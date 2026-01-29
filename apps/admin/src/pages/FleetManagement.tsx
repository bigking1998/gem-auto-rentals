import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Car, Fuel, Users, Settings2, Pencil, Trash2, CheckSquare, Square, Wrench, Calendar, X, AlertTriangle, Loader2, CalendarCheck, CalendarX } from 'lucide-react';
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
      await Promise.all(ids.map(id => api.vehicles.updateStatus(id, newStatus)));

      setVehicles((prev) =>
        prev.map((v) =>
          selectedVehicles.has(v.id) ? { ...v, status: newStatus } : v
        )
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
      const results = await Promise.allSettled(ids.map(id => api.vehicles.delete(id)));

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (succeeded > 0) {
        // Remove successfully deleted vehicles from state
        const successfulIds = ids.filter((_, i) => results[i].status === 'fulfilled');
        setVehicles((prev) => prev.filter((v) => !successfulIds.includes(v.id)));
        setSelectedVehicles(new Set());
      }

      setShowBulkActions(false);

      if (failed > 0 && succeeded > 0) {
        toast.warning(`Deleted ${succeeded} vehicles. ${failed} could not be deleted (may have active bookings).`, { duration: 6000 });
      } else if (failed > 0 && succeeded === 0) {
        toast.error('Could not delete vehicles. They may have active bookings. Try changing status to "Retired" instead.', { duration: 6000 });
      } else {
        toast.success(`Deleted ${succeeded} vehicles`);
      }
    } catch (error: any) {
      console.error('Error deleting vehicles:', error);
      toast.error(error?.message || 'Failed to delete vehicles');
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
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      const errorMessage = error?.message || 'Failed to delete vehicle';
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
        prev.map((v) =>
          v.id === vehicleId ? { ...v, status: newStatus } : v
        )
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
          v.id === maintenanceVehicle.id
            ? { ...v, status: 'MAINTENANCE' as const }
            : v
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
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status: 'AVAILABLE' as const }
            : v
        )
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
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error?.message || 'Failed to cancel booking');
    } finally {
      setCancellingBookingId(null);
      setCancelBookingTarget(null);
      setCancelBookingConfirmText('');
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isAllSelected = filteredVehicles.length > 0 && selectedVehicles.size === filteredVehicles.length;
  const hasSelection = selectedVehicles.size > 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Manage your vehicle inventory</p>
        </div>
        <button
          onClick={handleAddVehicle}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-gray-600" />
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
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-green-600" />
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
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
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
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
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
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-600" />
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
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-medium text-orange-900">
              {selectedVehicles.size} vehicle{selectedVehicles.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Bulk Actions
              </button>
              {showBulkActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBulkActions(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2">
                    <p className="px-4 py-1 text-xs text-gray-400 uppercase">Change Status</p>
                    {['AVAILABLE', 'MAINTENANCE', 'RETIRED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleBulkStatusChange(status as Vehicle['status'])}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            status === 'AVAILABLE' && 'bg-green-500',
                            status === 'MAINTENANCE' && 'bg-orange-500',
                            status === 'RETIRED' && 'bg-gray-500'
                          )}
                        />
                        Set as {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleBulkDelete}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSelectedVehicles(new Set())}
              className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
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
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-4">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Vehicle</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Daily Rate</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Specs</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">License Plate</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No vehicles found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      selectedVehicles.has(vehicle.id) && 'bg-orange-50'
                    )}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectVehicle(vehicle.id)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {selectedVehicles.has(vehicle.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2 transition-all">
                          {vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0]}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-gray-500">{vehicle.mileage.toLocaleString()} miles</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          categoryColors[vehicle.category]
                        )}
                      >
                        {vehicle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.bookingCount && vehicle.bookingCount > 0 ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          title={`This vehicle has ${vehicle.bookingCount} booking${vehicle.bookingCount > 1 ? 's' : ''} and cannot be deleted`}
                        >
                          {vehicle.bookingCount} booking{vehicle.bookingCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                            statusColors[vehicle.status]
                          )}
                          title="Click to toggle status (Available/Retired)"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Simple toggle for quick status change
                            if (vehicle.status === 'AVAILABLE') handleStatusChange(vehicle.id, 'RETIRED');
                            else if (vehicle.status === 'RETIRED') handleStatusChange(vehicle.id, 'AVAILABLE');
                          }}
                        >
                          {vehicle.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{formatCurrency(vehicle.dailyRate)}</span>
                      <span className="text-gray-500">/day</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1" title={`${vehicle.seats} Seats`}>
                          <Users className="w-4 h-4" />
                          <span>{vehicle.seats}</span>
                        </div>
                        <div className="flex items-center gap-1" title={vehicle.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual'}>
                          <Settings2 className="w-4 h-4" />
                          <span>{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Man'}</span>
                        </div>
                        <div className="flex items-center gap-1" title={vehicle.fuelType}>
                          <Fuel className="w-4 h-4" />
                          <span>{vehicle.fuelType.charAt(0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 font-mono text-sm">{vehicle.licensePlate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Vehicle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenMaintenance(vehicle)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenBookings(vehicle)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Bookings"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        {vehicle.status === 'MAINTENANCE' && (
                          <button
                            onClick={() => handleCompleteMaintenance(vehicle.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Complete Maintenance"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))

              )}
            </tbody>
          </table>
        </div>
      </motion.div >

      {/* Maintenance Modal */}
      {
        showMaintenanceModal && maintenanceVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMaintenanceModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Maintenance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
                  <select
                    value={maintenanceForm.type}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {maintenanceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={maintenanceForm.scheduledDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={maintenanceForm.notes}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowMaintenanceModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleMaintenance}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && deleteVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => !isDeleting && setShowDeleteModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-xl font-bold">Delete Vehicle?</h2>
              </div>

              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-semibold">{deleteVehicle.year} {deleteVehicle.make} {deleteVehicle.model}</span>?
                This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono font-bold">confirm</span> to proceed
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="confirm"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Vehicle
                </button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Bookings Modal */}
      {
        showBookingsModal && bookingsVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowBookingsModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vehicle Bookings</h2>
                  <p className="text-sm text-gray-500">
                    {bookingsVehicle.year} {bookingsVehicle.make} {bookingsVehicle.model}
                  </p>
                </div>
                <button onClick={() => setShowBookingsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                {isLoadingBookings ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-500">Loading bookings...</p>
                  </div>
                ) : vehicleBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No bookings found for this vehicle</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicleBookings.map((booking) => (
                      <div key={booking.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100">
                            <Calendar className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                getBookingStatusColor(booking.status)
                              )}>
                                {booking.status}
                              </span>
                              <span>• {formatCurrency(booking.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                        {['PENDING', 'CONFIRMED', 'ACTIVE'].includes(booking.status) && (
                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
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
        )
      }

      {/* Cancel Booking Confirmation Modal */}
      {
        showCancelBookingModal && cancelBookingTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => !cancellingBookingId && setShowCancelBookingModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking?</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type <span className="font-mono font-bold">confirm</span> to proceed
                </label>
                <input
                  type="text"
                  value={cancelBookingConfirmText}
                  onChange={(e) => setCancelBookingConfirmText(e.target.value)}
                  placeholder="confirm"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  disabled={!!cancellingBookingId || cancelBookingConfirmText.toLowerCase() !== 'confirm'}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {cancellingBookingId && <Loader2 className="w-3 h-3 animate-spin" />}
                  Cancel Booking
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
    </div >
  );
}
