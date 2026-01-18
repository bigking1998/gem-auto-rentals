import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'active' | 'upcoming' | 'past';

interface Booking {
  id: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    image: string;
    category: string;
  };
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalAmount: number;
}

// Mock data
const mockBookings: Booking[] = [
  {
    id: 'BK001',
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400',
      category: 'Standard',
    },
    startDate: '2026-01-20',
    endDate: '2026-01-25',
    pickupLocation: 'Downtown Office',
    dropoffLocation: 'Downtown Office',
    status: 'active',
    totalAmount: 325,
  },
  {
    id: 'BK002',
    vehicle: {
      make: 'BMW',
      model: 'X5',
      year: 2024,
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
      category: 'SUV',
    },
    startDate: '2026-02-01',
    endDate: '2026-02-05',
    pickupLocation: 'Airport Terminal',
    dropoffLocation: 'Airport Terminal',
    status: 'confirmed',
    totalAmount: 580,
  },
  {
    id: 'BK003',
    vehicle: {
      make: 'Mercedes',
      model: 'C-Class',
      year: 2023,
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
      category: 'Premium',
    },
    startDate: '2026-02-15',
    endDate: '2026-02-18',
    pickupLocation: 'City Center',
    dropoffLocation: 'Airport Terminal',
    status: 'pending',
    totalAmount: 420,
  },
  {
    id: 'BK004',
    vehicle: {
      make: 'Honda',
      model: 'Civic',
      year: 2024,
      image: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=400',
      category: 'Economy',
    },
    startDate: '2025-12-10',
    endDate: '2025-12-15',
    pickupLocation: 'Downtown Office',
    dropoffLocation: 'Downtown Office',
    status: 'completed',
    totalAmount: 195,
  },
  {
    id: 'BK005',
    vehicle: {
      make: 'Audi',
      model: 'A4',
      year: 2023,
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
      category: 'Premium',
    },
    startDate: '2025-11-20',
    endDate: '2025-11-22',
    pickupLocation: 'Airport Terminal',
    dropoffLocation: 'City Center',
    status: 'cancelled',
    totalAmount: 280,
  },
];

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'active', label: 'Active', icon: Car },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'past', label: 'Past', icon: Clock },
];

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-700',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  active: {
    label: 'Active',
    icon: Car,
    className: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-gray-100 text-gray-700',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
  },
};

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const filterBookings = (tab: TabType): Booking[] => {
    const now = new Date();
    return mockBookings.filter((booking) => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      if (tab === 'active') {
        return booking.status === 'active' || (booking.status === 'confirmed' && startDate <= now && endDate >= now);
      }
      if (tab === 'upcoming') {
        return (booking.status === 'pending' || booking.status === 'confirmed') && startDate > now;
      }
      if (tab === 'past') {
        return booking.status === 'completed' || booking.status === 'cancelled' || endDate < now;
      }
      return false;
    });
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
                      src={booking.vehicle.image}
                      alt={`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {booking.vehicle.category} • Booking #{booking.id}
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
                          ${booking.totalAmount}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            Cancel
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <RotateCcw className="w-4 h-4" />
                            Book Again
                          </button>
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
