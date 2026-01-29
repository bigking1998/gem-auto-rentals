import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { getStripe, stripeAppearance } from '@/lib/stripe';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
  isDefault: boolean;
}

const cardBrands: Record<string, { name: string; color: string }> = {
  visa: {
    name: 'Visa',
    color: 'bg-blue-600',
  },
  mastercard: {
    name: 'Mastercard',
    color: 'bg-orange-500',
  },
  amex: {
    name: 'American Express',
    color: 'bg-blue-800',
  },
  discover: {
    name: 'Discover',
    color: 'bg-orange-600',
  },
  default: {
    name: 'Card',
    color: 'bg-gray-600',
  },
};

// Card element styling
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

// Add Card Modal Component with Stripe Elements
function AddCardModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setCardError(null);

    try {
      // 1. Create SetupIntent on the backend
      const { clientSecret } = await api.billing.createSetupIntent();

      // 2. Confirm card setup with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to add card');
      }

      if (!setupIntent?.payment_method) {
        throw new Error('No payment method returned');
      }

      // 3. Attach payment method to customer on backend
      await api.billing.addPaymentMethod(
        setupIntent.payment_method as string,
        setAsDefault
      );

      toast.success('Card added successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding card:', err);
      setCardError(err instanceof Error ? err.message : 'Failed to add card');
      toast.error(err instanceof Error ? err.message : 'Failed to add card');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Payment Method
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stripe Card Element */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Card Information
            </label>
            <div className="p-4 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {cardError}
              </div>
            )}
          </div>

          {/* Set as Default */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">
              Set as default payment method
            </span>
          </label>

          {/* Accepted Cards */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !stripe || !cardComplete}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg transition-colors',
                isSubmitting || !stripe || !cardComplete
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-orange-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Card'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Wrapper for AddCardModal with Stripe Elements
function AddCardModalWrapper({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getStripe().then(() => setStripeLoaded(true));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!stripeLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-white rounded-xl shadow-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-500 mt-4">Loading payment form...</p>
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
      <AddCardModal isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />
    </Elements>
  );
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const methods = await api.billing.listPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setIsSettingDefault(id);
      await api.billing.setDefaultPaymentMethod(id);
      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          isDefault: pm.id === id,
        }))
      );
      toast.success('Default payment method updated');
    } catch (err) {
      console.error('Error setting default:', err);
      toast.error('Failed to update default payment method');
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await api.billing.deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
      toast.success('Payment method removed');
    } catch (err) {
      console.error('Error deleting payment method:', err);
      toast.error('Failed to remove payment method');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const getBrand = (brand: string) => {
    const normalizedBrand = brand.toLowerCase();
    return cardBrands[normalizedBrand] || cardBrands.default;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500 mt-1">
            Manage your saved payment methods for faster checkout
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500 mt-1">
            Manage your saved payment methods for faster checkout
          </p>
        </div>
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPaymentMethods}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500 mt-1">
            Manage your saved payment methods for faster checkout
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Card
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No payment methods
            </h3>
            <p className="text-gray-500 mb-6">
              Add a credit or debit card to start booking vehicles.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Card
            </button>
          </div>
        ) : (
          paymentMethods.map((method, index) => {
            const brand = getBrand(method.brand);

            return (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'bg-white rounded-xl border overflow-hidden',
                  method.isDefault ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-200'
                )}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Card Visual */}
                    <div
                      className={cn(
                        'w-16 h-10 rounded-lg flex items-center justify-center',
                        brand.color
                      )}
                    >
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>

                    {/* Card Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {brand.name} •••• {method.last4}
                        </h3>
                        {method.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            disabled={isSettingDefault === method.id}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors',
                              isSettingDefault === method.id && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {isSettingDefault === method.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmId(method.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === method.id && (
                  <div className="px-5 py-4 bg-red-50 border-t border-red-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Remove this payment method?
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          disabled={isDeleting}
                          className={cn(
                            'px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors',
                            isDeleting && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Secure Payments</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your payment information is encrypted and securely stored by Stripe. We never store
              your full card details on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Powered by Stripe */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-6">
        <span>Powered by</span>
        <svg className="h-5" viewBox="0 0 60 25" fill="currentColor">
          <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.48zm-8.06-2.67h4.36c0-1.67-.72-2.74-2.12-2.74-1.26 0-2.11 1.04-2.24 2.74zM36.95 19.52c-2.83 0-4.62-1.9-4.62-4.72V5.73h4.1v8.47c0 1.35.75 2.02 1.73 2.02 1.05 0 1.73-.67 1.73-2.02V5.73h4.1v9.07c0 2.83-1.79 4.72-4.62 4.72-.82 0-1.56-.11-2.42-.11v-3.3c.62.19 1.26.29 1.88.29.95 0 1.5-.56 1.5-1.5V5.73h4.1v9.07c0 2.83-1.79 4.72-4.62 4.72h2.04zm-6.17-.3h-4.1v-13.49h4.1v13.49zm0-15.3h-4.1V0h4.1v3.92zM18.65 19.52c-3.65 0-5.92-2.3-5.92-5.76V5.73h4.1v7.59c0 1.62.79 2.67 2.18 2.67 1.24 0 2.34-.97 2.34-2.67V5.73h4.1v9.03c0 2.88-2.54 4.76-5.84 4.76h-.96zm-8.79-.3H5.78v-7.59c0-1.62-.79-2.67-2.18-2.67-1.24 0-2.34.97-2.34 2.67v7.59H0V9.72c0-2.55 1.46-4.03 3.89-4.03 1.35 0 2.51.6 3.2 1.47.7-.87 1.85-1.47 3.2-1.47 2.43 0 3.89 1.49 3.89 4.03v9.5h-4.32zM0 5.73V2.32h4.1v3.41H0z" />
        </svg>
      </div>

      {/* Add Card Modal */}
      <AddCardModalWrapper
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPaymentMethods}
      />
    </div>
  );
}
