import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Fuel,
  Gauge,
  Star,
  Check,
  Calendar,
  MapPin,
  Shield,
  Navigation,
  Baby,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@gem/ui';
import AvailabilityCalendar from '@/components/vehicles/AvailabilityCalendar';
import ReviewList from '@/components/vehicles/ReviewList';
import FavoriteButton from '@/components/vehicles/FavoriteButton';
import { api, Vehicle } from '@/lib/api';
import { PRIMARY_PHONE, PRIMARY_PHONE_HREF } from '@/lib/contact';
import { BOOKING_VEHICLE_KEY } from './BookingPage';
import { useAuthStore } from '@/stores/authStore';
import { useBookingDates, useBookingStore } from '@/stores/bookingStore';

const extras = [
  {
    id: 'insurance',
    name: 'Full Insurance',
    price: 25,
    icon: Shield,
    description: 'Complete coverage for peace of mind',
  },
  {
    id: 'gps',
    name: 'GPS Navigation',
    price: 10,
    icon: Navigation,
    description: 'Never get lost on your journey',
  },
  {
    id: 'childSeat',
    name: 'Child Seat',
    price: 8,
    icon: Baby,
    description: 'Safety-certified child seat',
  },
  {
    id: 'additionalDriver',
    name: 'Additional Driver',
    price: 15,
    icon: UserPlus,
    description: 'Add another driver to your rental',
  },
];

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Get dates from booking store for sticky context
  const { startDate: storeStartDate, endDate: storeEndDate } = useBookingDates();
  const { setDates: setStoreDates } = useBookingStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  // Initialize from store instead of empty strings
  const [startDate, setStartDate] = useState(storeStartDate || '');
  const [endDate, setEndDate] = useState(storeEndDate || '');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync local dates back to store when they change
  useEffect(() => {
    if (startDate && endDate) {
      setStoreDates(startDate, endDate);
    }
  }, [startDate, endDate, setStoreDates]);

  // Fetch vehicle data from API
  useEffect(() => {
    async function fetchVehicle() {
      if (!id) {
        setError('No vehicle ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const vehicleData = await api.vehicles.get(id);
        setVehicle(vehicleData);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVehicle();
  }, [id]);

  // Handle booking navigation
  const handleBookNow = () => {
    if (!vehicle || days <= 0) return;

    // Store vehicle in sessionStorage for booking page
    sessionStorage.setItem(BOOKING_VEHICLE_KEY, JSON.stringify(vehicle));

    // Build booking URL with dates and extras
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (selectedExtras.length > 0) params.set('extras', selectedExtras.join(','));
    const bookingUrl = `/booking?${params.toString()}`;

    // If not authenticated (or auth not initialized yet), redirect to signup with return URL
    // We check isInitialized to avoid race condition where persisted state says "authenticated"
    // but the token hasn't been validated yet
    if (!isInitialized || !isAuthenticated) {
      const signupParams = new URLSearchParams();
      signupParams.set('returnUrl', bookingUrl);
      navigate(`/signup?${signupParams.toString()}`);
      return;
    }

    // User is authenticated, proceed to booking
    navigate(bookingUrl);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraId) ? prev.filter((e) => e !== extraId) : [...prev, extraId]
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const days = calculateDays();
  const dailyRate = vehicle ? Number(vehicle.dailyRate) : 0;
  const basePrice = dailyRate * days;
  const extrasPrice = selectedExtras.reduce((sum, extraId) => {
    const extra = extras.find((e) => e.id === extraId);
    return sum + (extra ? extra.price * days : 0);
  }, 0);
  const totalPrice = basePrice + extrasPrice;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center py-12 pt-32">
          <div className="text-center">
            <Loader2 className="text-primary-ink mx-auto mb-4 h-12 w-12 animate-spin" />
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center py-12 pt-32">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Vehicle Not Found</h2>
            <p className="mb-6 text-gray-600">
              {error || 'The vehicle you are looking for does not exist.'}
            </p>
            <button
              onClick={() => navigate('/vehicles')}
              className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-lg px-6 py-3 transition-colors"
            >
              Browse Vehicles
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % vehicle.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
  };

  // Helper to parse "YYYY-MM-DD" as local date (00:00:00)
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to format date as "YYYY-MM-DD" using local components
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-24">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <button
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/vehicles');
                }
              }}
              className="hover:text-primary-ink hover:border-primary/30 group inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to vehicles
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Column - Images & Details (8 cols) */}
            <div className="space-y-8 lg:col-span-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 shadow-md">
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={vehicle.images[activeImageIndex]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={prevImage}
                      className="transform rounded-full bg-white/90 p-2 text-gray-900 shadow-lg transition-colors hover:scale-105 hover:bg-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="transform rounded-full bg-white/90 p-2 text-gray-900 shadow-lg transition-colors hover:scale-105 hover:bg-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                    {activeImageIndex + 1} / {vehicle.images.length}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={cn(
                        'aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                        index === activeImageIndex
                          ? 'border-primary ring-primary/20 ring-2'
                          : 'border-transparent hover:border-gray-300'
                      )}
                    >
                      <img
                        src={image}
                        alt={`View ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Specs */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <span className="text-primary-foreground bg-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold shadow-lg">
                      {vehicle.category}
                    </span>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < Math.floor(vehicle.averageRating ?? 0)
                                ? 'text-primary fill-primary'
                                : 'fill-gray-200 text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-900">
                        {vehicle.averageRating?.toFixed(1) ?? 'New'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({vehicle.reviewCount ?? 0} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <FavoriteButton vehicleId={vehicle.id} size="lg" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">${vehicle.dailyRate}</span>
                      <span className="font-medium text-gray-500">/day</span>
                    </div>
                    <p className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <Check className="h-3 w-3" /> Best Price Guarantee
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-6 md:grid-cols-4">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-4">
                    <Users className="mb-2 h-6 w-6 text-gray-400" />
                    <span className="font-bold text-gray-900">{vehicle.seats} Seats</span>
                    <span className="text-xs text-gray-500">Capacity</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-4">
                    <Gauge className="mb-2 h-6 w-6 text-gray-400" />
                    <span className="font-bold text-gray-900">
                      {vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}
                    </span>
                    <span className="text-xs text-gray-500">Transmission</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-4">
                    <Fuel className="mb-2 h-6 w-6 text-gray-400" />
                    <span className="font-bold capitalize text-gray-900">
                      {vehicle.fuelType.toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-500">Fuel Type</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-4">
                    <MapPin className="mb-2 h-6 w-6 text-gray-400" />
                    <span className="font-bold text-gray-900">{vehicle.doors} Doors</span>
                    <span className="text-xs text-gray-500">Access</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">Description</h3>
                  <p className="text-lg leading-relaxed text-gray-600">{vehicle.description}</p>
                </div>

                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Key Features</h3>
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                    {vehicle.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <ReviewList
                vehicleId={vehicle.id}
                initialReviewCount={vehicle.reviewCount ?? 0}
                initialAverageRating={vehicle.averageRating ?? null}
              />
            </div>

            {/* Right Column - Booking Card (4 cols) */}
            <div className="lg:col-span-4">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                  <div className="bg-gray-900 p-6 text-white">
                    <h3 className="mb-1 text-lg font-bold">Book This Vehicle</h3>
                    <p className="text-sm text-gray-400">Complete your reservation securely</p>
                  </div>

                  <div className="p-6">
                    {/* Dates */}
                    <div className="mb-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-sm font-bold text-gray-700">
                            Pick-up Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  'flex w-full items-center justify-start rounded-xl border p-3 text-left font-medium transition-all',
                                  !startDate
                                    ? 'hover:border-primary/50 border-gray-200 text-gray-500'
                                    : 'border-primary bg-primary/5 text-gray-900'
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {startDate
                                    ? parseLocalDate(startDate)?.toLocaleDateString()
                                    : 'Select Date'}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <AvailabilityCalendar
                                selectedStart={parseLocalDate(startDate)}
                                selectedEnd={parseLocalDate(endDate)}
                                onSelectStart={(date) => setStartDate(formatLocalDate(date))}
                                onSelectEnd={(date) => {
                                  if (date) {
                                    setEndDate(formatLocalDate(date));
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

                        <div>
                          <label className="mb-1.5 block text-sm font-bold text-gray-700">
                            Return Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  'flex w-full items-center justify-start rounded-xl border p-3 text-left font-medium transition-all',
                                  !endDate
                                    ? 'hover:border-primary/50 border-gray-200 text-gray-500'
                                    : 'border-primary bg-primary/5 text-gray-900'
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {endDate
                                    ? parseLocalDate(endDate)?.toLocaleDateString()
                                    : 'Select Date'}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <AvailabilityCalendar
                                selectedStart={parseLocalDate(startDate)}
                                selectedEnd={parseLocalDate(endDate)}
                                onSelectStart={(date) => setStartDate(formatLocalDate(date))}
                                onSelectEnd={(date) => {
                                  if (date) {
                                    setEndDate(formatLocalDate(date));
                                  } else {
                                    setEndDate('');
                                  }
                                }}
                                minDate={
                                  startDate ? parseLocalDate(startDate) || new Date() : new Date()
                                }
                                selectionMode="end"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* Extras */}
                    <div className="mb-6">
                      <label className="mb-3 block text-sm font-bold text-gray-700">
                        Optional Extras
                      </label>
                      <div className="space-y-2">
                        {extras.map((extra) => (
                          <label
                            key={extra.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-md',
                              selectedExtras.includes(extra.id)
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50 border-gray-200'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                                selectedExtras.includes(extra.id)
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300 bg-white'
                              )}
                            >
                              {selectedExtras.includes(extra.id) && (
                                <Check className="text-primary-foreground h-3.5 w-3.5" />
                              )}
                              <input
                                type="checkbox"
                                checked={selectedExtras.includes(extra.id)}
                                onChange={() => toggleExtra(extra.id)}
                                className="hidden"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-gray-900">
                                {extra.name}
                              </p>
                              <p className="truncate text-xs text-gray-500">{extra.description}</p>
                            </div>
                            <span className="text-primary-ink text-sm font-bold">
                              +${extra.price}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    {days > 0 && (
                      <div className="mb-6 space-y-3 rounded-xl bg-gray-50 p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            ${vehicle.dailyRate} x {days} days
                          </span>
                          <span className="font-bold text-gray-900">${basePrice}</span>
                        </div>
                        {extrasPrice > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Extras</span>
                            <span className="font-bold text-gray-900">${extrasPrice}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
                          <span>Total</span>
                          <span>${totalPrice}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleBookNow}
                      disabled={days <= 0}
                      className={cn(
                        'block w-full transform rounded-xl py-4 text-center text-lg font-bold shadow-lg transition-all active:scale-[0.98]',
                        days > 0
                          ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                      )}
                    >
                      {days > 0 ? 'Book Now' : 'Select Dates'}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Secure SSL Booking</span>
                    </div>
                  </div>
                </div>

                {/* Help Card */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Need Help?</p>
                      <p className="text-xs text-gray-500">Call our expert support team</p>
                      <a
                        href={PRIMARY_PHONE_HREF}
                        className="text-primary-ink mt-0.5 block text-sm font-bold hover:underline"
                      >
                        {PRIMARY_PHONE}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
