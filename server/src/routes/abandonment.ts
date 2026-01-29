import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Validation schema for tracking abandonment
const trackAbandonmentSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  extras: z.record(z.any()).optional(),
  step: z.number().min(1).max(4),
  email: z.string().email().optional(),
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
        OR: [
          { userId: userId || undefined },
          { email: email || undefined },
        ],
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
    const { vehicleId } = req.body;
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
