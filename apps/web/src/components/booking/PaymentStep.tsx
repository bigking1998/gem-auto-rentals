import { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Check, Shield, Calendar, MapPin, User, AlertCircle, Loader2 } from 'lucide-react';
import type { BookingData } from '@/pages/BookingPage';
import { cn } from '@/lib/utils';
import { getStripe, stripeAppearance } from '@/lib/stripe';
import { api } from '@/lib/api';

interface PaymentStepProps {
  data: BookingData;
  vehicle: {
    make: string;
    model: string;
    year: number;
    category: string;
    dailyRate: number;
    images: string[];
  };
  total: number;
  days: number;
  bookingId: string;
  onSubmit: () => void;
}

// Card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

// Inner payment form component that uses Stripe hooks
function PaymentForm({ data, vehicle, total, days, bookingId, onSubmit }: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [nameOnCard, setNameOnCard] = useState(`${data.customer.firstName} ${data.customer.lastName}`);
  const [useDemoMode, setUseDemoMode] = useState(true); // Demo mode toggle

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    if (event.error) {
      setPaymentError(event.error.message);
    } else {
      setPaymentError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Demo mode - skip actual Stripe processing
    if (useDemoMode) {
      setIsProcessing(true);
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
      onSubmit();
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent on the backend using the booking ID
      const { clientSecret } = await api.payments.createIntent(bookingId);

      // Confirm the payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: nameOnCard,
            email: data.customer.email,
            phone: data.customer.phone,
            address: {
              line1: data.customer.address,
              city: data.customer.city,
              postal_code: data.customer.zipCode,
              country: 'US',
            },
          },
        },
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm the payment on our backend
        await api.payments.confirm(paymentIntent.id);
        onSubmit();
      } else {
        setPaymentError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setPaymentError('An error occurred while processing your payment. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Review & Payment
      </h2>
      <p className="text-gray-500 mb-6">
        Please review your booking details and complete the payment.
      </p>

      <div className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4">Booking Summary</h3>

          {/* Vehicle */}
          <div className="flex gap-4 pb-4 border-b border-gray-200">
            <img
              src={vehicle.images[0]}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-24 h-18 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-semibold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h4>
              <p className="text-sm text-gray-500">{vehicle.category}</p>
              <p className="text-sm text-indigo-600 font-medium mt-1">
                ${vehicle.dailyRate}/day
              </p>
            </div>
          </div>

          {/* Dates & Location */}
          <div className="py-4 border-b border-gray-200 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(data.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' - '}
                  {new Date(data.endDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {days} days • Pick-up: {data.pickupTime} • Return: {data.dropoffTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {data.pickupLocation}
                </p>
                {data.pickupLocation !== data.dropoffLocation && (
                  <p className="text-xs text-gray-500">
                    Return to: {data.dropoffLocation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="py-4 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {data.customer.firstName} {data.customer.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {data.customer.email} • {data.customer.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Extras */}
          {(data.extras.insurance || data.extras.gps || data.extras.childSeat || data.extras.additionalDriver) && (
            <div className="pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Extras</h4>
              <div className="flex flex-wrap gap-2">
                {data.extras.insurance && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Full Insurance
                  </span>
                )}
                {data.extras.gps && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    GPS Navigation
                  </span>
                )}
                {data.extras.childSeat && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    Child Seat
                  </span>
                )}
                {data.extras.additionalDriver && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    Additional Driver
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Payment Details
          </h3>

          {/* Demo Mode Toggle */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useDemoMode}
                onChange={(e) => setUseDemoMode(e.target.checked)}
                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-medium text-amber-800">Demo Mode</span>
                <p className="text-xs text-amber-600">
                  Skip actual payment processing for testing
                </p>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            {/* Name on Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name on Card
              </label>
              <input
                type="text"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Stripe Card Element */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Card Information
              </label>
              <div className="p-4 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <CardElement
                  options={cardElementOptions}
                  onChange={handleCardChange}
                />
              </div>
              {paymentError && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {paymentError}
                </div>
              )}
            </div>

            {/* Accepted Cards */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-gray-500">Accepted cards:</span>
              <div className="flex gap-2">
                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-700">VISA</span>
                </div>
                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                  <span className="text-[10px] font-bold text-red-600">MC</span>
                </div>
                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-500">AMEX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            Your payment is secured with 256-bit SSL encryption
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-indigo-50 rounded-xl p-5">
          <h3 className="font-medium text-indigo-900 mb-3">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-700">
                ${vehicle.dailyRate} x {days} days
              </span>
              <span className="text-indigo-900">${vehicle.dailyRate * days}</span>
            </div>
            {data.extras.insurance && (
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Full Insurance</span>
                <span className="text-indigo-900">${25 * days}</span>
              </div>
            )}
            {data.extras.gps && (
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">GPS Navigation</span>
                <span className="text-indigo-900">${10 * days}</span>
              </div>
            )}
            {data.extras.childSeat && (
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Child Seat</span>
                <span className="text-indigo-900">${8 * days}</span>
              </div>
            )}
            {data.extras.additionalDriver && (
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Additional Driver</span>
                <span className="text-indigo-900">${15 * days}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-indigo-200">
              <span className="font-semibold text-indigo-900">Total</span>
              <span className="text-xl font-bold text-indigo-600">${total}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || (!useDemoMode && (!stripe || !cardComplete || !nameOnCard))}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-lg font-semibold transition-all',
            'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
            'hover:from-indigo-700 hover:to-purple-700',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay ${total} and Confirm Booking
            </>
          )}
        </button>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            Secure Payment
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            Instant Confirmation
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            Free Cancellation
          </div>
        </div>

        {/* Powered by Stripe */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>Powered by</span>
          <svg className="h-5" viewBox="0 0 60 25" fill="currentColor">
            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.48zm-8.06-2.67h4.36c0-1.67-.72-2.74-2.12-2.74-1.26 0-2.11 1.04-2.24 2.74zM36.95 19.52c-2.83 0-4.62-1.9-4.62-4.72V5.73h4.1v8.47c0 1.35.75 2.02 1.73 2.02 1.05 0 1.73-.67 1.73-2.02V5.73h4.1v9.07c0 2.83-1.79 4.72-4.62 4.72-.82 0-1.56-.11-2.42-.11v-3.3c.62.19 1.26.29 1.88.29.95 0 1.5-.56 1.5-1.5V5.73h4.1v9.07c0 2.83-1.79 4.72-4.62 4.72h2.04zm-6.17-.3h-4.1v-13.49h4.1v13.49zm0-15.3h-4.1V0h4.1v3.92zM18.65 19.52c-3.65 0-5.92-2.3-5.92-5.76V5.73h4.1v7.59c0 1.62.79 2.67 2.18 2.67 1.24 0 2.34-.97 2.34-2.67V5.73h4.1v9.03c0 2.88-2.54 4.76-5.84 4.76h-.96zm-8.79-.3H5.78v-7.59c0-1.62-.79-2.67-2.18-2.67-1.24 0-2.34.97-2.34 2.67v7.59H0V9.72c0-2.55 1.46-4.03 3.89-4.03 1.35 0 2.51.6 3.2 1.47.7-.87 1.85-1.47 3.2-1.47 2.43 0 3.89 1.49 3.89 4.03v9.5h-4.32zM0 5.73V2.32h4.1v3.41H0z" />
          </svg>
        </div>
      </div>
    </form>
  );
}

// Main export with Stripe Elements wrapper
export default function PaymentStep(props: PaymentStepProps) {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    // Pre-load Stripe
    getStripe().then(() => setStripeLoaded(true));
  }, []);

  if (!stripeLoaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        appearance: stripeAppearance,
        locale: 'en',
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}
