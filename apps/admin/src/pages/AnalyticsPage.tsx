import { TrendingUp, TrendingDown, DollarSign, Car, Users, Calendar } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
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

// Mock data
const monthlyRevenue = [
  { month: 'Jul', revenue: 45000 },
  { month: 'Aug', revenue: 52000 },
  { month: 'Sep', revenue: 48000 },
  { month: 'Oct', revenue: 61000 },
  { month: 'Nov', revenue: 55000 },
  { month: 'Dec', revenue: 67000 },
  { month: 'Jan', revenue: 72000 },
];

const bookingTrends = [
  { month: 'Jul', bookings: 120 },
  { month: 'Aug', bookings: 145 },
  { month: 'Sep', bookings: 132 },
  { month: 'Oct', bookings: 168 },
  { month: 'Nov', bookings: 155 },
  { month: 'Dec', bookings: 189 },
  { month: 'Jan', bookings: 198 },
];

const fleetUtilization = [
  { name: 'Economy', value: 85, color: '#10b981' },
  { name: 'Standard', value: 72, color: '#3b82f6' },
  { name: 'Premium', value: 68, color: '#8b5cf6' },
  { name: 'Luxury', value: 45, color: '#f59e0b' },
  { name: 'SUV', value: 78, color: '#ef4444' },
];

const stats = [
  {
    label: 'Total Revenue',
    value: 400000,
    change: 12.5,
    trend: 'up',
    icon: DollarSign,
    isCurrency: true,
  },
  {
    label: 'Total Bookings',
    value: 1107,
    change: 8.2,
    trend: 'up',
    icon: Calendar,
  },
  {
    label: 'Active Customers',
    value: 856,
    change: 15.3,
    trend: 'up',
    icon: Users,
  },
  {
    label: 'Fleet Utilization',
    value: 72,
    change: -2.1,
    trend: 'down',
    icon: Car,
    suffix: '%',
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        <select className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option>Last 6 months</option>
          <option>Last 12 months</option>
          <option>This year</option>
          <option>All time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stat.isCurrency
                ? formatCurrency(stat.value)
                : `${stat.value.toLocaleString()}${stat.suffix || ''}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Booking Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fleet Utilization */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Fleet Utilization by Category</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="h-64">
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
                  formatter={(value: number) => [`${value}%`, 'Utilization']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            {fleetUtilization.map((category) => (
              <div key={category.name} className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{category.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${category.value}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
