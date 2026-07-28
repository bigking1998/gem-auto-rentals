/**
 * Wallet Routes
 *
 * Endpoints for generating wallet passes and QR code scanning
 * for check-in/check-out functionality.
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import googleWallet from '../services/googleWalletService.js';

const router = Router();

// Validation schemas
const scanQrSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
});

/**
 * GET /api/bookings/:id/pass/google
 * Generate a Google Wallet pass for a booking
 */
router.get('/bookings/:id/pass/google', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if Google Wallet is configured
    if (!googleWallet.isConfigured()) {
      throw BadRequestError('Google Wallet is not configured');
    }

    // Get booking with vehicle info
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: true,
      },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Check authorization (owner or staff)
    if (booking.userId !== userId && req.user!.role === 'CUSTOMER') {
      throw NotFoundError('Booking not found');
    }

    // Only generate passes for confirmed or active bookings
    if (!['CONFIRMED', 'ACTIVE'].includes(booking.status)) {
      throw BadRequestError(`Cannot generate pass for ${booking.status} booking`);
    }

    // Generate QR payload if not exists
    let qrPayload = booking.passQrCode;
    if (!qrPayload) {
      qrPayload = googleWallet.generateQrPayload(booking.id);
    }

    // Create/update the pass
    const passUrl = await googleWallet.createPass({
      bookingId: booking.id,
      confirmationNumber: `GEM${booking.id.slice(-8).toUpperCase()}`,
      customerName: `${booking.user.firstName} ${booking.user.lastName}`,
      customerEmail: booking.user.email,
      vehicleMake: booking.vehicle.make,
      vehicleModel: booking.vehicle.model,
      vehicleYear: booking.vehicle.year,
      licensePlate: booking.vehicle.licensePlate,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status as 'CONFIRMED' | 'ACTIVE' | 'COMPLETED',
    });

    // Update booking with pass info
    await prisma.booking.update({
      where: { id },
      data: {
        googlePassId: googleWallet.getObjectId(booking.id),
        passQrCode: qrPayload,
        passGeneratedAt: new Date(),
      },
    });

    res.json({
      success: true,
      passUrl,
      qrCode: qrPayload,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/scan
 * Scan a QR code to retrieve booking info (for check-in/check-out)
 */
router.post('/bookings/scan', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { qrCode } = scanQrSchema.parse(req.body);

    // Verify QR code
    const result = googleWallet.verifyQrPayload(qrCode);

    if (!result.valid) {
      throw BadRequestError(result.error || 'Invalid QR code');
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: result.bookingId },
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
      },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Determine available actions based on status
    const availableActions: string[] = [];
    if (booking.status === 'CONFIRMED' && !booking.checkedInAt) {
      availableActions.push('CHECK_IN');
    }
    if (booking.status === 'ACTIVE' && booking.checkedInAt && !booking.checkedOutAt) {
      availableActions.push('CHECK_OUT');
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationNumber: `GEM${booking.id.slice(-8).toUpperCase()}`,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        checkedInAt: booking.checkedInAt,
        checkedOutAt: booking.checkedOutAt,
        vehicle: {
          id: booking.vehicle.id,
          make: booking.vehicle.make,
          model: booking.vehicle.model,
          year: booking.vehicle.year,
          licensePlate: booking.vehicle.licensePlate,
          color: booking.vehicle.color,
        },
        customer: booking.user,
      },
      availableActions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/:id/checkin
 * Check in a customer (marks booking as ACTIVE)
 */
router.post('/bookings/:id/checkin', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user!.id;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, user: true },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Validate status
    if (booking.status !== 'CONFIRMED') {
      throw BadRequestError(`Cannot check in booking with status ${booking.status}`);
    }

    if (booking.checkedInAt) {
      throw BadRequestError('Booking already checked in');
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        checkedInAt: new Date(),
        checkedInBy: staffId,
      },
      include: {
        vehicle: true,
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

    // Update vehicle status
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: 'RENTED' },
    });

    // Update Google Wallet pass if exists
    if (booking.googlePassId && googleWallet.isConfigured()) {
      try {
        await googleWallet.updatePass({
          bookingId: booking.id,
          confirmationNumber: `GEM${booking.id.slice(-8).toUpperCase()}`,
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          customerEmail: booking.user.email,
          vehicleMake: booking.vehicle.make,
          vehicleModel: booking.vehicle.model,
          vehicleYear: booking.vehicle.year,
          licensePlate: booking.vehicle.licensePlate,
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: 'ACTIVE',
        });
      } catch (passError) {
        console.error('Failed to update Google Wallet pass:', passError);
        // Don't fail the check-in if pass update fails
      }
    }

    res.json({
      success: true,
      message: 'Check-in successful',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        checkedInAt: updatedBooking.checkedInAt,
        checkedInBy: updatedBooking.checkedInBy,
        vehicle: updatedBooking.vehicle,
        customer: updatedBooking.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/:id/checkout
 * Check out a customer (marks booking as COMPLETED)
 */
router.post('/bookings/:id/checkout', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user!.id;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, user: true },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Validate status
    if (booking.status !== 'ACTIVE') {
      throw BadRequestError(`Cannot check out booking with status ${booking.status}`);
    }

    if (!booking.checkedInAt) {
      throw BadRequestError('Booking not checked in');
    }

    if (booking.checkedOutAt) {
      throw BadRequestError('Booking already checked out');
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        checkedOutAt: new Date(),
        checkedOutBy: staffId,
      },
      include: {
        vehicle: true,
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

    // Update vehicle status back to available
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: 'AVAILABLE' },
    });

    // Update Google Wallet pass if exists
    if (booking.googlePassId && googleWallet.isConfigured()) {
      try {
        await googleWallet.updatePass({
          bookingId: booking.id,
          confirmationNumber: `GEM${booking.id.slice(-8).toUpperCase()}`,
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          customerEmail: booking.user.email,
          vehicleMake: booking.vehicle.make,
          vehicleModel: booking.vehicle.model,
          vehicleYear: booking.vehicle.year,
          licensePlate: booking.vehicle.licensePlate,
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: 'COMPLETED',
        });
      } catch (passError) {
        console.error('Failed to update Google Wallet pass:', passError);
      }
    }

    res.json({
      success: true,
      message: 'Check-out successful',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        checkedInAt: updatedBooking.checkedInAt,
        checkedOutAt: updatedBooking.checkedOutAt,
        checkedOutBy: updatedBooking.checkedOutBy,
        vehicle: updatedBooking.vehicle,
        customer: updatedBooking.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/status
 * Check if wallet services are configured
 */
router.get('/wallet/status', authenticate, staffOnly, async (_req, res) => {
  res.json({
    googleWallet: {
      configured: googleWallet.isConfigured(),
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || null,
    },
    appleWallet: {
      configured: false, // Not implemented yet
    },
  });
});

export default router;
