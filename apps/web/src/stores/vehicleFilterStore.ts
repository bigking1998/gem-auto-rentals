import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type VehicleCategory = 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
export type Transmission = 'AUTOMATIC' | 'MANUAL';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
export type SortOption = 'price-asc' | 'price-desc' | 'rating' | 'popularity' | 'newest';

interface VehicleFilters {
  // Search
  searchQuery: string;

  // Categories
  categories: VehicleCategory[];

  // Price range
  minPrice: number;
  maxPrice: number;

  // Transmission
  transmission: Transmission[];

  // Fuel type
  fuelType: FuelType[];

  // Features
  features: string[];

  // Seats
  minSeats: number;
  maxSeats: number;

  // Sorting
  sortBy: SortOption;

  // Pagination
  page: number;
  pageSize: number;
}

interface VehicleFilterActions {
  setSearchQuery: (query: string) => void;

  toggleCategory: (category: VehicleCategory) => void;
  setCategories: (categories: VehicleCategory[]) => void;
  clearCategories: () => void;

  setPriceRange: (min: number, max: number) => void;
  setMinPrice: (min: number) => void;
  setMaxPrice: (max: number) => void;

  toggleTransmission: (transmission: Transmission) => void;
  setTransmission: (transmission: Transmission[]) => void;

  toggleFuelType: (fuelType: FuelType) => void;
  setFuelType: (fuelType: FuelType[]) => void;

  toggleFeature: (feature: string) => void;
  setFeatures: (features: string[]) => void;

  setSeatsRange: (min: number, max: number) => void;

  setSortBy: (sortBy: SortOption) => void;

  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  resetFilters: () => void;
  getActiveFilterCount: () => number;

  // Build query params for API
  getQueryParams: () => URLSearchParams;
}

const initialFilters: VehicleFilters = {
  searchQuery: '',
  categories: [],
  minPrice: 0,
  maxPrice: 500,
  transmission: [],
  fuelType: [],
  features: [],
  minSeats: 2,
  maxSeats: 8,
  sortBy: 'popularity',
  page: 1,
  pageSize: 12,
};

export const useVehicleFilterStore = create<VehicleFilters & VehicleFilterActions>()(
  persist(
    (set, get) => ({
      ...initialFilters,

      setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),

      toggleCategory: (category) =>
        set((state) => {
          const categories = state.categories.includes(category)
            ? state.categories.filter((c) => c !== category)
            : [...state.categories, category];
          return { categories, page: 1 };
        }),

      setCategories: (categories) => set({ categories, page: 1 }),

      clearCategories: () => set({ categories: [], page: 1 }),

      setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max, page: 1 }),

      setMinPrice: (min) => set({ minPrice: min, page: 1 }),

      setMaxPrice: (max) => set({ maxPrice: max, page: 1 }),

      toggleTransmission: (transmission) =>
        set((state) => {
          const transmissions = state.transmission.includes(transmission)
            ? state.transmission.filter((t) => t !== transmission)
            : [...state.transmission, transmission];
          return { transmission: transmissions, page: 1 };
        }),

      setTransmission: (transmission) => set({ transmission, page: 1 }),

      toggleFuelType: (fuelType) =>
        set((state) => {
          const fuelTypes = state.fuelType.includes(fuelType)
            ? state.fuelType.filter((f) => f !== fuelType)
            : [...state.fuelType, fuelType];
          return { fuelType: fuelTypes, page: 1 };
        }),

      setFuelType: (fuelType) => set({ fuelType, page: 1 }),

      toggleFeature: (feature) =>
        set((state) => {
          const features = state.features.includes(feature)
            ? state.features.filter((f) => f !== feature)
            : [...state.features, feature];
          return { features, page: 1 };
        }),

      setFeatures: (features) => set({ features, page: 1 }),

      setSeatsRange: (min, max) => set({ minSeats: min, maxSeats: max, page: 1 }),

      setSortBy: (sortBy) => set({ sortBy, page: 1 }),

      setPage: (page) => set({ page }),

      setPageSize: (pageSize) => set({ pageSize, page: 1 }),

      nextPage: () => set((state) => ({ page: state.page + 1 })),

      prevPage: () => set((state) => ({ page: Math.max(1, state.page - 1) })),

      resetFilters: () => set(initialFilters),

      getActiveFilterCount: () => {
        const state = get();
        let count = 0;

        if (state.searchQuery) count++;
        if (state.categories.length > 0) count++;
        if (state.minPrice > 0 || state.maxPrice < 500) count++;
        if (state.transmission.length > 0) count++;
        if (state.fuelType.length > 0) count++;
        if (state.features.length > 0) count++;
        if (state.minSeats > 2 || state.maxSeats < 8) count++;

        return count;
      },

      getQueryParams: () => {
        const state = get();
        const params = new URLSearchParams();

        if (state.searchQuery) params.set('search', state.searchQuery);
        if (state.categories.length > 0) params.set('category', state.categories.join(','));
        if (state.minPrice > 0) params.set('minPrice', state.minPrice.toString());
        if (state.maxPrice < 500) params.set('maxPrice', state.maxPrice.toString());
        if (state.transmission.length > 0)
          params.set('transmission', state.transmission.join(','));
        if (state.fuelType.length > 0) params.set('fuelType', state.fuelType.join(','));
        if (state.features.length > 0) params.set('features', state.features.join(','));
        if (state.minSeats > 2) params.set('minSeats', state.minSeats.toString());
        if (state.maxSeats < 8) params.set('maxSeats', state.maxSeats.toString());
        params.set('sortBy', state.sortBy);
        params.set('page', state.page.toString());
        params.set('pageSize', state.pageSize.toString());

        return params;
      },
    }),
    {
      name: 'gem-vehicle-filters',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        categories: state.categories,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        transmission: state.transmission,
        fuelType: state.fuelType,
        sortBy: state.sortBy,
        pageSize: state.pageSize,
      }),
    }
  )
);

// Selector hooks
export const useSearchQuery = () => useVehicleFilterStore((state) => state.searchQuery);
export const useSelectedCategories = () => useVehicleFilterStore((state) => state.categories);
export const usePriceRange = () =>
  useVehicleFilterStore((state) => ({
    min: state.minPrice,
    max: state.maxPrice,
  }));
export const useSortBy = () => useVehicleFilterStore((state) => state.sortBy);
export const usePagination = () =>
  useVehicleFilterStore((state) => ({
    page: state.page,
    pageSize: state.pageSize,
  }));
export const useActiveFilterCount = () => useVehicleFilterStore((state) => state.getActiveFilterCount());
