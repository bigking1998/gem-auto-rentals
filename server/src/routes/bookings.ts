import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';
import { BUCKETS, isStorageConfigured, uploadFile, deleteFile, getSignedUrl } from '../lib/storage.js';

const router = Router();

// Configure multer for contract uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
    }
  },
});

// Validation schemas
const createBookingSchema = z.object({
  vehicleId: z.string().cuid(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().min(1, 'Dropoff location is required'),
  extras: z
    .object({
      insurance: z.boolean().optional(),
      gps: z.boolean().optional(),
      childSeat: z.boolean().optional(),
      additionalDriver: z.boolean().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

const updateBookingSchema = z.object({
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  extras: z
    .object({
      insurance: z.boolean().optional(),
      gps: z.boolean().optional(),
      childSeat: z.boolean().optional(),
      additionalDriver: z.boolean().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

const bookingFilterSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  userId: z.string().optional(),
  vehicleId: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Calculate rental total
function calculateTotal(
  dailyRate: number,
  startDate: Date,
  endDate: Date,
  extras?: { insurance?: boolean; gps?: boolean; childSeat?: boolean; additionalDriver?: boolean }
): number {
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let total = dailyRate * days;

  if (extras?.insurance) total += 25 * days;
  if (extras?.gps) total += 10 * days;
  if (extras?.childSeat) total += 8 * days;
  if (extras?.additionalDriver) total += 15 * days;

  return total;
}

// GET /api/bookings
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filters = bookingFilterSchema.parse(req.query);
    const { page, pageSize, ...filterParams } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Non-staff users can only see their own bookings
    if (!['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role)) {
      where.userId = req.user!.id;
    } else if (filterParams.userId) {
      where.userId = filterParams.userId;
    }

    if (filterParams.status) {
      where.status = filterParams.status;
    }

    if (filterParams.vehicleId) {
      where.vehicleId = filterParams.vehicleId;
    }

    if (filterParams.startDate) {
      where.startDate = { gte: filterParams.startDate };
    }

    if (filterParams.endDate) {
      where.endDate = { lte: filterParams.endDate };
    }

    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        items: bookings,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Non-staff can only view their own bookings
    if (
      !['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role) &&
      booking.userId !== req.user!.id
    ) {
      throw ForbiddenError('You can only view your own bookings');
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Validate dates
    if (data.startDate >= data.endDate) {
      throw BadRequestError('End date must be after start date');
    }

    if (data.startDate < new Date()) {
      throw BadRequestError('Start date cannot be in the past');
    }

    // Get vehicle and check availability
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    if (vehicle.status !== 'AVAILABLE') {
      throw BadRequestError('Vehicle is not available for booking');
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw BadRequestError('Vehicle is not available for the selected dates');
    }

    // Calculate total
    const totalAmount = calculateTotal(
      Number(vehicle.dailyRate),
      data.startDate,
      data.endDate,
      data.extras
    );

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: req.user!.id,
        vehicleId: data.vehicleId,
        startDate: data.startDate,
        endDate: data.endDate,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        extras: data.extras || {},
        notes: data.notes,
        dailyRate: vehicle.dailyRate,
        totalAmount,
        status: 'PENDING',
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/bookings/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateBookingSchema.parse(req.body);

    // Get existing booking
    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existing) {
      throw NotFoundError('Booking not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = existing.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only modify your own bookings');
    }

    // Non-staff can only modify pending bookings
    if (!isStaff && existing.status !== 'PENDING') {
      throw BadRequestError('You can only modify pending bookings');
    }

    // Non-staff cannot change status
    if (!isStaff && data.status) {
      throw ForbiddenError('You cannot change booking status');
    }

    // Recalculate total if dates or extras changed
    let totalAmount = Number(existing.totalAmount);
    if (data.startDate || data.endDate || data.extras) {
      const startDate = data.startDate || existing.startDate;
      const endDate = data.endDate || existing.endDate;
      const extras = data.extras || (existing.extras as Record<string, boolean>);

      totalAmount = calculateTotal(
        Number(existing.dailyRate),
        startDate,
        endDate,
        extras
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        totalAmount,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = booking.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only cancel your own bookings');
    }

    // Cannot cancel completed bookings
    if (booking.status === 'COMPLETED') {
      throw BadRequestError('Cannot cancel a completed booking');
    }

    if (booking.status === 'CANCELLED') {
      throw BadRequestError('Booking is already cancelled');
    }

    // Soft delete the booking when cancelled
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
        deletedBy: req.user!.id,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    // TODO: Process refund if payment was made

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking cancelled and moved to recycling bin',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bookings/:id - Admin only
router.delete('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    if (booking.status === 'ACTIVE') {
      throw BadRequestError('Cannot delete an active booking');
    }

    // Soft delete with deletedBy tracking
    await prisma.booking.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/contract - Upload signed contract
router.post('/:id/contract', authenticate, upload.single('contract'), async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    const { id } = req.params;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, contractUrl: true },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Check permissions - owner or staff can upload contract
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = booking.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only upload contracts for your own bookings');
    }

    if (!req.file) {
      throw BadRequestError('No contract file provided');
    }

    // Delete old contract if exists
    if (booking.contractUrl) {
      const urlParts = booking.contractUrl.split('/contracts/');
      if (urlParts.length > 1) {
        await deleteFile(BUCKETS.CONTRACTS, urlParts[1].split('?')[0]);
      }
    }

    // Generate unique file path
    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop() || 'pdf';
    const filePath = `${id}/${timestamp}-contract.${extension}`;

    // Upload to Supabase
    const result = await uploadFile(
      BUCKETS.CONTRACTS,
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    if ('error' in result) {
      throw BadRequestError(result.error);
    }

    // Update booking with contract URL (store the path, not signed URL)
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        contractUrl: filePath,
        contractSigned: true,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    // Get a signed URL for immediate access
    const signedUrl = await getSignedUrl(filePath, 3600, BUCKETS.CONTRACTS);

    res.status(201).json({
      success: true,
      data: {
        ...updatedBooking,
        contractSignedUrl: signedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id/contract - Download contract
router.get('/:id/contract', authenticate, async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, userId: true, contractUrl: true },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = booking.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only access contracts for your own bookings');
    }

    if (!booking.contractUrl) {
      throw NotFoundError('No contract uploaded for this booking');
    }

    // Get signed URL for download
    const signedUrl = await getSignedUrl(booking.contractUrl, 300, BUCKETS.CONTRACTS);

    if (!signedUrl) {
      throw BadRequestError('Failed to generate download URL');
    }

    res.json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        bookingId: id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bookings/:id/contract - Delete contract (Staff only)
router.delete('/:id/contract', authenticate, staffOnly, async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, contractUrl: true },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    if (!booking.contractUrl) {
      throw BadRequestError('No contract to delete');
    }

    // Delete from storage
    await deleteFile(BUCKETS.CONTRACTS, booking.contractUrl);

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        contractUrl: null,
        contractSigned: false,
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
