import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';
import VehicleCard from '@/components/vehicles/VehicleCard';
import FilterSidebar, { VehicleFilters } from '@/components/vehicles/FilterSidebar';
import { VehicleGridSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

// Mock data (same as before)
const mockVehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'STANDARD',
    dailyRate: 65,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
    averageRating: 4.8,
    reviewCount: 124,
  },
  {
    id: '2',
    make: 'Honda',
    model: 'CR-V',
    year: 2024,
    category: 'SUV',
    dailyRate: 85,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'HYBRID',
    images: ['https://images.unsplash.com/photo-1542362567-b07e54358753?w=800'],
    averageRating: 4.7,
    reviewCount: 98,
  },
  {
    id: '3',
    make: 'BMW',
    model: '3 Series',
    year: 2024,
    category: 'PREMIUM',
    dailyRate: 120,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
    averageRating: 4.9,
    reviewCount: 156,
  },
  {
    id: '4',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'PREMIUM',
    dailyRate: 130,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'ELECTRIC',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
    averageRating: 4.9,
    reviewCount: 203,
  },
  {
    id: '5',
    make: 'Ford',
    model: 'Mustang',
    year: 2024,
    category: 'LUXURY',
    dailyRate: 150,
    status: 'AVAILABLE',
    seats: 4,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'], // Keeping existing as it is a Mustang
    averageRating: 4.8,
    reviewCount: 87,
  },
  {
    id: '6',
    make: 'Nissan',
    model: 'Versa',
    year: 2024,
    category: 'ECONOMY',
    dailyRate: 45,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=800'],
    averageRating: 4.5,
    reviewCount: 234,
  },
  {
    id: '7',
    make: 'Chevrolet',
    model: 'Suburban',
    year: 2024,
    category: 'VAN',
    dailyRate: 140,
    status: 'AVAILABLE',
    seats: 8,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800'],
    averageRating: 4.6,
    reviewCount: 67,
  },
  {
    id: '8',
    make: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2024,
    category: 'LUXURY',
    dailyRate: 250,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
    averageRating: 5.0,
    reviewCount: 45,
  },
  {
    id: '9',
    make: 'Hyundai',
    model: 'Elantra',
    year: 2024,
    category: 'ECONOMY',
    dailyRate: 50,
    status: 'AVAILABLE',
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800'],
    averageRating: 4.6,
    reviewCount: 189,
  },
];

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

export default function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [filteredVehicles, setFilteredVehicles] = useState(mockVehicles);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('price-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<VehicleFilters>({
    category: searchParams.get('category') || undefined,
  });

  const itemsPerPage = 9;

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setVehicles(mockVehicles);
      setIsLoading(false);
    };
    loadVehicles();
  }, []);

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <PageHeader
          title="Browse Our Fleet"
          description="Find the perfect vehicle for your next adventure. From economy cars to luxury sedans, we have something for everyone."
        />

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by make, model, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-500 transition-all"
                />
              </div>
            </form>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 pb-16">
            {/* Filter Sidebar */}
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isOpen={filterSidebarOpen}
              onClose={() => setFilterSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setFilterSidebarOpen(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 from-neutral-50"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </button>

                  <p className="text-sm text-gray-500">
                    {isLoading ? (
                      <span className="inline-block h-4 w-24 animate-pulse bg-gray-200 rounded" />
                    ) : (
                      <>
                        <span className="font-bold text-gray-900">
                          {filteredVehicles.length}
                        </span>{' '}
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
                      className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-gray-400 pointer-events-none" />
                  </div>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-2 transition-colors',
                        viewMode === 'grid'
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-2 transition-colors',
                        viewMode === 'list'
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <VehicleGridSkeleton count={6} />
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
                    <VehicleCard
                      key={vehicle.id}
                      {...vehicle}
                      variant={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No vehicles found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="text-primary hover:text-orange-600 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                        currentPage === page
                          ? 'bg-primary text-white shadow-lg shadow-orange-200'
                          : 'hover:bg-gray-100 text-gray-700 bg-white border border-gray-200'
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
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
