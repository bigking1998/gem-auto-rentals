/**
 * API client for the Gem Auto Rentals backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const SERVER_BASE_URL = import.meta.env.VITE_API_URL || '';

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

// Server wake-up utility for Render free tier
let serverWakeUpPromise: Promise<void> | null = null;
let isServerAwake = false;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function wakeUpServer(): Promise<void> {
  // If already awake or waking up, return existing promise
  if (isServerAwake) return Promise.resolve();
  if (serverWakeUpPromise) return serverWakeUpPromise;

  serverWakeUpPromise = (async () => {
    const maxRetries = 15; // More retries to wait for DB connection
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(`${SERVER_BASE_URL}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Check if database is connected (not just server responding)
          const data = await response.json();
          if (data.database === 'connected') {
            isServerAwake = true;
            serverWakeUpPromise = null;
            return;
          }
          // Database still connecting, wait and retry
          console.log('Server up but database connecting, waiting...');
        }
      } catch (error) {
        // Ignore errors and retry
      }

      retryCount++;
      // Backoff: 2s, 3s, 4s, 5s, then 5s for remaining attempts
      const delayMs = Math.min(2000 + retryCount * 1000, 5000);
      await sleep(delayMs);
    }

    // If we exhausted retries, assume it's awake and let the actual API calls handle errors
    isServerAwake = true;
    serverWakeUpPromise = null;
  })();

  return serverWakeUpPromise;
}

// Backend response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  retryCount = 0
): Promise<T> {
  // On first request, wait for server to wake up (blocking)
  // This prevents 500 errors while server is starting
  if (!isServerAwake && retryCount === 0) {
    try {
      await wakeUpServer();
    } catch (error) {
      // Continue anyway - retries will handle it if server isn't ready
      console.error('Server wake-up check failed, continuing with request:', error);
    }
  }

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

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      if (!response.ok) {
        // Retry on 500 errors (server might still be waking up)
        if (response.status === 500 && retryCount < 10) {
          const delay = Math.min(2000 + retryCount * 1000, 6000); // 2s, 3s, 4s, 5s, 6s, then 6s
          await sleep(delay);
          return request<T>(endpoint, options, retryCount + 1);
        }
        throw new ApiError(response.status, response.statusText, 'Empty response from server');
      }
      return {} as T;
    }

    const json = JSON.parse(text) as ApiResponse<T>;

    if (!response.ok || !json.success) {
      // Retry on 500 errors (server might still be waking up)
      if (response.status === 500 && retryCount < 10) {
        const delay = Math.min(2000 + retryCount * 1000, 6000); // 2s, 3s, 4s, 5s, 6s, then 6s
        await sleep(delay);
        return request<T>(endpoint, options, retryCount + 1);
      }

      throw new ApiError(
        response.status,
        response.statusText,
        json.error || json.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    // Unwrap the data from the response wrapper
    return json.data;
  } catch (error) {
    // Retry on network errors (server might be waking up)
    if (retryCount < 10 && error instanceof TypeError) {
      const delay = Math.min(2000 + retryCount * 1000, 6000); // 2s, 3s, 4s, 5s, 6s, then 6s
      await sleep(delay);
      return request<T>(endpoint, options, retryCount + 1);
    }
    throw error;
  }
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
  doors: number;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  mileage: number;
  color?: string;
  description?: string;
  location?: string;
  licensePlate: string;
  vin: string;
  averageRating?: number | null;
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

// ============ Review Types ============
export interface Review {
  id: string;
  userId: string;
  vehicleId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

export interface ReviewsResponse extends PaginatedResponse<Review> {
  averageRating: number | null;
}

export interface CanReviewResponse {
  canReview: boolean;
  hasExistingReview: boolean;
  existingReview: {
    id: string;
    rating: number;
    comment?: string | null;
  } | null;
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

// ============ Document Types ============
export interface Document {
  id: string;
  userId: string;
  bookingId?: string;
  type: 'DRIVERS_LICENSE_FRONT' | 'DRIVERS_LICENSE_BACK' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'INSURANCE';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  signedUrl?: string;
  createdAt: string;
  updatedAt: string;
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
  avatarUrl?: string;
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
      request('/vehicles', { params: params as Record<string, string | number | boolean | undefined> }),

    get: (id: string): Promise<Vehicle> =>
      request(`/vehicles/${id}`),

    getAvailability: (id: string, startDate: string, endDate: string): Promise<{ available: boolean }> =>
      request(`/vehicles/${id}/availability`, { params: { startDate, endDate } }),

    previewPricing: (params: { startDate?: string; endDate?: string; category?: string }): Promise<{
      availableCount: number;
      minDailyRate: number | null;
      maxDailyRate: number | null;
      avgDailyRate: number | null;
      days: number;
      estimatedMinTotal: number | null;
      estimatedMaxTotal: number | null;
      featuredVehicles: Array<{
        id: string;
        make: string;
        model: string;
        year: number;
        category: string;
        dailyRate: number;
        images: string[];
        seats: number;
        transmission: string;
      }>;
    }> => request('/vehicles/preview-pricing', { params }),
  },

  // Reviews
  reviews: {
    list: (vehicleId: string, params?: { page?: number; limit?: number }): Promise<ReviewsResponse> =>
      request(`/vehicles/${vehicleId}/reviews`, { params }),

    submit: (vehicleId: string, data: { rating: number; comment?: string }): Promise<Review> =>
      request(`/vehicles/${vehicleId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (vehicleId: string): Promise<{ message: string }> =>
      request(`/vehicles/${vehicleId}/reviews`, { method: 'DELETE' }),

    canReview: (vehicleId: string): Promise<CanReviewResponse> =>
      request(`/vehicles/${vehicleId}/can-review`),
  },

  // Favorites
  favorites: {
    list: (): Promise<Array<{
      id: string;
      vehicleId: string;
      createdAt: string;
      vehicle: {
        id: string;
        make: string;
        model: string;
        year: number;
        category: string;
        dailyRate: number;
        status: string;
        images: string[];
        seats: number;
        transmission: string;
        fuelType: string;
      };
    }>> => request('/favorites'),

    add: (vehicleId: string): Promise<{ id: string; vehicleId: string }> =>
      request(`/favorites/${vehicleId}`, { method: 'POST' }),

    remove: (vehicleId: string): Promise<{ message: string }> =>
      request(`/favorites/${vehicleId}`, { method: 'DELETE' }),

    check: (vehicleId: string): Promise<{ isFavorited: boolean }> =>
      request(`/favorites/check/${vehicleId}`),

    getIds: (): Promise<string[]> =>
      request('/favorites/ids'),
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

    // Generate a short-lived SSO code for admin dashboard redirect
    generateSsoCode: (): Promise<{ code: string; expiresIn: number }> =>
      request('/auth/sso-code', { method: 'POST' }),
  },

  // Payments
  payments: {
    createIntent: (bookingId: string): Promise<{ clientSecret: string; amount: number }> =>
      request('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }),

    confirm: (paymentIntentId: string): Promise<{ payment: { status: string }; bookingStatus: string }> =>
      request('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      }),

    get: (bookingId: string): Promise<{ id: string; amount: number | string; status: string; method?: string }> =>
      request(`/payments/${bookingId}`),
  },

  // Billing (Customer Payment Methods)
  billing: {
    createSetupIntent: (): Promise<{ clientSecret: string }> =>
      request('/billing/setup-intent', { method: 'POST' }),

    listPaymentMethods: (): Promise<Array<{
      id: string;
      type: string;
      last4: string;
      expMonth: number;
      expYear: number;
      brand: string;
      isDefault: boolean;
    }>> => request('/billing/payment-methods'),

    addPaymentMethod: (paymentMethodId: string, setAsDefault?: boolean): Promise<{
      id: string;
      type: string;
      last4: string;
      expMonth: number;
      expYear: number;
      brand: string;
      isDefault: boolean;
    }> =>
      request('/billing/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ paymentMethodId, setAsDefault }),
      }),

    deletePaymentMethod: (id: string): Promise<{ message: string }> =>
      request(`/billing/payment-methods/${id}`, { method: 'DELETE' }),

    setDefaultPaymentMethod: (id: string): Promise<{ message: string }> =>
      request(`/billing/payment-methods/${id}/default`, { method: 'POST' }),
  },

  // Profile
  profile: {
    get: (): Promise<User> => request('/customers/profile'),

    update: (data: { firstName?: string; lastName?: string; phone?: string }): Promise<User> =>
      request('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    uploadAvatar: async (file: File): Promise<User> => {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('auth_token');
      // Get current user ID from token
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const userId = payload?.userId;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized', 'Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/customers/${userId}/avatar`, {
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

    deleteAvatar: async (): Promise<User> => {
      const token = localStorage.getItem('auth_token');
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const userId = payload?.userId;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized', 'Not authenticated');
      }

      return request(`/customers/${userId}/avatar`, { method: 'DELETE' });
    },
  },

  // Contracts
  contracts: {
    upload: async (bookingId: string, file: File): Promise<{ contractSignedUrl: string }> => {
      const formData = new FormData();
      formData.append('contract', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/contract`, {
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

    getDownloadUrl: (bookingId: string): Promise<{ downloadUrl: string }> =>
      request(`/bookings/${bookingId}/contract`),
  },

  // Documents
  documents: {
    upload: async (
      file: File,
      type: Document['type'],
      bookingId?: string
    ): Promise<Document> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (bookingId) {
        formData.append('bookingId', bookingId);
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
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

    list: (params?: { type?: string; status?: string; bookingId?: string }): Promise<Document[]> =>
      request('/documents', { params }),

    get: (id: string): Promise<Document> =>
      request(`/documents/${id}`),

    delete: (id: string): Promise<{ message: string }> =>
      request(`/documents/${id}`, { method: 'DELETE' }),

    getDownloadUrl: (id: string): Promise<{ downloadUrl: string; fileName: string; mimeType: string }> =>
      request(`/documents/${id}/download`),
  },

  // Invoices
  invoices: {
    list: (): Promise<Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      totalAmount: number;
      issueDate: string;
      dueDate: string;
      paidAt: string | null;
      booking: {
        id: string;
        startDate: string;
        endDate: string;
        vehicle: {
          make: string;
          model: string;
          year: number;
        };
      } | null;
    }>> => request('/invoices/my'),

    download: (id: string): string => {
      // Return the URL for downloading/viewing the invoice
      const token = localStorage.getItem('auth_token');
      return `${API_BASE_URL}/invoices/${id}/download${token ? `?token=${token}` : ''}`;
    },

    openInNewTab: async (id: string): Promise<void> => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/invoices/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  },
};

// ============ Token Management ============
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem('auth_token'),

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

export { ApiError };
