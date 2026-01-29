/**
 * API client for the Gem Auto Rentals Admin Dashboard
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const SERVER_BASE_URL = import.meta.env.VITE_API_URL || '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  const token = tokenManager.getToken();
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

// Separate function that includes pagination info - returns items for compatibility with pages
async function requestWithPagination<T>(
  endpoint: string,
  options: RequestOptions = {},
  retryCount = 0
): Promise<{ items: T; data: T; pagination: ApiResponse<T>['pagination'] }> {
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const token = tokenManager.getToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...fetchOptions, headers });
    const text = await response.text();

    if (!text) {
      if (!response.ok) {
        // Retry on 500 errors (server might still be waking up)
        if (response.status === 500 && retryCount < 10) {
          const delay = Math.min(2000 + retryCount * 1000, 6000); // 2s, 3s, 4s, 5s, 6s, then 6s
          await sleep(delay);
          return requestWithPagination<T>(endpoint, options, retryCount + 1);
        }
        throw new ApiError(response.status, response.statusText, 'Empty response from server');
      }
      return { items: {} as T, data: {} as T, pagination: undefined };
    }

    const json = JSON.parse(text) as ApiResponse<T>;

    if (!response.ok || !json.success) {
      // Retry on 500 errors (server might still be waking up)
      if (response.status === 500 && retryCount < 10) {
        const delay = Math.min(2000 + retryCount * 1000, 6000); // 2s, 3s, 4s, 5s, 6s, then 6s
        await sleep(delay);
        return requestWithPagination<T>(endpoint, options, retryCount + 1);
      }

      throw new ApiError(
        response.status,
        response.statusText,
        json.error || json.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    // Return both items and data for compatibility with different page patterns
    // Handle both array responses and { items: [...] } wrapped responses
    const items = Array.isArray(json.data) ? json.data : (json.data as { items?: T }).items ?? json.data;
    return { items: items as T, data: json.data, pagination: json.pagination };
  } catch (error) {
    // Retry on network errors (server might be waking up)
    if (retryCount < 10 && error instanceof TypeError) {
      const delay = Math.min(2000 + retryCount * 1000, 6000); // 2s, 3s, 4s, 5s, 6s, then 6s
      await sleep(delay);
      return requestWithPagination<T>(endpoint, options, retryCount + 1);
    }
    throw error;
  }
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

export interface AuthResponse {
  user: User;
  token: string;
}

// ============ Session Types ============
export interface Session {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  isActive: boolean;
  isCurrent?: boolean;
  lastActiveAt: string;
  expiresAt: string;
  revokedAt?: string;
  revokedReason?: string;
  createdAt: string;
}

// ============ Activity Types ============
export type ActivityAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'PROFILE_UPDATE'
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'VEHICLE_CREATED'
  | 'VEHICLE_UPDATED'
  | 'VEHICLE_DELETED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'SESSION_REVOKED'
  | 'LOGIN_FAILED'
  | 'API_ERROR';

export type ActivityStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface ActivityLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: ActivityStatus;
  errorMessage?: string;
  createdAt: string;
}

export interface ActivityStats {
  totalActivities: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
  recentFailures: number;
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
  bookingCount?: number;
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
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// ============ Customer Types ============
export interface Customer extends User {
  bookings?: Booking[];
  totalBookings?: number;
  totalSpent?: number;
}

// ============ Stats Types ============
export interface RevenueStats {
  data: { date: string; revenue: number; bookings: number }[];
  totals: {
    revenue: number;
    bookings: number;
  };
  averageOrderValue: number;
  growthRate: number;
}

export interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  utilizationRate: number;
  byCategory: Record<string, number>;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  byStatus: Record<string, number>;
  trends: { date: string; count: number }[];
}

export interface CustomerStats {
  total: number;
  new: number;
  active: number;
}

export interface DashboardStats {
  metrics: {
    activeRentals: number;
    todaysRevenue: number;
    pendingBookings: number;
    availableVehicles: number;
    totalCustomers: number;
  };
  recentBookings: Array<Booking & { user?: User; vehicle?: Vehicle }>;
}

// ============ User Preferences Types ============
export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  language: string;
  timezone: string;
  dateFormat: string;
  emailBookingConfirm: boolean;
  emailBookingReminder: boolean;
  emailPaymentReceipt: boolean;
  emailMarketing: boolean;
  smsBookingReminder: boolean;
  smsPaymentAlert: boolean;
  dashboardLayout?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============ Company Settings Types ============
export interface CompanySettings {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  logo?: string;
  currency: string;
  timezone: string;
  businessHours?: Record<string, { open: string; close: string; closed: boolean }>;
  bookingTerms?: string;
  cancellationPolicy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Integration Types ============
export type IntegrationProvider =
  | 'STRIPE'
  | 'PAYPAL'
  | 'MAILCHIMP'
  | 'TWILIO'
  | 'GOOGLE_CALENDAR'
  | 'QUICKBOOKS'
  | 'ZAPIER';

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  isEnabled: boolean;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  lastError?: string;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============ Trash / Recycle Bin Types ============
export type TrashEntityType = 'users' | 'vehicles' | 'bookings' | 'documents' | 'conversations' | 'invoices' | 'reviews' | 'maintenance';

// ============ Document Types ============
export type DocumentType = 'DRIVERS_LICENSE_FRONT' | 'DRIVERS_LICENSE_BACK' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'INSURANCE';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Document {
  id: string;
  userId: string;
  bookingId?: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  signedUrl?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TrashSummary {
  users: number;
  vehicles: number;
  bookings: number;
  documents: number;
  conversations: number;
  invoices: number;
  reviews: number;
  maintenance: number;
  total: number;
}

export interface DeletedItem {
  id: string;
  deletedAt: string;
  deletedBy?: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface TrashListResponse {
  items: DeletedItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============ Billing Types ============
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  isCurrent: boolean;
}

// ============ Conversation Types ============
export type ConversationStatus = 'OPEN' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageSender = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  sender?: User;
  senderType: MessageSender;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customer?: User;
  subject?: string;
  status: ConversationStatus;
  priority: Priority;
  assignedToId?: string;
  assignedTo?: User;
  bookingId?: string;
  booking?: Booking;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

// ============ Notification Types ============
export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_STARTED'
  | 'BOOKING_ENDING_SOON'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'INVOICE_SENT'
  | 'INVOICE_OVERDUE'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'NEW_MESSAGE'
  | 'SYSTEM_ALERT'
  | 'PROMOTION';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  channels: NotificationChannel[];
  readAt?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  smsSent?: boolean;
  smsSentAt?: string;
  createdAt: string;
}

// ============ API Methods ============
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string): Promise<AuthResponse> =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: (): Promise<void> =>
      request('/auth/logout', { method: 'POST' }),

    me: (): Promise<User> =>
      request('/auth/me'),

    exchangeSsoCode: (code: string): Promise<AuthResponse> =>
      request('/auth/sso-exchange', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    changePassword: (currentPassword: string, newPassword: string): Promise<{ message: string }> =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  // Sessions
  sessions: {
    list: (): Promise<Session[]> =>
      request('/sessions'),

    listAll: (params?: { userId?: string; isActive?: boolean; page?: number; limit?: number }) =>
      requestWithPagination<Session[]>('/sessions/all', { params }),

    revoke: (sessionId: string): Promise<{ message: string }> =>
      request(`/sessions/${sessionId}`, { method: 'DELETE' }),

    revokeAll: (): Promise<{ count: number }> =>
      request('/sessions/revoke-all', { method: 'DELETE' }),
  },

  // Activity Logs
  activity: {
    list: (params?: {
      userId?: string;
      action?: ActivityAction;
      entityType?: string;
      status?: ActivityStatus;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }) => requestWithPagination<ActivityLog[]>('/activity', { params }),

    getByUser: (userId: string, params?: { page?: number; limit?: number }) =>
      requestWithPagination<ActivityLog[]>(`/activity/user/${userId}`, { params }),

    getByEntity: (entityType: string, entityId: string, params?: { page?: number; limit?: number }) =>
      requestWithPagination<ActivityLog[]>(`/activity/entity/${entityType}/${entityId}`, { params }),

    getStats: (params?: { startDate?: string; endDate?: string }): Promise<ActivityStats> =>
      request('/activity/stats', { params }),

    getActions: (): Promise<string[]> =>
      request('/activity/actions'),
  },

  // Notifications
  notifications: {
    list: (params?: { page?: number; limit?: number; unreadOnly?: boolean; type?: NotificationType }) =>
      requestWithPagination<Notification[]>('/notifications', { params }),

    getUnreadCount: (): Promise<{ count: number }> =>
      request('/notifications/unread-count'),

    markAsRead: (id: string): Promise<Notification> =>
      request(`/notifications/${id}/read`, { method: 'PATCH' }),

    markAllAsRead: (): Promise<{ count: number }> =>
      request('/notifications/read-all', { method: 'PATCH' }),

    delete: (id: string): Promise<{ message: string }> =>
      request(`/notifications/${id}`, { method: 'DELETE' }),
  },

  // Vehicles
  vehicles: {
    list: (params?: VehicleFiltersParams) =>
      requestWithPagination<Vehicle[]>('/vehicles', { params: params as Record<string, string | number | boolean | undefined> }),

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

    delete: (id: string): Promise<{ message: string }> =>
      request(`/vehicles/${id}`, { method: 'DELETE' }),

    updateStatus: (id: string, status: Vehicle['status']): Promise<Vehicle> =>
      request(`/vehicles/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    uploadImage: async (id: string, file: File): Promise<{ imageUrl: string }> => {
      const formData = new FormData();
      formData.append('image', file);

      const token = tokenManager.getToken();
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

    deleteImage: (id: string, imageUrl: string): Promise<{ message: string }> =>
      request(`/vehicles/${id}/images`, {
        method: 'DELETE',
        body: JSON.stringify({ imageUrl }),
      }),
  },

  // Bookings
  bookings: {
    list: (params?: { status?: string; userId?: string; vehicleId?: string; page?: number; limit?: number }) =>
      requestWithPagination<Booking[]>('/bookings', { params }),

    get: (id: string): Promise<Booking> =>
      request(`/bookings/${id}`),

    create: (data: Partial<Booking>): Promise<Booking> =>
      request('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Booking>): Promise<Booking> =>
      request(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: Booking['status']): Promise<Booking> =>
      request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    cancel: (id: string): Promise<Booking> =>
      request(`/bookings/${id}/cancel`, { method: 'POST' }),
  },

  // Customers
  customers: {
    list: (params?: { search?: string; role?: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN'; page?: number; limit?: number }) =>
      requestWithPagination<Customer[]>('/customers', { params }),

    get: (id: string): Promise<Customer> =>
      request(`/customers/${id}`),

    update: (id: string, data: Partial<Customer>): Promise<Customer> =>
      request(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getBookings: (id: string, params?: { page?: number; limit?: number }) =>
      requestWithPagination<Booking[]>(`/customers/${id}/bookings`, { params }),

    uploadAvatar: async (id: string, file: File): Promise<{ avatarUrl: string }> => {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = tokenManager.getToken();
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
          json.error || json.message || 'Avatar upload failed'
        );
      }
      return json.data;
    },

    deleteAvatar: (id: string): Promise<{ message: string }> =>
      request(`/customers/${id}/avatar`, { method: 'DELETE' }),
  },

  // Documents
  documents: {
    list: (params?: { userId?: string; type?: DocumentType; status?: DocumentStatus; bookingId?: string }): Promise<Document[]> =>
      request('/documents', { params }),

    get: (id: string): Promise<Document> =>
      request(`/documents/${id}`),

    verify: (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<Document> =>
      request(`/documents/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),

    delete: (id: string): Promise<{ message: string }> =>
      request(`/documents/${id}`, { method: 'DELETE' }),

    getDownloadUrl: (id: string): Promise<{ downloadUrl: string; fileName: string; mimeType: string }> =>
      request(`/documents/${id}/download`),
  },

  // Conversations (Messages)
  conversations: {
    list: (params?: {
      status?: ConversationStatus;
      priority?: Priority;
      assignedToId?: string;
      customerId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => requestWithPagination<Conversation[]>('/conversations', { params }),

    get: (id: string): Promise<Conversation> =>
      request(`/conversations/${id}`),

    create: (data: {
      customerId: string;
      subject?: string;
      priority?: Priority;
      bookingId?: string;
      initialMessage?: string;
    }): Promise<Conversation> =>
      request('/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: {
      status?: ConversationStatus;
      priority?: Priority;
      assignedToId?: string | null;
    }): Promise<Conversation> =>
      request(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    sendMessage: (conversationId: string, content: string): Promise<Message> =>
      request(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    markMessageAsRead: (_conversationId: string, messageId: string): Promise<Message> =>
      request(`/conversations/messages/${messageId}/read`, {
        method: 'PATCH',
      }),

    markAllRead: (conversationId: string): Promise<{ count: number }> =>
      request(`/conversations/${conversationId}/read-all`, {
        method: 'POST',
      }),

    assign: (conversationId: string, assignedToId: string | null): Promise<Conversation> =>
      request(`/conversations/${conversationId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignedToId }),
      }),

    delete: (id: string): Promise<{ message: string }> =>
      request(`/conversations/${id}`, { method: 'DELETE' }),

    getUnreadCount: (): Promise<{ count: number }> =>
      request('/conversations/unread-count'),
  },

  // Stats / Dashboard
  stats: {
    dashboard: (): Promise<DashboardStats> =>
      request('/stats/dashboard'),

    revenue: (period?: string): Promise<RevenueStats> =>
      request('/stats/revenue', { params: period ? { period } : undefined }),

    fleet: (): Promise<FleetStats> =>
      request('/stats/fleet'),

    bookings: (params?: { startDate?: string; endDate?: string }): Promise<BookingStats> =>
      request('/stats/bookings', { params }),

    customers: (): Promise<CustomerStats> =>
      request('/stats/customers'),
  },

  // User Preferences
  preferences: {
    get: (userId: string): Promise<UserPreferences> =>
      request(`/settings/users/${userId}/preferences`),

    update: (userId: string, data: Partial<UserPreferences>): Promise<UserPreferences> =>
      request(`/settings/users/${userId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Company Settings
  company: {
    get: (): Promise<CompanySettings> =>
      request('/settings/company'),

    update: (data: Partial<CompanySettings>): Promise<CompanySettings> =>
      request('/settings/company', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
      const formData = new FormData();
      formData.append('logo', file);

      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/settings/company/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new ApiError(
          response.status,
          response.statusText,
          json.error || json.message || 'Logo upload failed'
        );
      }
      return json.data;
    },

    deleteLogo: (): Promise<{ message: string }> =>
      request('/settings/company/logo', { method: 'DELETE' }),
  },

  // Integrations
  integrations: {
    list: (): Promise<Integration[]> =>
      request('/integrations'),

    get: (provider: IntegrationProvider): Promise<Integration> =>
      request(`/integrations/${provider}`),

    connect: (provider: IntegrationProvider, credentials: Record<string, string>): Promise<{ success: boolean; message?: string; oauthUrl?: string }> =>
      request(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    disconnect: (provider: IntegrationProvider): Promise<{ message: string }> =>
      request(`/integrations/${provider}/disconnect`, { method: 'POST' }),

    updateConfig: (provider: IntegrationProvider, config: Record<string, unknown>): Promise<Integration> =>
      request(`/integrations/${provider}/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      }),

    test: (provider: IntegrationProvider): Promise<{ success: boolean; message: string }> =>
      request(`/integrations/${provider}/test`, { method: 'POST' }),
  },

  // ============ Billing / Payment Methods ============
  billing: {
    getPaymentMethods: (): Promise<PaymentMethod[]> =>
      request('/billing/payment-methods'),

    createSetupIntent: (): Promise<{ clientSecret: string }> =>
      request('/billing/setup-intent', { method: 'POST' }),

    addPaymentMethod: (paymentMethodId: string): Promise<PaymentMethod> =>
      request('/billing/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ paymentMethodId }),
      }),

    deletePaymentMethod: (paymentMethodId: string): Promise<{ message: string }> =>
      request(`/billing/payment-methods/${paymentMethodId}`, { method: 'DELETE' }),

    setDefaultPaymentMethod: (paymentMethodId: string): Promise<{ message: string }> =>
      request(`/billing/payment-methods/${paymentMethodId}/default`, { method: 'POST' }),

    getPlan: (): Promise<BillingPlan> =>
      request('/billing/plan'),

    upgradePlan: (planId: string): Promise<{ checkoutUrl?: string; message: string }> =>
      request('/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      }),
  },

  // ============ Trash / Recycle Bin ============
  trash: {
    getSummary: (): Promise<TrashSummary> => request('/trash'),

    list: (
      entityType: TrashEntityType,
      params?: { search?: string; page?: number; pageSize?: number }
    ): Promise<TrashListResponse> =>
      request(`/trash/${entityType}`, { params }),

    restore: (entityType: TrashEntityType, id: string): Promise<{ message: string }> =>
      request(`/trash/${entityType}/${id}/restore`, { method: 'POST' }),

    permanentDelete: (entityType: TrashEntityType, id: string): Promise<{ message: string }> =>
      request(`/trash/${entityType}/${id}/permanent`, { method: 'DELETE' }),

    emptyAll: (entityType?: TrashEntityType): Promise<{ deletedCounts: Record<string, number>; total: number }> =>
      request('/trash/empty', {
        method: 'POST',
        body: JSON.stringify({ entityType }),
      }),
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
