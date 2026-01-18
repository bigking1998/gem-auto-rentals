// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum Role {
  CUSTOMER = 'CUSTOMER',
  SUPPORT = 'SUPPORT',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

// Vehicle Types
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  dailyRate: number;
  status: VehicleStatus;
  images: string[];
  features: string[];
  seats: number;
  transmission: Transmission;
  fuelType: FuelType;
  mileage: number;
  licensePlate: string;
  vin: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum VehicleCategory {
  ECONOMY = 'ECONOMY',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY',
  SUV = 'SUV',
  VAN = 'VAN',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum Transmission {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

// Booking Types
export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  totalAmount: number;
  extras?: BookingExtras;
  pickupLocation: string;
  dropoffLocation: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  vehicle?: Vehicle;
  payment?: Payment;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface BookingExtras {
  insurance?: boolean;
  gps?: boolean;
  childSeat?: boolean;
  additionalDriver?: boolean;
}

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  method?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Document Types
export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  url: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter Types
export interface VehicleFilters {
  category?: VehicleCategory;
  minPrice?: number;
  maxPrice?: number;
  transmission?: Transmission;
  fuelType?: FuelType;
  seats?: number;
  status?: VehicleStatus;
}

export interface BookingFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  vehicleId?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  activeRentals: number;
  todaysRevenue: number;
  pendingBookings: number;
  availableVehicles: number;
  totalCustomers: number;
  totalBookings: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  vehicleId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  user?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}
