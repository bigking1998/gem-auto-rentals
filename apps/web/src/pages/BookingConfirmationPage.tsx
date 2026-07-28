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
  UserPlus,
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
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">No booking found</h1>
            <p className="mb-6 text-gray-500">
              It looks like you haven&apos;t completed a booking yet.
            </p>
            <Link
              to="/vehicles"
              className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-lg px-6 py-3"
            >
              <Car className="h-5 w-5" />
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-14 w-14 text-green-500" />
            </div>
          </motion.div>

          {/* Confirmation Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
            <p className="text-lg text-gray-500">
              Your reservation has been successfully processed.
            </p>
            <div className="bg-accent text-primary-ink mt-4 inline-block rounded-lg px-4 py-2">
              <span className="text-sm font-medium">Confirmation #:</span>{' '}
              <span className="font-bold">{confirmationNumber}</span>
            </div>
          </motion.div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            {/* Vehicle Section */}
            <div className="border-b border-gray-100 p-6">
              <div className="flex gap-4">
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-gray-500">{vehicle.category}</p>
                  <p className="text-primary-ink mt-1 font-semibold">
                    ${vehicle.dailyRate}/day • {days} days
                  </p>
                </div>
              </div>
            </div>

            {/* Dates & Location */}
            <div className="grid gap-6 border-b border-gray-100 p-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-500">PICK-UP</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="text-primary-ink h-4 w-4" />
                    {new Date(booking.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="text-primary-ink h-4 w-4" />
                    {booking.pickupTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <MapPin className="text-primary-ink h-4 w-4" />
                    {booking.pickupLocation}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-500">RETURN</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="text-primary-ink h-4 w-4" />
                    {new Date(booking.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="text-primary-ink h-4 w-4" />
                    {booking.dropoffTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <MapPin className="text-primary-ink h-4 w-4" />
                    {booking.dropoffLocation}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-b border-gray-100 p-6">
              <h3 className="mb-3 text-sm font-medium text-gray-500">DRIVER DETAILS</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="text-primary-ink h-4 w-4" />
                  {booking.customer.firstName} {booking.customer.lastName}
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="text-primary-ink h-4 w-4" />
                  {booking.customer.email}
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="text-primary-ink h-4 w-4" />
                  {booking.customer.phone}
                </div>
              </div>
            </div>

            {/* Extras */}
            {(booking.extras.insurance ||
              booking.extras.gps ||
              booking.extras.childSeat ||
              booking.extras.additionalDriver) && (
              <div className="border-b border-gray-100 p-6">
                <h3 className="mb-3 text-sm font-medium text-gray-500">EXTRAS INCLUDED</h3>
                <div className="flex flex-wrap gap-2">
                  {booking.extras.insurance && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                      <Shield className="h-4 w-4" />
                      Full Insurance
                    </span>
                  )}
                  {booking.extras.gps && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
                      <Navigation className="h-4 w-4" />
                      GPS Navigation
                    </span>
                  )}
                  {booking.extras.childSeat && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-medium text-pink-700">
                      <Baby className="h-4 w-4" />
                      Child Seat
                    </span>
                  )}
                  {booking.extras.additionalDriver && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700">
                      <UserPlus className="h-4 w-4" />
                      Additional Driver
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-accent p-6">
              <div className="flex items-center justify-between">
                <span className="text-navy text-lg font-medium">Total Paid</span>
                <span className="text-primary-ink text-3xl font-bold">${total}</span>
              </div>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <h3 className="mb-2 font-semibold text-amber-900">What to bring at pick-up</h3>
            <ul className="space-y-1 text-sm text-amber-700">
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
            className="flex flex-col gap-4 sm:flex-row"
          >
            <button
              onClick={() => window.print()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-5 w-5" />
              Download Confirmation
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground hover:bg-primary-dark flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium"
            >
              <Home className="h-5 w-5" />
              Return to Home
            </button>
          </motion.div>

          {/* Email Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center text-sm text-gray-500"
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
