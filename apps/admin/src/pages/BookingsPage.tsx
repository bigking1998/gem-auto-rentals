import { useState } from 'react';
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
  Download,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';
import { PaymentTrackingModal } from '@/components/bookings/PaymentTrackingModal';
import { generateRentalContract } from '@/lib/export';

// Extended mock data with more details
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

const initialBookings: Booking[] = [
  {
    id: 'BK001',
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1 (555) 123-4567',
      licenseNumber: 'DL-12345678',
      address: '123 Main St, Miami, FL 33101',
    },
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      licensePlate: 'ABC-1234',
      category: 'STANDARD',
      dailyRate: 65,
      vin: '1HGBH41JXMN109186',
    },
    startDate: new Date('2026-01-18'),
    endDate: new Date('2026-01-22'),
    status: 'CONFIRMED',
    amount: 260,
    pickupLocation: 'Miami Airport',
    dropoffLocation: 'Miami Airport',
    extras: {
      insurance: true,
      gps: false,
    },
    payment: {
      status: 'PAID',
      method: 'Credit Card',
      transactionId: 'ch_1234567890',
      paidAt: new Date('2026-01-15'),
    },
    payments: [
      {
        id: 'pay1',
        amount: 260,
        status: 'PAID',
        method: 'CREDIT_CARD',
        transactionId: 'ch_1234567890',
        paidAt: new Date('2026-01-15'),
      },
    ],
    createdAt: new Date('2026-01-14'),
  },
  {
    id: 'BK002',
    customer: {
      name: 'Michael Chen',
      email: 'michael@example.com',
      phone: '+1 (555) 234-5678',
      licenseNumber: 'DL-23456789',
      address: '456 Oak Ave, Miami, FL 33102',
    },
    vehicle: {
      make: 'BMW',
      model: '5 Series',
      year: 2024,
      licensePlate: 'XYZ-5678',
      category: 'LUXURY',
      dailyRate: 150,
      vin: 'WBAPH5C55BA238456',
    },
    startDate: new Date('2026-01-19'),
    endDate: new Date('2026-01-25'),
    status: 'PENDING',
    amount: 900,
    pickupLocation: 'Downtown Office',
    extras: {
      insurance: true,
      gps: true,
      additionalDriver: true,
    },
    payment: {
      status: 'PENDING',
    },
    payments: [],
    createdAt: new Date('2026-01-16'),
  },
  {
    id: 'BK003',
    customer: {
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      phone: '+1 (555) 345-6789',
      licenseNumber: 'DL-34567890',
      address: '789 Beach Blvd, Miami Beach, FL 33139',
    },
    vehicle: {
      make: 'Tesla',
      model: 'Model 3',
      year: 2024,
      licensePlate: 'EV-0001',
      category: 'PREMIUM',
      dailyRate: 120,
      vin: '5YJ3E1EA8PF123456',
    },
    startDate: new Date('2026-01-17'),
    endDate: new Date('2026-01-20'),
    status: 'ACTIVE',
    amount: 360,
    pickupLocation: 'Miami Beach',
    dropoffLocation: 'Miami Airport',
    extras: {
      insurance: true,
    },
    payment: {
      status: 'PAID',
      method: 'Credit Card',
      transactionId: 'ch_0987654321',
      paidAt: new Date('2026-01-16'),
    },
    payments: [
      {
        id: 'pay2',
        amount: 360,
        status: 'PAID',
        method: 'CREDIT_CARD',
        transactionId: 'ch_0987654321',
        paidAt: new Date('2026-01-16'),
      },
    ],
    notes: 'Customer requested early morning pickup at 6 AM.',
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'BK004',
    customer: {
      name: 'David Thompson',
      email: 'david@example.com',
      phone: '+1 (555) 456-7890',
    },
    vehicle: {
      make: 'Ford',
      model: 'Explorer',
      year: 2024,
      licensePlate: 'SUV-9999',
      category: 'SUV',
      dailyRate: 95,
      vin: '1FMSK8DH0PGA12345',
    },
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-01-27'),
    status: 'CONFIRMED',
    amount: 665,
    pickupLocation: 'Miami Airport',
    extras: {
      insurance: true,
      childSeat: true,
    },
    payment: {
      status: 'PAID',
      method: 'Debit Card',
      transactionId: 'ch_1122334455',
      paidAt: new Date('2026-01-17'),
    },
    payments: [
      {
        id: 'pay3',
        amount: 300,
        status: 'PAID',
        method: 'DEBIT_CARD',
        transactionId: 'ch_1122334455',
        paidAt: new Date('2026-01-17'),
        notes: 'Deposit payment',
      },
      {
        id: 'pay4',
        amount: 365,
        status: 'PAID',
        method: 'DEBIT_CARD',
        transactionId: 'ch_1122334456',
        paidAt: new Date('2026-01-19'),
        notes: 'Final payment',
      },
    ],
    createdAt: new Date('2026-01-16'),
  },
  {
    id: 'BK005',
    customer: {
      name: 'Lisa Wang',
      email: 'lisa@example.com',
      phone: '+1 (555) 567-8901',
    },
    vehicle: {
      make: 'Honda',
      model: 'Civic',
      year: 2024,
      licensePlate: 'ECO-1111',
      category: 'ECONOMY',
      dailyRate: 45,
      vin: '19XFC2F59PE012345',
    },
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-01-15'),
    status: 'COMPLETED',
    amount: 225,
    pickupLocation: 'Downtown Office',
    dropoffLocation: 'Downtown Office',
    extras: {},
    payment: {
      status: 'PAID',
      method: 'Credit Card',
      transactionId: 'ch_5566778899',
      paidAt: new Date('2026-01-08'),
    },
    payments: [
      {
        id: 'pay5',
        amount: 225,
        status: 'PAID',
        method: 'CREDIT_CARD',
        transactionId: 'ch_5566778899',
        paidAt: new Date('2026-01-08'),
      },
    ],
    createdAt: new Date('2026-01-07'),
  },
  {
    id: 'BK006',
    customer: {
      name: 'James Wilson',
      email: 'james@example.com',
      phone: '+1 (555) 678-9012',
    },
    vehicle: {
      make: 'Mercedes',
      model: 'E-Class',
      year: 2024,
      licensePlate: 'LUX-2024',
      category: 'LUXURY',
      dailyRate: 175,
      vin: 'WDDZF4JB5LA123456',
    },
    startDate: new Date('2026-01-05'),
    endDate: new Date('2026-01-08'),
    status: 'CANCELLED',
    amount: 525,
    pickupLocation: 'Miami Airport',
    extras: {
      insurance: true,
      gps: true,
    },
    payment: {
      status: 'REFUNDED',
    },
    payments: [
      {
        id: 'pay6',
        amount: 525,
        status: 'REFUNDED',
        method: 'CREDIT_CARD',
        transactionId: 'ch_9988776655',
        paidAt: new Date('2026-01-03'),
        refundedAt: new Date('2026-01-05'),
        notes: 'Full refund due to cancellation',
      },
    ],
    notes: 'Customer cancelled due to flight cancellation.',
    createdAt: new Date('2026-01-03'),
  },
];

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
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Payment tracking modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

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

  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
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

      setIsLoading(false);
    }, 500);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500">Manage rental reservations</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          New Booking
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, email, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      </div>

      {/* Bookings Grid */}
      <div className="grid gap-4">
        {filteredBookings.map((booking) => {
          const StatusIcon = statusIcons[booking.status];
          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewBooking(booking)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
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
                        <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
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
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Create New Booking
          </button>
        </div>
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
        isLoading={isLoading}
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
