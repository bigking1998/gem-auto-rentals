import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, Calendar, Package, User, FileText, CreditCard } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DateLocationStep from '@/components/booking/DateLocationStep';
import ExtrasStep from '@/components/booking/ExtrasStep';
import CustomerInfoStep from '@/components/booking/CustomerInfoStep';
import DocumentUploadStep from '@/components/booking/DocumentUploadStep';
import PaymentStep from '@/components/booking/PaymentStep';
import { cn } from '@/lib/utils';

// Mock vehicle data
const mockVehicle = {
  id: '1',
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  category: 'STANDARD',
  dailyRate: 65,
  images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
  seats: 5,
  transmission: 'AUTOMATIC',
  fuelType: 'GASOLINE',
};

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
  const { vehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    ...initialBookingData,
    vehicleId: vehicleId || '',
    startDate: searchParams.get('start') || '',
    endDate: searchParams.get('end') || '',
  });
  const [vehicle] = useState(mockVehicle); // Would fetch from API

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
    let total = vehicle.dailyRate * days;

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

  const nextStep = () => {
    if (currentStep < steps.length && canProceed()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Would submit to API
    navigate('/booking/confirmation', {
      state: {
        booking: bookingData,
        vehicle,
        total: calculateTotal(),
        days: calculateDays()
      }
    });
  };

  const days = calculateDays();
  const total = calculateTotal();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        currentStep > step.id
                          ? 'bg-green-500 border-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium hidden sm:block',
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 sm:mx-4',
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              ))}
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
                        dailyRate={vehicle.dailyRate}
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
                    {currentStep === 5 && (
                      <PaymentStep
                        data={bookingData}
                        vehicle={vehicle}
                        total={total}
                        days={days}
                        onSubmit={handleSubmit}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {currentStep < 5 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        currentStep === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className={cn(
                        'flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors',
                        !canProceed()
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      )}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Order Summary</h3>

                {/* Vehicle Info */}
                <div className="flex gap-4 mb-4 pb-4 border-b border-gray-100">
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="text-sm text-gray-500">{vehicle.category}</p>
                  </div>
                </div>

                {/* Dates */}
                {bookingData.startDate && bookingData.endDate && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pick-up</span>
                      <span className="text-gray-900">
                        {new Date(bookingData.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Return</span>
                      <span className="text-gray-900">
                        {new Date(bookingData.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="text-gray-900">{days} days</span>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      ${vehicle.dailyRate} x {days} days
                    </span>
                    <span className="text-gray-900">${vehicle.dailyRate * days}</span>
                  </div>

                  {bookingData.extras.insurance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Insurance</span>
                      <span className="text-gray-900">${25 * days}</span>
                    </div>
                  )}
                  {bookingData.extras.gps && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">GPS Navigation</span>
                      <span className="text-gray-900">${10 * days}</span>
                    </div>
                  )}
                  {bookingData.extras.childSeat && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Child Seat</span>
                      <span className="text-gray-900">${8 * days}</span>
                    </div>
                  )}
                  {bookingData.extras.additionalDriver && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Additional Driver</span>
                      <span className="text-gray-900">${15 * days}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-indigo-600">${total}</span>
                </div>

                {/* Progress Indicator */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Booking Progress</span>
                    <span className="font-medium text-gray-900">{currentStep} of {steps.length}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Check className="w-4 h-4 text-green-500" />
                    Free cancellation up to 24h before
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Check className="w-4 h-4 text-green-500" />
                    No hidden fees
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Check className="w-4 h-4 text-green-500" />
                    Secure payment
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
