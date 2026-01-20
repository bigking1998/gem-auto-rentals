import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, tokenManager, ApiError } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

// Allowed roles for admin dashboard access
const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'SUPPORT'];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      error: null,

      initialize: async () => {
        try {
          const token = tokenManager.getToken();

          if (token) {
            // Verify token is still valid
            try {
              const apiUser = await api.auth.me();

              // Check if user has admin privileges
              if (!ADMIN_ROLES.includes(apiUser.role)) {
                tokenManager.removeToken();
                set({
                  user: null,
                  isAuthenticated: false,
                  error: 'Access denied. Admin privileges required.',
                });
              } else {
                const profile: UserProfile = {
                  id: apiUser.id,
                  email: apiUser.email,
                  firstName: apiUser.firstName,
                  lastName: apiUser.lastName,
                  phone: apiUser.phone || null,
                  role: apiUser.role,
                  avatarUrl: null,
                  emailVerified: apiUser.emailVerified,
                  createdAt: apiUser.createdAt,
                };
                set({ user: profile, isAuthenticated: true });
              }
            } catch (error) {
              // Token is invalid
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
          const response = await api.auth.login(email, password);

          // Check if user has admin privileges
          if (!ADMIN_ROLES.includes(response.user.role)) {
            set({
              isLoading: false,
              error: 'Access denied. Admin privileges required.',
            });
            return false;
          }

          // Store token
          tokenManager.setToken(response.token);

          const profile: UserProfile = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            phone: response.user.phone || null,
            role: response.user.role,
            avatarUrl: null,
            emailVerified: response.user.emailVerified,
            createdAt: response.user.createdAt,
          };

          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Login failed';

          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.auth.logout();
        } catch (error) {
          console.error('Logout API error:', error);
        }

        tokenManager.removeToken();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      fetchProfile: async () => {
        if (!tokenManager.isAuthenticated()) return;

        try {
          const apiUser = await api.auth.me();
          const profile: UserProfile = {
            id: apiUser.id,
            email: apiUser.email,
            firstName: apiUser.firstName,
            lastName: apiUser.lastName,
            phone: apiUser.phone || null,
            role: apiUser.role,
            avatarUrl: null,
            emailVerified: apiUser.emailVerified,
            createdAt: apiUser.createdAt,
          };
          set({ user: profile });
        } catch (error) {
          console.error('Profile fetch error:', error);
          if (error instanceof ApiError && error.status === 401) {
            tokenManager.removeToken();
            set({ user: null, isAuthenticated: false });
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
