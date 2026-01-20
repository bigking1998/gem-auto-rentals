import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@gem/ui';

interface AvailabilityCalendarProps {
  bookedDates?: { start: Date; end: Date }[];
  selectedStart?: Date | null;
  selectedEnd?: Date | null;
  onSelectStart?: (date: Date) => void;
  onSelectEnd?: (date: Date) => void;
  minDate?: Date;
  className?: string;
  selectionMode?: 'range' | 'start' | 'end';
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
  className,
  selectionMode = 'range',
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // "selecting" state isn't strictly needed if we just infer from selectedStart/End, 
  // but helpful for UX flow.

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
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (compareDate < min) return true;
    }
    if (isDateBooked(date)) return true;
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (selectionMode !== 'range') return false;
    if (!selectedStart || !selectedEnd) return false;
    // Ensure we handle case where start > end gracefully by swapping check
    const start = selectedStart < selectedEnd ? selectedStart : selectedEnd;
    const end = selectedStart < selectedEnd ? selectedEnd : selectedStart;
    return date > start && date < end;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (selectionMode === 'start') {
      onSelectStart?.(date);
      // Optional: if start > current end, maybe clear end?
      if (selectedEnd && date > selectedEnd) {
        onSelectEnd?.(undefined as unknown as Date);
      }
    } else if (selectionMode === 'end') {
      onSelectEnd?.(date);
      // Optional: if end < current start, maybe clear start?
      if (selectedStart && date < selectedStart) {
        onSelectStart?.(undefined as unknown as Date);
      }
    } else {
      // Default range behavior
      if (!selectedStart || (selectedStart && selectedEnd)) {
        // Start new selection
        onSelectStart?.(date);
        onSelectEnd?.(undefined as unknown as Date); // Reset end
      } else {
        // Complete selection
        if (date < selectedStart) {
          onSelectEnd?.(selectedStart);
          onSelectStart?.(date);
        } else {
          onSelectEnd?.(date);
        }
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
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          disabled={isPreviousMonthDisabled()}
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-semibold text-sm">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-[0.8rem] font-medium text-muted-foreground py-1"
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
          const inRange = isDateInRange(date);

          // Determine styling
          let cellClass = "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

          const isStart = selectedStart && date.toDateString() === selectedStart.toDateString();
          const isEnd = selectedEnd && date.toDateString() === selectedEnd.toDateString();

          let isActive = false;
          let isPassive = false;

          if (selectionMode === 'start') {
            if (isStart) isActive = true;
            else if (isEnd) isPassive = true;
          } else if (selectionMode === 'end') {
            if (isEnd) isActive = true;
            else if (isStart) isPassive = true;
          } else {
            // Range mode or default
            if (isStart || isEnd) isActive = true;
          }

          if (disabled) {
            cellClass = "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent";
          } else if (isActive) {
            cellClass = "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground";
          } else if (isPassive) {
            // Passive selection (the "other" date) - distinct style
            cellClass = "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-primary/20 font-medium";
          } else if (inRange) {
            cellClass = "bg-accent text-accent-foreground";
          }

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                'h-9 w-9 p-0 font-normal rounded-md flex items-center justify-center text-sm transition-colors duration-200 tabular-nums',
                cellClass
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Minimal Legend/Help ?? Maybe not needed for premium feel if UI is obvious */}
    </div>
  );
}
