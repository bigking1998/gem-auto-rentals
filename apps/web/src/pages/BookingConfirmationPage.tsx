import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Car,
  User,
  Mail,
  Phone,
  Download,
  Home,
  Clock,
  Shield,
  Navigation,
  Baby,
  UserPlus
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { BookingData } from './BookingPage';

interface LocationState {
  booking: BookingData;
  vehicle: {
    make: string;
    model: string;
    year: number;
    category: string;
    dailyRate: number;
    images: string[];
  };
  total: number;
  days: number;
}

export default function BookingConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // Generate a random confirmation number
  const confirmationNumber = `GEM${Date.now().toString().slice(-8)}`;

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No booking found</h1>
            <p className="text-gray-500 mb-6">
              It looks like you haven&apos;t completed a booking yet.
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Car className="w-5 h-5" />
              Browse Vehicles
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { booking, vehicle, total, days } = state;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
          </motion.div>

          {/* Confirmation Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-500 text-lg">
              Your reservation has been successfully processed.
            </p>
            <div className="mt-4 inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">Confirmation #:</span>{' '}
              <span className="font-bold">{confirmationNumber}</span>
            </div>
          </motion.div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
          >
            {/* Vehicle Section */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex gap-4">
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-gray-500">{vehicle.category}</p>
                  <p className="text-orange-600 font-semibold mt-1">
                    ${vehicle.dailyRate}/day • {days} days
                  </p>
                </div>
              </div>
            </div>

            {/* Dates & Location */}
            <div className="p-6 border-b border-gray-100 grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">PICK-UP</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    {new Date(booking.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="w-4 h-4 text-orange-600" />
                    {booking.pickupTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {booking.pickupLocation}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">RETURN</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    {new Date(booking.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="w-4 h-4 text-orange-600" />
                    {booking.dropoffTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {booking.dropoffLocation}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">DRIVER DETAILS</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="w-4 h-4 text-orange-600" />
                  {booking.customer.firstName} {booking.customer.lastName}
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-4 h-4 text-orange-600" />
                  {booking.customer.email}
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="w-4 h-4 text-orange-600" />
                  {booking.customer.phone}
                </div>
              </div>
            </div>

            {/* Extras */}
            {(booking.extras.insurance || booking.extras.gps || booking.extras.childSeat || booking.extras.additionalDriver) && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">EXTRAS INCLUDED</h3>
                <div className="flex flex-wrap gap-2">
                  {booking.extras.insurance && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Full Insurance
                    </span>
                  )}
                  {booking.extras.gps && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Navigation className="w-4 h-4" />
                      GPS Navigation
                    </span>
                  )}
                  {booking.extras.childSeat && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                      <Baby className="w-4 h-4" />
                      Child Seat
                    </span>
                  )}
                  {booking.extras.additionalDriver && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      <UserPlus className="w-4 h-4" />
                      Additional Driver
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="p-6 bg-orange-50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-orange-900">Total Paid</span>
                <span className="text-3xl font-bold text-orange-600">${total}</span>
              </div>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6"
          >
            <h3 className="font-semibold text-amber-900 mb-2">What to bring at pick-up</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Valid driver&apos;s license (same as provided during booking)</li>
              <li>• Credit card in the driver&apos;s name</li>
              <li>• Booking confirmation (this page or email)</li>
              <li>• Additional driver&apos;s license (if applicable)</li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              <Download className="w-5 h-5" />
              Download Confirmation
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </button>
          </motion.div>

          {/* Email Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            A confirmation email has been sent to{' '}
            <span className="font-medium text-gray-700">{booking.customer.email}</span>
          </motion.p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
