import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleForm, VehicleFormData } from '@/components/vehicles/VehicleForm';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    data: VehicleFormData & { images: string[]; pendingFiles?: File[] }
  ) => {
    setIsLoading(true);
    try {
      const { pendingFiles, ...vehicleData } = data;
      // Destructure to omit `images` from the create payload — images are attached
      // server-side by the upload endpoint after the vehicle is created.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { images: _images, ...createData } = vehicleData;

      // Sanitize data: remove empty VIN
      const sanitizedData = {
        ...createData,
        vin: createData.vin === '' ? undefined : createData.vin,
      };

      const newVehicle = await api.vehicles.create(sanitizedData);

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
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

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
