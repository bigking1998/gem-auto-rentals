import { useState } from 'react';
import { Search, Filter, MoreHorizontal, Calendar, User, Car } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// Mock data
const bookings = [
  {
    id: 'BK001',
    customer: { name: 'Sarah Johnson', email: 'sarah@example.com' },
    vehicle: { make: 'Toyota', model: 'Camry', year: 2024 },
    startDate: new Date('2026-01-18'),
    endDate: new Date('2026-01-22'),
    status: 'CONFIRMED',
    amount: 260,
    pickupLocation: 'Miami Airport',
  },
  {
    id: 'BK002',
    customer: { name: 'Michael Chen', email: 'michael@example.com' },
    vehicle: { make: 'BMW', model: '5 Series', year: 2024 },
    startDate: new Date('2026-01-19'),
    endDate: new Date('2026-01-25'),
    status: 'PENDING',
    amount: 900,
    pickupLocation: 'Downtown Office',
  },
  {
    id: 'BK003',
    customer: { name: 'Emily Rodriguez', email: 'emily@example.com' },
    vehicle: { make: 'Tesla', model: 'Model 3', year: 2024 },
    startDate: new Date('2026-01-17'),
    endDate: new Date('2026-01-20'),
    status: 'ACTIVE',
    amount: 360,
    pickupLocation: 'Miami Beach',
  },
  {
    id: 'BK004',
    customer: { name: 'David Thompson', email: 'david@example.com' },
    vehicle: { make: 'Ford', model: 'Explorer', year: 2024 },
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-01-27'),
    status: 'CONFIRMED',
    amount: 665,
    pickupLocation: 'Miami Airport',
  },
  {
    id: 'BK005',
    customer: { name: 'Lisa Wang', email: 'lisa@example.com' },
    vehicle: { make: 'Honda', model: 'Civic', year: 2024 },
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-01-15'),
    status: 'COMPLETED',
    amount: 225,
    pickupLocation: 'Downtown Office',
  },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500">Manage rental reservations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or booking ID..."
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
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
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
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        statusColors[booking.status]
                      )}
                    >
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
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
