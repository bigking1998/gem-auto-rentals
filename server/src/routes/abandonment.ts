import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { recordId } from '../lib/validation.js';

const router = Router();

// Ids here are cuids, not uuids. This previously read `.uuid()`, which rejected
// every real vehicle id and made /track fail closed with a 400 — which is why
// AbandonedBooking has 0 rows.
const vehicleIdSchema = recordId('Invalid vehicle ID');

// Validation schema for tracking abandonment
const trackAbandonmentSchema = z
  .object({
    vehicleId: vehicleIdSchema,
    startDate: z.string().transform((s) => new Date(s)),
    endDate: z.string().transform((s) => new Date(s)),
    extras: z.record(z.any()).optional(),
    step: z.number().int().min(1).max(4),
    email: z.string().email().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// vehicleId is optional here: the handler deliberately treats a missing id as a
// no-op success rather than an error.
const completeAbandonmentSchema = z.object({
  vehicleId: vehicleIdSchema.optional(),
});

// POST /api/abandonment/track - Track booking progress (for abandonment recovery)
router.post('/track', optionalAuth, async (req, res, next) => {
  try {
    const data = trackAbandonmentSchema.parse(req.body);
    const userId = req.user?.id;
    const email = data.email || req.user?.email;

    // If we don't have either userId or email, we can't recover
    if (!userId && !email) {
      res.json({
        success: true,
        data: { tracked: false },
        message: 'No user or email to track',
      });
      return;
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      res.json({
        success: true,
        data: { tracked: false },
        message: 'Vehicle not found',
      });
      return;
    }

    // Check if there's an existing abandoned booking for this user/vehicle combo
    const existingAbandonment = await prisma.abandonedBooking.findFirst({
      where: {
        vehicleId: data.vehicleId,
        recovered: false,
        OR: [{ userId: userId || undefined }, { email: email || undefined }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAbandonment) {
      // Update existing abandonment
      await prisma.abandonedBooking.update({
        where: { id: existingAbandonment.id },
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          extras: data.extras || undefined,
          step: data.step,
          userId: userId || existingAbandonment.userId,
          email: email || existingAbandonment.email,
        },
      });
    } else {
      // Create new abandonment record
      await prisma.abandonedBooking.create({
        data: {
          userId,
          email,
          vehicleId: data.vehicleId,
          startDate: data.startDate,
          endDate: data.endDate,
          extras: data.extras || undefined,
          step: data.step,
        },
      });
    }

    res.json({
      success: true,
      data: { tracked: true },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/abandonment/complete - Mark abandonment as recovered (called when booking is completed)
router.post('/complete', authenticate, async (req, res, next) => {
  try {
    // vehicleId lands in a Prisma `where`, so it must be forced to a string.
    // An object here (e.g. {"vehicleId":{"not":"x"}}) would otherwise be read as
    // a Prisma filter operator and match far more rows than intended.
    const { vehicleId } = completeAbandonmentSchema.parse(req.body ?? {});
    const userId = req.user!.id;

    if (!vehicleId) {
      res.json({
        success: true,
        message: 'No vehicle ID provided',
      });
      return;
    }

    // Mark any matching abandoned bookings as recovered
    await prisma.abandonedBooking.updateMany({
      where: {
        userId,
        vehicleId,
        recovered: false,
      },
      data: {
        recovered: true,
      },
    });

    res.json({
      success: true,
      message: 'Abandonment marked as recovered',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/abandonment/recover/:token - Get recovery data for email link
router.get('/recover/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format to prevent NoSQL injection or invalid queries
    if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid recovery ID format',
      });
      return;
    }

    const abandonment = await prisma.abandonedBooking.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dailyRate: true,
            images: true,
            category: true,
            seats: true,
            transmission: true,
            fuelType: true,
            status: true,
          },
        },
      },
    });

    if (!abandonment || abandonment.recovered) {
      res.status(404).json({
        success: false,
        error: 'Recovery link is no longer valid',
      });
      return;
    }

    // Check if vehicle is still available
    const isAvailable = abandonment.vehicle.status === 'AVAILABLE';

    res.json({
      success: true,
      data: {
        vehicle: abandonment.vehicle,
        startDate: abandonment.startDate,
        endDate: abandonment.endDate,
        extras: abandonment.extras,
        isAvailable,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
