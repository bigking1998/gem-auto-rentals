import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe publishable key - this should be from environment variables in production
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// NOTE: `createPaymentIntent` / `confirmPayment` helpers used to live here.
// They were dead code (never imported anywhere) and used relative `/api/...`
// URLs, which on gemrentalcars.com hit the Vercel SPA rewrite and return
// index.html rather than the API. The live flow correctly uses
// `api.payments.createIntent` / `api.payments.confirm` from `lib/api.ts`.

// Stripe appearance configuration for consistent styling
export const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#4f46e5',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
      padding: '12px 16px',
    },
    '.Input:focus': {
      border: '1px solid #4f46e5',
      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '6px',
    },
    '.Error': {
      fontSize: '13px',
      marginTop: '4px',
    },
  },
};
