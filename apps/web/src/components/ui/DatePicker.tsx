import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: Date;
  placeholder?: string;
  className?: string;
  darkMode?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = 'Select date',
  className,
  darkMode = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse string value to Date
  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format display value
  const displayValue = selectedDate
    ? format(selectedDate, 'MMM d, yyyy')
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full h-[48px] px-4 rounded-xl text-left flex items-center gap-3 transition-all',
          darkMode
            ? 'bg-white/10 border border-white/20 text-white hover:bg-white/15 focus:ring-2 focus:ring-primary/50'
            : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300 focus:ring-2 focus:ring-orange-500',
          !selectedDate && (darkMode ? 'text-white/50' : 'text-gray-400'),
          className
        )}
      >
        <Calendar className={cn('w-5 h-5', darkMode ? 'text-white/60' : 'text-gray-400')} />
        <span className="flex-1 truncate">{displayValue}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 p-4 rounded-xl shadow-xl border',
            darkMode
              ? 'bg-gray-900 border-white/20'
              : 'bg-white border-gray-200'
          )}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={minDate ? { before: minDate } : undefined}
            showOutsideDays
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: cn(
                'text-sm font-medium',
                darkMode ? 'text-white' : 'text-gray-900'
              ),
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md transition-opacity',
                darkMode ? 'text-white' : 'text-gray-600'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: cn(
                'rounded-md w-9 font-normal text-[0.8rem]',
                darkMode ? 'text-white/50' : 'text-gray-500'
              ),
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-orange-500/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: cn(
                'h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md transition-colors',
                darkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-900 hover:bg-gray-100'
              ),
              day_selected: 'bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-500 focus:text-white',
              day_today: cn(
                'font-bold',
                darkMode ? 'text-primary' : 'text-orange-600'
              ),
              day_outside: cn(
                'opacity-50',
                darkMode ? 'text-white/30' : 'text-gray-300'
              ),
              day_disabled: 'opacity-30 cursor-not-allowed hover:bg-transparent',
              day_hidden: 'invisible',
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </div>
      )}
    </div>
  );
}
