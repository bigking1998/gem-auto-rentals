import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, ChevronDown, Loader2, MoreHorizontal, CheckCircle2, XCircle, Clock, Car, User, DollarSign, MapPin } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api, Booking, ApiError } from '@/lib/api';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  ACTIVE: Car,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

type StatusFilter = 'all' | 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { status?: string; limit: number } = { limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const { items } = await api.bookings.list(params);
      setBookings(items);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = booking.user ? `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase() : '';
    const vehicleName = booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}`.toLowerCase() : '';
    return customerName.includes(query) || vehicleName.includes(query) || booking.id.toLowerCase().includes(query);
  });

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update booking status');
    }
    setActiveDropdown(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.bookings.cancel(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      );
      toast.success('Booking cancelled');
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      toast.error('Failed to cancel booking');
    }
    setActiveDropdown(null);
  };

  const getCustomerName = (booking: Booking): string => {
    if (booking.user) {
      return `${booking.user.firstName} ${booking.user.lastName}`;
    }
    return 'Unknown Customer';
  };

  const getVehicleName = (booking: Booking): string => {
    if (booking.vehicle) {
      return `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`;
    }
    return 'Unknown Vehicle';
  };

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    active: bookings.filter((b) => b.status === 'ACTIVE').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500">Manage all rental bookings</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Bookings</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          <p className="text-sm text-gray-500">Confirmed</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </motion.div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, vehicle, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2">
                  {(['all', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilters(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                        statusFilter === status && 'bg-orange-50 text-primary'
                      )}
                    >
                      {status === 'all' ? 'All Bookings' : status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bookings List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBookings.map((booking, index) => {
              const StatusIcon = statusIcons[booking.status] || Clock;
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                        {booking.vehicle?.images?.[0] ? (
                          <img
                            src={booking.vehicle.images[0]}
                            alt={getVehicleName(booking)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{getVehicleName(booking)}</p>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            statusColors[booking.status]
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {getCustomerName(booking)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(new Date(booking.startDate))} - {formatDate(new Date(booking.endDate))}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.pickupLocation}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(booking.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : booking.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                      {activeDropdown === booking.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2">
                            <p className="px-4 py-1 text-xs text-gray-400 uppercase">Update Status</p>
                            {(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED'] as Booking['status'][]).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusUpdate(booking.id, status)}
                                className={cn(
                                  'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                                  booking.status === status && 'bg-orange-50 text-primary'
                                )}
                              >
                                {status}
                              </button>
                            ))}
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={booking.status === 'CANCELLED'}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </motion.div>
    </div>
  );
}
