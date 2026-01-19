import { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@gem/ui'; // We need to check if these are exported from index.ts. Yes they are.
import { RadioGroup, RadioGroupItem } from '@gem/ui';
import { Checkbox } from '@gem/ui';
import { Slider } from '@gem/ui';
import { Label } from '@gem/ui'; /* Helper for RadioGroup labels */

// If @gem/ui exports aren't working immediately, we might need to rely on the fact they are workspace packages.
// Assuming @gem/ui exports all these.

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
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
];

const transmissions = [
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
];

const fuelTypes = [
  { value: 'GASOLINE', label: 'Gasoline' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const seatOptions = [
  { value: 2, label: '2+ Seats' },
  { value: 4, label: '4+ Seats' },
  { value: 5, label: '5+ Seats' },
  { value: 7, label: '7+ Seats' },
];

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  isOpen = true,
  onClose,
}: FilterSidebarProps) {
  // Local state for slider to allow smooth dragging before committing
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);

  useEffect(() => {
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 300]);
    } else {
      setPriceRange([0, 300]);
    }
  }, [filters.minPrice, filters.maxPrice]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== 0
  ).length;

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  const handlePriceCommit = (value: number[]) => {
    onFilterChange({
      ...filters,
      minPrice: value[0] > 0 ? value[0] : undefined,
      maxPrice: value[1] < 300 ? value[1] : undefined,
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
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-900" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-primary hover:text-orange-600 font-medium"
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

        <div className="p-4">
          <Accordion type="multiple" defaultValue={['category', 'price', 'transmission', 'fuel', 'seats']} className="space-y-4">

            {/* Category */}
            <AccordionItem value="category" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline text-base font-semibold text-gray-900">
                Category
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <RadioGroup
                  value={filters.category || ""}
                  onValueChange={(val) => onFilterChange({ ...filters, category: val === "" ? undefined : val })}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="" id="cat-all" />
                    <Label htmlFor="cat-all" className="text-sm text-gray-600 cursor-pointer">All Categories</Label>
                  </div>
                  {categories.map((cat) => (
                    <div key={cat.value} className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value={cat.value} id={`cat-${cat.value}`} />
                      <Label htmlFor={`cat-${cat.value}`} className="text-sm text-gray-600 cursor-pointer">{cat.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>

            {/* Price Range */}
            <AccordionItem value="price" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline text-base font-semibold text-gray-900">
                Price Range
              </AccordionTrigger>
              <AccordionContent className="pt-6 px-1">
                <Slider
                  defaultValue={[0, 300]}
                  value={priceRange}
                  min={0}
                  max={300}
                  step={10}
                  onValueChange={handlePriceChange}
                  onValueCommit={handlePriceCommit}
                  className="mb-6"
                />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium text-gray-900">${priceRange[0]}</span>
                  <span className="font-medium text-gray-900">${priceRange[1]}{priceRange[1] === 300 && '+'}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Transmission */}
            <AccordionItem value="transmission" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline text-base font-semibold text-gray-900">
                Transmission
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  {transmissions.map((trans) => (
                    <div key={trans.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`trans-${trans.value}`}
                        checked={filters.transmission === trans.value}
                        onCheckedChange={(checked) => {
                          onFilterChange({
                            ...filters,
                            transmission: checked ? trans.value : undefined
                          })
                        }}
                      />
                      <Label htmlFor={`trans-${trans.value}`} className="text-sm text-gray-600 cursor-pointer">
                        {trans.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Fuel Type */}
            <AccordionItem value="fuel" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline text-base font-semibold text-gray-900">
                Fuel Type
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  {fuelTypes.map((fuel) => (
                    <div key={fuel.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fuel-${fuel.value}`}
                        checked={filters.fuelType === fuel.value}
                        onCheckedChange={(checked) => {
                          onFilterChange({
                            ...filters,
                            fuelType: checked ? fuel.value : undefined
                          })
                        }}
                      />
                      <Label htmlFor={`fuel-${fuel.value}`} className="text-sm text-gray-600 cursor-pointer">
                        {fuel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Seats */}
            <AccordionItem value="seats" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline text-base font-semibold text-gray-900">
                Seats
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <RadioGroup
                  value={filters.seats?.toString() || "0"}
                  onValueChange={(val) => onFilterChange({ ...filters, seats: val === "0" ? undefined : parseInt(val) })}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="0" id="seats-any" />
                    <Label htmlFor="seats-any" className="text-sm text-gray-600 cursor-pointer">Any Seats</Label>
                  </div>
                  {seatOptions.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value={opt.value.toString()} id={`seats-${opt.value}`} />
                      <Label htmlFor={`seats-${opt.value}`} className="text-sm text-gray-600 cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </aside>
    </>
  );
}
