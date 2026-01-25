import { useState } from 'react';
import { X, Loader2, AlertTriangle, CreditCard } from 'lucide-react';
import { api, PaymentMethod } from '@/lib/api';
import { toast } from 'sonner';

interface DeletePaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentMethod: PaymentMethod | null;
}

export function DeletePaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  paymentMethod,
}: DeletePaymentMethodModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !paymentMethod) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await api.billing.deletePaymentMethod(paymentMethod.id);
      toast.success('Payment method removed successfully');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove payment method';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const brandIcon = () => {
    const brand = paymentMethod.brand.toLowerCase();
    return (
      <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600 uppercase">
        {brand === 'visa' && 'VISA'}
        {brand === 'mastercard' && 'MC'}
        {brand === 'amex' && 'AMEX'}
        {!['visa', 'mastercard', 'amex'].includes(brand) && <CreditCard className="w-4 h-4" />}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Remove Payment Method</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                This action cannot be undone.
              </p>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to remove this payment method?
            </p>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {brandIcon()}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {paymentMethod.brand} ending in {paymentMethod.last4}
                </p>
                <p className="text-xs text-gray-500">
                  Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                </p>
              </div>
              {paymentMethod.isDefault && (
                <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  Default
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Card'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
