import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  bookingAmount: number;
  onPromoApplied: (discount: {
    code: string;
    type: string;
    amount: number;
    description: string;
  }) => void;
  onPromoRemoved: () => void;
  appliedPromo?: { code: string; type: string; amount: number; description: string } | null;
  className?: string;
}

export default function PromoCodeInput({
  bookingAmount,
  onPromoApplied,
  onPromoRemoved,
  appliedPromo,
  className,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await api.promos.validate(code.trim(), bookingAmount);

      if (!result.valid) {
        setError(result.message || 'Invalid promo code');
        return;
      }

      // Validate required fields before calling onPromoApplied
      if (!result.code || !result.type || result.discountAmount === undefined) {
        setError('Invalid response from server');
        return;
      }

      onPromoApplied({
        code: result.code,
        type: result.type,
        amount: result.discountAmount,
        description: result.discountDescription || '',
      });
      setCode('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onPromoRemoved();
    setCode('');
    setError(null);
  };

  if (appliedPromo) {
    return (
      <div className={cn('rounded-lg border border-green-200 bg-green-50 p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">{appliedPromo.code} applied!</p>
              <p className="text-sm text-green-600">
                {appliedPromo.description} (-${appliedPromo.amount.toFixed(2)})
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-100 hover:text-green-800"
            aria-label="Remove promo code"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-primary-ink hover:text-primary-dark flex items-center gap-2 font-medium transition-colors"
        >
          <Tag className="h-4 w-4" />
          Have a promo code?
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            key="promo-input-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="promo-code-input" className="text-sm font-medium text-gray-700">
                Enter Promo Code
              </label>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCode('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close promo code form"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                id="promo-code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="SUMMER2024"
                className="focus:ring-primary/20 focus:border-primary flex-1 rounded-lg border border-gray-200 px-4 py-2 uppercase transition-colors focus:ring-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
              />
              <button
                onClick={handleApply}
                disabled={isValidating || !code.trim()}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                  code.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                )}
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </button>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
