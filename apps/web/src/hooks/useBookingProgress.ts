import { useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface BookingProgressData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  extras?: Record<string, unknown>;
  step: number;
}

/**
 * Hook for tracking booking progress for abandonment recovery.
 * Debounces tracking calls to avoid excessive API calls.
 */
export function useBookingProgress(data: BookingProgressData | null) {
  const { isAuthenticated, user } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackedRef = useRef<string>('');

  const trackProgress = useCallback(async (progressData: BookingProgressData) => {
    // Only track if we have valid data
    if (!progressData.vehicleId || !progressData.startDate || !progressData.endDate) {
      return;
    }

    // Create a hash of the data to avoid duplicate tracking
    const dataHash = JSON.stringify({
      vehicleId: progressData.vehicleId,
      startDate: progressData.startDate,
      endDate: progressData.endDate,
      step: progressData.step,
    });

    // Skip if we already tracked this exact state
    if (dataHash === lastTrackedRef.current) {
      return;
    }

    lastTrackedRef.current = dataHash;

    try {
      await api.abandonment.track({
        vehicleId: progressData.vehicleId,
        startDate: progressData.startDate,
        endDate: progressData.endDate,
        extras: progressData.extras,
        step: progressData.step,
        email: user?.email,
      });
    } catch (error) {
      // Silently fail - this is non-critical tracking
      console.debug('Failed to track booking progress:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    // Track for anyone with valid booking data
    // (both authenticated users and guests can be tracked for abandonment recovery)
    if (!data) {
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the tracking call (wait 2 seconds after last change)
    timeoutRef.current = setTimeout(() => {
      trackProgress(data);
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, trackProgress]);

  // Method to mark the booking as completed (removes from abandonment tracking)
  const markCompleted = useCallback(async (vehicleId: string) => {
    if (!isAuthenticated) return;

    try {
      await api.abandonment.complete(vehicleId);
      lastTrackedRef.current = ''; // Reset tracking state
    } catch (error) {
      console.debug('Failed to mark abandonment as completed:', error);
    }
  }, [isAuthenticated]);

  return { markCompleted };
}

export default useBookingProgress;
