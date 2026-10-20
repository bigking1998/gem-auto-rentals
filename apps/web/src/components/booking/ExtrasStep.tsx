import { Shield, Baby, UserPlus, Check, Info } from 'lucide-react';
import type { BookingData } from '@/pages/BookingPage';
import { cn } from '@/lib/utils';
import { EXTRAS, SECURITY_DEPOSIT, calculateExtrasTotal, type ExtraId } from '@/lib/extras';

interface ExtrasStepProps {
  data: BookingData;
  onChange: (data: Partial<BookingData>) => void;
  dailyRate: number;
  days: number;
}

/** Icons live here, not in the catalogue, so the catalogue stays importable by non-React code. */
const ICONS: Record<ExtraId, typeof Shield> = {
  insurance: Shield,
  childSeat: Baby,
  additionalDriver: UserPlus,
};

export default function ExtrasStep({ data, onChange, days }: ExtrasStepProps) {
  const toggleExtra = (extraId: ExtraId) => {
    const option = EXTRAS.find((e) => e.id === extraId);
    if (!option?.available) return; // unavailable options are not selectable
    onChange({
      extras: {
        ...data.extras,
        [extraId]: !data.extras[extraId as keyof typeof data.extras],
      },
    });
  };

  const extrasTotal = calculateExtrasTotal(data.extras as Partial<Record<ExtraId, boolean>>, days);

  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Add Extras to Your Rental</h2>
      <p className="mb-6 text-gray-500">
        Enhance your rental experience with these optional extras.
      </p>

      <div className="space-y-4">
        {EXTRAS.map((extra) => {
          const Icon = ICONS[extra.id];
          const isSelected = extra.available && data.extras[extra.id as keyof typeof data.extras];
          const totalPrice = extra.pricePerDay * days;

          return (
            <div
              key={extra.id}
              onClick={() => toggleExtra(extra.id)}
              aria-disabled={!extra.available}
              className={cn(
                'relative rounded-xl border p-5 transition-all',
                !extra.available
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                  : isSelected
                    ? 'border-primary bg-accent ring-primary cursor-pointer ring-1'
                    : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {extra.popular && (
                <span className="from-primary to-primary-dark text-primary-foreground absolute -top-2.5 right-4 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-semibold">
                  Recommended
                </span>
              )}

              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2',
                    isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="text-primary-foreground h-3 w-3" />}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{extra.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{extra.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {extra.available ? (
                        <>
                          <p className="font-bold text-gray-900">${totalPrice}</p>
                          <p className="text-xs text-gray-500">${extra.pricePerDay}/day</p>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-gray-500">{extra.unavailableNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {extra.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                          isSelected ? 'bg-accent text-primary-ink' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Check className="h-3 w-3" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extras Summary */}
      {extrasTotal > 0 && (
        <div className="bg-accent border-primary mt-6 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-navy font-medium">Selected Extras Total</span>
            <span className="text-primary-ink text-xl font-bold">${extrasTotal}</span>
          </div>
          <p className="text-primary-ink mt-1 text-sm">for {days} days</p>
        </div>
      )}

      {/* Security deposit — stated here so it is never a surprise at checkout */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Refundable security deposit</span>
          <span className="text-xl font-bold text-gray-900">${SECURITY_DEPOSIT}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Added to your booking total and returned to you after the vehicle comes back undamaged.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-accent border-primary mt-6 flex gap-3 rounded-lg border p-4">
        <Info className="text-primary-ink mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <h4 className="text-navy font-medium">Damage protection</h4>
          <p className="text-primary-ink mt-1 text-sm">
            Coverage terms are confirmed with you by a team member before your rental is booked. Ask
            us what applies to your dates and vehicle.
          </p>
        </div>
      </div>
    </div>
  );
}
