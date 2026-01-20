import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Eye,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingData } from '@/pages/BookingPage';
import { api, Document } from '@/lib/api';

interface DocumentUploadStepProps {
  data: BookingData;
  onChange: (data: Partial<BookingData>) => void;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: 'license_front' | 'license_back';
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
  serverDocument?: Document;
}

export default function DocumentUploadStep({ data, onChange }: DocumentUploadStepProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState<'license_front' | 'license_back'>('license_front');
  const [previewDocument, setPreviewDocument] = useState<UploadedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasLicenseFront = documents.some(
    (doc) => doc.type === 'license_front' && doc.status === 'success'
  );
  const hasLicenseBack = documents.some(
    (doc) => doc.type === 'license_back' && doc.status === 'success'
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Please upload an image or PDF file');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        continue;
      }

      // Create preview
      const preview = await createPreview(file);

      const tempId = Date.now().toString();
      const newDoc: UploadedDocument = {
        id: tempId,
        name: file.name,
        type: uploadType,
        file,
        preview,
        status: 'uploading',
      };

      // Add to state and remove previous document of same type
      setDocuments((prev) => [
        ...prev.filter((d) => d.type !== uploadType),
        newDoc,
      ]);

      // Upload to server
      try {
        const apiDocType = uploadType === 'license_front'
          ? 'DRIVERS_LICENSE_FRONT'
          : 'DRIVERS_LICENSE_BACK';

        const serverDoc = await api.documents.upload(file, apiDocType);

        // Update document state with success
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? {
                  ...d,
                  id: serverDoc.id,
                  status: 'success' as const,
                  serverDocument: serverDoc,
                  preview: serverDoc.signedUrl || d.preview,
                }
              : d
          )
        );

        // Update parent with document info
        onChange({
          documents: {
            ...data.documents,
            [uploadType]: {
              id: serverDoc.id,
              fileName: file.name,
              uploaded: true,
            },
          },
        });
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        // Update document state with error
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...d, status: 'error' as const, errorMessage }
              : d
          )
        );
      }
    }
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDocument = async (id: string, type: 'license_front' | 'license_back') => {
    const doc = documents.find(d => d.id === id);

    // Remove from local state first
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    onChange({
      documents: {
        ...data.documents,
        [type]: undefined,
      },
    });

    // Try to delete from server if it was uploaded
    if (doc?.serverDocument) {
      try {
        await api.documents.delete(id);
      } catch (error) {
        console.error('Error deleting document from server:', error);
        // Already removed from UI, so just log the error
      }
    }
  };

  const triggerFileInput = (type: 'license_front' | 'license_back') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-500">
          Please upload your driver's license for verification. This is required to complete your booking.
        </p>
      </div>

      {/* Document Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Document Requirements</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>Valid driver's license (front and back)</li>
              <li>Clear, legible photos or scans</li>
              <li>File formats: JPG, PNG, or PDF</li>
              <li>Maximum file size: 10MB per file</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Areas */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* License Front */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Driver's License (Front) <span className="text-red-500">*</span>
          </label>

          {!hasLicenseFront ? (
            <UploadArea
              type="license_front"
              label="Front of License"
              isDragging={isDragging && uploadType === 'license_front'}
              isUploading={documents.some(d => d.type === 'license_front' && d.status === 'uploading')}
              error={documents.find(d => d.type === 'license_front' && d.status === 'error')?.errorMessage}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                setUploadType('license_front');
                handleDrop(e);
              }}
              onClick={() => triggerFileInput('license_front')}
            />
          ) : (
            <DocumentCard
              document={documents.find((d) => d.type === 'license_front')!}
              onRemove={(id) => removeDocument(id, 'license_front')}
              onPreview={setPreviewDocument}
            />
          )}
        </div>

        {/* License Back */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Driver's License (Back) <span className="text-red-500">*</span>
          </label>

          {!hasLicenseBack ? (
            <UploadArea
              type="license_back"
              label="Back of License"
              isDragging={isDragging && uploadType === 'license_back'}
              isUploading={documents.some(d => d.type === 'license_back' && d.status === 'uploading')}
              error={documents.find(d => d.type === 'license_back' && d.status === 'error')?.errorMessage}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                setUploadType('license_back');
                handleDrop(e);
              }}
              onClick={() => triggerFileInput('license_back')}
            />
          ) : (
            <DocumentCard
              document={documents.find((d) => d.type === 'license_back')!}
              onRemove={(id) => removeDocument(id, 'license_back')}
              onPreview={setPreviewDocument}
            />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Status */}
      {documents.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Upload Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasLicenseFront ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={cn(
                  'text-sm',
                  hasLicenseFront ? 'text-gray-900' : 'text-gray-500'
                )}>
                  License Front
                </span>
              </div>
              {hasLicenseFront ? (
                <span className="text-xs text-green-600 font-medium">Uploaded</span>
              ) : (
                <span className="text-xs text-gray-400">Required</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasLicenseBack ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={cn(
                  'text-sm',
                  hasLicenseBack ? 'text-gray-900' : 'text-gray-500'
                )}>
                  License Back
                </span>
              </div>
              {hasLicenseBack ? (
                <span className="text-xs text-green-600 font-medium">Uploaded</span>
              ) : (
                <span className="text-xs text-gray-400">Required</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Notice */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Document Verification</h4>
            <p className="mt-1 text-sm text-gray-500">
              Your documents will be reviewed within 24 hours. You'll receive an email confirmation once verified.
              Make sure the information on your license matches the details you provided.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPreviewDocument(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">{previewDocument.name}</h3>
              <button
                onClick={() => setPreviewDocument(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewDocument.preview}
                alt={previewDocument.name}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Upload Area Component
interface UploadAreaProps {
  type: 'license_front' | 'license_back';
  label: string;
  isDragging: boolean;
  isUploading: boolean;
  error?: string;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

function UploadArea({ label, isDragging, isUploading, error, onDragOver, onDragLeave, onDrop, onClick }: UploadAreaProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : error
          ? 'border-red-300 bg-red-50'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
      )}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Uploading...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">{label}</p>
          <p className="text-sm text-gray-500 mb-3">
            Drag and drop or click to upload
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Select File
          </button>
        </>
      )}
    </div>
  );
}

// Document Card Component
interface DocumentCardProps {
  document: UploadedDocument;
  onRemove: (id: string) => void;
  onPreview: (doc: UploadedDocument) => void;
}

function DocumentCard({ document, onRemove, onPreview }: DocumentCardProps) {
  return (
    <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Preview Image */}
      <div className="aspect-[4/3] bg-gray-100 relative">
        {document.preview.startsWith('data:image') || document.preview.startsWith('http') ? (
          <img
            src={document.preview}
            alt={document.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Status Overlay */}
        {document.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Success Badge */}
        {document.status === 'success' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}

        {/* Error Badge */}
        {document.status === 'error' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
          <button
            onClick={() => onPreview(document)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => onRemove(document.id)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      {/* File Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{document.name}</p>
        <p className="text-xs text-gray-500 capitalize">
          {document.type.replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}
