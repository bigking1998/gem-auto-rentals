import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Car,
  DollarSign,
  CheckCircle2,
  Clock,
  Shield,
  Star,
  Edit,
  Trash2,
  Download,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
  type: 'DRIVERS_LICENSE' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'INSURANCE';
  name: string;
  uploadedAt: Date;
  verified: boolean;
  url?: string;
}

interface Customer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  verified: boolean;
  totalBookings: number;
  totalSpent: number;
  createdAt: Date;
  bookings: CustomerBooking[];
  documents: CustomerDocument[];
}

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
  INSURANCE: 'Insurance',
};

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'documents'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerData(id);
    }
  }, [id]);

  const fetchCustomerData = async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch customer profile from API
      const userData = await api.customers.get(customerId);

      // Fetch customer's bookings
      const bookingsResponse = await api.bookings.list({ userId: customerId, limit: 50 });

      // Process bookings
      const processedBookings: CustomerBooking[] = bookingsResponse.items.map((b) => ({
        id: b.id,
        vehicle: b.vehicle
          ? `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}`
          : 'Unknown Vehicle',
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        status: b.status,
        amount: Number(b.totalAmount),
      }));

      // Calculate totals
      const totalSpent = processedBookings.reduce((sum, b) => sum + b.amount, 0);

      const customerProfile: Customer = {
        id: userData.id,
        name: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        avatarUrl: null,
        verified: userData.emailVerified,
        createdAt: new Date(userData.createdAt),
        totalBookings: processedBookings.length,
        totalSpent,
        bookings: processedBookings,
        documents: [], // TODO: Add documents API endpoint
      };

      setCustomer(customerProfile);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to load customer data');
      toast.error('Customer not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDocument = async (documentId: string) => {
    // TODO: Implement document verification API endpoint
    toast.error('Document verification is not yet implemented');
    console.log('Would verify document:', documentId);
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    // TODO: Implement customer deletion API endpoint
    toast.error('Customer deletion is not yet implemented');
    console.log('Would delete customer:', customer.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {error ? (
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        ) : (
          <User className="w-16 h-16 text-gray-300 mb-4" />
        )}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {error ? 'Error Loading Customer' : 'Customer Not Found'}
        </h2>
        <p className="text-gray-500 mb-6">
          {error || "The customer you're looking for doesn't exist."}
        </p>
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

  const daysAsCustomer = Math.floor(
    (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

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
              {customer.firstName[0]}{customer.lastName[0]}
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
        {(['overview', 'bookings', 'documents'] as const).map((tab) => (
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
            {tab === 'bookings' && (
              <span className="ml-1 text-xs text-gray-400">({customer.bookings.length})</span>
            )}
            {tab === 'documents' && (
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
                    <p className="text-2xl font-bold text-gray-900">{daysAsCustomer}</p>
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
                {customer.bookings.length > 0 ? (
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
              {customer.bookings.length > 0 ? (
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
              {customer.documents.length > 0 ? (
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
                          <p className="font-semibold text-gray-900">{documentTypeLabels[doc.type] || doc.type}</p>
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
