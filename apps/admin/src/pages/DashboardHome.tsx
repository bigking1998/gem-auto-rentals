import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  DollarSign,
  CalendarCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Users,
  FileText,
  Wrench,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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

// Quick action items configuration
const quickActions = [
  {
    id: 'add-vehicle',
    label: 'Add Vehicle',
    description: 'Add a new vehicle to fleet',
    icon: Car,
    color: 'bg-blue-500',
    hoverBorder: 'hover:border-blue-500',
    hoverBg: 'hover:bg-blue-50',
    route: '/fleet',
    action: 'modal', // Will open modal on fleet page
  },
  {
    id: 'new-booking',
    label: 'New Booking',
    description: 'Create a new reservation',
    icon: CalendarCheck,
    color: 'bg-green-500',
    hoverBorder: 'hover:border-green-500',
    hoverBg: 'hover:bg-green-50',
    route: '/bookings',
    action: 'navigate',
  },
  {
    id: 'add-customer',
    label: 'Add Customer',
    description: 'Register a new customer',
    icon: Users,
    color: 'bg-purple-500',
    hoverBorder: 'hover:border-purple-500',
    hoverBg: 'hover:bg-purple-50',
    route: '/customers',
    action: 'navigate',
  },
  {
    id: 'record-payment',
    label: 'Record Payment',
    description: 'Log a payment transaction',
    icon: DollarSign,
    color: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-500',
    hoverBg: 'hover:bg-emerald-50',
    route: '/bookings',
    action: 'navigate',
  },
  {
    id: 'schedule-maintenance',
    label: 'Maintenance',
    description: 'Schedule vehicle service',
    icon: Wrench,
    color: 'bg-orange-500',
    hoverBorder: 'hover:border-orange-500',
    hoverBg: 'hover:bg-orange-50',
    route: '/fleet',
    action: 'navigate',
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: TrendingUp,
    color: 'bg-indigo-500',
    hoverBorder: 'hover:border-indigo-500',
    hoverBg: 'hover:bg-indigo-50',
    route: '/analytics',
    action: 'navigate',
  },
];

// Alerts/notifications mock data
const alerts = [
  {
    id: 1,
    type: 'warning',
    message: '3 vehicles due for maintenance this week',
    action: 'View Schedule',
    route: '/fleet',
  },
  {
    id: 2,
    type: 'info',
    message: '5 pending document verifications',
    action: 'Review',
    route: '/customers',
  },
  {
    id: 3,
    type: 'success',
    message: 'Revenue target achieved for this month',
    action: 'View Details',
    route: '/analytics',
  },
];

export default function DashboardHome() {
  const navigate = useNavigate();

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.route) {
      // Navigate with state to potentially trigger actions
      navigate(action.route, { state: { action: action.id } });
    }
  };

  const handleAlertAction = (alert: typeof alerts[0]) => {
    navigate(alert.route);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fleet', { state: { action: 'add-vehicle' } })}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                alert.type === 'warning' && 'bg-amber-50 border-amber-200',
                alert.type === 'info' && 'bg-blue-50 border-blue-200',
                alert.type === 'success' && 'bg-green-50 border-green-200'
              )}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                {alert.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                <span className="text-sm text-gray-700">{alert.message}</span>
              </div>
              <button
                onClick={() => handleAlertAction(alert)}
                className={cn(
                  'text-sm font-medium flex items-center gap-1',
                  alert.type === 'warning' && 'text-amber-600 hover:text-amber-700',
                  alert.type === 'info' && 'text-blue-600 hover:text-blue-700',
                  alert.type === 'success' && 'text-green-600 hover:text-green-700'
                )}
              >
                {alert.action}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (stat.label === 'Active Rentals') navigate('/bookings');
              if (stat.label === 'Pending Bookings') navigate('/bookings');
              if (stat.label === 'Available Vehicles') navigate('/fleet');
            }}
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

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500">Common tasks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={cn(
                'group flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 transition-all duration-200',
                action.hoverBorder,
                action.hoverBg,
                'hover:shadow-md'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                  action.color
                )}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
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
            <button
              onClick={() => navigate('/bookings')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate('/bookings')}
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

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-6">
            {[
              { time: '10 min ago', event: 'New booking created', detail: 'Sarah Johnson - Toyota Camry', type: 'booking' },
              { time: '25 min ago', event: 'Payment received', detail: '$360.00 - Michael Chen', type: 'payment' },
              { time: '1 hour ago', event: 'Vehicle returned', detail: '2024 BMW 5 Series - Emily Rodriguez', type: 'return' },
              { time: '2 hours ago', event: 'Customer registered', detail: 'New customer: James Wilson', type: 'customer' },
              { time: '3 hours ago', event: 'Maintenance completed', detail: '2024 Ford Explorer - Oil change', type: 'maintenance' },
            ].map((activity, index) => (
              <div key={index} className="relative pl-10">
                <div
                  className={cn(
                    'absolute left-2 w-4 h-4 rounded-full border-2 border-white',
                    activity.type === 'booking' && 'bg-blue-500',
                    activity.type === 'payment' && 'bg-green-500',
                    activity.type === 'return' && 'bg-purple-500',
                    activity.type === 'customer' && 'bg-orange-500',
                    activity.type === 'maintenance' && 'bg-gray-500'
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.event}</p>
                  <p className="text-sm text-gray-500">{activity.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
