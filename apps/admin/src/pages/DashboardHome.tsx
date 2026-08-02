import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  DollarSign,
  CalendarCheck,
  Clock,
  Plus,
  Wrench,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, type ActivityLog } from '@/lib/api';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';
import { bookingStatusColors } from '@/lib/statusColors';

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

const statusColors = bookingStatusColors;

// Quick action items configuration
const quickActions = [
  {
    id: 'add-vehicle',
    label: 'Add Vehicle',
    description: 'Add a new vehicle to fleet',
    icon: Car,
    color: 'bg-navy',
    hoverBorder: 'hover:border-navy',
    hoverBg: 'hover:bg-accent',
    route: '/fleet/new',
    action: 'navigate',
  },
  {
    id: 'new-booking',
    label: 'New Booking',
    description: 'Create a new reservation',
    icon: CalendarCheck,
    color: 'bg-navy',
    hoverBorder: 'hover:border-navy',
    hoverBg: 'hover:bg-accent',
    route: '/bookings',
    action: 'navigate',
  },
  {
    id: 'schedule-maintenance',
    label: 'Maintenance',
    description: 'Mark a vehicle out of service',
    icon: Wrench,
    color: 'bg-navy',
    hoverBorder: 'hover:border-navy',
    hoverBg: 'hover:bg-accent',
    route: '/fleet',
    action: 'navigate',
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: TrendingUp,
    color: 'bg-navy',
    hoverBorder: 'hover:border-navy',
    hoverBg: 'hover:bg-accent',
    route: '/analytics',
    action: 'navigate',
  },
];

const REVENUE_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const;

