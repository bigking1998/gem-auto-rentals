import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';
import VehicleCard from '@/components/vehicles/VehicleCard';
import FilterSidebar, { VehicleFilters } from '@/components/vehicles/FilterSidebar';
import { VehicleGridSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { api, type Vehicle as ApiVehicle } from '@/lib/api';
import SEO from '@/components/SEO';
import { useBookingDates, useBookingCategory, useBookingStore } from '@/stores/bookingStore';

// Vehicle type that matches VehicleCard props
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  status: string;
  seats: number;
  transmission: string;
  fuelType: string;
  images: string[];
  averageRating?: number;
  reviewCount?: number;
}

// Transform API vehicle to component format
function transformVehicle(v: ApiVehicle): Vehicle {
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    category: v.category,
    dailyRate: Number(v.dailyRate),
    status: v.status,
    seats: v.seats,
    transmission: v.transmission,
    fuelType: v.fuelType,
    images: v.images || [],
    averageRating: v.averageRating || 4.5,
    reviewCount: v.reviewCount || 0,
  };
}

// Max time we wait for the vehicles API before showing a recoverable error state.
// The shared api client retries network failures internally (and waits on a server
// wake-up loop), so without this the page can sit on skeletons for minutes.
const VEHICLES_REQUEST_TIMEOUT_MS = 15000;

type LoadState = 'loading' | 'error' | 'ready';

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

export default function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read booking context from store
  const { startDate: storeStartDate, endDate: storeEndDate } = useBookingDates();
  const storeCategory = useBookingCategory();
  const { setDates: setStoreDates } = useBookingStore();

  // Use URL params as override, fallback to store
  const startDate = searchParams.get('start') || storeStartDate;
  const endDate = searchParams.get('end') || storeEndDate;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('price-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<VehicleFilters>({
    category: searchParams.get('category') || storeCategory || undefined,
  });

  const itemsPerPage = 9;
  const isLoading = loadState === 'loading';
  const hasError = loadState === 'error';

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const loadVehicles = async () => {
      setLoadState('loading');
      try {
        // Fetch vehicles from backend API, but never wait longer than the timeout —
        // a failed/hanging request must surface an error state, not endless skeletons.
        const response = await Promise.race([
          api.vehicles.list({
            limit: 100, // Get all available vehicles
          }),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error('Vehicles request timed out')),
              VEHICLES_REQUEST_TIMEOUT_MS
            );
          }),
        ]);

        if (cancelled) return;

        if (response.items && response.items.length > 0) {
          const transformedVehicles = response.items.map(transformVehicle);
          setVehicles(transformedVehicles);
        } else {
          setVehicles([]);
        }
        setLoadState('ready');
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching vehicles:', error);
        setVehicles([]);
        setLoadState('error');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    loadVehicles();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reloadKey]);

  useEffect(() => {
    if (isLoading) return;

    let result = [...vehicles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      result = result.filter((v) => v.category === filters.category);
    }

    if (filters.minPrice) {
      result = result.filter((v) => v.dailyRate >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      result = result.filter((v) => v.dailyRate <= filters.maxPrice!);
    }

    if (filters.transmission) {
      result = result.filter((v) => v.transmission === filters.transmission);
    }

    if (filters.fuelType) {
      result = result.filter((v) => v.fuelType === filters.fuelType);
    }

    if (filters.seats) {
      result = result.filter((v) => v.seats >= filters.seats!);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.dailyRate - b.dailyRate);
        break;
      case 'price-desc':
        result.sort((a, b) => b.dailyRate - a.dailyRate);
        break;
      case 'rating':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'newest':
        result.sort((a, b) => b.year - a.year);
        break;
    }

    setFilteredVehicles(result);
    setCurrentPage(1);
  }, [vehicles, searchQuery, filters, sortBy, isLoading]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (newFilters: VehicleFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params);
  };

  const handleRetry = () => {
    setReloadKey((k) => k + 1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSearchParams({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SEO
        title="Browse Our Fleet"
        description="Browse our wide selection of rental vehicles. From economy cars to luxury sedans and SUVs, find the perfect car for your next trip. Book online today!"
        keywords="rental cars, browse vehicles, car fleet, economy rental, luxury rental, SUV rental, Mulberry FL"
        canonicalUrl="https://gemrentalcars.com/vehicles"
      />
      <Header />

      <main className="flex-1">
        <PageHeader
          title="Browse Our Fleet"
          description="Find the perfect vehicle for your next adventure. From economy cars to luxury sedans, we have something for everyone."
        />

        {/* Content */}
        <div className="container relative z-30 mx-auto -mt-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by make, model, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:ring-primary/20 focus:border-primary w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 text-gray-900 transition-all placeholder:text-gray-500 focus:ring-2"
                />
              </div>
            </form>
          </div>

          {/* Date Context Banner */}
          {startDate && endDate && (
            <div className="bg-primary/5 border-primary/20 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Calendar className="text-primary-ink h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your selected dates</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    &mdash;{' '}
                    {new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="text-primary-ink text-sm font-medium transition-colors hover:underline"
                >
                  Change dates
                </button>
                <button
                  onClick={() => {
                    setStoreDates('', '');
                    // Clear URL params too
                    const params = new URLSearchParams(searchParams);
                    params.delete('start');
                    params.delete('end');
                    setSearchParams(params);
                  }}
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                  title="Clear dates"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-8 pb-16 lg:flex-row">
            {/* Filter Sidebar */}
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isOpen={filterSidebarOpen}
              onClose={() => setFilterSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="min-w-0 flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setFilterSidebarOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 from-neutral-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </button>

                  <p className="text-sm text-gray-500">
                    {isLoading ? (
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" />
                    ) : hasError ? (
                      <span className="text-gray-500">Vehicles unavailable</span>
                    ) : (
                      <>
                        <span className="font-bold text-gray-900">{filteredVehicles.length}</span>{' '}
                        vehicles found
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="focus:ring-primary/20 focus:border-primary cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm hover:bg-gray-50 focus:ring-2"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronLeft className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 -rotate-90 text-gray-400" />
                  </div>

                  {/* View Toggle */}
                  <div className="hidden items-center overflow-hidden rounded-lg border border-gray-200 bg-white sm:flex">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-2 transition-colors',
                        viewMode === 'grid'
                          ? 'bg-primary/10 text-primary-ink'
                          : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-2 transition-colors',
                        viewMode === 'list'
                          ? 'bg-primary/10 text-primary-ink'
                          : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <VehicleGridSkeleton count={6} />
              ) : hasError ? (
                /* Error State — fetch failed or timed out */
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                  <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <AlertTriangle className="text-primary-ink h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">
                    We couldn&apos;t load our fleet
                  </h3>
                  <p className="mx-auto mb-6 max-w-md px-4 text-gray-500">
                    Something went wrong while reaching our servers. Please check your connection
                    and try again in a moment.
                  </p>
                  <button
                    onClick={handleRetry}
                    className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              ) : paginatedVehicles.length > 0 ? (
                /* Vehicle Grid/List */
                <div
                  className={cn(
                    'gap-6',
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'flex flex-col'
                  )}
                >
                  {paginatedVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} {...vehicle} variant={viewMode} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">No vehicles found</h3>
                  <p className="mb-4 text-gray-500">Try adjusting your filters or search terms</p>
                  <button
                    onClick={handleClearFilters}
                    className="text-primary-ink font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !hasError && totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'h-10 w-10 rounded-lg text-sm font-medium transition-colors',
                        currentPage === page
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
