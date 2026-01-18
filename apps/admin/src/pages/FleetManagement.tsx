import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Car, Fuel, Users, Settings2, Pencil, Trash2, CheckSquare, Square, Wrench, Calendar, X, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { VehicleModal } from '@/components/vehicles/VehicleModal';

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
}

interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  type: 'OIL_CHANGE' | 'TIRE_ROTATION' | 'BRAKE_SERVICE' | 'GENERAL_INSPECTION' | 'FULL_SERVICE';
  scheduledDate: string;
  notes?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// Mock data
const initialVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'STANDARD',
    status: 'AVAILABLE',
    dailyRate: 65,
    licensePlate: 'ABC-1234',
    mileage: 15000,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    vin: '1HGBH41JXMN109186',
    features: ['Air Conditioning', 'Bluetooth', 'Backup Camera', 'Cruise Control'],
    images: [],
  },
  {
    id: '2',
    make: 'BMW',
    model: '5 Series',
    year: 2024,
    category: 'LUXURY',
    status: 'RENTED',
    dailyRate: 150,
    licensePlate: 'XYZ-5678',
    mileage: 8000,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    vin: 'WBAPH5C55BA238456',
    features: ['Leather Seats', 'Navigation', 'Sunroof', 'Heated Seats', 'Apple CarPlay'],
    images: [],
  },
  {
    id: '3',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'PREMIUM',
    status: 'AVAILABLE',
    dailyRate: 120,
    licensePlate: 'EV-0001',
    mileage: 5000,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'ELECTRIC',
    vin: '5YJ3E1EA8PF123456',
    features: ['Autopilot', 'Navigation', 'Premium Sound', 'Glass Roof'],
    images: [],
  },
  {
    id: '4',
    make: 'Ford',
    model: 'Explorer',
    year: 2024,
    category: 'SUV',
    status: 'MAINTENANCE',
    dailyRate: 95,
    licensePlate: 'SUV-9999',
    mileage: 22000,
    seats: 7,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    vin: '1FMSK8DH0PGA12345',
    features: ['Third Row Seating', 'Backup Camera', 'Apple CarPlay', 'Android Auto'],
    images: [],
    maintenanceSchedule: {
      id: 'm1',
      vehicleId: '4',
      type: 'BRAKE_SERVICE',
      scheduledDate: '2026-01-20',
      notes: 'Brake pads replacement needed',
      status: 'IN_PROGRESS',
    },
  },
  {
    id: '5',
    make: 'Honda',
    model: 'Civic',
    year: 2024,
    category: 'ECONOMY',
    status: 'AVAILABLE',
    dailyRate: 45,
    licensePlate: 'ECO-1111',
    mileage: 12000,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    vin: '19XFC2F59PE012345',
    features: ['Air Conditioning', 'Bluetooth', 'USB Ports'],
    images: [],
  },
];

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RENTED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  RETIRED: 'bg-gray-100 text-gray-800',
};

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-green-100 text-green-800',
  STANDARD: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
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

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleBulkStatusChange = (newStatus: Vehicle['status']) => {
    setVehicles((prev) =>
      prev.map((v) =>
        selectedVehicles.has(v.id) ? { ...v, status: newStatus } : v
      )
    );
    setSelectedVehicles(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedVehicles.size} vehicles?`)) {
      setVehicles((prev) => prev.filter((v) => !selectedVehicles.has(v.id)));
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
    }
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    }
    setActiveDropdown(null);
  };

  const handleSubmitVehicle = (data: Omit<Vehicle, 'id'>) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (editingVehicle) {
        // Update existing vehicle
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === editingVehicle.id ? { ...v, ...data } : v
          )
        );
      } else {
        // Add new vehicle
        const newVehicle: Vehicle = {
          ...data,
          id: String(Date.now()),
        };
        setVehicles((prev) => [...prev, newVehicle]);
      }

      setIsLoading(false);
      setIsModalOpen(false);
      setEditingVehicle(null);
    }, 1000);
  };

  const handleStatusChange = (vehicleId: string, newStatus: Vehicle['status']) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, status: newStatus } : v
      )
    );
    setActiveDropdown(null);
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
    setActiveDropdown(null);
  };

  const handleScheduleMaintenance = () => {
    if (!maintenanceVehicle || !maintenanceForm.scheduledDate) return;

    const newMaintenance: MaintenanceSchedule = {
      id: `m${Date.now()}`,
      vehicleId: maintenanceVehicle.id,
      type: maintenanceForm.type,
      scheduledDate: maintenanceForm.scheduledDate,
      notes: maintenanceForm.notes,
      status: 'SCHEDULED',
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === maintenanceVehicle.id
          ? { ...v, status: 'MAINTENANCE', maintenanceSchedule: newMaintenance }
          : v
      )
    );

    setShowMaintenanceModal(false);
    setMaintenanceVehicle(null);
  };

  const handleCompleteMaintenance = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              status: 'AVAILABLE',
              maintenanceSchedule: v.maintenanceSchedule
                ? { ...v.maintenanceSchedule, status: 'COMPLETED' }
                : undefined,
            }
          : v
      )
    );
    setActiveDropdown(null);
  };

  const isAllSelected = filteredVehicles.length > 0 && selectedVehicles.size === filteredVehicles.length;
  const hasSelection = selectedVehicles.size > 0;

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
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {vehicles.filter((v) => v.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Rented</p>
          <p className="text-2xl font-bold text-blue-600">
            {vehicles.filter((v) => v.status === 'RENTED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Maintenance</p>
          <p className="text-2xl font-bold text-orange-600">
            {vehicles.filter((v) => v.status === 'MAINTENANCE').length}
          </p>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">
              {selectedVehicles.size} vehicle{selectedVehicles.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Bulk Actions
              </button>
              {showBulkActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBulkActions(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-2">
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
              className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
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
                      selectedVehicles.has(vehicle.id) && 'bg-indigo-50'
                    )}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectVehicle(vehicle.id)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {selectedVehicles.has(vehicle.id) ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
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
                          <p className="font-medium text-gray-900">
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
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit',
                            statusColors[vehicle.status]
                          )}
                        >
                          {vehicle.status}
                        </span>
                        {vehicle.maintenanceSchedule && vehicle.status === 'MAINTENANCE' && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {maintenanceTypes.find(t => t.value === vehicle.maintenanceSchedule?.type)?.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{formatCurrency(vehicle.dailyRate)}</span>
                      <span className="text-gray-500">/day</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{vehicle.seats}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings2 className="w-4 h-4" />
                          <span>{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Fuel className="w-4 h-4" />
                          <span>{vehicle.fuelType.charAt(0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 font-mono">{vehicle.licensePlate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === vehicle.id ? null : vehicle.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === vehicle.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                              <button
                                onClick={() => handleEditVehicle(vehicle)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit Details
                              </button>
                              <button
                                onClick={() => handleOpenMaintenance(vehicle)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Wrench className="w-4 h-4" />
                                Schedule Maintenance
                              </button>
                              {vehicle.status === 'MAINTENANCE' && vehicle.maintenanceSchedule && (
                                <button
                                  onClick={() => handleCompleteMaintenance(vehicle.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                  Complete Maintenance
                                </button>
                              )}
                              <div className="border-t border-gray-100 my-1" />
                              <p className="px-4 py-1 text-xs text-gray-400 uppercase">Change Status</p>
                              {['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(vehicle.id, status as Vehicle['status'])}
                                  className={cn(
                                    'w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50',
                                    vehicle.status === status ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'w-2 h-2 rounded-full',
                                      status === 'AVAILABLE' && 'bg-green-500',
                                      status === 'RENTED' && 'bg-blue-500',
                                      status === 'MAINTENANCE' && 'bg-orange-500',
                                      status === 'RETIRED' && 'bg-gray-500'
                                    )}
                                  />
                                  {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                              ))}
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Vehicle
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              1
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVehicle(null);
        }}
        onSubmit={handleSubmitVehicle}
        initialData={editingVehicle || undefined}
        isLoading={isLoading}
      />

      {/* Maintenance Scheduling Modal */}
      {showMaintenanceModal && maintenanceVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMaintenanceModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Schedule Maintenance</h2>
                    <p className="text-sm text-white/80">
                      {maintenanceVehicle.year} {maintenanceVehicle.make} {maintenanceVehicle.model}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning if already in maintenance */}
              {maintenanceVehicle.status === 'MAINTENANCE' && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Vehicle already in maintenance</p>
                    <p className="text-sm text-amber-600">This will update the existing maintenance schedule.</p>
                  </div>
                </div>
              )}

              {/* Maintenance Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Type
                </label>
                <select
                  value={maintenanceForm.type}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value as MaintenanceSchedule['type'] })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {maintenanceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={maintenanceForm.scheduledDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any notes about the maintenance..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMaintenance}
                disabled={!maintenanceForm.scheduledDate}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
