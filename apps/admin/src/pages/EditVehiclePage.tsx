import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VehicleForm, VehicleFormData } from '@/components/vehicles/VehicleForm';
import { api, Vehicle } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditVehiclePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);

    useEffect(() => {
        if (id) {
            fetchVehicle(id);
        }
    }, [id]);

    const fetchVehicle = async (vehicleId: string) => {
        setIsFetching(true);
        try {
            const data = await api.vehicles.get(vehicleId);
            setVehicle(data);
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            toast.error('Failed to load vehicle details');
            navigate('/fleet');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (data: VehicleFormData & { images: string[]; pendingFiles?: File[] }) => {
        if (!id) return;
        setIsLoading(true);
        try {
            const { pendingFiles, ...vehicleData } = data;

            // Sanitize data: allow empty VIN by converting to undefined so partial update ignores it
            const sanitizedData = {
                ...vehicleData,
                vin: vehicleData.vin === '' ? undefined : vehicleData.vin,
            };

            await api.vehicles.update(id, sanitizedData);
            toast.success('Vehicle updated successfully');
            navigate('/fleet');
        } catch (error: any) {
            console.error('Error updating vehicle:', error);
            toast.error(error.message || 'Failed to update vehicle');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading vehicle details...</p>
                </div>
            </div>
        );
    }

    if (!vehicle) return null;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
                <p className="text-gray-500">Update vehicle information</p>
            </div>

            <VehicleForm
                initialData={vehicle}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/fleet')}
                isLoading={isLoading}
            />
        </div>
    );
}
