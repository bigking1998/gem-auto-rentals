import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Car,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';
import { PaymentTrackingModal } from '@/components/bookings/PaymentTrackingModal';
import { generateRentalContract } from '@/lib/export';
import { api, Booking as ApiBooking } from '@/lib/api';
import { toast } from 'sonner';

// UI Booking interface for display
interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' | 'PARTIAL';
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BANK_TRANSFER';
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  notes?: string;
}

interface Booking {
  id: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    licenseNumber?: string;
    address?: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
    category?: string;
    dailyRate?: number;
    vin?: string;
  };
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  pickupLocation: string;
  dropoffLocation?: string;
  extras?: {
    insurance?: boolean;
    gps?: boolean;
    childSeat?: boolean;
    additionalDriver?: boolean;
  };
  payment?: {
    status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
    method?: string;
    transactionId?: string;
    paidAt?: Date;
  };
  payments?: Payment[];
  notes?: string;
  createdAt?: Date;
}

// Transform API booking to UI booking format
function transformBooking(apiBooking: ApiBooking): Booking {
  const user = apiBooking.user;
  const vehicle = apiBooking.vehicle;

  return {
    id: apiBooking.id,
    customer: {
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
      email: user?.email || '',
      phone: user?.phone,
    },
    vehicle: {
      make: vehicle?.make || 'Unknown',
      model: vehicle?.model || 'Vehicle',
      year: vehicle?.year || 0,
      licensePlate: vehicle?.licensePlate,
      category: vehicle?.category,
      dailyRate: vehicle ? Number(vehicle.dailyRate) : 0,
      vin: vehicle?.vin,
    },
    startDate: new Date(apiBooking.startDate),
    endDate: new Date(apiBooking.endDate),
    status: apiBooking.status,
    amount: Number(apiBooking.totalAmount),
    pickupLocation: apiBooking.pickupLocation,
    dropoffLocation: apiBooking.dropoffLocation,
    extras: apiBooking.extras as Booking['extras'],
    payment: {
      status: 'PENDING', // TODO: Add payment tracking to API
    },
    payments: [],
    notes: apiBooking.notes,
    createdAt: new Date(apiBooking.createdAt),
  };
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
  CONFIRMED: CheckCircle,
  ACTIVE: Car,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Payment tracking modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  // Fetch bookings from API
  useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.bookings.list({ limit: 100 });
        const transformedBookings = response.items.map(transformBooking);
        setBookings(transformedBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    setIsUpdating(true);

    try {
      if (newStatus === 'CANCELLED') {
        await api.bookings.cancel(bookingId);
      } else {
        await api.bookings.updateStatus(bookingId, newStatus);
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );

      // Update selected booking if it's the one being modified
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }

      toast.success(`Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error('Failed to update booking status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
    setActiveDropdown(null);
  };

  // Generate contract for a booking
  const handleGenerateContract = (booking: Booking) => {
    generateRentalContract({
      bookingId: booking.id,
      customer: {
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
        address: booking.customer.address,
        licenseNumber: booking.customer.licenseNumber,
      },
      vehicle: {
        make: booking.vehicle.make,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        licensePlate: booking.vehicle.licensePlate,
        category: booking.vehicle.category,
        vin: booking.vehicle.vin,
      },
      rental: {
        startDate: booking.startDate,
        endDate: booking.endDate,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation || booking.pickupLocation,
        dailyRate: booking.vehicle.dailyRate || 0,
        totalAmount: booking.amount,
        deposit: Math.round(booking.amount * 0.3), // 30% deposit
      },
      extras: booking.extras,
    });
    setActiveDropdown(null);
  };

  // Open payment tracking modal
  const handleOpenPaymentTracking = (booking: Booking) => {
    setPaymentBooking(booking);
    setIsPaymentModalOpen(true);
    setActiveDropdown(null);
  };

  // Record a new payment
  const handleRecordPayment = (payment: Omit<Payment, 'id'>) => {
    if (!paymentBooking) return;

    const newPayment: Payment = {
      ...payment,
      id: `pay${Date.now()}`,
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === paymentBooking.id
          ? {
              ...b,
              payments: [...(b.payments || []), newPayment],
              payment: {
                ...b.payment,
                status: payment.status === 'PAID' ? 'PAID' : b.payment?.status || 'PENDING',
                paidAt: payment.paidAt,
              },
            }
          : b
      )
    );

    // Update the payment booking state
    setPaymentBooking((prev) =>
      prev
        ? {
            ...prev,
            payments: [...(prev.payments || []), newPayment],
          }
        : null
    );
  };

  // Process a refund
  const handleRefundPayment = (paymentId: string, amount: number) => {
    if (!paymentBooking) return;

    const refundPayment: Payment = {
      id: `ref${Date.now()}`,
      amount: amount,
      status: 'REFUNDED',
      method: 'CREDIT_CARD',
      refundedAt: new Date(),
      notes: `Refund for payment ${paymentId}`,
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === paymentBooking.id
          ? {
              ...b,
              payments: [
                ...(b.payments || []).map((p) =>
                  p.id === paymentId ? { ...p, status: 'REFUNDED' as const, refundedAt: new Date() } : p
                ),
                refundPayment,
              ],
            }
          : b
      )
    );

    // Update the payment booking state
    setPaymentBooking((prev) =>
      prev
        ? {
            ...prev,
            payments: [
              ...(prev.payments || []).map((p) =>
                p.id === paymentId ? { ...p, status: 'REFUNDED' as const, refundedAt: new Date() } : p
              ),
              refundPayment,
            ],
          }
        : null
    );
  };

  // Get stats for status summary
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    active: bookings.filter((b) => b.status === 'ACTIVE').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500">Manage rental reservations</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500">Manage rental reservations</p>
        </div>
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load bookings</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-orange-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500">Manage rental reservations</p>
        </div>
        <button className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300">
          <Plus className="w-5 h-5 mr-2" />
          New Booking
        </button>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, email, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Bookings Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-4"
      >
        {filteredBookings.map((booking, index) => {
          const StatusIcon = statusIcons[booking.status];
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => handleViewBooking(booking)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                    {booking.customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{booking.customer.name}</h3>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[booking.status]
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{booking.customer.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Booking ID: {booking.id}</p>
                  </div>
                </div>

                {/* Middle Section */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </span>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(booking.amount)}</p>
                    <p className="text-xs text-gray-500">{booking.pickupLocation}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === booking.id ? null : booking.id);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === booking.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                          }}
                        />
                        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewBooking(booking);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateContract(booking);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FileText className="w-4 h-4" />
                            Generate Contract
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPaymentTracking(booking);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <DollarSign className="w-4 h-4" />
                            Payment Tracking
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Booking
                          </button>
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(booking.id, 'CONFIRMED');
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm Booking
                            </button>
                          )}
                          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(booking.id, 'CANCELLED');
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel Booking
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBooking(booking.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <button className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300">
            Create New Booking
          </button>
        </motion.div>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onStatusChange={handleStatusChange}
        isLoading={isUpdating}
      />

      {/* Payment Tracking Modal */}
      {paymentBooking && (
        <PaymentTrackingModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentBooking(null);
          }}
          bookingId={paymentBooking.id}
          customerName={paymentBooking.customer.name}
          totalAmount={paymentBooking.amount}
          payments={paymentBooking.payments || []}
          onRecordPayment={handleRecordPayment}
          onRefundPayment={handleRefundPayment}
        />
      )}
    </div>
  );
}
