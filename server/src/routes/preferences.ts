import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { ActivityLogger } from '../lib/activityLogger.js';

const router = Router();

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

export default router;
