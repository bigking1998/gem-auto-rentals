import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, AlertCircle, Check, Car } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    endDate: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
    };
    dailyRate: number;
  };
  onExtended: (newEndDate: string) => void;
}

export default function ExtensionModal({
  isOpen,
  onClose,
  booking,
  onExtended,
}: ExtensionModalProps) {
  const [newEndDate, setNewEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    available: boolean;
    additionalDays: number;
    additionalAmount: number;
    conflictDate?: string;
  } | null>(null);

  // Set initial date to day after current end date
  useEffect(() => {
    if (isOpen && booking.endDate) {
      const endDate = new Date(booking.endDate);
      endDate.setDate(endDate.getDate() + 1);
      // Use locale-safe local date string to avoid timezone shifts
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      setNewEndDate(`${year}-${month}-${day}`);
    }
  }, [isOpen, booking.endDate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setError(null);
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (!newEndDate) return;

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const result = await api.extensions.preview(booking.id, newEndDate);

      if (!result.available) {
        setPreview({
          available: false,
          additionalDays: 0,
          additionalAmount: 0,
          conflictDate: result.conflictDate,
        });
      } else {
        // Defensively handle missing pricing data
        setPreview({
          available: true,
          additionalDays: result.pricing?.additionalDays ?? 0,
          additionalAmount: result.pricing?.additionalAmount ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!preview?.available) return;

    setIsPaying(true);
    setError(null);

    let extensionId: string | null = null;

    try {
      // Create extension request
      const extensionResult = await api.extensions.request(booking.id, newEndDate);
      extensionId = extensionResult.extension.id;

      // Pay for extension
      await api.extensions.pay(booking.id, extensionId);

      // Success
      onExtended(newEndDate);
      onClose();
    } catch (err) {
      // If payment failed but extension was created, the extension remains pending
      // User can retry payment or it will be cleaned up by backend
      setError(err instanceof Error ? err.message : 'Failed to extend rental');
    } finally {
      setIsPaying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const minDate = new Date(booking.endDate);
  minDate.setDate(minDate.getDate() + 1);
  // Use locale-safe local date string for min attribute
  const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="extend-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 id="extend-modal-title" className="text-lg font-semibold text-gray-900">
                Extend Your Rental
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4">
              {/* Vehicle Info */}
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-full">
                  <Car className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-500">
                    Current end: {formatDate(booking.endDate)}
                  </p>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label
                  htmlFor="new-return-date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  New Return Date
                </label>
                <div className="relative">
                  <input
                    id="new-return-date"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => {
                      setNewEndDate(e.target.value);
                      setPreview(null);
                      setError(null);
                    }}
                    min={minDateStr}
                    className="focus:ring-primary/20 focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-3 transition-colors focus:ring-2"
                  />
                  <Calendar
                    className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Check Availability Button */}
              {!preview && (
                <button
                  onClick={handlePreview}
                  disabled={isLoading || !newEndDate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Check Availability'}
                </button>
              )}

              {/* Preview Results */}
              {preview && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {preview.available ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-green-700">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">Vehicle Available!</span>
                      </div>
                      <div className="space-y-1 text-sm text-green-600">
                        <p>Additional days: {preview.additionalDays}</p>
                        <p>Daily rate: ${booking.dailyRate.toFixed(2)}</p>
                        <p className="mt-2 border-t border-green-200 pt-1 text-base font-semibold text-green-700">
                          Total: ${preview.additionalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Not Available</span>
                      </div>
                      <p className="mt-1 text-sm text-red-600">
                        The vehicle is booked starting{' '}
                        {preview.conflictDate
                          ? formatDate(preview.conflictDate)
                          : 'during this period'}
                        . Please choose an earlier date.
                      </p>
                      <button
                        onClick={() => setPreview(null)}
                        className="mt-2 text-sm text-red-600 underline"
                      >
                        Try a different date
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            {preview?.available && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <button
                  onClick={handleExtend}
                  disabled={isPaying}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all',
                    isPaying
                      ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                      : 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg'
                  )}
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ${preview.additionalAmount.toFixed(2)} & Extend</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
