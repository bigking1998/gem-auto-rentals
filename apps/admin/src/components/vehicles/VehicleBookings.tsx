import { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Car,
    User,
    MoreHorizontal,
    Loader2
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api, Booking } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VehicleBookingsProps {
    vehicleId: string;
}

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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Bookings Found</h3>
                <p className="text-gray-500">This vehicle has no booking history yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Vehicle Bookings</h2>
                    <p className="text-sm text-gray-500">Recent booking history for this vehicle</p>
                </div>
                <span className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-medium text-gray-600">
                    {bookings.length} Total
                </span>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/30">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {bookings.map((booking) => {
                            const StatusIcon = statusIcons[booking.status] || Clock;
                            return (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{getCustomerName(booking)}</div>
                                                <div className="text-xs text-gray-500">{booking.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {formatDate(new Date(booking.startDate))}
                                        </div>
                                        <div className="text-xs text-gray-500 ml-4.5">
                                            to {formatDate(new Date(booking.endDate))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                                            statusColors[booking.status]
                                        )}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : booking.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {activeDropdown === booking.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                            className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 focus:outline-none max-h-64 overflow-y-auto"
                                                        >
                                                            <div className="px-4 py-2 border-b border-gray-100">
                                                                <p className="text-xs font-medium text-gray-500 uppercase">Update Status</p>
                                                            </div>
                                                            {(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as Booking['status'][]).map((status) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleStatusUpdate(booking.id, status)}
                                                                    className={cn(
                                                                        "block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                                                                        booking.status === status ? "bg-orange-50 text-primary font-medium" : "text-gray-700"
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
