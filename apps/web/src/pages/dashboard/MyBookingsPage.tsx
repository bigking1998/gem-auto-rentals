import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Car,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, Booking } from '@/lib/api';

type TabType = 'active' | 'upcoming' | 'past';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'active', label: 'Active', icon: Car },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'past', label: 'Past', icon: CheckCircle },
];

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-700',
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  ACTIVE: {
    label: 'Active',
    icon: Car,
    className: 'bg-blue-100 text-blue-700',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-gray-100 text-gray-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
  },
};

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings from API
  useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true);
        const response = await api.bookings.list({ limit: 50 });
        setBookings(response.items as Booking[]);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, []);

  const filterBookings = (tab: TabType): Booking[] => {
    const now = new Date();
    return bookings.filter((booking) => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      if (tab === 'active') {
        return booking.status === 'ACTIVE' || (booking.status === 'CONFIRMED' && startDate <= now && endDate >= now);
      }
      if (tab === 'upcoming') {
        return (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && startDate > now;
      }
      if (tab === 'past') {
        return booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || endDate < now;
      }
      return false;
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.bookings.cancel(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b))
      );
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
    }
  };

  const filteredBookings = filterBookings(activeTab);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">View and manage all your vehicle rentals</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">View and manage all your vehicle rentals</p>
        </div>
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">
          View and manage all your vehicle rentals
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = filterBookings(tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-semibold rounded-full',
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-xl border border-gray-200"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeTab} bookings
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'active'
                ? "You don't have any active rentals at the moment."
                : activeTab === 'upcoming'
                ? "You don't have any upcoming reservations."
                : "You haven't completed any rentals yet."}
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Car className="w-5 h-5" />
              Browse Vehicles
            </Link>
          </motion.div>
        ) : (
          filteredBookings.map((booking, index) => {
            const status = statusConfig[booking.status];
            const StatusIcon = status.icon;
            const vehicle = booking.vehicle;
            const vehicleImage = vehicle?.images?.[0] || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400';

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Vehicle Image */}
                  <div className="sm:w-48 h-40 sm:h-auto">
                    <img
                      src={vehicleImage}
                      alt={vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {vehicle?.category || 'Standard'} • Booking #{booking.id.slice(0, 8)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                          status.className
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>
                          {booking.pickupLocation}
                          {booking.pickupLocation !== booking.dropoffLocation && (
                            <> → {booking.dropoffLocation}</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-sm text-gray-500">Total:</span>
                        <span className="ml-2 text-lg font-bold text-gray-900">
                          ${Number(booking.totalAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status === 'COMPLETED' && vehicle && (
                          <Link
                            to={`/vehicles/${vehicle.id}/book`}
                            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Book Again
                          </Link>
                        )}
                        <Link
                          to={`/dashboard/bookings/${booking.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
