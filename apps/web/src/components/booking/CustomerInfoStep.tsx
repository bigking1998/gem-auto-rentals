import { User, Mail, Phone, MapPin, CreditCard, Calendar } from 'lucide-react';
import type { BookingData } from '@/pages/BookingPage';

interface CustomerInfoStepProps {
  data: BookingData;
  onChange: (data: Partial<BookingData>) => void;
}

const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Australia',
  'Netherlands',
  'Belgium',
];

export default function CustomerInfoStep({ data, onChange }: CustomerInfoStepProps) {
  const updateCustomer = (field: keyof typeof data.customer, value: string) => {
    onChange({
      customer: {
        ...data.customer,
        [field]: value,
      },
    });
  };

  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Your Details</h2>
      <p className="mb-6 text-gray-500">
        Please provide your personal information to complete the booking.
      </p>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl bg-gray-50 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
            <User className="text-primary-ink h-5 w-5" />
            Personal Information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                value={data.customer.firstName}
                onChange={(e) => updateCustomer('firstName', e.target.value)}
                placeholder="John"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                value={data.customer.lastName}
                onChange={(e) => updateCustomer('lastName', e.target.value)}
                placeholder="Doe"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Mail className="mr-1.5 inline h-4 w-4" />
                Email Address *
              </label>
              <input
                type="email"
                value={data.customer.email}
                onChange={(e) => updateCustomer('email', e.target.value)}
                placeholder="john.doe@example.com"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Phone className="mr-1.5 inline h-4 w-4" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={data.customer.phone}
                onChange={(e) => updateCustomer('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1.5 inline h-4 w-4" />
                Date of Birth *
              </label>
              <input
                type="date"
                value={data.customer.dateOfBirth}
                onChange={(e) => updateCustomer('dateOfBirth', e.target.value)}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="rounded-xl bg-gray-50 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
            <MapPin className="text-primary-ink h-5 w-5" />
            Address
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Street Address *
              </label>
              <input
                type="text"
                value={data.customer.address}
                onChange={(e) => updateCustomer('address', e.target.value)}
                placeholder="123 Main Street"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                value={data.customer.city}
                onChange={(e) => updateCustomer('city', e.target.value)}
                placeholder="New York"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                ZIP / Postal Code *
              </label>
              <input
                type="text"
                value={data.customer.zipCode}
                onChange={(e) => updateCustomer('zipCode', e.target.value)}
                placeholder="10001"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Country *</label>
              <select
                value={data.customer.country}
                onChange={(e) => updateCustomer('country', e.target.value)}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Driver's License */}
        <div className="rounded-xl bg-gray-50 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
            <CreditCard className="text-primary-ink h-5 w-5" />
            Driver&apos;s License
          </h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              License Number *
            </label>
            <input
              type="text"
              value={data.customer.driversLicense}
              onChange={(e) => updateCustomer('driversLicense', e.target.value)}
              placeholder="DL12345678"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              You&apos;ll need to present your physical license at pick-up.
            </p>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="text-primary-ink focus:ring-primary mt-0.5 h-5 w-5 rounded"
            />
            <span className="text-sm text-blue-900">
              I agree to the{' '}
              <a href="/terms" className="text-primary-ink hover:underline">
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-ink hover:underline">
                Privacy Policy
              </a>
              . I confirm that I am at least 21 years old and hold a valid driver&apos;s license.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
