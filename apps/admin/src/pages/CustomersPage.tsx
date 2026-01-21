import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Plus,
  Filter,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
  Shield,
  ShieldCheck,
  UserCog,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { api, Customer as ApiCustomer } from '@/lib/api';
import { toast } from 'sonner';

// UI Customer interface
type Role = 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';

const validRoles: Role[] = ['CUSTOMER', 'SUPPORT', 'MANAGER', 'ADMIN'];

function isValidRole(role: string): role is Role {
  return validRoles.includes(role as Role);
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  verified: boolean;
  role: Role;
  totalBookings: number;
  totalSpent: number;
  createdAt: Date;
}

// Transform API customer to UI format
function transformCustomer(apiCustomer: ApiCustomer): Customer {
  const role = isValidRole(apiCustomer.role) ? apiCustomer.role : 'CUSTOMER';
  return {
    id: apiCustomer.id,
    name: `${apiCustomer.firstName} ${apiCustomer.lastName}`,
    email: apiCustomer.email,
    phone: apiCustomer.phone,
    verified: apiCustomer.emailVerified,
    role,
    totalBookings: apiCustomer._count?.bookings || 0,
    totalSpent: 0, // TODO: Add totalSpent to API response
    createdAt: new Date(apiCustomer.createdAt),
  };
}

const roleLabels: Record<Role, string> = {
  CUSTOMER: 'Customer',
  SUPPORT: 'Support',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

const roleColors: Record<Role, { bg: string; text: string; icon: typeof Users }> = {
  CUSTOMER: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Users },
  SUPPORT: { bg: 'bg-blue-100', text: 'text-blue-600', icon: UserCog },
  MANAGER: { bg: 'bg-purple-100', text: 'text-purple-600', icon: Shield },
  ADMIN: { bg: 'bg-orange-100', text: 'text-orange-600', icon: ShieldCheck },
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [roleSubmenuOpen, setRoleSubmenuOpen] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<'left' | 'right'>('right');
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.customers.list({ limit: 100 });
      const transformedCustomers = response.items.map(transformCustomer);
      setCustomers(transformedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && customer.verified) ||
      (verificationFilter === 'pending' && !customer.verified);
    return matchesSearch && matchesVerification;
  });

  const handleViewProfile = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
    setActiveDropdown(null);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    // TODO: Implement customer deletion API endpoint
    toast.error('Customer deletion is not yet implemented');
    console.log('Would delete customer:', customerId);
    setActiveDropdown(null);
  };

  const handleRoleChange = async (customerId: string, newRole: Role) => {
    setChangingRole(customerId);
    try {
      await api.customers.changeRole(customerId, newRole);
      // Update customer in local state
      setCustomers(prev =>
        prev.map(c => c.id === customerId ? { ...c, role: newRole } : c)
      );
      toast.success(`Role changed to ${roleLabels[newRole]}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change role';
      toast.error(errorMessage);
    } finally {
      setChangingRole(null);
      setRoleSubmenuOpen(null);
      setActiveDropdown(null);
    }
  };

  // Stats
  const stats = {
    total: customers.length,
    verified: customers.filter((c) => c.verified).length,
    pending: customers.filter((c) => !c.verified).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer accounts</p>
        </div>
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load customers</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => fetchCustomers()}
            className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-orange-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer accounts</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Customers</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              <p className="text-sm text-gray-500">Verified</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Verification Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as 'all' | 'verified' | 'pending')}
              className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => handleViewProfile(customer)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200">
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{customer.name}</h3>
                  <div className="flex items-center gap-1 flex-wrap">
                    {customer.verified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full font-medium">
                        <XCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                    {customer.role !== 'CUSTOMER' && (
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[customer.role].bg} ${roleColors[customer.role].text}`}>
                        {(() => {
                          const RoleIcon = roleColors[customer.role].icon;
                          return <RoleIcon className="w-3 h-3" />;
                        })()}
                        {roleLabels[customer.role]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === customer.id ? null : customer.id);
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {activeDropdown === customer.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(null);
                      }}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(customer);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Customer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Mail className="w-4 h-4" />
                        Send Email
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (roleSubmenuOpen !== customer.id) {
                              // Check if we need to flip the menu
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceRight = window.innerWidth - rect.right;
                              // Menu width is w-40 (160px) + some padding. Let's say 180px safe zone.
                              setSubmenuPosition(spaceRight < 180 ? 'left' : 'right');
                              setRoleSubmenuOpen(customer.id);
                            } else {
                              setRoleSubmenuOpen(null);
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Change Role
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {roleSubmenuOpen === customer.id && (
                          <div
                            className={`absolute top-0 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 ${submenuPosition === 'left' ? 'right-full mr-1' : 'left-full ml-1'
                              }`}
                          >
                            {(Object.keys(roleLabels) as Role[]).map((role) => (
                              <button
                                key={role}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (role !== customer.role) {
                                    handleRoleChange(customer.id, role);
                                  }
                                }}
                                disabled={changingRole === customer.id || role === customer.role}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${role === customer.role
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                              >
                                {(() => {
                                  if (changingRole === customer.id) {
                                    return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
                                  }
                                  const RoleIcon = roleColors[role].icon;
                                  return <RoleIcon className={`w-4 h-4 ${role === customer.role ? 'text-gray-400' : roleColors[role].text}`} />;
                                })()}
                                <span>{roleLabels[role]}</span>
                                {role === customer.role && (
                                  <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer.id);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Customer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{customer.totalBookings}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProfile(customer);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all group/btn"
              >
                View
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center"
        >
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No customers found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
        </motion.div>
      )}
    </div>
  );
}
