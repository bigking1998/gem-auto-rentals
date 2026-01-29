import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, Calendar, Package, User, FileText, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DateLocationStep from '@/components/booking/DateLocationStep';
import ExtrasStep from '@/components/booking/ExtrasStep';
import CustomerInfoStep from '@/components/booking/CustomerInfoStep';
import DocumentUploadStep from '@/components/booking/DocumentUploadStep';
import PaymentStep from '@/components/booking/PaymentStep';
import { cn } from '@/lib/utils';
import { api, Vehicle } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useBookingDates } from '@/stores/bookingStore';

// Session storage key for booking data
export const BOOKING_VEHICLE_KEY = 'gem_booking_vehicle';

const steps = [
  { id: 1, title: 'Dates & Location', icon: Calendar },
  { id: 2, title: 'Extras', icon: Package },
  { id: 3, title: 'Your Details', icon: User },
  { id: 4, title: 'Documents', icon: FileText },
  { id: 5, title: 'Payment', icon: CreditCard },
];

export interface BookingData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;
  extras: {
    insurance: boolean;
    gps: boolean;
    childSeat: boolean;
    additionalDriver: boolean;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    driversLicense: string;
    dateOfBirth: string;
  };
  documents?: {
    license_front?: {
      fileName: string;
      uploaded: boolean;
    };
    license_back?: {
      fileName: string;
      uploaded: boolean;
    };
  };
}

