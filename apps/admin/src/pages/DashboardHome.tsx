import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  DollarSign,
  CalendarCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Users,
  Wrench,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';

interface DashboardStats {
  activeRentals: number;
  todaysRevenue: number;
  pendingBookings: number;
  availableVehicles: number;
  totalCustomers: number;
  vehiclesInMaintenance: number;
}

interface RecentBooking {
  id: string;
  customer: string;
  vehicle: string;
  startDate: Date;
  endDate: Date;
  status: string;
  amount: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-purple-100 text-purple-800',
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
    color: 'bg-purple-500',
    hoverBorder: 'hover:border-purple-500',
    hoverBg: 'hover:bg-purple-50',
    route: '/fleet',
    action: 'modal',
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
    color: 'bg-primary',
    hoverBorder: 'hover:border-primary',
    hoverBg: 'hover:bg-orange-50',
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
    color: 'bg-amber-500',
    hoverBorder: 'hover:border-amber-500',
    hoverBg: 'hover:bg-amber-50',
    route: '/analytics',
    action: 'navigate',
  },
];

// Mock revenue data for the chart (would be fetched from payments table in production)
const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 4500 },
  { name: 'Fri', revenue: 6000 },
  { name: 'Sat', revenue: 7500 },
  { name: 'Sun', revenue: 5500 },
];

export default function DashboardHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeRentals: 0,
    todaysRevenue: 0,
    pendingBookings: 0,
    availableVehicles: 0,
    totalCustomers: 0,
    vehiclesInMaintenance: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [alerts, setAlerts] = useState<{ id: number; type: string; message: string; action: string; route: string }[]>([]);
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard stats from API
      const dashboardData = await api.stats.dashboard();

      // Update stats
      setStats({
        activeRentals: dashboardData.metrics.activeRentals,
        todaysRevenue: dashboardData.metrics.todaysRevenue,
        pendingBookings: dashboardData.metrics.pendingBookings,
        availableVehicles: dashboardData.metrics.availableVehicles,
        totalCustomers: dashboardData.metrics.totalCustomers,
        vehiclesInMaintenance: 0, // Not included in metrics, could add later
      });

      // Process recent bookings
      if (dashboardData.recentBookings && dashboardData.recentBookings.length > 0) {
        const processedBookings: RecentBooking[] = dashboardData.recentBookings.map((booking) => ({
          id: booking.id,
          customer: booking.user
            ? `${booking.user.firstName} ${booking.user.lastName}`
            : 'Unknown Customer',
          vehicle: booking.vehicle
            ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
            : 'Unknown Vehicle',
          startDate: new Date(booking.startDate),
          endDate: new Date(booking.endDate),
          status: booking.status,
          amount: Number(booking.totalAmount),
        }));
        setRecentBookings(processedBookings);
      }

      // Generate alerts based on data
      const newAlerts = [];
      if (dashboardData.metrics.pendingBookings > 0) {
        newAlerts.push({
          id: 2,
          type: 'info',
          message: `${dashboardData.metrics.pendingBookings} pending booking${dashboardData.metrics.pendingBookings > 1 ? 's' : ''} awaiting confirmation`,
          action: 'Review',
          route: '/bookings',
        });
      }
      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.id === 'new-booking') {
      setIsCreateBookingModalOpen(true);
      return;
    }
    if (action.route) {
      navigate(action.route, { state: { action: action.id } });
    }
  };

  const handleAlertAction = (alert: typeof alerts[0]) => {
    navigate(alert.route);
  };

  const statsConfig = [
    {
      label: 'Active Rentals',
      value: stats.activeRentals,
      change: 12,
      trend: 'up' as const,
      icon: Car,
      color: 'bg-red-500',
    },
    {
      label: "Today's Revenue",
      value: stats.todaysRevenue,
      change: 8.2,
      trend: 'up' as const,
      icon: DollarSign,
      color: 'bg-green-500',
      isCurrency: true,
    },
    {
      label: 'Pending Bookings',
      value: stats.pendingBookings,
      change: -3,
      trend: 'down' as const,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      label: 'Available Vehicles',
      value: stats.availableVehicles,
      change: 5,
      trend: 'up' as const,
      icon: CalendarCheck,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center justify-between p-4 rounded-2xl border',
                alert.type === 'warning' && 'bg-amber-50 border-amber-200',
                alert.type === 'info' && 'bg-purple-50 border-purple-200',
                alert.type === 'success' && 'bg-green-50 border-green-200'
              )}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                {alert.type === 'info' && <AlertCircle className="w-5 h-5 text-purple-500" />}
                {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                <span className="text-sm font-medium text-gray-700">{alert.message}</span>
              </div>
              <button
                onClick={() => handleAlertAction(alert)}
                className={cn(
                  'text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors',
                  alert.type === 'warning' && 'text-amber-600 hover:bg-amber-100',
                  alert.type === 'info' && 'text-purple-600 hover:bg-purple-100',
                  alert.type === 'success' && 'text-green-600 hover:bg-green-100'
                )}
              >
                {alert.action}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsConfig.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
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
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform', stat.color)}>
                <stat.icon className="w-6 h-6 text-white" />
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
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500">Common tasks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={cn(
                'group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-200 transition-all duration-300',
                action.hoverBorder,
                action.hoverBg,
                'hover:shadow-xl'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110',
                  action.color
                )}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Charts & Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Weekly Revenue</h2>
              <p className="text-sm text-gray-500">Last 7 days performance</p>
            </div>
            <select className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
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
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#FF871E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
              <p className="text-sm text-gray-500">Latest rental reservations</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="text-sm text-primary hover:text-orange-600 font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No recent bookings</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate('/bookings')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-200">
                      {booking.customer.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{booking.customer}</p>
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
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {formatCurrency(booking.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <button className="text-sm text-primary hover:text-orange-600 font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors">
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
                    'absolute left-2 w-4 h-4 rounded-full border-2 border-white shadow-lg',
                    activity.type === 'booking' && 'bg-orange-500',
                    activity.type === 'payment' && 'bg-green-500',
                    activity.type === 'return' && 'bg-amber-500',
                    activity.type === 'customer' && 'bg-orange-500',
                    activity.type === 'maintenance' && 'bg-gray-500'
                  )}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{activity.event}</p>
                  <p className="text-sm text-gray-500">{activity.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isCreateBookingModalOpen}
        onClose={() => setIsCreateBookingModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