// Colour for the activity timeline dot, derived from the real ActivityLog action.
function activityDotColor(action: string): string {
  if (action.startsWith('BOOKING_')) return 'bg-primary';
  if (action.startsWith('PAYMENT_')) return 'bg-green-500';
  if (action.startsWith('VEHICLE_')) return 'bg-secondary';
  if (action.startsWith('USER_') || action.startsWith('CUSTOMER_')) return 'bg-navy';
  return 'bg-gray-500';
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // Changed to false so UI shows immediately
  const [stats, setStats] = useState<DashboardStats>({
    activeRentals: 0,
    todaysRevenue: 0,
    pendingBookings: 0,
    availableVehicles: 0,
    totalCustomers: 0,
    vehiclesInMaintenance: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [alerts, setAlerts] = useState<
    { id: number; type: string; message: string; action: string; route: string }[]
  >([]);
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<string>('7d');
  const [revenueSeries, setRevenueSeries] = useState<{ name: string; revenue: number }[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real revenue series from GET /api/stats/revenue
  useEffect(() => {
    let cancelled = false;
    const fetchRevenue = async () => {
      setIsLoadingRevenue(true);
      try {
        const result = await api.stats.revenue(revenuePeriod);
        if (cancelled) return;
        setRevenueSeries(
          (result.data || []).map((point) => ({
            name: new Date(point.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }),
            revenue: point.revenue,
          }))
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching revenue stats:', error);
        setRevenueSeries([]);
      } finally {
        if (!cancelled) setIsLoadingRevenue(false);
      }
    };
    fetchRevenue();
    return () => {
      cancelled = true;
    };
  }, [revenuePeriod]);

  // Real activity feed from GET /api/activity
  useEffect(() => {
    let cancelled = false;
    const fetchActivity = async () => {
      setIsLoadingActivity(true);
      try {
        const { data } = await api.activity.list({ limit: 5 });
        if (!cancelled) setRecentActivity(data || []);
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching recent activity:', error);
        setRecentActivity([]);
      } finally {
        if (!cancelled) setIsLoadingActivity(false);
      }
    };
    fetchActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true); // Show loading state on individual components
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

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    if (action.id === 'new-booking') {
      setIsCreateBookingModalOpen(true);
      return;
    }
    // No page reads location.state, so navigate plainly.
    if (action.route) {
      navigate(action.route);
    }
  };

  const handleAlertAction = (alert: (typeof alerts)[0]) => {
    navigate(alert.route);
  };

  // NOTE: no `change` / `trend` fields here on purpose. The server exposes no
  // period-over-period comparison, so any percentage shown would be invented.
  // Add these back only once /api/stats returns a real delta.
  const statsConfig = [
    {
      label: 'Active Rentals',
      value: stats.activeRentals,
      caption: 'Currently on the road',
      icon: Car,
      color: 'bg-primary',
    },
    {
      label: "Today's Revenue",
      value: stats.todaysRevenue,
      caption: 'Payments received today',
      icon: DollarSign,
      color: 'bg-primary',
      isCurrency: true,
    },
    {
      label: 'Pending Bookings',
      value: stats.pendingBookings,
      caption: 'Awaiting confirmation',
      icon: Clock,
      color: 'bg-primary',
    },
    {
      label: 'Available Vehicles',
      value: stats.availableVehicles,
      caption: 'Ready to rent',
      icon: CalendarCheck,
      color: 'bg-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fleet/new')}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 hidden items-center gap-2 rounded-xl px-4 py-2 shadow-lg transition-all sm:flex"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <span className="text-sm font-bold text-amber-600">DEMO</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">Demo Mode Active</p>
          <p className="text-xs text-amber-600">
            Revenue and payment data may include demo/test transactions. Contact support to reset
            data before launch.
          </p>
        </div>
      </motion.div>

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
                'flex items-center justify-between rounded-2xl border p-4',
                alert.type === 'warning' && 'border-amber-200 bg-amber-50',
                alert.type === 'info' && 'border-primary bg-accent',
                alert.type === 'success' && 'border-green-200 bg-green-50'
              )}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                {alert.type === 'info' && <AlertCircle className="text-primary-ink h-5 w-5" />}
                {alert.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                <span className="text-sm font-medium text-gray-700">{alert.message}</span>
              </div>
              <button
                onClick={() => handleAlertAction(alert)}
                className={cn(
                  'flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                  alert.type === 'warning' && 'text-amber-600 hover:bg-amber-100',
                  alert.type === 'info' && 'text-primary-ink hover:bg-accent',
                  alert.type === 'success' && 'text-green-600 hover:bg-green-100'
                )}
              >
                {alert.action}
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {statsConfig.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
            onClick={() => {
              if (stat.label === 'Active Rentals') navigate('/bookings');
              if (stat.label === 'Pending Bookings') navigate('/bookings');
              if (stat.label === 'Available Vehicles') navigate('/fleet');
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="text-primary-ink h-5 w-5 animate-spin" />
                    <span className="text-xl font-bold text-gray-300">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110',
                  stat.color
                )}
              >
                <stat.icon className="text-primary-foreground h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-sm text-gray-500">{stat.caption}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500">Common tasks</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 p-4 transition-all duration-300',
                action.hoverBorder,
                action.hoverBg,
                'hover:shadow-xl'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110',
                  action.color
                )}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">{action.label}</p>
                <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Charts & Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Revenue</h2>
              </div>
              <p className="text-sm text-gray-500">
                {REVENUE_PERIODS.find((p) => p.value === revenuePeriod)?.label} of successful
                payments
              </p>
            </div>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
              aria-label="Revenue period"
              className="focus:ring-primary rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            >
              {REVENUE_PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64">
            {isLoadingRevenue ? (
              <div className="flex h-full items-center justify-center gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading revenue...
              </div>
            ) : revenueSeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No revenue data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                    minTickGap={16}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                    tickFormatter={(value) => (value >= 1000 ? `$${value / 1000}k` : `$${value}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
              <p className="text-sm text-gray-500">Latest rental reservations</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="text-primary-ink hover:bg-accent flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">
                <Loader2 className="text-primary-ink mx-auto mb-2 h-10 w-10 animate-spin" />
                <p>Loading bookings...</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <CalendarCheck className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                <p>No recent bookings</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:shadow-md"
                  onClick={() => navigate('/bookings')}
                >
                  <div className="flex items-center gap-4">
                    <div className="from-primary-light to-primary-dark text-primary-foreground shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold shadow-lg">
                      {booking.customer
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{booking.customer}</p>
                      <p className="text-sm text-gray-500">{booking.vehicle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusColors[booking.status]
                      )}
                    >
                      {booking.status}
                    </span>
                    <p className="mt-1 text-sm font-bold text-gray-900">
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
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          {/* No "View All" — there is no full activity page in the admin yet. */}
          <span className="text-sm text-gray-500">Last 5 events</span>
        </div>
        {isLoadingActivity ? (
          <div className="flex items-center gap-2 py-6 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading activity...
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="py-6 text-sm text-gray-400">No recorded activity yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-4 top-0 w-px bg-gray-200" />
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="relative pl-10">
                  <div
                    className={cn(
                      'absolute left-2 h-4 w-4 rounded-full border-2 border-white shadow-lg',
                      activityDotColor(activity.action)
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    {activity.user && (
                      <p className="text-sm text-gray-500">
                        {activity.user.firstName} {activity.user.lastName}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
