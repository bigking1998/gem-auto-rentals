import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
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
import { bookingStatusColors } from '@/lib/statusColors';

const statusColors = bookingStatusColors;

const statusIcons: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  ACTIVE: Car,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

type StatusFilter = 'all' | 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function BookingsPage() {
  // Customers → "View Bookings" links here with ?customerId=… ; honour it.
  const [searchParams, setSearchParams] = useSearchParams();
  const customerIdFilter = searchParams.get('customerId') || undefined;

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
      const params: { status?: string; userId?: string; limit: number } = { limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (customerIdFilter) {
        params.userId = customerIdFilter;
      }
      const { items } = await api.bookings.list(params);
      setBookings(items);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, customerIdFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = booking.user
      ? `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase()
      : '';
    const vehicleName = booking.vehicle
      ? `${booking.vehicle.make} ${booking.vehicle.model}`.toLowerCase()
      : '';
    return (
      customerName.includes(query) ||
      vehicleName.includes(query) ||
      booking.id.toLowerCase().includes(query)
    );
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
          {customerIdFilter && (
            <button
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('customerId');
                setSearchParams(next);
              }}
              className="bg-accent text-primary-ink mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            >
              Filtered to one customer
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Calendar className="h-5 w-5 text-gray-600" />
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
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            <p className="text-sm text-gray-500">Confirmed</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Car className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <CheckCircle2 className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </motion.div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, vehicle, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-primary w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 transition-colors hover:bg-gray-50"
            >
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  {(
                    [
                      'all',
                      'PENDING',
                      'CONFIRMED',
                      'ACTIVE',
                      'COMPLETED',
                      'CANCELLED',
                    ] as StatusFilter[]
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilters(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                        statusFilter === status && 'bg-accent text-primary-ink'
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
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No bookings found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status] || Clock;
                  return (
                    <tr key={booking.id} className="transition-colors hover:bg-gray-50">
                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/fleet?search=${booking.vehicle?.licensePlate || booking.vehicle?.make || ''}`}
                          className="group flex items-center gap-3 transition-opacity hover:opacity-80"
                        >
                          <div className="group-hover:ring-primary flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 transition-all group-hover:ring-2 group-hover:ring-offset-2">
                            {booking.vehicle?.images?.[0] ? (
                              <img
                                src={booking.vehicle.images[0]}
                                alt={getVehicleName(booking)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Car className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <span className="group-hover:text-primary-ink whitespace-nowrap font-medium text-gray-900 transition-colors">
                            {getVehicleName(booking)}
                          </span>
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/customers/${booking.user?.id}`}
                          className="group flex items-center gap-2 transition-opacity hover:opacity-80"
                        >
                          <div className="group-hover:bg-primary/10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors">
                            <User className="group-hover:text-primary-ink h-3.5 w-3.5 text-gray-400 transition-colors" />
                          </div>
                          <span className="group-hover:text-primary-ink whitespace-nowrap text-sm text-gray-700 transition-colors">
                            {getCustomerName(booking)}
                          </span>
                        </Link>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="whitespace-nowrap text-sm text-gray-700">
                            {formatDate(new Date(booking.startDate))} -{' '}
                            {formatDate(new Date(booking.endDate))}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="whitespace-nowrap text-sm text-gray-700">
                            {booking.pickupLocation}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            statusColors[booking.status]
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {booking.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveDropdown(activeDropdown === booking.id ? null : booking.id)
                            }
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-5 w-5 text-gray-400" />
                          </button>
                          {activeDropdown === booking.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                                <p className="px-4 py-1 text-xs uppercase text-gray-400">
                                  Update Status
                                </p>
                                {(
                                  [
                                    'PENDING',
                                    'CONFIRMED',
                                    'ACTIVE',
                                    'COMPLETED',
                                  ] as Booking['status'][]
                                ).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(booking.id, status)}
                                    className={cn(
                                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                                      booking.status === status && 'bg-accent text-primary-ink'
                                    )}
                                  >
                                    {status}
                                  </button>
                                ))}
                                <div className="my-1 border-t border-gray-100" />
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
        <div className="border-t border-gray-100 px-6 py-3 text-sm text-gray-500">
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
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                        <AlertTriangle className="h-5 w-5" />
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
                      className="rounded-lg p-2 transition-colors hover:bg-white/20"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 p-6">
                  <div className="space-y-2 rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {cancelTarget.vehicle?.images?.[0] ? (
                          <img
                            src={cancelTarget.vehicle.images[0]}
                            alt={getVehicleName(cancelTarget)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Car className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getVehicleName(cancelTarget)}</p>
                        <p className="text-sm text-gray-500">{getCustomerName(cancelTarget)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(new Date(cancelTarget.startDate))} -{' '}
                        {formatDate(new Date(cancelTarget.endDate))}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(cancelTarget.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Are you sure you want to cancel this booking? This will notify the customer and
                    cannot be undone.
                  </p>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Type <span className="font-bold text-red-600">confirm</span> to cancel this
                      booking
                    </label>
                    <input
                      type="text"
                      value={cancelConfirmText}
                      onChange={(e) => setCancelConfirmText(e.target.value)}
                      placeholder="Type confirm here..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={isCancelling}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelTarget(null);
                      setCancelConfirmText('');
                    }}
                    disabled={isCancelling}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={confirmCancelBooking}
                    disabled={cancelConfirmText.toLowerCase() !== 'confirm' || isCancelling}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <CalendarX className="h-4 w-4" />
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
