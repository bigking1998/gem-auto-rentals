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
      setNewEndDate(endDate.toISOString().split('T')[0]);
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
        setPreview({
          available: true,
          additionalDays: result.pricing!.additionalDays,
          additionalAmount: result.pricing!.additionalAmount,
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

    try {
      // Create extension request
      const extensionResult = await api.extensions.request(booking.id, newEndDate);

      // Pay for extension
      await api.extensions.pay(booking.id, extensionResult.extension.id);

      // Success
      onExtended(newEndDate);
      onClose();
    } catch (err) {
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
            className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Extend Your Rental</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Vehicle Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Return Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => {
                      setNewEndDate(e.target.value);
                      setPreview(null);
                      setError(null);
                    }}
                    min={minDate.toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Check Availability Button */}
              {!preview && (
                <button
                  onClick={handlePreview}
                  disabled={isLoading || !newEndDate}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Check Availability'
                  )}
                </button>
              )}

              {/* Preview Results */}
              {preview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {preview.available ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Vehicle Available!</span>
                      </div>
                      <div className="space-y-1 text-sm text-green-600">
                        <p>Additional days: {preview.additionalDays}</p>
                        <p>Daily rate: ${booking.dailyRate.toFixed(2)}</p>
                        <p className="font-semibold text-green-700 text-base pt-1 border-t border-green-200 mt-2">
                          Total: ${preview.additionalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Not Available</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        The vehicle is booked starting {preview.conflictDate ? formatDate(preview.conflictDate) : 'during this period'}.
                        Please choose an earlier date.
                      </p>
                      <button
                        onClick={() => setPreview(null)}
                        className="text-sm text-red-600 underline mt-2"
                      >
                        Try a different date
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            {preview?.available && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleExtend}
                  disabled={isPaying}
                  className={cn(
                    'w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                    isPaying
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-orange-600 shadow-lg shadow-orange-200'
                  )}
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ${preview.additionalAmount.toFixed(2)} & Extend
                    </>
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
