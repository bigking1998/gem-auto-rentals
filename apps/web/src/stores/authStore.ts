import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, tokenManager, ApiError, type User as ApiUser } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
  emailVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// Convert API user to store user format
function toStoreUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    phone: apiUser.phone,
    role: apiUser.role,
    emailVerified: apiUser.emailVerified,
    avatarUrl: null,
    createdAt: apiUser.createdAt,
  };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      initialize: async () => {
        try {
          // Check if we have a token stored
          const token = tokenManager.getToken();

          if (token) {
            // Verify token is still valid by fetching profile
            try {
              const apiUser = await api.auth.me();
              const user = toStoreUser(apiUser);
              set({ user, isAuthenticated: true });
            } catch (error) {
              // Token is invalid, clear it
              console.error('Token validation failed:', error);
              tokenManager.removeToken();
              set({ user: null, isAuthenticated: false });
            }
          }

          set({ isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.login({ email, password });

          // Store the token
          tokenManager.setToken(response.token);

          // Convert to store user format
          const user = toStoreUser(response.user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Login failed';

          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.register({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          });

          // Store the token
          tokenManager.setToken(response.token);

          // Convert to store user format
          const user = toStoreUser(response.user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Registration failed';

          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Call logout endpoint (optional, JWT is stateless)
          await api.auth.logout();
        } catch (error) {
          // Ignore logout API errors
          console.error('Logout API error:', error);
        }

        // Clear token and state
        tokenManager.removeToken();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      fetchProfile: async () => {
        if (!tokenManager.isAuthenticated()) return;

        try {
          const apiUser = await api.auth.me();
          const user = toStoreUser(apiUser);
          set({ user });
        } catch (error) {
          console.error('Profile fetch error:', error);
          // If profile fetch fails, user might need to re-login
          if (error instanceof ApiError && error.status === 401) {
            tokenManager.removeToken();
            set({ user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'gem-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
