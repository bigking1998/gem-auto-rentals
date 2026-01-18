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
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Your Details
      </h2>
      <p className="text-gray-500 mb-6">
        Please provide your personal information to complete the booking.
      </p>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Personal Information
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                value={data.customer.firstName}
                onChange={(e) => updateCustomer('firstName', e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                value={data.customer.lastName}
                onChange={(e) => updateCustomer('lastName', e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-4 h-4 inline mr-1.5" />
                Email Address *
              </label>
              <input
                type="email"
                value={data.customer.email}
                onChange={(e) => updateCustomer('email', e.target.value)}
                placeholder="john.doe@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 inline mr-1.5" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={data.customer.phone}
                onChange={(e) => updateCustomer('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Date of Birth *
              </label>
              <input
                type="date"
                value={data.customer.dateOfBirth}
                onChange={(e) => updateCustomer('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Address
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Street Address *
              </label>
              <input
                type="text"
                value={data.customer.address}
                onChange={(e) => updateCustomer('address', e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City *
              </label>
              <input
                type="text"
                value={data.customer.city}
                onChange={(e) => updateCustomer('city', e.target.value)}
                placeholder="New York"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ZIP / Postal Code *
              </label>
              <input
                type="text"
                value={data.customer.zipCode}
                onChange={(e) => updateCustomer('zipCode', e.target.value)}
                placeholder="10001"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country *
              </label>
              <select
                value={data.customer.country}
                onChange={(e) => updateCustomer('country', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Driver&apos;s License
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              License Number *
            </label>
            <input
              type="text"
              value={data.customer.driversLicense}
              onChange={(e) => updateCustomer('driversLicense', e.target.value)}
              placeholder="DL12345678"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              You&apos;ll need to present your physical license at pick-up.
            </p>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-blue-900">
              I agree to the{' '}
              <a href="/terms" className="text-indigo-600 hover:underline">
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-indigo-600 hover:underline">
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
