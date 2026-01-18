import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';

const router = Router();

// Initialize Stripe (will be undefined if not configured)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// POST /api/payments/create-intent
router.post('/create-intent', authenticate, async (req, res, next) => {
  try {
    if (!stripe) {
      throw BadRequestError('Payment processing is not configured');
    }

    const { bookingId } = z
      .object({
        bookingId: z.string().cuid(),
      })
      .parse(req.body);

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        vehicle: {
          select: { make: true, model: true, year: true },
        },
      },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Verify ownership
    if (booking.userId !== req.user!.id) {
      throw ForbiddenError('You can only pay for your own bookings');
    }

    // Check booking status
    if (booking.status !== 'PENDING') {
      throw BadRequestError('This booking cannot be paid for');
    }

    // Check if already paid
    if (booking.payment?.status === 'SUCCEEDED') {
      throw BadRequestError('This booking has already been paid');
    }

    // Create or retrieve payment intent
    let paymentIntent: Stripe.PaymentIntent;

    if (booking.payment?.stripePaymentIntentId) {
      // Retrieve existing payment intent
      paymentIntent = await stripe.paymentIntents.retrieve(
        booking.payment.stripePaymentIntentId
      );
    } else {
      // Create new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(booking.totalAmount) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          bookingId: booking.id,
          userId: req.user!.id,
          vehicleInfo: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
        },
      });

      // Create or update payment record
      await prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount: booking.totalAmount,
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
        },
        update: {
          stripePaymentIntentId: paymentIntent.id,
        },
      });
    }

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: Number(booking.totalAmount),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/confirm
router.post('/confirm', authenticate, async (req, res, next) => {
  try {
    if (!stripe) {
      throw BadRequestError('Payment processing is not configured');
    }

    const { paymentIntentId } = z
      .object({
        paymentIntentId: z.string(),
      })
      .parse(req.body);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { booking: true },
    });

    if (!payment) {
      throw NotFoundError('Payment not found');
    }

    // Verify ownership
    if (payment.booking.userId !== req.user!.id) {
      throw ForbiddenError('You can only confirm your own payments');
    }

    // Update payment and booking status based on Stripe status
    let paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' = 'PENDING';
    let bookingStatus: 'PENDING' | 'CONFIRMED' = 'PENDING';

    switch (paymentIntent.status) {
      case 'succeeded':
        paymentStatus = 'SUCCEEDED';
        bookingStatus = 'CONFIRMED';
        break;
      case 'processing':
        paymentStatus = 'PROCESSING';
        break;
      case 'requires_payment_method':
      case 'canceled':
        paymentStatus = 'FAILED';
        break;
    }

    // Update records
    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          stripeChargeId: paymentIntent.latest_charge as string | null,
          method: 'CARD',
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: bookingStatus },
      }),
    ]);

    res.json({
      success: true,
      data: {
        payment: updatedPayment,
        bookingStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/:bookingId
router.get('/:bookingId', authenticate, async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          select: {
            id: true,
            userId: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!payment) {
      throw NotFoundError('Payment not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = payment.booking.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only view your own payments');
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:bookingId/refund - Staff only
router.post('/:bookingId/refund', authenticate, staffOnly, async (req, res, next) => {
  try {
    if (!stripe) {
      throw BadRequestError('Payment processing is not configured');
    }

    const { bookingId } = req.params;
    const { amount, reason } = z
      .object({
        amount: z.number().positive().optional(),
        reason: z.string().optional(),
      })
      .parse(req.body);

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw NotFoundError('Payment not found');
    }

    if (payment.status !== 'SUCCEEDED') {
      throw BadRequestError('Can only refund successful payments');
    }

    if (!payment.stripePaymentIntentId) {
      throw BadRequestError('No Stripe payment intent found');
    }

    // Calculate refund amount
    const refundAmount = amount || Number(payment.amount);

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
    });

    // Update payment record
    const isFullRefund = refundAmount >= Number(payment.amount);

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundAmount,
        refundReason: reason,
      },
    });

    // If full refund, cancel the booking
    if (isFullRefund) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    res.json({
      success: true,
      data: {
        payment: updatedPayment,
        refund: {
          id: refund.id,
          amount: refundAmount,
          status: refund.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook handler
router.post(
  '/webhook',
  // Note: This endpoint needs raw body, configure in Express
  async (req, res, next) => {
    try {
      if (!stripe) {
        throw BadRequestError('Payment processing is not configured');
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw BadRequestError('Webhook secret not configured');
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          await prisma.payment.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
              status: 'SUCCEEDED',
              stripeChargeId: paymentIntent.latest_charge as string | null,
            },
          });

          // Also update booking status
          const payment = await prisma.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });

          if (payment) {
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: 'CONFIRMED' },
            });
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          await prisma.payment.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: { status: 'FAILED' },
          });
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
