import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  Users,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { exportToCSV, exportToPDF, formatCurrencyForExport } from '@/lib/export';
import { api, type RevenueStats, type FleetStats } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Category colors for pie chart — brand-derived ramp (gold -> navy family),
// alternating light/dark so adjacent slices stay distinguishable.
const categoryColors: Record<string, string> = {
  ECONOMY: '#D4AF37', // primary gold
  STANDARD: '#1E3A6E', // secondary royal blue
  PREMIUM: '#A87C1A', // primary dark gold
  LUXURY: '#0A1929', // navy
  SUV: '#F2D99A', // primary light gold
  VAN: '#7E9AC4', // navy light
};

type Period = '7d' | '30d' | '90d' | '365d';

interface BookingStats {
  byStatus: Array<{ status: string; count: number }>;
  trend: Array<{ date: string; count: number }>;
}

interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
}

export default function AnalyticsPage() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [timePeriod, setTimePeriod] = useState<Period>('30d');
  const [isLoading, setIsLoading] = useState(true);

  // API data state
  const [revenueData, setRevenueData] = useState<RevenueStats | null>(null);
  const [fleetData, setFleetData] = useState<FleetStats | null>(null);
  const [bookingData, setBookingData] = useState<BookingStats | null>(null);
  const [customerData, setCustomerData] = useState<CustomerStats | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [revenue, fleet, bookings, customers] = await Promise.all([
        api.stats.revenue(timePeriod),
        api.stats.fleet(),
        api.stats.bookings(),
        api.stats.customers(),
      ]);
      setRevenueData(revenue);
      setFleetData(fleet);
      // Map booking data - backend returns 'trends'
      setBookingData({
        byStatus: Object.entries(bookings.byStatus).map(([status, count]) => ({ status, count })),
        trend: bookings.trends || [],
      });
      // Map customer data
      setCustomerData({
        totalCustomers: customers.total,
        newCustomers: customers.new,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod]);

  // Fetch data on mount and when period changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Format revenue data for charts (aggregate by week for readability)
  const monthlyRevenue = useMemo(() => {
    if (!revenueData?.data) return [];

    // Group data into weekly buckets for better visualization
    const weeklyData: Array<{ label: string; revenue: number; bookings: number }> = [];
    const dataPoints = revenueData.data;

    for (let i = 0; i < dataPoints.length; i += 7) {
      const weekSlice = dataPoints.slice(i, Math.min(i + 7, dataPoints.length));
      if (weekSlice.length > 0) {
        const startDate = new Date(weekSlice[0].date);
        const label = startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        weeklyData.push({
          label,
          revenue: weekSlice.reduce((sum, d) => sum + d.revenue, 0),
          bookings: weekSlice.reduce((sum, d) => sum + d.bookings, 0),
        });
      }
    }

    return weeklyData;
  }, [revenueData]);

  // Format booking trends for charts
  const bookingTrends = useMemo(() => {
    if (!bookingData?.trend) return [];

    // Group data into weekly buckets
    const weeklyData: Array<{ label: string; bookings: number }> = [];
    const dataPoints = bookingData.trend;

    for (let i = 0; i < dataPoints.length; i += 7) {
      const weekSlice = dataPoints.slice(i, Math.min(i + 7, dataPoints.length));
      if (weekSlice.length > 0) {
        const startDate = new Date(weekSlice[0].date);
        const label = startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        weeklyData.push({
          label,
          bookings: weekSlice.reduce((sum, d) => sum + d.count, 0),
        });
      }
    }

    return weeklyData;
  }, [bookingData]);

  // Fleet utilization by category for pie chart
  const fleetUtilization = useMemo(() => {
    if (!fleetData?.byCategory) return [];

    return Object.entries(fleetData.byCategory).map(([name, count]) => ({
      name,
      value: count as number,
      color: categoryColors[name] || '#9ca3af',
    }));
  }, [fleetData]);

  // Stats cards data
  const stats = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: revenueData?.totals?.revenue || 0,
        change: 12.5, // Would need historical comparison to calculate
        trend: 'up' as const,
        icon: DollarSign,
        isCurrency: true,
      },
      {
        label: 'Total Bookings',
        value: revenueData?.totals?.bookings || 0,
        change: 8.2,
        trend: 'up' as const,
        icon: Calendar,
      },
      {
        label: 'Total Customers',
        value: customerData?.totalCustomers || 0,
        change: customerData?.newCustomers || 0,
        trend: 'up' as const,
        icon: Users,
      },
      {
        label: 'Fleet Utilization',
        value: Math.round(fleetData?.utilizationRate || 0),
        change: fleetData?.utilizationRate ? (fleetData.utilizationRate > 50 ? 2.1 : -2.1) : 0,
        trend: (fleetData?.utilizationRate || 0) > 50 ? ('up' as const) : ('down' as const),
        icon: Car,
        suffix: '%',
      },
    ],
    [revenueData, fleetData, customerData]
  );

  // Export to CSV function
  const handleExportCSV = () => {
    setShowExportMenu(false);

    // Export Revenue Data
    exportToCSV(
      monthlyRevenue.map((item) => ({
        period: item.label,
        revenue: item.revenue,
        revenueFormatted: formatCurrencyForExport(item.revenue),
      })),
      `gem-auto-rentals-revenue-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'period', label: 'Period' },
        { key: 'revenueFormatted', label: 'Revenue' },
      ]
    );
  };

  // Export to PDF function
  const handleExportPDF = () => {
    setShowExportMenu(false);

    exportToPDF('Analytics Report', [
      {
        title: 'Key Metrics Summary',
        type: 'stats',
        data: stats.map((stat) => ({
          label: stat.label,
          value: stat.isCurrency
            ? formatCurrencyForExport(stat.value)
            : `${stat.value.toLocaleString()}${stat.suffix || ''}`,
        })),
      },
      {
        title: 'Revenue by Period',
        type: 'table',
        headers: [
          { key: 'period', label: 'Period' },
          { key: 'revenueFormatted', label: 'Revenue' },
        ],
        data: monthlyRevenue.map((item) => ({
          period: item.label,
          revenueFormatted: formatCurrencyForExport(item.revenue),
        })),
      },
      {
        title: 'Booking Trends',
        type: 'table',
        headers: [
          { key: 'period', label: 'Period' },
          { key: 'bookings', label: 'Bookings' },
        ],
        data: bookingTrends.map((item) => ({ period: item.label, bookings: item.bookings })),
      },
      {
        title: 'Fleet Utilization by Category',
        type: 'table',
        headers: [
          { key: 'name', label: 'Category' },
          { key: 'utilization', label: 'Utilization' },
        ],
        data: fleetUtilization.map((item) => ({
          name: item.name,
          utilization: `${item.value}%`,
        })),
      },
    ]);
  };

  // Export All Data as CSV
  const handleExportAllCSV = () => {
    setShowExportMenu(false);

    // Create comprehensive data export
    const allData = [
      {
        category: 'Summary',
        metric: 'Total Revenue',
        value: formatCurrencyForExport(stats[0].value),
        change: `${stats[0].change}%`,
      },
      {
        category: 'Summary',
        metric: 'Total Bookings',
        value: stats[1].value.toString(),
        change: `${stats[1].change}%`,
      },
      {
        category: 'Summary',
        metric: 'Total Customers',
        value: stats[2].value.toString(),
        change: `+${stats[2].change} new`,
      },
      {
        category: 'Summary',
        metric: 'Fleet Utilization',
        value: `${stats[3].value}%`,
        change: `${stats[3].change}%`,
      },
      ...monthlyRevenue.map((item) => ({
        category: 'Revenue',
        metric: item.label,
        value: formatCurrencyForExport(item.revenue),
        change: '-',
      })),
      ...bookingTrends.map((item) => ({
        category: 'Booking Trends',
        metric: item.label,
        value: item.bookings.toString(),
        change: '-',
      })),
      ...fleetUtilization.map((item) => ({
        category: 'Fleet by Category',
        metric: item.name,
        value: `${item.value} vehicles`,
        change: '-',
      })),
    ];

    exportToCSV(
      allData,
      `gem-auto-rentals-full-analytics-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'category', label: 'Category' },
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
        { key: 'change', label: 'Change' },
      ]
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <span className="text-sm font-bold text-amber-600">DEMO</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">Demo Mode Active</p>
          <p className="text-xs text-amber-600">
            Revenue data may include demo/test payments. Contact support to reset data before
            launch.
          </p>
        </div>
      </motion.div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Period Selector */}
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as Period)}
            className="focus:ring-primary rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last 12 months</option>
          </select>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', showExportMenu && 'rotate-180')}
              />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  <button
                    onClick={handleExportPDF}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export as PDF</p>
                      <p className="text-xs text-gray-500">Full report with charts</p>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export Revenue CSV</p>
                      <p className="text-xs text-gray-500">Monthly revenue data</p>
                    </div>
                  </button>
                  <button
                    onClick={handleExportAllCSV}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <FileSpreadsheet className="text-primary-ink h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export All Data CSV</p>
                      <p className="text-xs text-gray-500">Complete analytics export</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="bg-accent flex h-12 w-12 items-center justify-center rounded-xl">
                <stat.icon className="text-primary-ink h-6 w-6" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-medium',
                  stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                )}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stat.isCurrency
                ? formatCurrency(stat.value)
                : `${stat.value.toLocaleString()}${stat.suffix || ''}`}
            </p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
            <button
              onClick={() => {
                exportToCSV(
                  monthlyRevenue.map((item) => ({
                    period: item.label,
                    revenueFormatted: formatCurrencyForExport(item.revenue),
                  })),
                  `revenue-data-${new Date().toISOString().split('T')[0]}`,
                  [
                    { key: 'period', label: 'Period' },
                    { key: 'revenueFormatted', label: 'Revenue' },
                  ]
                );
              }}
              className="text-primary-ink hover:bg-accent hover:text-primary-ink flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>
          <div className="h-64">
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No revenue data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Booking Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Booking Trends</h2>
            <button
              onClick={() => {
                exportToCSV(
                  bookingTrends.map((item) => ({ period: item.label, bookings: item.bookings })),
                  `booking-trends-${new Date().toISOString().split('T')[0]}`,
                  [
                    { key: 'period', label: 'Period' },
                    { key: 'bookings', label: 'Bookings' },
                  ]
                );
              }}
              className="text-primary-ink hover:bg-accent hover:text-primary-ink flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>
          <div className="h-64">
            {bookingTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    dot={{ fill: '#D4AF37' }}
                    activeDot={{ r: 6, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No booking data available
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Fleet Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Fleet Distribution by Category</h2>
          <button
            onClick={() => {
              exportToCSV(
                fleetUtilization.map((item) => ({
                  category: item.name,
                  vehicles: item.value,
                })),
                `fleet-distribution-${new Date().toISOString().split('T')[0]}`,
                [
                  { key: 'category', label: 'Category' },
                  { key: 'vehicles', label: 'Vehicles' },
                ]
              );
            }}
            className="text-primary-ink hover:bg-accent hover:text-primary-ink flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors"
          >
            <Download className="h-3 w-3" />
            CSV
          </button>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-64">
            {fleetUtilization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetUtilization}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {fleetUtilization.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} vehicles`, 'Count']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No fleet data available
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center space-y-4">
            {(() => {
              const totalVehicles = fleetUtilization.reduce((sum, cat) => sum + cat.value, 0);
              return fleetUtilization.map((category, index) => {
                const percentage =
                  totalVehicles > 0 ? Math.round((category.value / totalVehicles) * 100) : 0;
                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {category.value} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
