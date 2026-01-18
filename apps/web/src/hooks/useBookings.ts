import { useCallback } from 'react';
import { useQuery, useMutation } from './useQuery';
import { api, Booking, CreateBookingData, PaginatedResponse } from '@/lib/api';
import { cacheKeys, cacheTTL, apiCache } from '@/lib/cache';

/**
 * Hook for fetching user's bookings
 */
export function useBookings(filters?: { status?: string; page?: number; limit?: number }) {
  const filterKey = filters ? JSON.stringify(filters) : 'all';
  const cacheKey = `${cacheKeys.bookings()}:${filterKey}`;

  return useQuery<PaginatedResponse<Booking>>(
    () => api.bookings.list(filters),
    {
      cacheKey,
      ttl: cacheTTL.short, // Shorter TTL for bookings as they change more often
      staleWhileRevalidate: true,
    }
  );
}

/**
 * Hook for fetching a single booking
 */
export function useBooking(id: string | undefined) {
  return useQuery<Booking>(
    () => api.bookings.get(id!),
    {
      cacheKey: cacheKeys.booking(id || ''),
      ttl: cacheTTL.short,
      enabled: !!id,
      staleWhileRevalidate: true,
    }
  );
}

/**
 * Hook for creating a new booking
 */
export function useCreateBooking() {
  return useMutation<Booking, CreateBookingData>(
    (data) => api.bookings.create(data),
    {
      invalidateKeys: [cacheKeys.bookings()],
      onSuccess: () => {
        // Invalidate all booking-related caches
        apiCache.invalidatePattern(/^bookings/);
      },
    }
  );
}

/**
 * Hook for cancelling a booking
 */
export function useCancelBooking() {
  return useMutation<Booking, string>(
    (id) => api.bookings.cancel(id),
    {
      onSuccess: (_, bookingId) => {
        // Invalidate the specific booking and the list
        apiCache.invalidate(cacheKeys.booking(bookingId));
        apiCache.invalidatePattern(/^bookings/);
      },
    }
  );
}

/**
 * Hook for invalidating booking cache
 */
export function useInvalidateBookings() {
  return useCallback(() => {
    apiCache.invalidatePattern(/^bookings/);
  }, []);
}
