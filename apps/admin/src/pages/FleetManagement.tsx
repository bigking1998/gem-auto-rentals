import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Car,
  Fuel,
  Users,
  Settings2,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  Wrench,
  Calendar,
  X,
  AlertTriangle,
  Loader2,
  CalendarCheck,
  CalendarX,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api, type Vehicle as ApiVehicle, type Booking } from '@/lib/api';
import { toast } from 'sonner';

// Vehicle type for the fleet
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
  dailyRate: number;
  licensePlate: string;
  mileage: number;
  seats: number;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  vin?: string;
  features: string[];
  images: string[];
  maintenanceSchedule?: MaintenanceSchedule;
  bookingCount?: number;
}

interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  type: 'OIL_CHANGE' | 'TIRE_ROTATION' | 'BRAKE_SERVICE' | 'GENERAL_INSPECTION' | 'FULL_SERVICE';
  scheduledDate: string;
  notes?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RENTED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  RETIRED: 'bg-gray-100 text-gray-800',
};

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-green-100 text-green-800',
  STANDARD: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-rose-100 text-rose-800',
  LUXURY: 'bg-amber-100 text-amber-800',
  SUV: 'bg-orange-100 text-orange-800',
  VAN: 'bg-teal-100 text-teal-800',
};

const maintenanceTypes = [
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'TIRE_ROTATION', label: 'Tire Rotation' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'GENERAL_INSPECTION', label: 'General Inspection' },
  { value: 'FULL_SERVICE', label: 'Full Service' },
];

// Helper function to convert API vehicle to local Vehicle type
const apiToVehicle = (v: ApiVehicle & { bookingCount?: number }): Vehicle => ({
  id: v.id,
  make: v.make,
  model: v.model,
  year: v.year,
  category: v.category,
  status: v.status,
  dailyRate: Number(v.dailyRate),
  licensePlate: v.licensePlate,
  mileage: v.mileage,
  seats: v.seats,
  transmission: v.transmission,
  fuelType: v.fuelType,
  vin: v.vin,
  features: v.features || [],
  images: v.images || [],
  bookingCount: v.bookingCount || 0,
});

