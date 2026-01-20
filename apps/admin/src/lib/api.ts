/**
 * Admin API client for the Gem Auto Rentals backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// Backend response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
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
  const token = localStorage.getItem('admin_auth_token');
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, 'Empty response from server');
    }
    return {} as T;
  }

  const json = JSON.parse(text) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new ApiError(
      response.status,
      response.statusText,
      json.error || json.message || `API Error: ${response.status} ${response.statusText}`
    );
  }

  // Unwrap the data from the response wrapper
  return json.data;
}

// ============ Types ============

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
  dailyRate: number | string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
  images: string[];
  features: string[];
  description?: string;
  seats: number;
  doors: number;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  mileage: number;
  color?: string;
  licensePlate: string;
  vin: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number | string;
  dailyRate: number | string;
  extras?: Record<string, unknown>;
  pickupLocation: string;
  dropoffLocation: string;
  notes?: string;
  contractSigned: boolean;
  contractUrl?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  vehicle?: Vehicle;
}

export interface Customer extends User {
  _count?: {
    bookings: number;
    documents: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  metrics: {
    activeRentals: number;
    todaysRevenue: number;
    pendingBookings: number;
    availableVehicles: number;
    totalCustomers: number;
    totalBookings: number;
  };
  recentBookings: Booking[];
}

export interface RevenueStats {
  period: string;
  data: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  totals: {
    revenue: number;
    bookings: number;
    averageBookingValue: number;
  };
}

export interface FleetStats {
  totalVehicles: number;
  available: number;
  rented: number;
  maintenance: number;
  retired: number;
  byCategory: Record<string, number>;
  utilizationRate: number;
}

// ============ API Methods ============

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string): Promise<{ user: User; token: string }> =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: (): Promise<void> =>
      request('/auth/logout', { method: 'POST' }),

    me: (): Promise<User> =>
      request('/auth/me'),
  },

  // Vehicles
  vehicles: {
    list: (params?: {
      category?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<Vehicle>> =>
      request('/vehicles', { params }),

    get: (id: string): Promise<Vehicle> =>
      request(`/vehicles/${id}`),

    create: (data: Partial<Vehicle>): Promise<Vehicle> =>
      request('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Vehicle>): Promise<Vehicle> =>
      request(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<void> =>
      request(`/vehicles/${id}`, { method: 'DELETE' }),

    updateStatus: (id: string, status: Vehicle['status']): Promise<Vehicle> =>
      request(`/vehicles/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    uploadImage: async (id: string, file: File): Promise<{ imageUrl: string; vehicle: Vehicle }> => {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('admin_auth_token');
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new ApiError(
          response.status,
          response.statusText,
          json.error || json.message || 'Upload failed'
        );
      }
      return json.data;
    },

    deleteImage: (id: string, imageUrl: string): Promise<Vehicle> =>
      request(`/vehicles/${id}/images`, {
        method: 'DELETE',
        body: JSON.stringify({ imageUrl }),
      }),
  },

  // Bookings
  bookings: {
    list: (params?: {
      status?: string;
      userId?: string;
      vehicleId?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<Booking>> =>
      request('/bookings', { params }),

    get: (id: string): Promise<Booking> =>
      request(`/bookings/${id}`),

    update: (id: string, data: Partial<Booking>): Promise<Booking> =>
      request(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: Booking['status']): Promise<Booking> =>
      request(`/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    cancel: (id: string, reason?: string): Promise<Booking> =>
      request(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    uploadContract: async (id: string, file: File): Promise<Booking & { contractSignedUrl: string }> => {
      const formData = new FormData();
      formData.append('contract', file);

      const token = localStorage.getItem('admin_auth_token');
      const response = await fetch(`${API_BASE_URL}/bookings/${id}/contract`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new ApiError(
          response.status,
          response.statusText,
          json.error || json.message || 'Upload failed'
        );
      }
      return json.data;
    },

    getContractUrl: (id: string): Promise<{ downloadUrl: string }> =>
      request(`/bookings/${id}/contract`),

    deleteContract: (id: string): Promise<Booking> =>
      request(`/bookings/${id}/contract`, { method: 'DELETE' }),
  },

  // Customers
  customers: {
    list: (params?: {
      search?: string;
      role?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<Customer>> =>
      request('/customers', { params }),

    get: (id: string): Promise<Customer> =>
      request(`/customers/${id}`),

    update: (id: string, data: Partial<Customer>): Promise<Customer> =>
      request(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    uploadAvatar: async (id: string, file: File): Promise<Customer> => {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('admin_auth_token');
      const response = await fetch(`${API_BASE_URL}/customers/${id}/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new ApiError(
          response.status,
          response.statusText,
          json.error || json.message || 'Upload failed'
        );
      }
      return json.data;
    },

    deleteAvatar: (id: string): Promise<Customer> =>
      request(`/customers/${id}/avatar`, { method: 'DELETE' }),
  },

  // Stats
  stats: {
    dashboard: (): Promise<DashboardStats> =>
      request('/stats/dashboard'),

    revenue: (period: '7d' | '30d' | '90d' | '365d' = '30d'): Promise<RevenueStats> =>
      request('/stats/revenue', { params: { period } }),

    fleet: (): Promise<FleetStats> =>
      request('/stats/fleet'),

    bookings: (): Promise<{
      total: number;
      byStatus: Record<string, number>;
      trends: Array<{ date: string; count: number }>;
    }> =>
      request('/stats/bookings'),

    customers: (): Promise<{
      total: number;
      new: number;
      returning: number;
      trends: Array<{ date: string; count: number }>;
    }> =>
      request('/stats/customers'),
  },
};

// ============ Token Management ============
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem('admin_auth_token'),

  setToken: (token: string): void => {
    localStorage.setItem('admin_auth_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('admin_auth_token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('admin_auth_token');
  },
};
