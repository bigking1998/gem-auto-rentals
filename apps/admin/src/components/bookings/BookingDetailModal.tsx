import { useState } from 'react';
import {
  X,
  User,
  Car,
  Calendar,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  FileText,
  CreditCard,
  CheckCircle2,
  Download,
  Printer,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface Booking {
  id: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    licenseNumber?: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
    category?: string;
    dailyRate?: number;
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
  notes?: string;
  createdAt?: Date;
}

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onStatusChange: (bookingId: string, newStatus: Booking['status']) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'text-yellow-600',
  PAID: 'text-green-600',
  REFUNDED: 'text-blue-600',
  FAILED: 'text-red-600',
};

const statusFlow: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onStatusChange,
  isLoading = false,
}: BookingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes'>('details');

  if (!isOpen || !booking) return null;

  const rentalDays = Math.ceil(
    (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const availableStatusChanges = statusFlow[booking.status] || [];

  const handlePrintContract = () => {
    window.print();
  };

  const timeline = [
    { date: booking.createdAt || new Date(), event: 'Booking Created', status: 'complete' },
    ...(booking.status !== 'PENDING' ? [{ date: new Date(), event: 'Booking Confirmed', status: 'complete' }] : []),
    ...(booking.status === 'ACTIVE' || booking.status === 'COMPLETED' ? [{ date: booking.startDate, event: 'Rental Started', status: 'complete' }] : []),
    ...(booking.status === 'COMPLETED' ? [{ date: booking.endDate, event: 'Rental Completed', status: 'complete' }] : []),
    ...(booking.status === 'CANCELLED' ? [{ date: new Date(), event: 'Booking Cancelled', status: 'cancelled' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Booking #{booking.id}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(booking.createdAt || new Date())}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium border',
                  statusColors[booking.status].bg,
                  statusColors[booking.status].text,
                  statusColors[booking.status].border
                )}
              >
                {booking.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintContract}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Print Contract"
              >
                <Printer className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['details', 'timeline', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
            {activeTab === 'details' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                          {booking.customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.customer.name}</p>
                          <p className="text-sm text-gray-500">{booking.customer.email}</p>
                        </div>
                      </div>
                      {booking.customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {booking.customer.phone}
                        </div>
                      )}
                      {booking.customer.licenseNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          License: {booking.customer.licenseNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle Information
                    </h3>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">
                        {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                      {booking.vehicle.licensePlate && (
                        <p className="text-sm text-gray-600">
                          Plate: <span className="font-mono">{booking.vehicle.licensePlate}</span>
                        </p>
                      )}
                      {booking.vehicle.category && (
                        <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {booking.vehicle.category}
                        </span>
                      )}
                      {booking.vehicle.dailyRate && (
                        <p className="text-sm text-gray-600">
                          Daily Rate: {formatCurrency(booking.vehicle.dailyRate)}/day
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Rental Period
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pick-up Date</span>
                        <span className="font-medium text-gray-900">{formatDate(booking.startDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Return Date</span>
                        <span className="font-medium text-gray-900">{formatDate(booking.endDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium text-gray-900">{rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Locations
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Pick-up Location</p>
                        <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Drop-off Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.dropoffLocation || booking.pickupLocation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Payment Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Rental ({rentalDays} days × {formatCurrency(booking.vehicle.dailyRate || booking.amount / rentalDays)})
                        </span>
                        <span className="text-gray-900">
                          {formatCurrency((booking.vehicle.dailyRate || booking.amount / rentalDays) * rentalDays)}
                        </span>
                      </div>
                      {booking.extras?.insurance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Insurance</span>
                          <span className="text-gray-900">{formatCurrency(15 * rentalDays)}</span>
                        </div>
                      )}
                      {booking.extras?.gps && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">GPS Navigation</span>
                          <span className="text-gray-900">{formatCurrency(10 * rentalDays)}</span>
                        </div>
                      )}
                      {booking.extras?.childSeat && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Child Seat</span>
                          <span className="text-gray-900">{formatCurrency(8 * rentalDays)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="font-bold text-lg text-gray-900">{formatCurrency(booking.amount)}</span>
                        </div>
                      </div>
                      {booking.payment && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-gray-500">Payment Status</span>
                          <span className={cn('text-sm font-medium', paymentStatusColors[booking.payment.status])}>
                            {booking.payment.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extras */}
                  {booking.extras && Object.values(booking.extras).some(Boolean) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Add-ons & Extras
                      </h3>
                      <div className="space-y-2">
                        {booking.extras.insurance && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Full Insurance Coverage
                          </div>
                        )}
                        {booking.extras.gps && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            GPS Navigation
                          </div>
                        )}
                        {booking.extras.childSeat && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Child Seat
                          </div>
                        )}
                        {booking.extras.additionalDriver && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Additional Driver
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Actions */}
                  {availableStatusChanges.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableStatusChanges.map((status) => (
                          <button
                            key={status}
                            onClick={() => onStatusChange(booking.id, status as Booking['status'])}
                            disabled={isLoading}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                              status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-primary text-white hover:bg-orange-600'
                            )}
                          >
                            {status === 'CONFIRMED' && 'Confirm Booking'}
                            {status === 'ACTIVE' && 'Start Rental'}
                            {status === 'COMPLETED' && 'Complete Rental'}
                            {status === 'CANCELLED' && 'Cancel Booking'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Mail className="w-4 h-4" />
                      Send Email
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Download Contract
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="max-w-2xl">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-6">
                    {timeline.map((item, index) => (
                      <div key={index} className="relative pl-10">
                        <div
                          className={cn(
                            'absolute left-2 w-4 h-4 rounded-full border-2 border-white',
                            item.status === 'complete' && 'bg-green-500',
                            item.status === 'cancelled' && 'bg-red-500',
                            item.status === 'pending' && 'bg-gray-300'
                          )}
                        />
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-medium text-gray-900">{item.event}</p>
                          <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="max-w-2xl">
                {booking.notes ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notes yet</h3>
                    <p className="text-gray-500 mb-4">Add notes to keep track of important information.</p>
                    <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
                      Add Note
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
