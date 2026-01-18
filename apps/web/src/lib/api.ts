/**
 * API client for the Gem Auto Rentals backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      response.statusText,
      errorData.message || `API Error: ${response.status} ${response.statusText}`
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

// ============ Vehicle Types ============
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
  dailyRate: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
  images: string[];
  features: string[];
  seats: number;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  mileage: number;
  licensePlate: string;
  vin: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFiltersParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ Booking Types ============
export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  extras?: {
    insurance?: boolean;
    gps?: boolean;
    childSeat?: boolean;
    additionalDriver?: boolean;
  };
  pickupLocation: string;
  dropoffLocation: string;
  vehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;
  extras?: {
    insurance?: boolean;
    gps?: boolean;
    childSeat?: boolean;
    additionalDriver?: boolean;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    zipCode?: string;
  };
}

// ============ Auth Types ============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
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

// ============ API Methods ============

export const api = {
  // Vehicles
  vehicles: {
    list: (params?: VehicleFiltersParams): Promise<PaginatedResponse<Vehicle>> =>
      request('/vehicles', { params }),

    get: (id: string): Promise<Vehicle> =>
      request(`/vehicles/${id}`),

    getAvailability: (id: string, startDate: string, endDate: string): Promise<{ available: boolean }> =>
      request(`/vehicles/${id}/availability`, { params: { startDate, endDate } }),
  },

  // Bookings
  bookings: {
    list: (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Booking>> =>
      request('/bookings', { params }),

    get: (id: string): Promise<Booking> =>
      request(`/bookings/${id}`),

    create: (data: CreateBookingData): Promise<Booking> =>
      request('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cancel: (id: string): Promise<Booking> =>
      request(`/bookings/${id}/cancel`, { method: 'POST' }),
  },

  // Auth
  auth: {
    login: (data: LoginData): Promise<AuthResponse> =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    register: (data: RegisterData): Promise<AuthResponse> =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: (): Promise<void> =>
      request('/auth/logout', { method: 'POST' }),

    me: (): Promise<User> =>
      request('/auth/me'),

    forgotPassword: (email: string): Promise<{ message: string }> =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string): Promise<{ message: string }> =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },

  // Payments
  payments: {
    createIntent: (amount: number, bookingId: string): Promise<{ clientSecret: string; paymentIntentId: string }> =>
      request('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ amount, bookingId }),
      }),

    confirm: (paymentIntentId: string): Promise<{ success: boolean }> =>
      request('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      }),
  },
};

export { ApiError };
