import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Trash2, Car, Plus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Vehicle form validation schema
const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  category: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN']),
  dailyRate: z.number().min(1, 'Daily rate must be at least $1'),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED']),
  seats: z.number().min(1, 'Must have at least 1 seat').max(15, 'Maximum 15 seats'),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  mileage: z.number().min(0, 'Mileage cannot be negative'),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().length(17, 'VIN must be exactly 17 characters').optional().or(z.literal('')),
  features: z.array(z.string()).default([]),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData & { images: string[]; pendingFiles?: File[] }) => void;
  initialData?: Partial<VehicleFormData & { id: string; images: string[] }>;
  isLoading?: boolean;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

const categories = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
];

const statuses = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

const transmissions = [
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
];

const fuelTypes = [
  { value: 'GASOLINE', label: 'Gasoline' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const commonFeatures = [
  'Air Conditioning',
  'Bluetooth',
  'Backup Camera',
  'Navigation',
  'Cruise Control',
  'Leather Seats',
  'Sunroof',
  'Apple CarPlay',
  'Android Auto',
  'Heated Seats',
  'Keyless Entry',
  'USB Ports',
];

export function VehicleForm({
  onSubmit,
  initialData,
  isLoading = false,
  onCancel,
  title,
  subtitle,
}: VehicleFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // Files waiting to upload (for new vehicles)
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]); // Preview URLs for pending files
  const [customFeature, setCustomFeature] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialData?.id;
  const vehicleId = initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: initialData?.make || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      category: initialData?.category || 'STANDARD',
      dailyRate: initialData?.dailyRate || 50,
      status: initialData?.status || 'AVAILABLE',
      seats: initialData?.seats || 5,
      transmission: initialData?.transmission || 'AUTOMATIC',
      fuelType: initialData?.fuelType || 'GASOLINE',
      mileage: initialData?.mileage || 0,
      licensePlate: initialData?.licensePlate || '',
      vin: initialData?.vin || '',
      features: initialData?.features || [],
    },
  });

  const selectedFeatures = watch('features') || [];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    if (isEditing && vehicleId) {
      // For existing vehicles, upload immediately to the API
      setIsUploading(true);
      try {
        for (const file of fileArray) {
          const result = await api.vehicles.uploadImage(vehicleId, file);
          setImages((prev) => [...prev, result.imageUrl]);
          toast.success('Image uploaded successfully');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    } else {
      // For new vehicles, store files and create previews (will upload after vehicle creation)
      fileArray.forEach((file) => {
        setPendingFiles((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPendingPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index: number, imageUrl: string) => {
    if (isEditing && vehicleId && !imageUrl.startsWith('data:')) {
      // For existing images on the server, delete via API
      setIsDeletingImage(imageUrl);
      try {
        await api.vehicles.deleteImage(vehicleId, imageUrl);
        setImages((prev) => prev.filter((_, i) => i !== index));
        toast.success('Image deleted successfully');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete image');
      } finally {
        setIsDeletingImage(null);
      }
    } else {
      // For pending local images, just remove from state
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const removePendingImage = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature: string) => {
    const current = selectedFeatures;
    if (current.includes(feature)) {
      setValue(
        'features',
        current.filter((f) => f !== feature),
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
    } else {
      setValue('features', [...current, feature], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const addCustomFeature = () => {
    if (customFeature.trim() && !selectedFeatures.includes(customFeature.trim())) {
      setValue('features', [...selectedFeatures, customFeature.trim()], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setCustomFeature('');
    }
  };

  const onFormSubmit = (data: VehicleFormData) => {
    // Explicitly include features from watch (ensures they're always included)
    // Pass both existing images and pending files for new vehicles
    onSubmit({ ...data, features: selectedFeatures, images, pendingFiles });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2">
            <Car className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {title || (isEditing ? 'Edit Vehicle' : 'Add New Vehicle')}
            </h2>
            <p className="text-sm text-gray-500">
              {subtitle ||
                (isEditing ? 'Update vehicle information' : 'Add a new vehicle to your fleet')}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="space-y-6 p-6">
          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Vehicle Images
              {isUploading && (
                <span className="ml-2 text-xs text-orange-500">
                  <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                  Uploading...
                </span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-3">
              {/* Uploaded Images (from server) */}
              {images.map((image, index) => (
                <div
                  key={`uploaded-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={image}
                    alt={`Vehicle ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {isDeletingImage === image ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeImage(index, image)}
                      disabled={isUploading || isDeletingImage !== null}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity disabled:cursor-not-allowed group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
              ))}

              {/* Pending Images (local previews for new vehicles) */}
              {pendingPreviews.map((preview, index) => (
                <div
                  key={`pending-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-orange-300"
                >
                  <img
                    src={preview}
                    alt={`Pending ${index + 1}`}
                    className="h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute left-1 top-1 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] text-white">
                    Pending
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingImage(index)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {images.length + pendingPreviews.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="hover:border-primary hover:text-primary flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                  <span className="text-xs">{isUploading ? 'Uploading...' : 'Upload'}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload up to 8 images (JPEG, PNG, WebP). Max 5MB each.
              {!isEditing && pendingPreviews.length > 0 && (
                <span className="ml-1 text-orange-500">
                  Pending images will be uploaded when the vehicle is saved.
                </span>
              )}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Make *</label>
              <input
                {...register('make')}
                placeholder="e.g. Toyota"
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2',
                  errors.make ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.make && <p className="mt-1 text-xs text-red-500">{errors.make.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Model *</label>
              <input
                {...register('model')}
                placeholder="e.g. Camry"
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2',
                  errors.model ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Year *</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2',
                  errors.year ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year.message}</p>}
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
              <select
                {...register('category')}
                className="focus:ring-primary w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status *</label>
              <select
                {...register('status')}
                className="focus:ring-primary w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Specs */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Daily Rate ($) *
              </label>
              <input
                type="number"
                {...register('dailyRate', { valueAsNumber: true })}
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2',
                  errors.dailyRate ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.dailyRate && (
                <p className="mt-1 text-xs text-red-500">{errors.dailyRate.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Seats *</label>
              <input
                type="number"
                {...register('seats', { valueAsNumber: true })}
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2',
                  errors.seats ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.seats && <p className="mt-1 text-xs text-red-500">{errors.seats.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Transmission *</label>
              <select
                {...register('transmission')}
                className="focus:ring-primary w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2"
              >
                {transmissions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fuel Type *</label>
              <select
                {...register('fuelType')}
                className="focus:ring-primary w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2"
              >
                {fuelTypes.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mileage & License */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mileage *</label>
              <input
                type="number"
                {...register('mileage', { valueAsNumber: true })}
                placeholder="e.g. 15000"
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2',
                  errors.mileage ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.mileage && (
                <p className="mt-1 text-xs text-red-500">{errors.mileage.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                License Plate *
              </label>
              <input
                {...register('licensePlate')}
                placeholder="e.g. ABC-1234"
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2',
                  errors.licensePlate ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.licensePlate && (
                <p className="mt-1 text-xs text-red-500">{errors.licensePlate.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">VIN</label>
              <input
                {...register('vin')}
                placeholder="17-character VIN"
                maxLength={17}
                className={cn(
                  'focus:ring-primary w-full rounded-lg border px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2',
                  errors.vin ? 'border-red-500' : 'border-gray-200'
                )}
              />
              {errors.vin && <p className="mt-1 text-xs text-red-500">{errors.vin.message}</p>}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Features</label>
            <div className="mb-3 flex flex-wrap gap-2">
              {commonFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    selectedFeatures.includes(feature)
                      ? 'bg-primary border-primary text-white'
                      : 'hover:border-primary hover:text-primary border-gray-200 text-gray-600'
                  )}
                >
                  {feature}
                </button>
              ))}
            </div>

            {/* Custom Features */}
            {selectedFeatures.filter((f) => !commonFeatures.includes(f)).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFeatures
                  .filter((f) => !commonFeatures.includes(f))
                  .map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-sm text-green-800"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className="hover:text-green-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Add Custom Feature */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                placeholder="Add custom feature..."
                className="focus:ring-primary flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomFeature}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
