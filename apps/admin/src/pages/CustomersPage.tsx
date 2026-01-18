import { useState } from 'react';
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
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { CustomerProfileModal } from '@/components/customers/CustomerProfileModal';

// Extended mock data with full customer details
interface CustomerBooking {
  id: string;
  vehicle: string;
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  amount: number;
}

interface CustomerDocument {
  id: string;
  type: 'DRIVERS_LICENSE' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS';
  name: string;
  uploadedAt: Date;
  verified: boolean;
  url?: string;
}

interface CustomerNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: Date;
  licenseNumber?: string;
  licenseExpiry?: Date;
  verified: boolean;
  totalBookings: number;
  totalSpent: number;
  createdAt: Date;
  bookings?: CustomerBooking[];
  documents?: CustomerDocument[];
  notes?: CustomerNote[];
}

const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    dateOfBirth: new Date('1990-05-15'),
    licenseNumber: 'J123-456-78-901',
    licenseExpiry: new Date('2027-05-15'),
    verified: true,
    totalBookings: 5,
    totalSpent: 1250,
    createdAt: new Date('2025-06-15'),
    bookings: [
      { id: 'BK001', vehicle: '2024 Toyota Camry', startDate: new Date('2026-01-18'), endDate: new Date('2026-01-22'), status: 'CONFIRMED', amount: 260 },
      { id: 'BK007', vehicle: '2024 Honda Civic', startDate: new Date('2025-11-10'), endDate: new Date('2025-11-15'), status: 'COMPLETED', amount: 225 },
      { id: 'BK008', vehicle: '2024 BMW 3 Series', startDate: new Date('2025-09-01'), endDate: new Date('2025-09-05'), status: 'COMPLETED', amount: 480 },
      { id: 'BK009', vehicle: '2024 Tesla Model Y', startDate: new Date('2025-07-20'), endDate: new Date('2025-07-22'), status: 'COMPLETED', amount: 240 },
      { id: 'BK010', vehicle: '2024 Ford Mustang', startDate: new Date('2025-06-15'), endDate: new Date('2025-06-17'), status: 'CANCELLED', amount: 45 },
    ],
    documents: [
      { id: 'DOC001', type: 'DRIVERS_LICENSE', name: 'Drivers_License.pdf', uploadedAt: new Date('2025-06-15'), verified: true },
      { id: 'DOC002', type: 'PROOF_OF_ADDRESS', name: 'Utility_Bill.pdf', uploadedAt: new Date('2025-06-15'), verified: true },
    ],
    notes: [
      { id: 'NOTE001', content: 'VIP customer - prefers luxury vehicles. Always returns cars in excellent condition.', author: 'Admin User', createdAt: new Date('2025-07-01') },
      { id: 'NOTE002', content: 'Requested early morning pickup for next booking.', author: 'Support Team', createdAt: new Date('2026-01-15') },
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Avenue',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    dateOfBirth: new Date('1985-08-22'),
    licenseNumber: 'C987-654-32-109',
    licenseExpiry: new Date('2026-08-22'),
    verified: true,
    totalBookings: 3,
    totalSpent: 2100,
    createdAt: new Date('2025-08-20'),
    bookings: [
      { id: 'BK002', vehicle: '2024 BMW 5 Series', startDate: new Date('2026-01-19'), endDate: new Date('2026-01-25'), status: 'PENDING', amount: 900 },
      { id: 'BK011', vehicle: '2024 Mercedes E-Class', startDate: new Date('2025-10-05'), endDate: new Date('2025-10-10'), status: 'COMPLETED', amount: 750 },
      { id: 'BK012', vehicle: '2024 Audi A6', startDate: new Date('2025-09-15'), endDate: new Date('2025-09-18'), status: 'COMPLETED', amount: 450 },
    ],
    documents: [
      { id: 'DOC003', type: 'DRIVERS_LICENSE', name: 'License_MChen.pdf', uploadedAt: new Date('2025-08-20'), verified: true },
    ],
    notes: [
      { id: 'NOTE003', content: 'Business traveler - usually books for week-long trips.', author: 'Admin User', createdAt: new Date('2025-09-01') },
    ],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    phone: '+1 (555) 345-6789',
    address: '789 Palm Drive',
    city: 'Coral Gables',
    state: 'FL',
    zipCode: '33134',
    dateOfBirth: new Date('1992-12-03'),
    licenseNumber: 'R456-789-01-234',
    licenseExpiry: new Date('2028-12-03'),
    verified: false,
    totalBookings: 1,
    totalSpent: 360,
    createdAt: new Date('2026-01-10'),
    bookings: [
      { id: 'BK003', vehicle: '2024 Tesla Model 3', startDate: new Date('2026-01-17'), endDate: new Date('2026-01-20'), status: 'ACTIVE', amount: 360 },
    ],
    documents: [
      { id: 'DOC004', type: 'DRIVERS_LICENSE', name: 'DL_Emily.jpg', uploadedAt: new Date('2026-01-10'), verified: false },
    ],
    notes: [],
  },
  {
    id: '4',
    name: 'David Thompson',
    email: 'david.t@example.com',
    phone: '+1 (555) 456-7890',
    address: '321 Beach Road',
    city: 'Fort Lauderdale',
    state: 'FL',
    zipCode: '33301',
    dateOfBirth: new Date('1978-03-18'),
    licenseNumber: 'T789-012-34-567',
    licenseExpiry: new Date('2025-03-18'),
    verified: true,
    totalBookings: 8,
    totalSpent: 4500,
    createdAt: new Date('2025-03-05'),
    bookings: [
      { id: 'BK004', vehicle: '2024 Ford Explorer', startDate: new Date('2026-01-20'), endDate: new Date('2026-01-27'), status: 'CONFIRMED', amount: 665 },
      { id: 'BK013', vehicle: '2024 Chevrolet Tahoe', startDate: new Date('2025-12-20'), endDate: new Date('2025-12-27'), status: 'COMPLETED', amount: 700 },
      { id: 'BK014', vehicle: '2024 Toyota Highlander', startDate: new Date('2025-11-15'), endDate: new Date('2025-11-20'), status: 'COMPLETED', amount: 475 },
    ],
    documents: [
      { id: 'DOC005', type: 'DRIVERS_LICENSE', name: 'Thompson_DL.pdf', uploadedAt: new Date('2025-03-05'), verified: true },
      { id: 'DOC006', type: 'ID_CARD', name: 'Thompson_ID.pdf', uploadedAt: new Date('2025-03-05'), verified: true },
    ],
    notes: [
      { id: 'NOTE004', content: 'Frequent family traveler. Prefers SUVs for family trips. License expiring soon - need to remind for renewal.', author: 'Admin User', createdAt: new Date('2025-03-10') },
    ],
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@example.com',
    phone: '+1 (555) 567-8901',
    address: '555 Sunset Boulevard',
    city: 'Hollywood',
    state: 'FL',
    zipCode: '33020',
    dateOfBirth: new Date('1995-07-28'),
    licenseNumber: 'W234-567-89-012',
    licenseExpiry: new Date('2029-07-28'),
    verified: true,
    totalBookings: 2,
    totalSpent: 450,
    createdAt: new Date('2025-11-28'),
    bookings: [
      { id: 'BK005', vehicle: '2024 Honda Civic', startDate: new Date('2026-01-10'), endDate: new Date('2026-01-15'), status: 'COMPLETED', amount: 225 },
      { id: 'BK015', vehicle: '2024 Toyota Corolla', startDate: new Date('2025-12-01'), endDate: new Date('2025-12-05'), status: 'COMPLETED', amount: 225 },
    ],
    documents: [
      { id: 'DOC007', type: 'DRIVERS_LICENSE', name: 'LisaW_License.pdf', uploadedAt: new Date('2025-11-28'), verified: true },
    ],
    notes: [],
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 678-9012',
    address: '888 Marina Way',
    city: 'Key Biscayne',
    state: 'FL',
    zipCode: '33149',
    verified: false,
    totalBookings: 0,
    totalSpent: 0,
    createdAt: new Date('2026-01-15'),
    bookings: [],
    documents: [
      { id: 'DOC008', type: 'DRIVERS_LICENSE', name: 'JWilson_DL.jpg', uploadedAt: new Date('2026-01-15'), verified: false },
    ],
    notes: [],
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleVerifyDocument = (customerId: string, documentId: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              documents: c.documents?.map((d) =>
                d.id === documentId ? { ...d, verified: true } : d
              ),
            }
          : c
      )
    );

    // Check if all documents are now verified
    const customer = customers.find((c) => c.id === customerId);
    if (customer?.documents?.every((d) => d.verified || d.id === documentId)) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, verified: true } : c
        )
      );
    }

    // Update selected customer if modal is open
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              documents: prev.documents?.map((d) =>
                d.id === documentId ? { ...d, verified: true } : d
              ),
            }
          : null
      );
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setIsModalOpen(false);
      setSelectedCustomer(null);
    }
  };

  // Stats
  const stats = {
    total: customers.length,
    verified: customers.filter((c) => c.verified).length,
    pending: customers.filter((c) => !c.verified).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer accounts</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Verification Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as 'all' | 'verified' | 'pending')}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewProfile(customer)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center gap-1">
                    {customer.verified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Pending
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
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
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
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onVerifyDocument={handleVerifyDocument}
        onDeleteCustomer={handleDeleteCustomer}
      />
    </div>
  );
}
