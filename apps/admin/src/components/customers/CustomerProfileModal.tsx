import { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
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

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onVerifyDocument?: (customerId: string, documentId: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
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

export function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  onVerifyDocument,
  onDeleteCustomer,
  isLoading: _isLoading = false,
}: CustomerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'documents' | 'notes'>(
    'overview'
  );
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !customer) return null;

  const averageBookingValue =
    customer.totalBookings > 0 ? customer.totalSpent / customer.totalBookings : 0;

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In production, this would call an API
      setNewNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="relative">
            {/* Background gradient */}
            <div className="from-primary-light to-primary-dark h-24 bg-gradient-to-r" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30"
            >
              <X className="text-primary-foreground h-5 w-5" />
            </button>

            {/* Customer info overlay */}
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div className="from-primary-light to-primary-dark text-primary-foreground flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br text-2xl font-bold shadow-lg">
                {customer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
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
                <p className="text-sm text-gray-500">
                  Customer since {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="absolute -bottom-6 right-6 flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16 flex border-b border-gray-100 px-6">
            {(['overview', 'bookings', 'documents', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-primary-ink border-primary border-b-2'
                    : 'text-gray-500 hover:text-gray-700'
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
          <div className="max-h-[calc(90vh-250px)] overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-700">
                            <p>{customer.address}</p>
                            {customer.city && customer.state && (
                              <p>
                                {customer.city}, {customer.state} {customer.zipCode}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      {customer.dateOfBirth && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Date of Birth</span>
                          <span className="text-gray-900">{formatDate(customer.dateOfBirth)}</span>
                        </div>
                      )}
                      {customer.licenseNumber && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">License Number</span>
                          <span className="font-mono text-gray-900">{customer.licenseNumber}</span>
                        </div>
                      )}
                      {customer.licenseExpiry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">License Expiry</span>
                          <span
                            className={cn(
                              'text-gray-900',
                              new Date(customer.licenseExpiry) < new Date() && 'text-red-600'
                            )}
                          >
                            {formatDate(customer.licenseExpiry)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent rounded-xl p-4 text-center">
                      <Car className="text-accent-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-2xl font-bold text-gray-900">{customer.totalBookings}</p>
                      <p className="text-sm text-gray-500">Total Bookings</p>
                    </div>
                    <div className="rounded-xl bg-green-50 p-4 text-center">
                      <DollarSign className="mx-auto mb-2 h-8 w-8 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                      <p className="text-sm text-gray-500">Total Spent</p>
                    </div>
                    <div className="bg-accent rounded-xl p-4 text-center">
                      <Star className="text-accent-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(averageBookingValue)}
                      </p>
                      <p className="text-sm text-gray-500">Avg. Booking</p>
                    </div>
                    <div className="bg-accent rounded-xl p-4 text-center">
                      <Calendar className="text-accent-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.floor(
                          (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                        )}
                      </p>
                      <p className="text-sm text-gray-500">Days as Customer</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Recent Activity</h3>
                    {customer.bookings && customer.bookings.length > 0 ? (
                      <div className="space-y-3">
                        {customer.bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{booking.vehicle}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(booking.startDate)}
                              </p>
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
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {customer.bookings && customer.bookings.length > 0 ? (
                  customer.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-lg">
                          <Car className="text-accent-foreground h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.vehicle}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            statusColors[booking.status]
                          )}
                        >
                          {booking.status}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(booking.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Car className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-1 text-lg font-medium text-gray-900">No bookings yet</h3>
                    <p className="text-gray-500">This customer hasn&apos;t made any bookings.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {customer.documents && customer.documents.length > 0 ? (
                  customer.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-lg">
                          <FileText className="text-accent-foreground h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {documentTypeLabels[doc.type]}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.verified ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => onVerifyDocument?.(customer.id, doc.id)}
                            className="bg-primary text-primary-foreground hover:bg-primary-dark flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                          >
                            <Shield className="h-3 w-3" />
                            Verify
                          </button>
                        )}
                        <button className="rounded-lg p-2 transition-colors hover:bg-gray-200">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                        <button className="rounded-lg p-2 transition-colors hover:bg-gray-200">
                          <Download className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-1 text-lg font-medium text-gray-900">
                      No documents uploaded
                    </h3>
                    <p className="text-gray-500">
                      This customer hasn&apos;t uploaded any documents yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Add Note</h3>
                  <div className="flex gap-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note about this customer..."
                      rows={3}
                      className="focus:ring-primary flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {customer.notes && customer.notes.length > 0 ? (
                  customer.notes.map((note) => (
                    <div key={note.id} className="rounded-xl bg-gray-50 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-accent-foreground bg-accent flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                            {note.author
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{note.author}</p>
                            <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                          </div>
                        </div>
                        <button className="rounded p-1 transition-colors hover:bg-gray-200">
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                      <p className="pl-10 text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-1 text-lg font-medium text-gray-900">No notes yet</h3>
                    <p className="text-gray-500">
                      Add notes to keep track of important information.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              onClick={() => onDeleteCustomer?.(customer.id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Customer
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
