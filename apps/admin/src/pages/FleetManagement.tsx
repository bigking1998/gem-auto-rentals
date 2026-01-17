import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Car, Fuel, Users, Settings2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// Mock data
const vehicles = [
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

export default function FleetManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Manage your vehicle inventory</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </button>
      </div>

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
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Car className="w-6 h-6 text-gray-400" />
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
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        statusColors[vehicle.status]
                      )}
                    >
                      {vehicle.status}
                    </span>
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
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
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
              2
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
