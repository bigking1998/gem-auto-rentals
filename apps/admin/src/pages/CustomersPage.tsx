import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  User,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api, Customer, ApiError } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { items } = await api.customers.list({ limit: 100, search: searchQuery || undefined });
      setCustomers(items);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const getInitials = (customer: Customer): string => {
    return `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase();
  };

  const handleViewProfile = (customerId: string) => {
    navigate(`/customers/${customerId}`);
    setActiveDropdown(null);
  };

  // Stats
  const stats = {
    total: customers.length,
    verified: customers.filter((c) => c.emailVerified).length,
    withBookings: customers.filter((c) => (c.totalBookings || 0) > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage customer accounts and profiles</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Customers</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
          <p className="text-sm text-gray-500">Verified</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <p className="text-2xl font-bold text-gray-900">{stats.withBookings}</p>
          <p className="text-sm text-gray-500">With Bookings</p>
        </motion.div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-primary w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 transition-colors hover:bg-gray-50">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700">Filters</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </motion.div>

      {/* Customers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
            <p className="text-gray-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No customers found</h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Bookings
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.avatarUrl ? (
                          <img
                            src={customer.avatarUrl}
                            alt={`${customer.firstName} ${customer.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="from-primary-light to-primary-dark text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-medium">
                            {getInitials(customer)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-sm capitalize text-gray-500">
                            {customer.role.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          customer.emailVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        )}
                      >
                        {customer.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {customer.totalBookings || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(new Date(customer.createdAt))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setActiveDropdown(activeDropdown === customer.id ? null : customer.id)
                          }
                          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-5 w-5 text-gray-400" />
                        </button>
                        {activeDropdown === customer.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                              <button
                                onClick={() => handleViewProfile(customer.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <User className="h-4 w-4" />
                                View Profile
                              </button>
                              <button
                                onClick={() => {
                                  window.location.href = `mailto:${customer.email}`;
                                  setActiveDropdown(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Mail className="h-4 w-4" />
                                Send Email
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/bookings?customerId=${customer.id}`);
                                  setActiveDropdown(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Calendar className="h-4 w-4" />
                                View Bookings
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
          Showing {customers.length} customers
        </div>
      </motion.div>
    </div>
  );
}
