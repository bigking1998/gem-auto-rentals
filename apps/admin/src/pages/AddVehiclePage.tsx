import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleForm, VehicleFormData } from '@/components/vehicles/VehicleForm';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AddVehiclePage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: VehicleFormData & { images: string[]; pendingFiles?: File[] }) => {
        setIsLoading(true);
        try {
            const { pendingFiles, ...vehicleData } = data;
            const { images: _images, ...createData } = vehicleData;

            const newVehicle = await api.vehicles.create(createData);

            if (pendingFiles && pendingFiles.length > 0) {
                toast.info(`Uploading ${pendingFiles.length} image(s)...`);
                const uploadedImages: string[] = [];
                for (const file of pendingFiles) {
                    try {
                        const result = await api.vehicles.uploadImage(newVehicle.id, file);
                        uploadedImages.push(result.imageUrl);
                    } catch (uploadError) {
                        console.error('Error uploading image:', uploadError);
                    }
                }
            }

            toast.success('Vehicle added successfully');
            navigate('/fleet');
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            toast.error(error.message || 'Failed to save vehicle');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Add Vehicle</h1>
                <p className="text-gray-500">Add a new vehicle to your fleet</p>
            </div>

            <VehicleForm
                onSubmit={handleSubmit}
                onCancel={() => navigate('/fleet')}
                isLoading={isLoading}
            />
        </div>
    );
}
