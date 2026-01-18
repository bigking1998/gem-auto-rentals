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

// Mock API call to create payment intent - replace with actual API call in production
export async function createPaymentIntent(amount: number, bookingData: {
  vehicleId: string;
  startDate: string;
  endDate: string;
  customerEmail: string;
  customerName: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  // In production, this would call your backend API
  // POST /api/payments/create-intent
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        vehicleId: bookingData.vehicleId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        customerEmail: bookingData.customerEmail,
        customerName: bookingData.customerName,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

// Mock function to confirm payment - for demo purposes
export async function confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
  // In production, this would call your backend API
  // POST /api/payments/confirm
  const response = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm payment');
  }

  return response.json();
}

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
