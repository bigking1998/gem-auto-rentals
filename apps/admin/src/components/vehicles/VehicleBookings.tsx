import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  User,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api, Booking } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingStatusColors } from '@/lib/statusColors';

interface VehicleBookingsProps {
  vehicleId: string;
}

const statusColors = bookingStatusColors;

const statusIcons: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  ACTIVE: Car,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export function VehicleBookings({ vehicleId }: VehicleBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items } = await api.bookings.list({ vehicleId, limit: 50 });
      setBookings(items);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      toast.error('Failed to load vehicle bookings');
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (vehicleId) {
      fetchBookings();
    }
  }, [vehicleId, fetchBookings]);

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast.success(`Booking updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update booking status');
    }
    setActiveDropdown(null);
  };

  const getCustomerName = (booking: Booking): string => {
    if (booking.user) {
      return `${booking.user.firstName} ${booking.user.lastName}`;
    }
    return 'Unknown Customer';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <Loader2 className="text-primary-ink h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">No Bookings Found</h3>
        <p className="text-gray-500">This vehicle has no booking history yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Bookings</h2>
          <p className="text-sm text-gray-500">Recent booking history for this vehicle</p>
        </div>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
          {bookings.length} Total
        </span>
      </div>

      <div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/30">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((booking) => {
              const StatusIcon = statusIcons[booking.status] || Clock;
              return (
                <tr key={booking.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getCustomerName(booking)}
                        </div>
                        <div className="text-xs text-gray-500">{booking.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(new Date(booking.startDate))}
                    </div>
                    <div className="ml-4.5 text-xs text-gray-500">
                      to {formatDate(new Date(booking.endDate))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusColors[booking.status]
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {booking.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setActiveDropdown(activeDropdown === booking.id ? null : booking.id)
                        }
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === booking.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 z-50 mt-2 max-h-64 w-48 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                            >
                              <div className="border-b border-gray-100 px-4 py-2">
                                <p className="text-xs font-medium uppercase text-gray-500">
                                  Update Status
                                </p>
                              </div>
                              {(
                                [
                                  'PENDING',
                                  'CONFIRMED',
                                  'ACTIVE',
                                  'COMPLETED',
                                  'CANCELLED',
                                ] as Booking['status'][]
                              ).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusUpdate(booking.id, status)}
                                  className={cn(
                                    'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                                    booking.status === status
                                      ? 'bg-accent text-accent-foreground font-medium'
                                      : 'text-gray-700'
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