const initialBookingData: BookingData = {
  vehicleId: '',
  startDate: '',
  endDate: '',
  pickupLocation: 'Main Office - Downtown',
  dropoffLocation: 'Main Office - Downtown',
  pickupTime: '10:00',
  dropoffTime: '10:00',
  extras: {
    insurance: false,
    gps: false,
    childSeat: false,
    additionalDriver: false,
  },
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'United States',
    driversLicense: '',
    dateOfBirth: '',
  },
  documents: {},
};

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized } = useAuthStore();

  // Get dates from store as fallback when URL params are empty
  const { startDate: storeStartDate, endDate: storeEndDate } = useBookingDates();

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    ...initialBookingData,
    // Use URL params first, then store as fallback
    startDate: searchParams.get('start') || storeStartDate || '',
    endDate: searchParams.get('end') || storeEndDate || '',
  });
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const returnUrl = `/booking?${searchParams.toString()}`;
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate, searchParams]);

  // Load vehicle from sessionStorage
  useEffect(() => {
    function loadVehicle() {
      try {
        const storedVehicle = sessionStorage.getItem(BOOKING_VEHICLE_KEY);
        if (!storedVehicle) {
          setError('No vehicle selected. Please select a vehicle first.');
          setIsLoading(false);
          return;
        }

        const vehicleData: Vehicle = JSON.parse(storedVehicle);
        setVehicle(vehicleData);
        setBookingData((prev) => ({
          ...prev,
          vehicleId: vehicleData.id,
        }));

        // Pre-fill customer info if user is logged in
        if (user) {
          setBookingData((prev) => ({
            ...prev,
            customer: {
              ...prev.customer,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: user.phone || '',
            },
          }));
        }
      } catch (err) {
        console.error('Error loading vehicle:', err);
        setError('Failed to load vehicle details');
      } finally {
        setIsLoading(false);
      }
    }

    loadVehicle();
  }, [user]);

  // Parse extras from URL
  useEffect(() => {
    const extrasParam = searchParams.get('extras');
    if (extrasParam) {
      const extrasList = extrasParam.split(',');
      setBookingData((prev) => ({
        ...prev,
        extras: {
          insurance: extrasList.includes('insurance'),
          gps: extrasList.includes('gps'),
          childSeat: extrasList.includes('childSeat'),
          additionalDriver: extrasList.includes('additionalDriver'),
        },
      }));
    }
  }, [searchParams]);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    if (!vehicle) return 0;
    let total = Number(vehicle.dailyRate) * days;

    if (bookingData.extras.insurance) total += 25 * days;
    if (bookingData.extras.gps) total += 10 * days;
    if (bookingData.extras.childSeat) total += 8 * days;
    if (bookingData.extras.additionalDriver) total += 15 * days;

    return total;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return calculateDays() > 0;
      case 2:
        return true; // Extras are optional
      case 3:
        // Basic customer info validation
        const { firstName, lastName, email, phone, driversLicense } = bookingData.customer;
        return firstName && lastName && email && phone && driversLicense;
      case 4:
        // Documents validation
        const docs = bookingData.documents;
        return docs?.license_front?.uploaded && docs?.license_back?.uploaded;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (currentStep < steps.length && canProceed()) {
      // When moving to payment step (step 5), create the booking first
      if (currentStep === 4 && !bookingId) {
        await createBooking();
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const createBooking = async () => {
    if (!vehicle) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await api.bookings.create({
        vehicleId: vehicle.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        pickupTime: bookingData.pickupTime,
        dropoffTime: bookingData.dropoffTime,
        extras: bookingData.extras,
        customer: {
          firstName: bookingData.customer.firstName,
          lastName: bookingData.customer.lastName,
          email: bookingData.customer.email,
          phone: bookingData.customer.phone,
          address: bookingData.customer.address,
          city: bookingData.customer.city,
          zipCode: bookingData.customer.zipCode,
        },
      });

      setBookingId(booking.id);
      setCurrentStep(5);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handlePaymentSuccess = () => {
    if (!vehicle || !bookingId) return;

    // Navigate to confirmation with booking data
    navigate('/booking/confirmation', {
      state: {
        booking: bookingData,
        bookingId,
        vehicle,
        total: calculateTotal(),
        days: calculateDays()
      }
    });
  };

  const days = calculateDays();
  const total = calculateTotal();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header variant="booking" />
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

  // Show error state
  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header variant="booking" />
        <main className="flex-1 flex items-center justify-center py-12 pt-32">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Booking</h2>
            <p className="text-gray-600 mb-6">{error || 'Vehicle not found'}</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="booking" />

      <main className="flex-1 py-12 pt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative flex items-center justify-between">
              {/* Connector Lines */}
              <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-100 -z-10" />

              {steps.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="relative flex flex-col items-center bg-gray-50 px-2">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm',
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                            ? 'bg-primary border-primary text-white scale-110 shadow-primary/25 shadow-lg'
                            : 'bg-white border-gray-200 text-gray-300'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-3 text-xs font-bold tracking-wide transition-colors duration-300',
                        isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStep === 1 && (
                      <DateLocationStep
                        data={bookingData}
                        onChange={updateBookingData}
                      />
                    )}
                    {currentStep === 2 && (
                      <ExtrasStep
                        data={bookingData}
                        onChange={updateBookingData}
                        dailyRate={Number(vehicle.dailyRate)}
                        days={days}
                      />
                    )}
                    {currentStep === 3 && (
                      <CustomerInfoStep
                        data={bookingData}
                        onChange={updateBookingData}
                      />
                    )}
                    {currentStep === 4 && (
                      <DocumentUploadStep
                        data={bookingData}
                        onChange={updateBookingData}
                      />
                    )}
                    {currentStep === 5 && bookingId && (
                      <PaymentStep
                        data={bookingData}
                        vehicle={{
                          make: vehicle.make,
                          model: vehicle.model,
                          year: vehicle.year,
                          category: vehicle.category,
                          dailyRate: Number(vehicle.dailyRate),
                          images: vehicle.images,
                        }}
                        total={total}
                        days={days}
                        bookingId={bookingId}
                        onSubmit={handlePaymentSuccess}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {currentStep < 5 && (
                  <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                        currentStep === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <button
                      onClick={nextStep}
                      disabled={!canProceed() || isSubmitting}
                      className={cn(
                        'flex items-center gap-2 px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 transform active:scale-95',
                        (!canProceed() || isSubmitting)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                          : 'bg-primary text-white hover:bg-orange-600 hover:shadow-primary/30'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Booking...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sticky top-28 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/60">
                <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                  <span>Order Summary</span>
                  <div className="h-1 w-1 rounded-full bg-primary/50" />
                </h3>

                {/* Vehicle Info */}
                <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="relative w-24 h-20 rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight mb-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                      {vehicle.category}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                {bookingData.startDate && bookingData.endDate && (
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Pick-up</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(bookingData.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Return</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(bookingData.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200/50">
                      <span className="text-gray-500 font-medium">Duration</span>
                      <span className="text-primary font-bold">{days} days</span>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm group">
                    <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                      Car Rental
                    </span>
                    <span className="text-gray-900 font-semibold">${Number(vehicle.dailyRate) * days}</span>
                  </div>

                  {bookingData.extras.insurance && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Insurance
                      </span>
                      <span className="font-semibold">+${25 * days}</span>
                    </div>
                  )}
                  {bookingData.extras.gps && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> GPS
                      </span>
                      <span className="font-semibold">+${10 * days}</span>
                    </div>
                  )}
                  {bookingData.extras.childSeat && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Child Seat
                      </span>
                      <span className="font-semibold">+${8 * days}</span>
                    </div>
                  )}
                  {bookingData.extras.additionalDriver && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Add. Driver
                      </span>
                      <span className="font-semibold">+${15 * days}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-end pt-6 border-t-2 border-dashed border-gray-100">
                  <span className="text-sm font-semibold text-gray-500 mb-1">Total Amount</span>
                  <span className="text-3xl font-bold text-gray-900">${total}</span>
                </div>

                {/* Progress Indicator */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                    <span className="text-gray-400">Completion</span>
                    <span className="text-primary">{Math.round((currentStep / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    Free cancellation (24h)
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    No hidden fees
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    Secure SSL payment
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
