import { create } from 'zustand';

export interface BookingExtras {
  insurance: boolean;
  gps: boolean;
  childSeat: boolean;
  additionalDriver: boolean;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  driversLicense: string;
  dateOfBirth: string;
}

export interface BookingVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  images: string[];
}

interface BookingState {
  // Current step in booking flow
  currentStep: number;

  // Vehicle info
  vehicle: BookingVehicle | null;

  // Date & Location
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;

  // Extras
  extras: BookingExtras;

  // Customer
  customer: CustomerInfo;

  // Calculated values
  days: number;
  subtotal: number;
  extrasTotal: number;
  total: number;
}

interface BookingActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setVehicle: (vehicle: BookingVehicle) => void;

  setDates: (startDate: string, endDate: string) => void;
  setLocations: (pickup: string, dropoff: string) => void;
  setTimes: (pickupTime: string, dropoffTime: string) => void;

  setExtras: (extras: Partial<BookingExtras>) => void;
  toggleExtra: (extra: keyof BookingExtras) => void;

  setCustomer: (customer: Partial<CustomerInfo>) => void;

  calculateTotals: () => void;
  resetBooking: () => void;

  // Get booking data for submission
  getBookingData: () => BookingSubmission;
}

interface BookingSubmission {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;
  extras: BookingExtras;
  customer: CustomerInfo;
  totalAmount: number;
}

const EXTRAS_PRICES = {
  insurance: 25,
  gps: 10,
  childSeat: 8,
  additionalDriver: 15,
};

const initialCustomer: CustomerInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zipCode: '',
  country: 'United States',
  driversLicense: '',
  dateOfBirth: '',
};

const initialExtras: BookingExtras = {
  insurance: false,
  gps: false,
  childSeat: false,
  additionalDriver: false,
};

const initialState: BookingState = {
  currentStep: 1,
  vehicle: null,
  startDate: '',
  endDate: '',
  pickupLocation: '',
  dropoffLocation: '',
  pickupTime: '10:00',
  dropoffTime: '10:00',
  extras: initialExtras,
  customer: initialCustomer,
  days: 0,
  subtotal: 0,
  extrasTotal: 0,
  total: 0,
};

export const useBookingStore = create<BookingState & BookingActions>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),

  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  setVehicle: (vehicle) => {
    set({ vehicle });
    get().calculateTotals();
  },

  setDates: (startDate, endDate) => {
    set({ startDate, endDate });
    get().calculateTotals();
  },

  setLocations: (pickup, dropoff) => set({ pickupLocation: pickup, dropoffLocation: dropoff }),

  setTimes: (pickupTime, dropoffTime) => set({ pickupTime, dropoffTime }),

  setExtras: (extras) => {
    set((state) => ({ extras: { ...state.extras, ...extras } }));
    get().calculateTotals();
  },

  toggleExtra: (extra) => {
    set((state) => ({
      extras: { ...state.extras, [extra]: !state.extras[extra] },
    }));
    get().calculateTotals();
  },

  setCustomer: (customer) =>
    set((state) => ({ customer: { ...state.customer, ...customer } })),

  calculateTotals: () => {
    const { vehicle, startDate, endDate, extras } = get();

    if (!vehicle || !startDate || !endDate) {
      set({ days: 0, subtotal: 0, extrasTotal: 0, total: 0 });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const subtotal = vehicle.dailyRate * days;

    let extrasTotal = 0;
    if (extras.insurance) extrasTotal += EXTRAS_PRICES.insurance * days;
    if (extras.gps) extrasTotal += EXTRAS_PRICES.gps * days;
    if (extras.childSeat) extrasTotal += EXTRAS_PRICES.childSeat * days;
    if (extras.additionalDriver) extrasTotal += EXTRAS_PRICES.additionalDriver * days;

    const total = subtotal + extrasTotal;

    set({ days, subtotal, extrasTotal, total });
  },

  resetBooking: () => set(initialState),

  getBookingData: () => {
    const state = get();
    return {
      vehicleId: state.vehicle?.id || '',
      startDate: state.startDate,
      endDate: state.endDate,
      pickupLocation: state.pickupLocation,
      dropoffLocation: state.dropoffLocation,
      pickupTime: state.pickupTime,
      dropoffTime: state.dropoffTime,
      extras: state.extras,
      customer: state.customer,
      totalAmount: state.total,
    };
  },
}));

// Selector hooks
export const useBookingStep = () => useBookingStore((state) => state.currentStep);
export const useBookingVehicle = () => useBookingStore((state) => state.vehicle);
export const useBookingDates = () =>
  useBookingStore((state) => ({
    startDate: state.startDate,
    endDate: state.endDate,
    days: state.days,
  }));
export const useBookingExtras = () => useBookingStore((state) => state.extras);
export const useBookingCustomer = () => useBookingStore((state) => state.customer);
export const useBookingTotals = () =>
  useBookingStore((state) => ({
    subtotal: state.subtotal,
    extrasTotal: state.extrasTotal,
    total: state.total,
    days: state.days,
  }));
