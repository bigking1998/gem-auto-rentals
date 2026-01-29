import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Upload,
    Trash2,
    Car,
    Plus,
    Loader2,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Vehicle form validation schema
const vehicleSchema = z.object({
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().min(1990, 'Year must be 1990 or later').max(new Date().getFullYear() + 1, 'Invalid year'),
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
    subtitle
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
            } catch (error: any) {
                console.error('Error uploading image:', error);
                toast.error(error.message || 'Failed to upload image');
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
            } catch (error: any) {
                console.error('Error deleting image:', error);
                toast.error(error.message || 'Failed to delete image');
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
            setValue('features', current.filter((f) => f !== feature), {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true
            });
        } else {
            setValue('features', [...current, feature], {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true
            });
        }
    };

    const addCustomFeature = () => {
        if (customFeature.trim() && !selectedFeatures.includes(customFeature.trim())) {
            setValue('features', [...selectedFeatures, customFeature.trim()], {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true
            });
            setCustomFeature('');
        }
    };

    const onFormSubmit = (data: VehicleFormData) => {
        // Explicitly include features from watch (ensures they're always included)
        // Pass both existing images and pending files for new vehicles
        console.log('Form submit - features:', selectedFeatures);
        console.log('Form submit - data:', data);
        onSubmit({ ...data, features: selectedFeatures, images, pendingFiles });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {title || (isEditing ? 'Edit Vehicle' : 'Add New Vehicle')}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {subtitle || (isEditing ? 'Update vehicle information' : 'Add a new vehicle to your fleet')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)}>
                <div className="p-6 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vehicle Images
                            {isUploading && (
                                <span className="ml-2 text-orange-500 text-xs">
                                    <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                                    Uploading...
                                </span>
                            )}
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {/* Uploaded Images (from server) */}
                            {images.map((image, index) => (
                                <div
                                    key={`uploaded-${index}`}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                                >
                                    <img
                                        src={image}
                                        alt={`Vehicle ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {isDeletingImage === image ? (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index, image)}
                                            disabled={isUploading || isDeletingImage !== null}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-5 h-5 text-white" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Pending Images (local previews for new vehicles) */}
                            {pendingPreviews.map((preview, index) => (
                                <div
                                    key={`pending-${index}`}
                                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-orange-300 group"
                                >
                                    <img
                                        src={preview}
                                        alt={`Pending ${index + 1}`}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                        Pending
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePendingImage(index)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}

                            {/* Upload Button */}
                            {images.length + pendingPreviews.length < 8 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Upload className="w-6 h-6" />
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
                        <p className="text-xs text-gray-500 mt-2">
                            Upload up to 8 images (JPEG, PNG, WebP). Max 5MB each.
                            {!isEditing && pendingPreviews.length > 0 && (
                                <span className="text-orange-500 ml-1">
                                    Pending images will be uploaded when the vehicle is saved.
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Make *
                            </label>
                            <input
                                {...register('make')}
                                placeholder="e.g. Toyota"
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                                    errors.make ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.make && (
                                <p className="text-xs text-red-500 mt-1">{errors.make.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model *
                            </label>
                            <input
                                {...register('model')}
                                placeholder="e.g. Camry"
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                                    errors.model ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.model && (
                                <p className="text-xs text-red-500 mt-1">{errors.model.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year *
                            </label>
                            <input
                                type="number"
                                {...register('year', { valueAsNumber: true })}
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                                    errors.year ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.year && (
                                <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                {...register('category')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status *
                            </label>
                            <select
                                {...register('status')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Daily Rate ($) *
                            </label>
                            <input
                                type="number"
                                {...register('dailyRate', { valueAsNumber: true })}
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                                    errors.dailyRate ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.dailyRate && (
                                <p className="text-xs text-red-500 mt-1">{errors.dailyRate.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Seats *
                            </label>
                            <input
                                type="number"
                                {...register('seats', { valueAsNumber: true })}
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                                    errors.seats ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.seats && (
                                <p className="text-xs text-red-500 mt-1">{errors.seats.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Transmission *
                            </label>
                            <select
                                {...register('transmission')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {transmissions.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fuel Type *
                            </label>
                            <select
                                {...register('fuelType')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mileage *
                            </label>
                            <input
                                type="number"
                                {...register('mileage', { valueAsNumber: true })}
                                placeholder="e.g. 15000"
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                                    errors.mileage ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.mileage && (
                                <p className="text-xs text-red-500 mt-1">{errors.mileage.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                License Plate *
                            </label>
                            <input
                                {...register('licensePlate')}
                                placeholder="e.g. ABC-1234"
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase',
                                    errors.licensePlate ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.licensePlate && (
                                <p className="text-xs text-red-500 mt-1">{errors.licensePlate.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                VIN
                            </label>
                            <input
                                {...register('vin')}
                                placeholder="17-character VIN"
                                maxLength={17}
                                className={cn(
                                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase',
                                    errors.vin ? 'border-red-500' : 'border-gray-200'
                                )}
                            />
                            {errors.vin && (
                                <p className="text-xs text-red-500 mt-1">{errors.vin.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Features
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {commonFeatures.map((feature) => (
                                <button
                                    key={feature}
                                    type="button"
                                    onClick={() => toggleFeature(feature)}
                                    className={cn(
                                        'px-3 py-1.5 text-sm rounded-full border transition-colors',
                                        selectedFeatures.includes(feature)
                                            ? 'bg-primary text-white border-primary'
                                            : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                                    )}
                                >
                                    {feature}
                                </button>
                            ))}
                        </div>

                        {/* Custom Features */}
                        {selectedFeatures.filter((f) => !commonFeatures.includes(f)).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedFeatures
                                    .filter((f) => !commonFeatures.includes(f))
                                    .map((feature) => (
                                        <span
                                            key={feature}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-full"
                                        >
                                            {feature}
                                            <button
                                                type="button"
                                                onClick={() => toggleFeature(feature)}
                                                className="hover:text-green-600"
                                            >
                                                <X className="w-3 h-3" />
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
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Add Vehicle'}
                    </button>
                </div>
            </form>
        </div>
    );
}
