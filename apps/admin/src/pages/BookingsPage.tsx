import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  User,
  MapPin,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  X,
} from 'lucide-react';
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

  // Cancel booking confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelConfirmText, setCancelConfirmText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancelBooking = (booking: Booking) => {
    setCancelTarget(booking);
    setCancelConfirmText('');
    setShowCancelModal(true);
    setActiveDropdown(null);
  };

  const confirmCancelBooking = async () => {
    if (!cancelTarget || cancelConfirmText.toLowerCase() !== 'confirm') return;

    setIsCancelling(true);
    try {
      await api.bookings.cancel(cancelTarget.id);
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelTarget.id ? { ...b, status: 'CANCELLED' } : b))
      );
      toast.success('Booking cancelled');
      setShowCancelModal(false);
      setCancelTarget(null);
      setCancelConfirmText('');
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
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
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Bookings</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-500">Confirmed</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Car className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
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

      {/* Bookings Table */}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status] || Clock;
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/fleet?search=${booking.vehicle?.licensePlate || booking.vehicle?.make || ''}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2 transition-all">
                            {booking.vehicle?.images?.[0] ? (
                              <img
                                src={booking.vehicle.images[0]}
                                alt={getVehicleName(booking)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Car className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap group-hover:text-primary transition-colors">
                            {getVehicleName(booking)}
                          </span>
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/customers/${booking.user?.id}`}
                          className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                            <User className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm text-gray-700 whitespace-nowrap group-hover:text-primary transition-colors">
                            {getCustomerName(booking)}
                          </span>
                        </Link>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 whitespace-nowrap">
                            {formatDate(new Date(booking.startDate))} - {formatDate(new Date(booking.endDate))}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 whitespace-nowrap">{booking.pickupLocation}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[booking.status]
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {booking.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
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
                                {booking.status !== 'CANCELLED' ? (
                                  <button
                                    onClick={() => handleCancelBooking(booking)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Cancel Booking
                                  </button>
                                ) : (
                                  <div className="px-4 py-2 text-sm text-gray-400">
                                    Already Cancelled
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </motion.div>

      {/* Cancel Booking Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && cancelTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isCancelling) {
                  setShowCancelModal(false);
                  setCancelTarget(null);
                  setCancelConfirmText('');
                }
              }}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Cancel Booking</h2>
                        <p className="text-sm text-white/80">This action cannot be undone</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!isCancelling) {
                          setShowCancelModal(false);
                          setCancelTarget(null);
                          setCancelConfirmText('');
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {cancelTarget.vehicle?.images?.[0] ? (
                          <img
                            src={cancelTarget.vehicle.images[0]}
                            alt={getVehicleName(cancelTarget)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getVehicleName(cancelTarget)}</p>
                        <p className="text-sm text-gray-500">{getCustomerName(cancelTarget)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(new Date(cancelTarget.startDate))} - {formatDate(new Date(cancelTarget.endDate))}
                      </span>
                      <span className="font-medium">{formatCurrency(cancelTarget.totalAmount)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Are you sure you want to cancel this booking? This will notify the customer and cannot be undone.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="font-bold text-red-600">confirm</span> to cancel this booking
                    </label>
                    <input
                      type="text"
                      value={cancelConfirmText}
                      onChange={(e) => setCancelConfirmText(e.target.value)}
                      placeholder="Type confirm here..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={isCancelling}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelTarget(null);
                      setCancelConfirmText('');
                    }}
                    disabled={isCancelling}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={confirmCancelBooking}
                    disabled={cancelConfirmText.toLowerCase() !== 'confirm' || isCancelling}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <CalendarX className="w-4 h-4" />
                        Cancel Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
