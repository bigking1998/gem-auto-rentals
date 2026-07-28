import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VehicleForm, VehicleFormData } from '@/components/vehicles/VehicleForm';
import { VehicleBookings } from '@/components/vehicles/VehicleBookings';
import { api, Vehicle } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const fetchVehicle = useCallback(
    async (vehicleId: string) => {
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
    },
    [navigate]
  );

  useEffect(() => {
    if (id) {
      fetchVehicle(id);
    }
  }, [id, fetchVehicle]);

  const handleSubmit = async (
    data: VehicleFormData & { images: string[]; pendingFiles?: File[] }
  ) => {
    if (!id) return;
    setIsLoading(true);
    try {
      // Destructure to omit `pendingFiles` from the update payload (File objects
      // can't be sent as JSON; in edit mode images upload immediately via the form).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pendingFiles, ...vehicleData } = data;

      // Sanitize data: allow empty VIN by converting to undefined so partial update ignores it
      const sanitizedData = {
        ...vehicleData,
        vin: vehicleData.vin === '' ? undefined : vehicleData.vin,
      };

      const updatedVehicle = await api.vehicles.update(id, sanitizedData);

      // Update local state with the updated vehicle data
      setVehicle(updatedVehicle);

      toast.success('Vehicle updated successfully');
      // Stay on the same page - don't navigate away
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
          <p className="text-gray-500">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/fleet')}
          className="mb-2 flex items-center text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Fleet
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
        <p className="text-gray-500">Update vehicle information</p>
      </div>

      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/fleet')}
        isLoading={isLoading}
      />

      <div className="mt-8">
        <VehicleBookings vehicleId={id!} />
      </div>
    </div>
  );
}
