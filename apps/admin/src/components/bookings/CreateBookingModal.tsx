import { useState, useEffect } from 'react';
import { X, Loader2, Search, Calendar, MapPin, Car, User, DollarSign } from 'lucide-react';
import { api, Customer, Vehicle } from '@/lib/api';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const extras = [
  { id: 'insurance', label: 'Insurance', description: 'Full coverage protection', price: 25 },
  { id: 'gps', label: 'GPS Navigation', description: 'Built-in navigation system', price: 10 },
  { id: 'childSeat', label: 'Child Seat', description: 'Safety seat for children', price: 15 },
  { id: 'additionalDriver', label: 'Additional Driver', description: 'Add another driver', price: 20 },
];

export function CreateBookingModal({ isOpen, onClose, onSuccess }: CreateBookingModalProps) {
  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Vehicle state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Booking details
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({
    insurance: false,
    gps: false,
    childSeat: false,
    additionalDriver: false,
  });
  const [notes, setNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available vehicles on mount
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Search customers with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length >= 2) {
        searchCustomers();
      } else {
        setCustomers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const result = await api.vehicles.list({ status: 'AVAILABLE', limit: 50 });
      setVehicles(result.items);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const searchCustomers = async () => {
    setIsSearchingCustomers(true);
    try {
      const result = await api.customers.list({ search: customerSearch, limit: 10 });
      setCustomers(result.items);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Failed to search customers:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerDropdown(false);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => ({
      ...prev,
      [extraId]: !prev[extraId],
    }));
  };

  // Calculate totals
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const calculateTotal = () => {
    if (!selectedVehicle) return 0;
    const days = calculateDays();
    let total = selectedVehicle.dailyRate * days;

    // Add extras
    extras.forEach(extra => {
      if (selectedExtras[extra.id]) {
        total += extra.price * days;
      }
    });

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer || !selectedVehicle || !startDate || !endDate || !pickupLocation || !dropoffLocation) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.bookings.create({
        userId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        startDate,
        endDate,
        pickupLocation,
        dropoffLocation,
        totalAmount: calculateTotal(),
        extras: selectedExtras,
      });

      toast.success('Booking created successfully');
      onSuccess();
      resetForm();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setSelectedVehicle(null);
    setStartDate('');
    setEndDate('');
    setPickupLocation('');
    setDropoffLocation('');
    setSelectedExtras({
      insurance: false,
      gps: false,
      childSeat: false,
      additionalDriver: false,
    });
    setNotes('');
  };

  if (!isOpen) return null;

  const days = calculateDays();
  const total = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Booking</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details to create a reservation</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                Customer *
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomer(null);
                    }}
                    onFocus={() => customers.length > 0 && setShowCustomerDropdown(true)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {isSearchingCustomers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg text-sm text-orange-700">
                  <User className="w-4 h-4" />
                  Selected: {selectedCustomer.firstName} {selectedCustomer.lastName}
                </div>
              )}
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Car className="w-4 h-4" />
                Vehicle *
              </label>
              {isLoadingVehicles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        selectedVehicle?.id === vehicle.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-500">{vehicle.category}</p>
                      <p className="text-sm font-semibold text-orange-600 mt-1">
                        {formatCurrency(vehicle.dailyRate)}/day
                      </p>
                    </button>
                  ))}
                  {vehicles.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-gray-500">
                      No available vehicles
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  Pickup Location *
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g., Miami Airport"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  Dropoff Location *
                </label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="e.g., Miami Downtown"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Extras */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Extras (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                {extras.map((extra) => (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      selectedExtras[extra.id]
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm">{extra.label}</p>
                      <span className="text-xs font-semibold text-orange-600">+{formatCurrency(extra.price)}/day</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{extra.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Price Summary */}
            {selectedVehicle && days > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <DollarSign className="w-4 h-4" />
                  Price Summary
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(selectedVehicle.dailyRate)} x {days} day{days > 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">{formatCurrency(selectedVehicle.dailyRate * days)}</span>
                </div>
                {extras.filter(e => selectedExtras[e.id]).map((extra) => (
                  <div key={extra.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{extra.label} x {days} day{days > 1 ? 's' : ''}</span>
                    <span className="font-medium">{formatCurrency(extra.price * days)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-orange-600">{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCustomer || !selectedVehicle || !startDate || !endDate || !pickupLocation || !dropoffLocation}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
