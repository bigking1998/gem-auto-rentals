/**
 * Simple in-memory cache with TTL support
 * For production, consider using a more robust solution like React Query or SWR
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();

  /**
   * Get cached data or fetch from the API
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;
    const now = Date.now();

    // Check if we have a valid cached entry
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    if (cached) {
      const isExpired = now > cached.expiresAt;

      if (!isExpired) {
        // Return fresh cached data
        return cached.data;
      }

      if (staleWhileRevalidate) {
        // Return stale data while fetching in background
        this.revalidate(key, fetcher, ttl);
        return cached.data;
      }
    }

    // No cache or expired without stale-while-revalidate
    return this.fetchAndCache(key, fetcher, ttl);
  }

  /**
   * Fetch data and store in cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }

    // Create new fetch promise
    const fetchPromise = fetcher()
      .then((data) => {
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Revalidate cache in background
   */
  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    // Don't revalidate if already pending
    if (this.pendingRequests.has(key)) {
      return;
    }

    try {
      const data = await this.fetchAndCache(key, fetcher, ttl);
      this.set(key, data, ttl);
    } catch (error) {
      console.warn(`Cache revalidation failed for key: ${key}`, error);
    }
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }

    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const apiCache = new ApiCache();

// Cache key generators
export const cacheKeys = {
  vehicles: () => 'vehicles',
  vehicle: (id: string) => `vehicle:${id}`,
  vehiclesByCategory: (category: string) => `vehicles:category:${category}`,
  bookings: (userId?: string) => userId ? `bookings:user:${userId}` : 'bookings',
  booking: (id: string) => `booking:${id}`,
};

// Cache TTL presets (in milliseconds)
export const cacheTTL = {
  short: 1 * 60 * 1000,      // 1 minute
  medium: 5 * 60 * 1000,     // 5 minutes
  long: 15 * 60 * 1000,      // 15 minutes
  veryLong: 60 * 60 * 1000,  // 1 hour
};
