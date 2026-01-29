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
import { BOOKING_VEHICLE_KEY } from './BookingPage';
import { useAuthStore } from '@/stores/authStore';
import { useBookingDates, useBookingStore } from '@/stores/bookingStore';

const extras = [
  { id: 'insurance', name: 'Full Insurance', price: 25, icon: Shield, description: 'Complete coverage for peace of mind' },
  { id: 'gps', name: 'GPS Navigation', price: 10, icon: Navigation, description: 'Never get lost on your journey' },
  { id: 'childSeat', name: 'Child Seat', price: 8, icon: Baby, description: 'Safety-certified child seat' },
  { id: 'additionalDriver', name: 'Additional Driver', price: 15, icon: UserPlus, description: 'Add another driver to your rental' },
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 pt-32">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The vehicle you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/vehicles')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
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
    <div className="min-h-screen flex flex-col bg-gray-50 pt-24">
      <Header />

      <main className="flex-1">

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to vehicles
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column - Images & Details (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 shadow-md group">
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={vehicle.images[activeImageIndex]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={prevImage}
                      className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white text-gray-900 transition-colors transform hover:scale-105"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white text-gray-900 transition-colors transform hover:scale-105"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-full">
                    {activeImageIndex + 1} / {vehicle.images.length}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={cn(
                        'shrink-0 w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all',
                        index === activeImageIndex
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-gray-300'
                      )}
                    >
                      <img
                        src={image}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Specs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-primary shadow-lg shadow-orange-200 rounded-full mb-3">
                      {vehicle.category}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < Math.floor(vehicle.averageRating ?? 0)
                                ? 'text-primary fill-primary'
                                : 'text-gray-200 fill-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-900">{vehicle.averageRating?.toFixed(1) ?? 'New'}</span>
                      <span className="text-gray-500 text-sm">({vehicle.reviewCount ?? 0} reviews)</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <FavoriteButton vehicleId={vehicle.id} size="lg" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">${vehicle.dailyRate}</span>
                      <span className="text-gray-500 font-medium">/day</span>
                    </div>
                    <p className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Best Price Guarantee
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                    <Users className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="font-bold text-gray-900">{vehicle.seats} Seats</span>
                    <span className="text-xs text-gray-500">Capacity</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                    <Gauge className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="font-bold text-gray-900">{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
                    <span className="text-xs text-gray-500">Transmission</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                    <Fuel className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="font-bold text-gray-900 capitalize">{vehicle.fuelType.toLowerCase()}</span>
                    <span className="text-xs text-gray-500">Fuel Type</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="font-bold text-gray-900">{vehicle.doors} Doors</span>
                    <span className="text-xs text-gray-500">Access</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{vehicle.description}</p>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Key Features</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                    {vehicle.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{feature}</span>
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
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-gray-900 text-white">
                    <h3 className="font-bold text-lg mb-1">Book This Vehicle</h3>
                    <p className="text-gray-400 text-sm">Complete your reservation securely</p>
                  </div>

                  <div className="p-6">
                    {/* Dates */}
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Pick-up Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className={cn(
                                "w-full flex items-center justify-start text-left font-medium p-3 rounded-xl border transition-all",
                                !startDate ? "text-gray-500 border-gray-200 hover:border-primary/50" : "text-gray-900 border-primary bg-primary/5"
                              )}>
                                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {startDate ? parseLocalDate(startDate)?.toLocaleDateString() : "Select Date"}
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
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Return Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className={cn(
                                "w-full flex items-center justify-start text-left font-medium p-3 rounded-xl border transition-all",
                                !endDate ? "text-gray-500 border-gray-200 hover:border-primary/50" : "text-gray-900 border-primary bg-primary/5"
                              )}>
                                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {endDate ? parseLocalDate(endDate)?.toLocaleDateString() : "Select Date"}
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
                                minDate={startDate ? parseLocalDate(startDate) || new Date() : new Date()}
                                selectionMode="end"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* Extras */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Optional Extras
                      </label>
                      <div className="space-y-2">
                        {extras.map((extra) => (
                          <label
                            key={extra.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                              selectedExtras.includes(extra.id)
                                ? 'border-primary bg-primary/5 shadow-orange-100'
                                : 'border-gray-200 hover:border-primary/50'
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                              selectedExtras.includes(extra.id) ? "bg-primary border-primary" : "border-gray-300 bg-white"
                            )}>
                              {selectedExtras.includes(extra.id) && <Check className="w-3.5 h-3.5 text-white" />}
                              <input
                                type="checkbox"
                                checked={selectedExtras.includes(extra.id)}
                                onChange={() => toggleExtra(extra.id)}
                                className="hidden"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{extra.name}</p>
                              <p className="text-xs text-gray-500 truncate">{extra.description}</p>
                            </div>
                            <span className="text-sm font-bold text-primary">
                              +${extra.price}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    {days > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
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
                        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 text-gray-900">
                          <span>Total</span>
                          <span>${totalPrice}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleBookNow}
                      disabled={days <= 0}
                      className={cn(
                        'block w-full py-4 text-center text-lg font-bold rounded-xl transition-all shadow-lg transform active:scale-[0.98]',
                        days > 0
                          ? 'bg-primary text-white hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {days > 0 ? 'Book Now' : 'Select Dates'}
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Secure SSL Booking</span>
                    </div>
                  </div>
                </div>

                {/* Help Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Need Help?</p>
                      <p className="text-xs text-gray-500">Call our expert support team</p>
                      <a href="tel:+1234567890" className="text-primary font-bold text-sm block mt-0.5 hover:underline">
                        +1 (555) 123-4567
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
