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
  type: string;
  fileName: string;
  uploadedAt: Date;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  signedUrl?: string;
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
  CONFIRMED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const documentTypeLabels: Record<string, string> = {
  DRIVERS_LICENSE_FRONT: "Driver's License (Front)",
  DRIVERS_LICENSE_BACK: "Driver's License (Back)",
  ID_CARD: 'ID Card',
  PASSPORT: 'Passport',
  PROOF_OF_ADDRESS: 'Proof of Address',
  INSURANCE: 'Insurance',
};

const documentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  VERIFIED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
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
      // Fetch customer profile, bookings, and documents in parallel
      const [userData, bookingsResponse, documentsResponse] = await Promise.all([
        api.customers.get(customerId),
        api.bookings.list({ userId: customerId, limit: 50 }),
        api.documents.list({ userId: customerId }),
      ]);

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

      // Process documents
      const processedDocuments: CustomerDocument[] = documentsResponse.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
        uploadedAt: new Date(d.createdAt),
        status: d.status,
        signedUrl: d.signedUrl,
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
        documents: processedDocuments,
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

  const handleVerifyDocument = async (documentId: string, action: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.documents.verify(documentId, action);
      toast.success(`Document ${action.toLowerCase()}`);
      // Refresh the data
      if (id) {
        fetchCustomerData(id);
      }
    } catch (err) {
      console.error('Error verifying document:', err);
      toast.error('Failed to verify document');
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const { downloadUrl } = await api.documents.getDownloadUrl(documentId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error('Failed to download document');
    }
  };

  const handleViewDocument = (signedUrl?: string) => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error('Document URL not available');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    if (
      !window.confirm(
        'Are you sure you want to delete this customer? This action cannot be undone.'
      )
    ) {
      return;
    }

    // TODO: Implement customer deletion API endpoint
    toast.error('Customer deletion is not yet implemented');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-orange-500" />
          <p className="text-gray-500">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        {error ? (
          <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
        ) : (
          <User className="mb-4 h-16 w-16 text-gray-300" />
        )}
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {error ? 'Error Loading Customer' : 'Customer Not Found'}
        </h2>
        <p className="mb-6 text-gray-500">
          {error || "The customer you're looking for doesn't exist."}
        </p>
        <Link
          to="/customers"
          className="bg-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
      </div>
    );
  }

  const averageBookingValue =
    customer.totalBookings > 0 ? customer.totalSpent / customer.totalBookings : 0;

  const daysAsCustomer = Math.floor(
    (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Back Button */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        {/* Background gradient */}
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600" />

        {/* Customer info overlay */}
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-orange-400 to-orange-600 text-2xl font-bold text-white shadow-lg">
              {customer.firstName[0]}
              {customer.lastName[0]}
            </div>
            <div className="flex-1 pt-14 sm:pt-14">
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                {customer.verified ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    <Clock className="h-3 w-3" />
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-gray-500">Customer since {formatDate(customer.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 pt-14 sm:pt-14">
              <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex rounded-t-2xl border-b border-gray-200 bg-white px-6">
        {(['overview', 'bookings', 'documents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              '-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-primary border-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Stats */}
            <div className="space-y-4 lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Car className="text-primary h-6 w-6" />
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
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Star className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(averageBookingValue)}
                    </p>
                    <p className="text-sm text-gray-500">Avg. Booking Value</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{daysAsCustomer}</p>
                    <p className="text-sm text-gray-500">Days as Customer</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                      <Phone className="h-5 w-5 text-gray-400" />
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
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
                {customer.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {customer.bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                            <Car className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.vehicle}</p>
                            <p className="text-xs text-gray-500">{formatDate(booking.startDate)}</p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            statusColors[booking.status]
                          )}
                        >
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
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Booking History</h3>
              {customer.bookings.length > 0 ? (
                <div className="space-y-4">
                  {customer.bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                          <Car className="text-primary h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.vehicle}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            statusColors[booking.status]
                          )}
                        >
                          {booking.status}
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(booking.amount)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Car className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-1 text-lg font-medium text-gray-900">No bookings yet</h3>
                  <p className="text-gray-500">This customer hasn&apos;t made any bookings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Documents</h3>
              {customer.documents.length > 0 ? (
                <div className="space-y-4">
                  {customer.documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {documentTypeLabels[doc.type] || doc.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {doc.fileName} • Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                            documentStatusColors[doc.status]
                          )}
                        >
                          {doc.status === 'VERIFIED' && <CheckCircle2 className="h-3 w-3" />}
                          {doc.status === 'PENDING' && <Clock className="h-3 w-3" />}
                          {doc.status === 'REJECTED' && <AlertCircle className="h-3 w-3" />}
                          {doc.status}
                        </span>
                        {doc.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                              className="flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                              className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewDocument(doc.signedUrl)}
                          className="rounded-xl p-2 transition-colors hover:bg-gray-200"
                          title="View document"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="rounded-xl p-2 transition-colors hover:bg-gray-200"
                          title="Download document"
                        >
                          <Download className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-1 text-lg font-medium text-gray-900">No documents uploaded</h3>
                  <p className="text-gray-500">
                    This customer hasn&apos;t uploaded any documents yet.
                  </p>
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
        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <button
          onClick={handleDeleteCustomer}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete Customer
        </button>
        <Link
          to="/customers"
          className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Back to Customers
        </Link>
      </motion.div>
    </motion.div>
  );
}
