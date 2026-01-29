import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Car, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@gem/ui';
import AvailabilityCalendar from '@/components/vehicles/AvailabilityCalendar';
import { useBookingStore } from '@/stores/bookingStore';

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
];

interface PricingData {
  availableCount: number;
  minDailyRate: number | null;
  maxDailyRate: number | null;
  avgDailyRate: number | null;
  days: number;
  estimatedMinTotal: number | null;
  estimatedMaxTotal: number | null;
}

export default function QuickPricingWidget() {
  const navigate = useNavigate();
  const { setDates: setStoreDates, setCategory: setStoreCategory } = useBookingStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to parse "YYYY-MM-DD" as local date
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to format date as "YYYY-MM-DD"
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch pricing data
  const fetchPricing = useCallback(async () => {
    if (!startDate || !endDate) {
      setPricing(null);
      return;
    }

    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        startDate,
        endDate,
      };
      if (category) {
        params.category = category;
      }

      const response = await api.vehicles.previewPricing(params);
      setPricing(response);
    } catch (err) {
      console.error('Failed to fetch pricing:', err);
      setPricing(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, category]);

  // Debounce pricing fetch
  useEffect(() => {
    const timer = setTimeout(fetchPricing, 300);
    return () => clearTimeout(timer);
  }, [fetchPricing]);

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (category) params.set('category', category);
    navigate(`/vehicles?${params.toString()}`);
  };

  // Calculate days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const days = calculateDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mt-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pick-up Date */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Pick-up Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "w-full h-[48px] flex items-center justify-start text-left font-medium px-4 rounded-xl border transition-all",
                !startDate
                  ? "text-white/50 border-white/20 bg-white/10 hover:bg-white/15"
                  : "text-white border-primary bg-primary/20"
              )}>
                <Calendar className="mr-2 h-4 w-4 shrink-0 text-white/60" />
                <span className="truncate">
                  {startDate ? parseLocalDate(startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select Date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <AvailabilityCalendar
                selectedStart={parseLocalDate(startDate)}
                selectedEnd={parseLocalDate(endDate)}
                onSelectStart={(date) => {
                  const newStartStr = formatLocalDate(date);
                  setStartDate(newStartStr);
                  // Auto-set end date if not set or if before new start
                  if (!endDate || newStartStr >= endDate) {
                    const newEnd = new Date(date);
                    newEnd.setDate(newEnd.getDate() + 1);
                    const newEndStr = formatLocalDate(newEnd);
                    setEndDate(newEndStr);
                    // Save to store for sticky context
                    setStoreDates(newStartStr, newEndStr);
                  } else {
                    // Save to store for sticky context
                    setStoreDates(newStartStr, endDate);
                  }
                }}
                onSelectEnd={(date) => {
                  if (date) {
                    const newEndStr = formatLocalDate(date);
                    setEndDate(newEndStr);
                    // Save to store for sticky context
                    if (startDate) {
                      setStoreDates(startDate, newEndStr);
                    }
                  } else {
                    setEndDate('');
                  }
                }}
                minDate={new Date()}
                selectionMode="start"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Return Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "w-full h-[48px] flex items-center justify-start text-left font-medium px-4 rounded-xl border transition-all",
                !endDate
                  ? "text-white/50 border-white/20 bg-white/10 hover:bg-white/15"
                  : "text-white border-primary bg-primary/20"
              )}>
                <Calendar className="mr-2 h-4 w-4 shrink-0 text-white/60" />
                <span className="truncate">
                  {endDate ? parseLocalDate(endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select Date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <AvailabilityCalendar
                selectedStart={parseLocalDate(startDate)}
                selectedEnd={parseLocalDate(endDate)}
                onSelectStart={(date) => {
                  const newStartStr = formatLocalDate(date);
                  setStartDate(newStartStr);
                  if (endDate) {
                    setStoreDates(newStartStr, endDate);
                  }
                }}
                onSelectEnd={(date) => {
                  if (date) {
                    const newEndStr = formatLocalDate(date);
                    setEndDate(newEndStr);
                    // Save to store for sticky context
                    if (startDate) {
                      setStoreDates(startDate, newEndStr);
                    }
                  } else {
                    setEndDate('');
                  }
                }}
                minDate={startDate ? parseLocalDate(startDate) || new Date() : new Date()}
                selectionMode="end"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Category */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            <Car className="inline w-4 h-4 mr-1" />
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              const newCategory = e.target.value;
              setCategory(newCategory);
              // Save to store for sticky context
              setStoreCategory(newCategory);
            }}
            className="w-full h-[48px] px-4 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-gray-900 text-white">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div>
          {/* Invisible label spacer to match other columns */}
          <div className="block text-transparent text-sm font-medium mb-2 select-none" aria-hidden="true">
            &nbsp;
          </div>
          <button
            onClick={handleSearch}
            disabled={!startDate || !endDate}
            className="w-full h-[48px] flex items-center justify-center gap-2 px-4 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Search className="w-5 h-5 flex-shrink-0" />
            <span>Search Vehicles</span>
          </button>
        </div>
      </div>

      {/* Pricing Preview */}
      {(isLoading || pricing) && startDate && endDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Checking availability...</span>
            </div>
          ) : pricing && pricing.availableCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-white/80">
                <span className="text-3xl font-bold text-white">
                  {pricing.availableCount}
                </span>
                <span className="ml-2">vehicles available</span>
                {days > 0 && (
                  <span className="text-white/60 ml-2">for {days} day{days !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-white/60 text-sm">Starting from</div>
                <div className="text-2xl font-bold text-primary">
                  ${pricing.estimatedMinTotal?.toFixed(0) || '—'}
                </div>
                <div className="text-white/50 text-xs">
                  (${pricing.minDailyRate?.toFixed(0) || '—'}/day)
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/70">
              No vehicles available for these dates. Try different dates.
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
