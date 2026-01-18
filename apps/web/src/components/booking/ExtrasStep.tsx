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
    description: 'Comprehensive protection covering collision damage, theft, and third-party liability. Zero deductible.',
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
    benefits: [
      'Age 1-4 years',
      'Safety certified',
      'Easy installation',
      'ISOFIX compatible',
    ],
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
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Add Extras to Your Rental
      </h2>
      <p className="text-gray-500 mb-6">
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
                'relative border rounded-xl p-5 cursor-pointer transition-all',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              {extra.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full">
                  Recommended
                </span>
              )}

              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <extra.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{extra.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{extra.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">
                        ${totalPrice}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${extra.pricePerDay}/day
                      </p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {extra.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full',
                          isSelected
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Check className="w-3 h-3" />
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
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-indigo-900">Selected Extras Total</span>
            <span className="text-xl font-bold text-indigo-600">
              ${calculateExtrasTotal()}
            </span>
          </div>
          <p className="text-sm text-indigo-700 mt-1">
            for {days} days
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-900">Insurance Coverage</h4>
          <p className="text-sm text-amber-700 mt-1">
            All rentals include basic liability insurance. Full coverage insurance provides
            additional protection with zero deductible.
          </p>
        </div>
      </div>
    </div>
  );
}
