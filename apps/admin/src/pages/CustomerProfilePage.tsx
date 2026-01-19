import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Car,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Star,
  Edit,
  Trash2,
  MessageSquare,
  Download,
  Eye,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

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

// Mock customer data (in production, this would come from an API)
const mockCustomers: Customer[] = [
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
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const documentTypeLabels: Record<string, string> = {
  DRIVERS_LICENSE: "Driver's License",
  ID_CARD: 'ID Card',
  PASSPORT: 'Passport',
  PROOF_OF_ADDRESS: 'Proof of Address',
};

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'documents' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');

  // Find customer by ID (in production, this would be an API call)
  const customer = mockCustomers.find(c => c.id === id);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h2>
        <p className="text-gray-500 mb-6">The customer you're looking for doesn't exist.</p>
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
      </div>
    );
  }

  const averageBookingValue = customer.totalBookings > 0
    ? customer.totalSpent / customer.totalBookings
    : 0;

  const handleAddNote = () => {
    if (newNote.trim()) {
      console.log('Adding note:', newNote);
      setNewNote('');
    }
  };

  const handleVerifyDocument = (documentId: string) => {
    console.log('Verifying document:', documentId);
  };

  const handleDeleteCustomer = () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      console.log('Deleting customer:', customer.id);
      navigate('/customers');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Background gradient */}
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600" />

        {/* Customer info overlay */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg flex-shrink-0">
              {customer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 pt-14 sm:pt-14">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                {customer.verified ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    <Clock className="w-3 h-3" />
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-gray-500">Customer since {formatDate(customer.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 pt-14 sm:pt-14">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-6">
        {(['overview', 'bookings', 'documents', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'text-primary border-primary'
                : 'text-gray-500 hover:text-gray-700 border-transparent'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'bookings' && customer.bookings && (
              <span className="ml-1 text-xs text-gray-400">({customer.bookings.length})</span>
            )}
            {tab === 'documents' && customer.documents && (
              <span className="ml-1 text-xs text-gray-400">({customer.documents.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{customer.totalBookings}</p>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageBookingValue)}</p>
                    <p className="text-sm text-gray-500">Avg. Booking Value</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-sm text-gray-500">Days as Customer</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {customer.address}
                          {customer.city && customer.state && (
                            <>, {customer.city}, {customer.state} {customer.zipCode}</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {customer.dateOfBirth && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(customer.dateOfBirth)}</p>
                    </div>
                  )}
                  {customer.licenseNumber && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">License Number</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">{customer.licenseNumber}</p>
                    </div>
                  )}
                  {customer.licenseExpiry && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">License Expiry</p>
                      <p className={cn(
                        'text-sm font-medium',
                        new Date(customer.licenseExpiry) < new Date() ? 'text-red-600' : 'text-gray-900'
                      )}>
                        {formatDate(customer.licenseExpiry)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {customer.bookings && customer.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {customer.bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Car className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.vehicle}</p>
                            <p className="text-xs text-gray-500">{formatDate(booking.startDate)}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          statusColors[booking.status]
                        )}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking History</h3>
              {customer.bookings && customer.bookings.length > 0 ? (
                <div className="space-y-4">
                  {customer.bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Car className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.vehicle}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          statusColors[booking.status]
                        )}>
                          {booking.status}
                        </span>
                        <span className="font-bold text-gray-900">{formatCurrency(booking.amount)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings yet</h3>
                  <p className="text-gray-500">This customer hasn't made any bookings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              {customer.documents && customer.documents.length > 0 ? (
                <div className="space-y-4">
                  {customer.documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{documentTypeLabels[doc.type]}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.verified ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyDocument(doc.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                          >
                            <Shield className="w-3 h-3" />
                            Verify
                          </button>
                        )}
                        <button className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No documents uploaded</h3>
                  <p className="text-gray-500">This customer hasn't uploaded any documents yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Add Note */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a note about this customer..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>

            {/* Notes List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes History</h3>
                {customer.notes && customer.notes.length > 0 ? (
                  <div className="space-y-4">
                    {customer.notes.map((note, index) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary text-sm font-medium">
                              {note.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{note.author}</p>
                              <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                            </div>
                          </div>
                          <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 pl-11">{note.content}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notes yet</h3>
                    <p className="text-gray-500">Add notes to keep track of important information.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      >
        <button
          onClick={handleDeleteCustomer}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Customer
        </button>
        <Link
          to="/customers"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          Back to Customers
        </Link>
      </motion.div>
    </motion.div>
  );
}