export default function FleetManagement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Bulk selection state
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Maintenance modal state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'OIL_CHANGE' as MaintenanceSchedule['type'],
    scheduledDate: '',
    notes: '',
  });

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Bookings modal state
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [bookingsVehicle, setBookingsVehicle] = useState<Vehicle | null>(null);
  const [vehicleBookings, setVehicleBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  // Cancel booking confirmation modal state
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [cancelBookingConfirmText, setCancelBookingConfirmText] = useState('');

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await api.vehicles.list({ limit: 100 });
      const convertedVehicles = response.items.map(apiToVehicle);
      setVehicles(convertedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddVehicle = () => {
    navigate('/fleet/new');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    navigate(`/fleet/${vehicle.id}`);
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredVehicles.map((v) => v.id)));
    }
  };

  const handleSelectVehicle = (vehicleId: string) => {
    const newSelected = new Set(selectedVehicles);
    if (newSelected.has(vehicleId)) {
      newSelected.delete(vehicleId);
    } else {
      newSelected.add(vehicleId);
    }
    setSelectedVehicles(newSelected);
  };

  const handleBulkStatusChange = async (newStatus: Vehicle['status']) => {
    try {
      const ids = Array.from(selectedVehicles);
      // Update each vehicle's status via API
      await Promise.all(ids.map((id) => api.vehicles.updateStatus(id, newStatus)));

      setVehicles((prev) =>
        prev.map((v) => (selectedVehicles.has(v.id) ? { ...v, status: newStatus } : v))
      );
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
      toast.success(`Updated ${ids.length} vehicles to ${newStatus}`);
    } catch (error) {
      console.error('Error updating vehicles:', error);
      toast.error('Failed to update vehicles');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedVehicles.size} vehicles?`)) {
      return;
    }

    try {
      const ids = Array.from(selectedVehicles);
      // Delete each vehicle via API, track failures
      const results = await Promise.allSettled(ids.map((id) => api.vehicles.delete(id)));

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (succeeded > 0) {
        // Remove successfully deleted vehicles from state
        const successfulIds = ids.filter((_, i) => results[i].status === 'fulfilled');
        setVehicles((prev) => prev.filter((v) => !successfulIds.includes(v.id)));
        setSelectedVehicles(new Set());
      }

      setShowBulkActions(false);

      if (failed > 0 && succeeded > 0) {
        toast.warning(
          `Deleted ${succeeded} vehicles. ${failed} could not be deleted (may have active bookings).`,
          { duration: 6000 }
        );
      } else if (failed > 0 && succeeded === 0) {
        toast.error(
          'Could not delete vehicles. They may have active bookings. Try changing status to "Retired" instead.',
          { duration: 6000 }
        );
      } else {
        toast.success(`Deleted ${succeeded} vehicles`);
      }
    } catch (error) {
      console.error('Error deleting vehicles:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete vehicles');
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setDeleteVehicle(vehicle);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!deleteVehicle || deleteConfirmText.toLowerCase() !== 'confirm') return;

    setIsDeleting(true);
    try {
      await api.vehicles.delete(deleteVehicle.id);
      setVehicles((prev) => prev.filter((v) => v.id !== deleteVehicle.id));
      toast.success('Vehicle deleted successfully');
      setShowDeleteModal(false);
      setDeleteVehicle(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle';
      if (errorMessage.includes('active bookings') || errorMessage.includes('bookings')) {
        toast.error(
          'Cannot delete vehicle with bookings. Try changing status to "Retired" instead, or use Recycle Bin for soft delete.',
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (vehicleId: string, newStatus: Vehicle['status']) => {
    try {
      await api.vehicles.updateStatus(vehicleId, newStatus);

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v))
      );
      toast.success(`Vehicle status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update vehicle status');
    }
  };

  // Maintenance handlers
  const handleOpenMaintenance = (vehicle: Vehicle) => {
    setMaintenanceVehicle(vehicle);
    setMaintenanceForm({
      type: 'OIL_CHANGE',
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowMaintenanceModal(true);
  };

  const handleScheduleMaintenance = async () => {
    if (!maintenanceVehicle || !maintenanceForm.scheduledDate) return;

    try {
      // Update vehicle status to MAINTENANCE
      await api.vehicles.updateStatus(maintenanceVehicle.id, 'MAINTENANCE');

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === maintenanceVehicle.id ? { ...v, status: 'MAINTENANCE' as const } : v
        )
      );

      setShowMaintenanceModal(false);
      setMaintenanceVehicle(null);
      toast.success('Maintenance scheduled successfully');
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error('Failed to schedule maintenance');
    }
  };

  const handleCompleteMaintenance = async (vehicleId: string) => {
    try {
      await api.vehicles.updateStatus(vehicleId, 'AVAILABLE');

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: 'AVAILABLE' as const } : v))
      );
      toast.success('Maintenance completed');
    } catch (error) {
      console.error('Error completing maintenance:', error);
      toast.error('Failed to complete maintenance');
    }
  };

  // Booking handlers
  const handleOpenBookings = async (vehicle: Vehicle) => {
    setBookingsVehicle(vehicle);
    setShowBookingsModal(true);

    setIsLoadingBookings(true);

    try {
      const response = await api.bookings.list({ vehicleId: vehicle.id, limit: 50 });
      setVehicleBookings(response.items);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setVehicleBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setCancelBookingTarget(booking);
    setCancelBookingConfirmText('');
    setShowCancelBookingModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!cancelBookingTarget || cancelBookingConfirmText.toLowerCase() !== 'confirm') return;

    setCancellingBookingId(cancelBookingTarget.id);
    setShowCancelBookingModal(false);
    try {
      await api.bookings.cancel(cancelBookingTarget.id);
      setVehicleBookings((prev) => prev.filter((b) => b.id !== cancelBookingTarget.id));

      // Update the vehicle's booking count
      if (bookingsVehicle) {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === bookingsVehicle.id
              ? { ...v, bookingCount: Math.max(0, (v.bookingCount || 1) - 1) }
              : v
          )
        );
      }

      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    } finally {
      setCancellingBookingId(null);
      setCancelBookingTarget(null);
      setCancelBookingConfirmText('');
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isAllSelected =
    filteredVehicles.length > 0 && selectedVehicles.size === filteredVehicles.length;
  const hasSelection = selectedVehicles.size > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-orange-500" />
          <p className="text-gray-500">Loading fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Manage your vehicle inventory</p>
        </div>
        <button
          onClick={handleAddVehicle}
          className="bg-primary inline-flex items-center justify-center rounded-xl px-4 py-2 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 hover:shadow-orange-300"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Car className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              <p className="text-sm text-gray-500">Total Vehicles</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Car className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter((v) => v.status === 'AVAILABLE').length}
              </p>
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter((v) => v.bookingCount && v.bookingCount > 0).length}
              </p>
              <p className="text-sm text-gray-500">Booked</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter((v) => v.status === 'RENTED').length}
              </p>
              <p className="text-sm text-gray-500">Rented</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {vehicles.filter((v) => v.status === 'MAINTENANCE').length}
              </p>
              <p className="text-sm text-gray-500">Maintenance</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-primary h-5 w-5" />
            <span className="font-medium text-orange-900">
              {selectedVehicles.size} vehicle{selectedVehicles.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="bg-primary rounded-lg px-4 py-2 text-white transition-colors hover:bg-orange-600"
              >
                Bulk Actions
              </button>
              {showBulkActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBulkActions(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                    <p className="px-4 py-1 text-xs uppercase text-gray-400">Change Status</p>
                    {['AVAILABLE', 'MAINTENANCE', 'RETIRED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleBulkStatusChange(status as Vehicle['status'])}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            status === 'AVAILABLE' && 'bg-green-500',
                            status === 'MAINTENANCE' && 'bg-orange-500',
                            status === 'RETIRED' && 'bg-gray-500'
                          )}
                        />
                        Set as {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleBulkDelete}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSelectedVehicles(new Set())}
              className="rounded-lg border border-orange-300 px-4 py-2 text-orange-700 transition-colors hover:bg-orange-100"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-primary w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="focus:ring-primary rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2"
            >
              <option value="all">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="rounded p-1 transition-colors hover:bg-gray-200"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="text-primary h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Daily Rate
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Specs</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  License Plate
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Car className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium">No vehicles found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className={cn(
                      'transition-colors hover:bg-gray-50',
                      selectedVehicles.has(vehicle.id) && 'bg-orange-50'
                    )}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectVehicle(vehicle.id)}
                        className="rounded p-1 transition-colors hover:bg-gray-200"
                      >
                        {selectedVehicles.has(vehicle.id) ? (
                          <CheckSquare className="text-primary h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="group flex cursor-pointer items-center gap-3"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <div className="group-hover:ring-primary flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100 transition-all group-hover:ring-2 group-hover:ring-offset-2">
                          {vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0]}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="group-hover:text-primary font-medium text-gray-900 transition-colors">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle.mileage.toLocaleString()} miles
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          categoryColors[vehicle.category]
                        )}
                      >
                        {vehicle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.bookingCount && vehicle.bookingCount > 0 ? (
                        <span
                          className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                          title={`This vehicle has ${vehicle.bookingCount} booking${vehicle.bookingCount > 1 ? 's' : ''} and cannot be deleted`}
                        >
                          {vehicle.bookingCount} booking{vehicle.bookingCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex cursor-pointer items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80',
                            statusColors[vehicle.status]
                          )}
                          title="Click to toggle status (Available/Retired)"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Simple toggle for quick status change
                            if (vehicle.status === 'AVAILABLE')
                              handleStatusChange(vehicle.id, 'RETIRED');
                            else if (vehicle.status === 'RETIRED')
                              handleStatusChange(vehicle.id, 'AVAILABLE');
                          }}
                        >
                          {vehicle.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(vehicle.dailyRate)}
                      </span>
                      <span className="text-gray-500">/day</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1" title={`${vehicle.seats} Seats`}>
                          <Users className="h-4 w-4" />
                          <span>{vehicle.seats}</span>
                        </div>
                        <div
                          className="flex items-center gap-1"
                          title={vehicle.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}
                        >
                          <Settings2 className="h-4 w-4" />
                          <span>{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Man'}</span>
                        </div>
                        <div className="flex items-center gap-1" title={vehicle.fuelType}>
                          <Fuel className="h-4 w-4" />
                          <span>{vehicle.fuelType.charAt(0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">
                        {vehicle.licensePlate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="hover:text-primary rounded-lg p-2 text-gray-400 transition-colors hover:bg-orange-50"
                          title="Edit Vehicle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenMaintenance(vehicle)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-600"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenBookings(vehicle)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="View Bookings"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        {vehicle.status === 'MAINTENANCE' && (
                          <button
                            onClick={() => handleCompleteMaintenance(vehicle.id)}
                            className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                            title="Complete Maintenance"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && maintenanceVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMaintenanceModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-xl font-bold text-gray-900">Schedule Maintenance</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Maintenance Type
                </label>
                <select
                  value={maintenanceForm.type}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      type: e.target.value as MaintenanceSchedule['type'],
                    })
                  }
                  className="focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
                >
                  {maintenanceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={maintenanceForm.scheduledDate}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })
                  }
                  className="focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={maintenanceForm.notes}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })
                  }
                  className="focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMaintenance}
                  className="bg-primary rounded-lg px-4 py-2 text-white hover:bg-orange-600"
                >
                  Schedule
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-8 w-8" />
              <h2 className="text-xl font-bold">Delete Vehicle?</h2>
            </div>

            <p className="mb-4 text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deleteVehicle.year} {deleteVehicle.make} {deleteVehicle.model}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Type <span className="font-mono font-bold">confirm</span> to proceed
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="confirm"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVehicle}
                disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'confirm'}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Vehicle
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && bookingsVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBookingsModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vehicle Bookings</h2>
                <p className="text-sm text-gray-500">
                  {bookingsVehicle.year} {bookingsVehicle.make} {bookingsVehicle.model}
                </p>
              </div>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingBookings ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-orange-500" />
                  <p className="text-gray-500">Loading bookings...</p>
                </div>
              ) : vehicleBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarX className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">No bookings found for this vehicle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-white">
                          <Calendar className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                getBookingStatusColor(booking.status)
                              )}
                            >
                              {booking.status}
                            </span>
                            <span>• {formatCurrency(booking.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                      {['PENDING', 'CONFIRMED', 'ACTIVE'].includes(booking.status) && (
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {showCancelBookingModal && cancelBookingTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !cancellingBookingId && setShowCancelBookingModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-2 text-lg font-bold text-gray-900">Cancel Booking?</h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Type <span className="font-mono font-bold">confirm</span> to proceed
              </label>
              <input
                type="text"
                value={cancelBookingConfirmText}
                onChange={(e) => setCancelBookingConfirmText(e.target.value)}
                placeholder="confirm"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelBookingModal(false)}
                disabled={!!cancellingBookingId}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={
                  !!cancellingBookingId || cancelBookingConfirmText.toLowerCase() !== 'confirm'
                }
                className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingBookingId && <Loader2 className="h-3 w-3 animate-spin" />}
                Cancel Booking
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
