import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VehicleFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
}

interface FilterSidebarProps {
  filters: VehicleFilters;
  onFilterChange: (filters: VehicleFilters) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
];

const transmissions = [
  { value: '', label: 'Any Transmission' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
];

const fuelTypes = [
  { value: '', label: 'Any Fuel Type' },
  { value: 'GASOLINE', label: 'Gasoline' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const seatOptions = [
  { value: 0, label: 'Any Seats' },
  { value: 2, label: '2+ Seats' },
  { value: 4, label: '4+ Seats' },
  { value: 5, label: '5+ Seats' },
  { value: 7, label: '7+ Seats' },
];

const priceRanges = [
  { min: 0, max: 0, label: 'Any Price' },
  { min: 0, max: 50, label: 'Under $50/day' },
  { min: 50, max: 100, label: '$50 - $100/day' },
  { min: 100, max: 150, label: '$100 - $150/day' },
  { min: 150, max: 200, label: '$150 - $200/day' },
  { min: 200, max: 0, label: '$200+/day' },
];

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  isOpen = true,
  onClose,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    transmission: true,
    fuelType: true,
    seats: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== 0
  ).length;

  const handlePriceChange = (min: number, max: number) => {
    onFilterChange({
      ...filters,
      minPrice: min || undefined,
      maxPrice: max || undefined,
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-1">
          {/* Category */}
          <FilterSection
            title="Category"
            expanded={expandedSections.category}
            onToggle={() => toggleSection('category')}
          >
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={(filters.category || '') === cat.value}
                    onChange={() =>
                      onFilterChange({ ...filters, category: cat.value || undefined })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection
            title="Price Range"
            expanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="space-y-2">
              {priceRanges.map((range, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="price"
                    checked={
                      (filters.minPrice || 0) === range.min &&
                      (filters.maxPrice || 0) === range.max
                    }
                    onChange={() => handlePriceChange(range.min, range.max)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {range.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Transmission */}
          <FilterSection
            title="Transmission"
            expanded={expandedSections.transmission}
            onToggle={() => toggleSection('transmission')}
          >
            <div className="space-y-2">
              {transmissions.map((trans) => (
                <label
                  key={trans.value}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="transmission"
                    checked={(filters.transmission || '') === trans.value}
                    onChange={() =>
                      onFilterChange({ ...filters, transmission: trans.value || undefined })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {trans.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Fuel Type */}
          <FilterSection
            title="Fuel Type"
            expanded={expandedSections.fuelType}
            onToggle={() => toggleSection('fuelType')}
          >
            <div className="space-y-2">
              {fuelTypes.map((fuel) => (
                <label
                  key={fuel.value}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="fuelType"
                    checked={(filters.fuelType || '') === fuel.value}
                    onChange={() =>
                      onFilterChange({ ...filters, fuelType: fuel.value || undefined })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {fuel.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Seats */}
          <FilterSection
            title="Seats"
            expanded={expandedSections.seats}
            onToggle={() => toggleSection('seats')}
          >
            <div className="space-y-2">
              {seatOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="seats"
                    checked={(filters.seats || 0) === opt.value}
                    onChange={() =>
                      onFilterChange({ ...filters, seats: opt.value || undefined })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        </div>
      </aside>
    </>
  );
}

// Filter Section Component
function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && <div className="pt-1">{children}</div>}
    </div>
  );
}
