import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler.js';
import { ActivityLogger } from '../lib/activityLogger.js';
import { BUCKETS, isStorageConfigured, uploadFile, deleteFile, getPublicUrl } from '../lib/supabase.js';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.'));
    }
  },
});

// Validation schemas
const updatePreferencesSchema = z.object({
  // Email notifications
  emailBookingConfirm: z.boolean().optional(),
  emailBookingReminder: z.boolean().optional(),
  emailPaymentReceipt: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
  emailNewsletter: z.boolean().optional(),

  // Push notifications
  pushEnabled: z.boolean().optional(),

  // SMS notifications
  smsBookingReminder: z.boolean().optional(),
  smsPaymentAlert: z.boolean().optional(),

  // Preferences
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().optional(),
});

const updateCompanySettingsSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyLogo: z.string().optional().nullable(),

  defaultCurrency: z.string().optional(),
  defaultTimezone: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),

  minBookingHours: z.number().int().min(1).optional(),
  maxBookingDays: z.number().int().min(1).optional(),
  cancellationHours: z.number().int().min(0).optional(),
  depositPercentage: z.number().min(0).max(1).optional(),

  operatingHours: z.record(z.unknown()).optional().nullable(),

  termsOfService: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
});

// GET /api/users/:id/preferences - Get user preferences
router.get('/users/:id/preferences', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Users can only view their own preferences unless they're staff
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    if (id !== req.user!.id && !isStaff) {
      throw ForbiddenError('You can only view your own preferences');
    }

    // Get or create preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: id },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.userPreferences.create({
        data: { userId: id },
      });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/preferences - Update user preferences
router.put('/users/:id/preferences', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updatePreferencesSchema.parse(req.body);

    // Users can only update their own preferences unless they're staff
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    if (id !== req.user!.id && !isStaff) {
      throw ForbiddenError('You can only update your own preferences');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw NotFoundError('User not found');
    }

    // Upsert preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ...data,
      },
      update: data,
    });

    // Log activity
    const changes = Object.keys(data);
    if (changes.length > 0) {
      await ActivityLogger.settingsUpdate(req.user!.id, 'User Preferences', changes);
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/company - Get company settings
router.get('/company', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (_req, res, next) => {
  try {
    // Get or create company settings (singleton)
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {},
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/company - Update company settings (Admin only)
router.put('/company', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = updateCompanySettingsSchema.parse(req.body);

    // Get existing or create
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: data as Record<string, unknown>,
      });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: data as Record<string, unknown>,
      });
    }

    // Log activity
    const changes = Object.keys(data);
    if (changes.length > 0) {
      await ActivityLogger.settingsUpdate(req.user!.id, 'Company Settings', changes);
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/settings/company/logo - Upload company logo
router.post('/company/logo', authenticate, authorize('ADMIN'), upload.single('logo'), async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    if (!req.file) {
      throw BadRequestError('No logo file provided');
    }

    // Get existing company settings
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {},
      });
    }

    // Delete old logo if exists
    if (settings.companyLogo && settings.companyLogo.includes('/logos/')) {
      const urlParts = settings.companyLogo.split('/logos/');
      if (urlParts.length > 1) {
        await deleteFile(BUCKETS.LOGOS, urlParts[1]);
      }
    }

    // Generate unique file path
    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop() || 'png';
    const filePath = `company/${timestamp}.${extension}`;

    // Upload to Supabase
    const result = await uploadFile(
      BUCKETS.LOGOS,
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    if ('error' in result) {
      throw BadRequestError(result.error);
    }

    // Get public URL
    const logoUrl = getPublicUrl(BUCKETS.LOGOS, filePath);

    if (!logoUrl) {
      throw BadRequestError('Failed to generate logo URL');
    }

    // Update company settings with new logo
    settings = await prisma.companySettings.update({
      where: { id: settings.id },
      data: { companyLogo: logoUrl },
    });

    // Log activity
    await ActivityLogger.settingsUpdate(req.user!.id, 'Company Settings', ['companyLogo']);

    res.status(201).json({
      success: true,
      data: { logoUrl },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/settings/company/logo - Delete company logo
router.delete('/company/logo', authenticate, authorize('ADMIN'), async (_req, res, next) => {
  try {
    // Get existing company settings
    const settings = await prisma.companySettings.findFirst();

    if (!settings) {
      throw NotFoundError('Company settings not found');
    }

    // Delete logo from storage if exists
    if (settings.companyLogo && settings.companyLogo.includes('/logos/')) {
      const urlParts = settings.companyLogo.split('/logos/');
      if (urlParts.length > 1) {
        await deleteFile(BUCKETS.LOGOS, urlParts[1]);
      }
    }

    // Update company settings to remove logo
    await prisma.companySettings.update({
      where: { id: settings.id },
      data: { companyLogo: null },
    });

    res.json({
      success: true,
      message: 'Logo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
