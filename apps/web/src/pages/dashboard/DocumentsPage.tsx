import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Trash2,
  CreditCard,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'expired';

interface Document {
  id: string;
  name: string;
  type: 'drivers_license' | 'passport' | 'insurance' | 'other';
  status: DocumentStatus;
  uploadedAt: string;
  expiresAt: string | null;
  fileUrl: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: "Driver's License",
    type: 'drivers_license',
    status: 'verified',
    uploadedAt: '2025-01-15',
    expiresAt: '2028-05-20',
    fileUrl: '#',
  },
  {
    id: '2',
    name: 'Passport',
    type: 'passport',
    status: 'pending',
    uploadedAt: '2026-01-10',
    expiresAt: '2030-08-15',
    fileUrl: '#',
  },
  {
    id: '3',
    name: 'Insurance Card',
    type: 'insurance',
    status: 'expired',
    uploadedAt: '2024-06-01',
    expiresAt: '2025-12-31',
    fileUrl: '#',
  },
];

const documentTypes = [
  { value: 'drivers_license', label: "Driver's License", icon: CreditCard },
  { value: 'passport', label: 'Passport', icon: FileText },
  { value: 'insurance', label: 'Insurance Card', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText },
];

const statusConfig = {
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
    description: 'Document has been verified',
  },
  pending: {
    label: 'Pending Review',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700',
    description: 'Waiting for verification',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
    description: 'Document was rejected',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    className: 'bg-gray-100 text-gray-700',
    description: 'Document has expired',
  },
};

export default function DocumentsPage() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDocumentIcon = (type: Document['type']) => {
    const docType = documentTypes.find((d) => d.value === type);
    return docType?.icon || FileText;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-gray-500">Manage your identification and insurance documents</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Upload Document
        </button>
      </div>

      {/* Required Documents Notice */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-900">Required Documents</h3>
            <p className="mt-1 text-sm text-blue-700">
              To complete your bookings, please upload a valid driver&apos;s license. Additional
              documents like passport or insurance may be required for certain rentals.
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No documents uploaded</h3>
            <p className="mb-6 text-gray-500">Upload your documents to start booking vehicles.</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium"
            >
              <Upload className="h-5 w-5" />
              Upload Your First Document
            </button>
          </div>
        ) : (
          documents.map((doc, index) => {
            const status = statusConfig[doc.status];
            const StatusIcon = status.icon;
            const DocIcon = getDocumentIcon(doc.type);

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'overflow-hidden rounded-xl border bg-white',
                  doc.status === 'expired' ? 'border-amber-200' : 'border-gray-200'
                )}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Document Icon */}
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg',
                        doc.status === 'verified'
                          ? 'bg-green-100'
                          : doc.status === 'pending'
                            ? 'bg-amber-100'
                            : doc.status === 'expired'
                              ? 'bg-gray-100'
                              : 'bg-red-100'
                      )}
                    >
                      <DocIcon
                        className={cn(
                          'h-6 w-6',
                          doc.status === 'verified'
                            ? 'text-green-600'
                            : doc.status === 'pending'
                              ? 'text-amber-600'
                              : doc.status === 'expired'
                                ? 'text-gray-600'
                                : 'text-red-600'
                        )}
                      />
                    </div>

                    {/* Document Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Uploaded {formatDate(doc.uploadedAt)}
                            {doc.expiresAt && <> • Expires {formatDate(doc.expiresAt)}</>}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                            status.className
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </div>

                      {/* Status Description */}
                      {doc.status === 'rejected' && (
                        <div className="mt-3 rounded-lg bg-red-50 p-3">
                          <p className="text-sm text-red-700">
                            <strong>Reason:</strong> The document image is unclear. Please upload a
                            clearer image.
                          </p>
                        </div>
                      )}

                      {doc.status === 'expired' && (
                        <div className="mt-3 rounded-lg bg-amber-50 p-3">
                          <p className="text-sm text-amber-700">
                            This document has expired. Please upload an updated version.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        {(doc.status === 'rejected' || doc.status === 'expired') && (
                          <button className="text-primary-ink bg-accent hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">
                            <Upload className="h-4 w-4" />
                            Re-upload
                          </button>
                        )}
                        <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUploadModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Upload Document</h2>

            {/* Document Type Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Document Type</label>
              <select className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2">
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiration Date */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Expiration Date (if applicable)
              </label>
              <input
                type="date"
                className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2"
              />
            </div>

            {/* Drop Zone */}
            <div
              className={cn(
                'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                dragActive ? 'border-primary bg-accent' : 'border-gray-200 hover:border-gray-300'
              )}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => setDragActive(false)}
            >
              <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <p className="mb-1 text-gray-600">
                <span className="text-primary-ink cursor-pointer font-medium hover:underline">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG or PDF (max. 10MB)</p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button className="text-primary-foreground bg-primary hover:bg-primary-dark flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">
                Upload Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
