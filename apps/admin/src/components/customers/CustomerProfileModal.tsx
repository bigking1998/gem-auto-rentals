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
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'documents' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !customer) return null;

  const averageBookingValue = customer.totalBookings > 0
    ? customer.totalSpent / customer.totalBookings
    : 0;

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In production, this would call an API
      console.log('Adding note:', newNote);
      setNewNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="relative">
            {/* Background gradient */}
            <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-600" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Customer info overlay */}
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {customer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
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
                <p className="text-sm text-gray-500">Customer since {formatDate(customer.createdAt)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="absolute -bottom-6 right-6 flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mt-16 px-6">
            {(['overview', 'bookings', 'documents', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
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
          <div className="overflow-y-auto max-h-[calc(90vh-250px)] p-6">
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-sm text-gray-700">
                            <p>{customer.address}</p>
                            {customer.city && customer.state && (
                              <p>{customer.city}, {customer.state} {customer.zipCode}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h3>
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
                          <span className="text-gray-900 font-mono">{customer.licenseNumber}</span>
                        </div>
                      )}
                      {customer.licenseExpiry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">License Expiry</span>
                          <span className={cn(
                            'text-gray-900',
                            new Date(customer.licenseExpiry) < new Date() && 'text-red-600'
                          )}>
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
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <Car className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{customer.totalBookings}</p>
                      <p className="text-sm text-gray-500">Total Bookings</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-sm text-gray-500">Total Spent</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageBookingValue)}</p>
                      <p className="text-sm text-gray-500">Avg. Booking</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.floor((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-sm text-gray-500">Days as Customer</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
                    {customer.bookings && customer.bookings.length > 0 ? (
                      <div className="space-y-3">
                        {customer.bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{booking.vehicle}</p>
                              <p className="text-xs text-gray-500">{formatDate(booking.startDate)}</p>
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
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.vehicle}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[booking.status]
                        )}>
                          {booking.status}
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(booking.amount)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings yet</h3>
                    <p className="text-gray-500">This customer hasn't made any bookings.</p>
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
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{documentTypeLabels[doc.type]}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.verified ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => onVerifyDocument?.(customer.id, doc.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <Shield className="w-3 h-3" />
                            Verify
                          </button>
                        )}
                        <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No documents uploaded</h3>
                    <p className="text-gray-500">This customer hasn't uploaded any documents yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Note</h3>
                  <div className="flex gap-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note about this customer..."
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {customer.notes && customer.notes.length > 0 ? (
                  customer.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary text-sm font-medium">
                            {note.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{note.author}</p>
                            <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                          </div>
                        </div>
                        <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 pl-10">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notes yet</h3>
                    <p className="text-gray-500">Add notes to keep track of important information.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => onDeleteCustomer?.(customer.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Customer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
