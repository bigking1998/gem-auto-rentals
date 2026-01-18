import { useCallback } from 'react';
import { useQuery, useMutation } from './useQuery';
import { api, Vehicle, VehicleFiltersParams, PaginatedResponse } from '@/lib/api';
import { cacheKeys, cacheTTL, apiCache } from '@/lib/cache';

/**
 * Hook for fetching a list of vehicles with filters
 */
export function useVehicles(filters?: VehicleFiltersParams) {
  const filterKey = filters ? JSON.stringify(filters) : 'all';
  const cacheKey = `${cacheKeys.vehicles()}:${filterKey}`;

  return useQuery<PaginatedResponse<Vehicle>>(
    () => api.vehicles.list(filters),
    {
      cacheKey,
      ttl: cacheTTL.medium,
      staleWhileRevalidate: true,
    }
  );
}

/**
 * Hook for fetching a single vehicle by ID
 */
export function useVehicle(id: string | undefined) {
  return useQuery<Vehicle>(
    () => api.vehicles.get(id!),
    {
      cacheKey: cacheKeys.vehicle(id || ''),
      ttl: cacheTTL.long,
      enabled: !!id,
      staleWhileRevalidate: true,
    }
  );
}

/**
 * Hook for checking vehicle availability
 */
export function useVehicleAvailability(
  vehicleId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined
) {
  const enabled = !!(vehicleId && startDate && endDate);
  const cacheKey = `vehicle:${vehicleId}:availability:${startDate}:${endDate}`;

  return useQuery<{ available: boolean }>(
    () => api.vehicles.getAvailability(vehicleId!, startDate!, endDate!),
    {
      cacheKey,
      ttl: cacheTTL.short, // Short TTL for availability
      enabled,
      staleWhileRevalidate: false, // Always fetch fresh availability
    }
  );
}

/**
 * Hook for prefetching vehicles (e.g., for featured section)
 */
export function usePrefetchVehicles() {
  return useCallback(async (filters?: VehicleFiltersParams) => {
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    const cacheKey = `${cacheKeys.vehicles()}:${filterKey}`;

    await apiCache.get(
      cacheKey,
      () => api.vehicles.list(filters),
      { ttl: cacheTTL.medium }
    );
  }, []);
}

/**
 * Hook for invalidating vehicle cache
 */
export function useInvalidateVehicles() {
  return useCallback(() => {
    apiCache.invalidatePattern(/^vehicles/);
  }, []);
}
