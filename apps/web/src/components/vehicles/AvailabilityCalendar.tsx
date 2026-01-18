import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  vehicleId: string;
  bookedDates?: { start: Date; end: Date }[];
  selectedStart?: Date | null;
  selectedEnd?: Date | null;
  onSelectStart?: (date: Date) => void;
  onSelectEnd?: (date: Date) => void;
  minDate?: Date;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AvailabilityCalendar({
  bookedDates = [],
  selectedStart,
  selectedEnd,
  onSelectStart,
  onSelectEnd,
  minDate = new Date(),
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (booking) => date >= booking.start && date <= booking.end
    );
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate < today) return true;
    if (minDate && compareDate < minDate) return true;
    if (isDateBooked(date)) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedStart && !selectedEnd) return false;

    const dateStr = date.toDateString();

    if (selectedStart && dateStr === selectedStart.toDateString()) return true;
    if (selectedEnd && dateStr === selectedEnd.toDateString()) return true;

    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStart || !selectedEnd) return false;
    return date > selectedStart && date < selectedEnd;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (selecting === 'start') {
      onSelectStart?.(date);
      setSelecting('end');
    } else {
      if (selectedStart && date > selectedStart) {
        onSelectEnd?.(date);
        setSelecting('start');
      } else {
        // If end date is before start, reset and set as new start
        onSelectStart?.(date);
        onSelectEnd?.(undefined as unknown as Date);
      }
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isPreviousMonthDisabled = () => {
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() <= today.getMonth()
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={isPreviousMonthDisabled()}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-gray-900">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const inRange = isDateInRange(date);
          const booked = isDateBooked(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                'aspect-square flex items-center justify-center text-sm rounded-lg transition-all',
                disabled && !booked && 'text-gray-300 cursor-not-allowed',
                booked && 'bg-red-50 text-red-300 cursor-not-allowed line-through',
                !disabled && !selected && !inRange && 'hover:bg-gray-100 text-gray-900',
                selected && 'bg-indigo-600 text-white font-semibold',
                inRange && 'bg-indigo-100 text-indigo-700'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded" />
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-100 rounded" />
          <span className="text-gray-600">In Range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 rounded border border-red-200" />
          <span className="text-gray-600">Booked</span>
        </div>
      </div>

      {/* Selection Info */}
      {(selectedStart || selectedEnd) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">Pick-up: </span>
              <span className="font-medium">
                {selectedStart
                  ? selectedStart.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Select date'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Return: </span>
              <span className="font-medium">
                {selectedEnd
                  ? selectedEnd.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Select date'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
