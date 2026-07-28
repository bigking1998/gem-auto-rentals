import { Shield, Navigation, Baby, UserPlus, Check, Info } from 'lucide-react';
import type { BookingData } from '@/pages/BookingPage';
import { cn } from '@/lib/utils';

interface ExtrasStepProps {
  data: BookingData;
  onChange: (data: Partial<BookingData>) => void;
  dailyRate: number;
  days: number;
}

const extras = [
  {
    id: 'insurance',
    name: 'Full Coverage Insurance',
    description:
      'Comprehensive protection covering collision damage, theft, and third-party liability. Zero deductible.',
    pricePerDay: 25,
    icon: Shield,
    popular: true,
    benefits: [
      'Zero deductible',
      'Collision damage waiver',
      'Theft protection',
      'Third-party liability',
    ],
  },
  {
    id: 'gps',
    name: 'GPS Navigation',
    description: 'Built-in GPS navigation system with live traffic updates and points of interest.',
    pricePerDay: 10,
    icon: Navigation,
    popular: false,
    benefits: [
      'Turn-by-turn directions',
      'Live traffic updates',
      'Points of interest',
      'Offline maps',
    ],
  },
  {
    id: 'childSeat',
    name: 'Child Seat',
    description: 'Safety-certified child seat suitable for children aged 1-4 years (9-18 kg).',
    pricePerDay: 8,
    icon: Baby,
    popular: false,
    benefits: ['Age 1-4 years', 'Safety certified', 'Easy installation', 'ISOFIX compatible'],
  },
  {
    id: 'additionalDriver',
    name: 'Additional Driver',
    description: 'Add another driver to your rental. Additional driver must present valid license.',
    pricePerDay: 15,
    icon: UserPlus,
    popular: false,
    benefits: [
      'Share driving duties',
      'Fully insured',
      'No age restrictions',
      'Same coverage applies',
    ],
  },
];

export default function ExtrasStep({ data, onChange, days }: ExtrasStepProps) {
  const toggleExtra = (extraId: string) => {
    onChange({
      extras: {
        ...data.extras,
        [extraId]: !data.extras[extraId as keyof typeof data.extras],
      },
    });
  };

  const calculateExtrasTotal = () => {
    let total = 0;
    if (data.extras.insurance) total += 25 * days;
    if (data.extras.gps) total += 10 * days;
    if (data.extras.childSeat) total += 8 * days;
    if (data.extras.additionalDriver) total += 15 * days;
    return total;
  };

  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Add Extras to Your Rental</h2>
      <p className="mb-6 text-gray-500">
        Enhance your rental experience with these optional extras.
      </p>

      <div className="space-y-4">
        {extras.map((extra) => {
          const isSelected = data.extras[extra.id as keyof typeof data.extras];
          const totalPrice = extra.pricePerDay * days;

          return (
            <div
              key={extra.id}
              onClick={() => toggleExtra(extra.id)}
              className={cn(
                'relative cursor-pointer rounded-xl border p-5 transition-all',
                isSelected
                  ? 'border-primary bg-accent ring-primary ring-1'
                  : 'border-gray-200 bg-white hover:border-gray-300'
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
                  <extra.icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{extra.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{extra.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-gray-900">${totalPrice}</p>
                      <p className="text-xs text-gray-500">${extra.pricePerDay}/day</p>
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
      {calculateExtrasTotal() > 0 && (
        <div className="bg-accent border-primary mt-6 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-navy font-medium">Selected Extras Total</span>
            <span className="text-primary-ink text-xl font-bold">${calculateExtrasTotal()}</span>
          </div>
          <p className="text-primary-ink mt-1 text-sm">for {days} days</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-accent border-primary mt-6 flex gap-3 rounded-lg border p-4">
        <Info className="text-primary-ink mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <h4 className="text-navy font-medium">Insurance Coverage</h4>
          <p className="text-primary-ink mt-1 text-sm">
            All rentals include basic liability insurance. Full coverage insurance provides
            additional protection with zero deductible.
          </p>
        </div>
      </div>
    </div>
  );
}
