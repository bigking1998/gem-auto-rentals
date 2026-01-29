import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';
import { sendBookingConfirmationEmail } from '../lib/email.js';

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

    // Send booking confirmation email on successful payment
    // Only send if booking doesn't already have confirmationEmailSent flag
    // (webhook may also send, so we use atomic update to prevent duplicates)
    if (paymentStatus === 'SUCCEEDED') {
      // Use atomic update to prevent duplicate emails from webhook race condition
      const bookingToUpdate = await prisma.booking.updateMany({
        where: {
          id: payment.bookingId,
          confirmationEmailSent: { not: true },
        },
        data: {
          confirmationEmailSent: true,
        },
      });

      // Only send email if we successfully set the flag (count > 0 means it wasn't already sent)
      if (bookingToUpdate.count > 0) {
        const bookingWithDetails = await prisma.booking.findUnique({
          where: { id: payment.bookingId },
          include: {
            user: { select: { email: true, firstName: true } },
            vehicle: { select: { make: true, model: true, year: true } },
          },
        });

        if (bookingWithDetails && bookingWithDetails.user) {
          const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
          };

          sendBookingConfirmationEmail(
            bookingWithDetails.user.email,
            bookingWithDetails.user.firstName,
            {
              bookingId: bookingWithDetails.id,
              vehicleName: `${bookingWithDetails.vehicle.year} ${bookingWithDetails.vehicle.make} ${bookingWithDetails.vehicle.model}`,
              startDate: formatDate(bookingWithDetails.startDate),
              endDate: formatDate(bookingWithDetails.endDate),
              pickupLocation: bookingWithDetails.pickupLocation,
              totalAmount: `$${Number(bookingWithDetails.totalAmount).toFixed(2)}`,
            }
          ).catch((err) => {
            console.error('Failed to send booking confirmation email:', err);
          });
        }
      }
    }

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

// POST /api/payments/demo - Demo payment for testing (creates real records but no Stripe charge)
router.post('/demo', authenticate, async (req, res, next) => {
  try {
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
        user: {
          select: { email: true, firstName: true },
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

    // Create demo payment record and confirm booking
    const [payment] = await prisma.$transaction([
      prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount: booking.totalAmount,
          status: 'SUCCEEDED',
          method: 'DEMO', // Mark as demo payment
          stripePaymentIntentId: `demo_${Date.now()}_${bookingId}`,
        },
        update: {
          status: 'SUCCEEDED',
          method: 'DEMO',
          stripePaymentIntentId: `demo_${Date.now()}_${bookingId}`,
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          confirmationEmailSent: true,
        },
      }),
    ]);

    // Send confirmation email
    if (booking.user) {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      };

      sendBookingConfirmationEmail(
        booking.user.email,
        booking.user.firstName,
        {
          bookingId: booking.id,
          vehicleName: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
          startDate: formatDate(booking.startDate),
          endDate: formatDate(booking.endDate),
          pickupLocation: booking.pickupLocation,
          totalAmount: `$${Number(booking.totalAmount).toFixed(2)}`,
        }
      ).catch((err) => {
        console.error('Failed to send booking confirmation email:', err);
      });
    }

    res.json({
      success: true,
      data: {
        payment,
        bookingStatus: 'CONFIRMED',
        isDemo: true,
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
        res.status(400).json({ error: 'Invalid signature' });
        return;
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
            // Use atomic update to prevent duplicate emails from /confirm endpoint race
            const bookingToUpdate = await prisma.booking.updateMany({
              where: {
                id: payment.bookingId,
                confirmationEmailSent: { not: true },
              },
              data: {
                status: 'CONFIRMED',
                confirmationEmailSent: true,
              },
            });

            // Only send email if we successfully set the flag (count > 0 means it wasn't already sent)
            if (bookingToUpdate.count > 0) {
              const booking = await prisma.booking.findUnique({
                where: { id: payment.bookingId },
                include: {
                  user: { select: { email: true, firstName: true } },
                  vehicle: { select: { make: true, model: true, year: true } },
                },
              });

              if (booking && booking.user) {
                const formatDate = (date: Date) => {
                  return date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                };

                sendBookingConfirmationEmail(
                  booking.user.email,
                  booking.user.firstName,
                  {
                    bookingId: booking.id,
                    vehicleName: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
                    startDate: formatDate(booking.startDate),
                    endDate: formatDate(booking.endDate),
                    pickupLocation: booking.pickupLocation,
                    totalAmount: `$${Number(booking.totalAmount).toFixed(2)}`,
                  }
                ).catch((err) => {
                  console.error('Failed to send booking confirmation email:', err);
                });
              }
            } else {
              // Just update status if email was already sent
              await prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CONFIRMED' },
              });
            }
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
