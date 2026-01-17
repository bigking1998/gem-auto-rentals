import { Car, DollarSign, CalendarCheck, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data
const stats = [
  {
    label: 'Active Rentals',
    value: 24,
    change: 12,
    trend: 'up',
    icon: Car,
    color: 'bg-blue-500',
  },
  {
    label: "Today's Revenue",
    value: 4850,
    change: 8.2,
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-500',
    isCurrency: true,
  },
  {
    label: 'Pending Bookings',
    value: 8,
    change: -3,
    trend: 'down',
    icon: Clock,
    color: 'bg-orange-500',
  },
  {
    label: 'Available Vehicles',
    value: 32,
    change: 5,
    trend: 'up',
    icon: CalendarCheck,
    color: 'bg-purple-500',
  },
];

const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 4500 },
  { name: 'Fri', revenue: 6000 },
  { name: 'Sat', revenue: 7500 },
  { name: 'Sun', revenue: 5500 },
];

const recentBookings = [
  {
    id: 'BK001',
    customer: 'Sarah Johnson',
    vehicle: '2024 Toyota Camry',
    startDate: new Date('2026-01-18'),
    endDate: new Date('2026-01-22'),
    status: 'CONFIRMED',
    amount: 260,
  },
  {
    id: 'BK002',
    customer: 'Michael Chen',
    vehicle: '2024 BMW 5 Series',
    startDate: new Date('2026-01-19'),
    endDate: new Date('2026-01-25'),
    status: 'PENDING',
    amount: 900,
  },
  {
    id: 'BK003',
    customer: 'Emily Rodriguez',
    vehicle: '2024 Tesla Model 3',
    startDate: new Date('2026-01-17'),
    endDate: new Date('2026-01-20'),
    status: 'ACTIVE',
    amount: 360,
  },
  {
    id: 'BK004',
    customer: 'David Thompson',
    vehicle: '2024 Ford Explorer',
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-01-27'),
    status: 'CONFIRMED',
    amount: 665,
  },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                </p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {stat.trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                )}
              >
                {Math.abs(stat.change)}%
              </span>
              <span className="text-sm text-gray-500">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Weekly Revenue</h2>
              <p className="text-sm text-gray-500">Last 7 days performance</p>
            </div>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <p className="text-sm text-gray-500">Latest rental reservations</p>
            </div>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {booking.customer.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.customer}</p>
                    <p className="text-sm text-gray-500">{booking.vehicle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      statusColors[booking.status]
                    )}
                  >
                    {booking.status}
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatCurrency(booking.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <Car className="w-6 h-6 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Add Vehicle</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">New Booking</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Record Payment</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <Clock className="w-6 h-6 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Schedule Maintenance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
