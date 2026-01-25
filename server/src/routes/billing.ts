import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { ActivityLogger } from '../lib/activityLogger.js';

const router = Router();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

// Helper to check if Stripe is configured
function requireStripe(): Stripe {
  if (!stripe) {
    throw BadRequestError('Payment processing is not configured. Please contact support.');
  }
  return stripe;
}

// Helper to get or create Stripe customer for user
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const stripeClient = requireStripe();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, stripeCustomerId: true },
  });

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripeClient.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId: user.id },
  });

  // Save Stripe customer ID to user
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// Validation schemas
const addPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  setAsDefault: z.boolean().optional().default(false),
});

// GET /api/billing/payment-methods - List payment methods
router.get('/payment-methods', authenticate, async (req, res, next) => {
  try {
    const stripeClient = requireStripe();
    const customerId = await getOrCreateStripeCustomer(req.user!.id);

    // Get payment methods from Stripe
    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Get default payment method
    const customer = await stripeClient.customers.retrieve(customerId) as Stripe.Customer;
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    const methods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.card?.brand || 'card',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPaymentMethodId,
    }));

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/billing/payment-methods - Add a payment method
router.post('/payment-methods', authenticate, async (req, res, next) => {
  try {
    const stripeClient = requireStripe();
    const data = addPaymentMethodSchema.parse(req.body);
    const customerId = await getOrCreateStripeCustomer(req.user!.id);

    // Attach payment method to customer
    const paymentMethod = await stripeClient.paymentMethods.attach(data.paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested or if it's the first payment method
    if (data.setAsDefault) {
      await stripeClient.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethod.id },
      });
    }

    // Log activity
    await ActivityLogger.settingsUpdate(req.user!.id, 'Payment Methods', ['add']);

    res.status(201).json({
      success: true,
      data: {
        id: paymentMethod.id,
        type: paymentMethod.card?.brand || 'card',
        last4: paymentMethod.card?.last4 || '****',
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
        isDefault: data.setAsDefault,
      },
    });
  } catch (error: any) {
    // Handle Stripe errors
    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      return next(BadRequestError(error.message));
    }
    next(error);
  }
});

// DELETE /api/billing/payment-methods/:id - Delete a payment method
router.delete('/payment-methods/:id', authenticate, async (req, res, next) => {
  try {
    const stripeClient = requireStripe();
    const { id } = req.params;
    const customerId = await getOrCreateStripeCustomer(req.user!.id);

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripeClient.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== customerId) {
      throw BadRequestError('Payment method not found');
    }

    // Detach the payment method
    await stripeClient.paymentMethods.detach(id);

    // Log activity
    await ActivityLogger.settingsUpdate(req.user!.id, 'Payment Methods', ['delete']);

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError') {
      return next(BadRequestError(error.message));
    }
    next(error);
  }
});

// POST /api/billing/payment-methods/:id/default - Set as default payment method
router.post('/payment-methods/:id/default', authenticate, async (req, res, next) => {
  try {
    const stripeClient = requireStripe();
    const { id } = req.params;
    const customerId = await getOrCreateStripeCustomer(req.user!.id);

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripeClient.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== customerId) {
      throw BadRequestError('Payment method not found');
    }

    // Set as default
    await stripeClient.customers.update(customerId, {
      invoice_settings: { default_payment_method: id },
    });

    res.json({
      success: true,
      message: 'Default payment method updated',
    });
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError') {
      return next(BadRequestError(error.message));
    }
    next(error);
  }
});

// POST /api/billing/setup-intent - Create a SetupIntent for adding a card
router.post('/setup-intent', authenticate, async (req, res, next) => {
  try {
    const stripeClient = requireStripe();
    const customerId = await getOrCreateStripeCustomer(req.user!.id);

    const setupIntent = await stripeClient.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/billing/plan - Get current subscription plan
router.get('/plan', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    // For now, return mock plan data
    // In production, this would fetch from Stripe subscriptions
    res.json({
      success: true,
      data: {
        plan: 'professional',
        name: 'Professional',
        price: 299,
        interval: 'month',
        features: ['Unlimited vehicles', 'Priority support', 'Advanced analytics'],
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/billing/upgrade - Initiate plan upgrade
router.post('/upgrade', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const stripeClient = requireStripe();
    const { planId } = req.body;

    if (!planId) {
      throw BadRequestError('Plan ID is required');
    }

    // In production, create a Checkout session for the upgrade
    // For now, return a mock checkout URL
    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: await getOrCreateStripeCustomer(req.user!.id),
      line_items: [
        {
          price: planId, // This would be a Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: `${process.env.ADMIN_URL}/settings?tab=billing&upgrade=success`,
      cancel_url: `${process.env.ADMIN_URL}/settings?tab=billing&upgrade=cancelled`,
    });

    res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
      },
    });
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError') {
      return next(BadRequestError(error.message));
    }
    next(error);
  }
});

export default router;
