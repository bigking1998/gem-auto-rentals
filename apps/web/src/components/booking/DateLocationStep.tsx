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
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00',
];

export default function DateLocationStep({ data, onChange }: DateLocationStepProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Select Dates & Location
      </h2>
      <p className="text-gray-500 mb-6">
        Choose your pick-up and return dates along with your preferred locations.
      </p>

      <div className="space-y-6">
        {/* Pick-up Section */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
              1
            </span>
            Pick-up Details
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Pick-up Date
              </label>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                min={today}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Pick-up Time
              </label>
              <select
                value={data.pickupTime}
                onChange={(e) => onChange({ pickupTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1.5" />
                Pick-up Location
              </label>
              <select
                value={data.pickupLocation}
                onChange={(e) => onChange({ pickupLocation: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
              2
            </span>
            Return Details
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Return Date
              </label>
              <input
                type="date"
                value={data.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                min={data.startDate || today}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Return Time
              </label>
              <select
                value={data.dropoffTime}
                onChange={(e) => onChange({ dropoffTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1.5" />
                Return Location
              </label>
              <select
                value={data.dropoffLocation}
                onChange={(e) => onChange({ dropoffLocation: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={data.pickupLocation === data.dropoffLocation}
              onChange={(e) =>
                onChange({
                  dropoffLocation: e.target.checked ? data.pickupLocation : data.dropoffLocation,
                })
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              Return to same location
            </span>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-1">Good to know</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Free cancellation up to 24 hours before pick-up</li>
            <li>• Valid driver&apos;s license required at pick-up</li>
            <li>• Minimum age: 21 years</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
