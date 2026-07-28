import { Calendar, MapPin, Clock } from 'lucide-react';
import type { BookingData } from '@/pages/BookingPage';

interface DateLocationStepProps {
  data: BookingData;
  onChange: (data: Partial<BookingData>) => void;
}

const locations = [
  'Main Office - Downtown',
  'Airport Terminal',
  'North Station',
  'South Mall',
  'Hotel Marriott',
];

const timeSlots = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
];

export default function DateLocationStep({ data, onChange }: DateLocationStepProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Select Dates & Location</h2>
      <p className="mb-6 text-gray-500">
        Choose your pick-up and return dates along with your preferred locations.
      </p>

      <div className="space-y-6">
        {/* Pick-up Section */}
        <div className="rounded-xl bg-gray-50 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-sm">
              1
            </span>
            Pick-up Details
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1.5 inline h-4 w-4" />
                Pick-up Date
              </label>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                min={today}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Clock className="mr-1.5 inline h-4 w-4" />
                Pick-up Time
              </label>
              <select
                value={data.pickupTime}
                onChange={(e) => onChange({ pickupTime: e.target.value })}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <MapPin className="mr-1.5 inline h-4 w-4" />
                Pick-up Location
              </label>
              <select
                value={data.pickupLocation}
                onChange={(e) => onChange({ pickupLocation: e.target.value })}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Return Section */}
        <div className="rounded-xl bg-gray-50 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-sm">
              2
            </span>
            Return Details
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1.5 inline h-4 w-4" />
                Return Date
              </label>
              <input
                type="date"
                value={data.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                min={data.startDate || today}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Clock className="mr-1.5 inline h-4 w-4" />
                Return Time
              </label>
              <select
                value={data.dropoffTime}
                onChange={(e) => onChange({ dropoffTime: e.target.value })}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <MapPin className="mr-1.5 inline h-4 w-4" />
                Return Location
              </label>
              <select
                value={data.dropoffLocation}
                onChange={(e) => onChange({ dropoffLocation: e.target.value })}
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Same location checkbox */}
          <label className="mt-4 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={data.pickupLocation === data.dropoffLocation}
              onChange={(e) =>
                onChange({
                  dropoffLocation: e.target.checked ? data.pickupLocation : data.dropoffLocation,
                })
              }
              className="text-primary-ink focus:ring-primary h-4 w-4 rounded"
            />
            <span className="text-sm text-gray-600">Return to same location</span>
          </label>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-1 font-medium text-blue-900">Good to know</h4>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Free cancellation up to 24 hours before pick-up</li>
            <li>• Valid driver&apos;s license required at pick-up</li>
            <li>• Minimum age: 21 years</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
