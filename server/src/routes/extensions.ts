import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/bookings/:id/extend/preview - Preview extension pricing
router.post('/:id/extend/preview', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newEndDate } = z
      .object({
        newEndDate: z.string().transform((s) => new Date(s)),
      })
      .parse(req.body);

    const userId = req.user!.id;

    // Get the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dailyRate: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Active booking not found',
      });
      return;
    }

    // Validate new end date is after current end date
    if (newEndDate <= booking.endDate) {
      res.status(400).json({
        success: false,
        error: 'New end date must be after current end date',
      });
      return;
    }

    // Check if vehicle is available for the extension period
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: booking.vehicleId,
        id: { not: booking.id },
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        deletedAt: null,
        OR: [
          {
            startDate: { lte: newEndDate },
            endDate: { gte: booking.endDate },
          },
        ],
      },
    });

    if (conflictingBooking) {
      res.json({
        success: true,
        data: {
          available: false,
          message: 'Vehicle is not available for the requested extension period',
          conflictDate: conflictingBooking.startDate,
        },
      });
      return;
    }

    // Calculate additional days and amount
    const additionalDays = Math.ceil(
      (newEndDate.getTime() - booking.endDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const additionalAmount = additionalDays * Number(booking.dailyRate);

    res.json({
      success: true,
      data: {
        available: true,
        booking: {
          id: booking.id,
          currentEndDate: booking.endDate,
          newEndDate,
          vehicle: booking.vehicle,
        },
        pricing: {
          additionalDays,
          dailyRate: Number(booking.dailyRate),
          additionalAmount: Math.round(additionalAmount * 100) / 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/extend - Request a booking extension
router.post('/:id/extend', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newEndDate } = z
      .object({
        newEndDate: z.string().transform((s) => new Date(s)),
      })
      .parse(req.body);

    const userId = req.user!.id;

    // Get the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Active booking not found',
      });
      return;
    }

    // Validate new end date
    if (newEndDate <= booking.endDate) {
      res.status(400).json({
        success: false,
        error: 'New end date must be after current end date',
      });
      return;
    }

    // Check for conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: booking.vehicleId,
        id: { not: booking.id },
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        deletedAt: null,
        startDate: { lte: newEndDate },
        endDate: { gte: booking.endDate },
      },
    });

    if (conflictingBooking) {
      res.status(400).json({
        success: false,
        error: 'Vehicle is not available for the requested extension period',
      });
      return;
    }

    // Check for existing pending extension
    const existingExtension = await prisma.bookingExtension.findFirst({
      where: {
        bookingId: booking.id,
        paymentStatus: 'PENDING',
      },
    });

    if (existingExtension) {
      res.status(400).json({
        success: false,
        error: 'You already have a pending extension request',
      });
      return;
    }

    // Calculate additional amount
    const additionalDays = Math.ceil(
      (newEndDate.getTime() - booking.endDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const additionalAmount = additionalDays * Number(booking.dailyRate);

    // Create extension request
    const extension = await prisma.bookingExtension.create({
      data: {
        bookingId: booking.id,
        originalEndDate: booking.endDate,
        newEndDate,
        additionalAmount,
      },
    });

    res.json({
      success: true,
      data: {
        extension: {
          id: extension.id,
          originalEndDate: extension.originalEndDate,
          newEndDate: extension.newEndDate,
          additionalAmount: Number(extension.additionalAmount),
          paymentStatus: extension.paymentStatus,
        },
        message: 'Extension request created. Please complete payment to confirm.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/extend/pay - Pay for an extension
router.post('/:id/extend/pay', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { extensionId, paymentMethodId: _paymentMethodId } = z
      .object({
        extensionId: z.string(),
        paymentMethodId: z.string().optional(),
      })
      .parse(req.body);

    const userId = req.user!.id;

    // Get the extension and booking
    const extension = await prisma.bookingExtension.findFirst({
      where: {
        id: extensionId,
        paymentStatus: 'PENDING',
        booking: {
          id,
          userId,
          status: 'ACTIVE',
        },
      },
      include: {
        booking: true,
      },
    });

    if (!extension) {
      res.status(404).json({
        success: false,
        error: 'Extension request not found',
      });
      return;
    }

    // TODO: Integrate with Stripe to process payment
    // For now, we'll simulate a successful payment
    // In production, you'd create a PaymentIntent and process it

    // Update extension and booking
    await prisma.$transaction([
      prisma.bookingExtension.update({
        where: { id: extensionId },
        data: {
          paymentStatus: 'SUCCEEDED',
          paidAt: new Date(),
          approvedAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: extension.bookingId },
        data: {
          endDate: extension.newEndDate,
          totalAmount: {
            increment: Number(extension.additionalAmount),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        message: 'Extension payment successful! Your rental has been extended.',
        newEndDate: extension.newEndDate,
        amountPaid: Number(extension.additionalAmount),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id/extensions - Get extension history for a booking
router.get('/:id/extensions', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    const extensions = await prisma.bookingExtension.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: extensions.map((e) => ({
        id: e.id,
        originalEndDate: e.originalEndDate,
        newEndDate: e.newEndDate,
        additionalAmount: Number(e.additionalAmount),
        paymentStatus: e.paymentStatus,
        requestedAt: e.requestedAt,
        approvedAt: e.approvedAt,
        paidAt: e.paidAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
