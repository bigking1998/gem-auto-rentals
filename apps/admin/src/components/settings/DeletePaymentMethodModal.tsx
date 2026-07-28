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
      <div className="flex h-6 w-10 items-center justify-center rounded bg-gray-100 text-xs font-medium uppercase text-gray-600">
        {brand === 'visa' && 'VISA'}
        {brand === 'mastercard' && 'MC'}
        {brand === 'amex' && 'AMEX'}
        {!['visa', 'mastercard', 'amex'].includes(brand) && <CreditCard className="h-4 w-4" />}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold text-gray-900">Remove Payment Method</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">This action cannot be undone.</p>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to remove this payment method?
            </p>

            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
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
                <span className="bg-accent text-accent-foreground ml-auto rounded px-2 py-0.5 text-xs font-medium">
                  Default
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
