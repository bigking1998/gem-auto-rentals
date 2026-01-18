import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiCache, cacheKeys, cacheTTL } from '../cache';

describe('ApiCache', () => {
  beforeEach(() => {
    apiCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get', () => {
    it('should fetch and cache data', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const result = await apiCache.get('test-key', fetcher);

      expect(result).toEqual({ data: 'test' });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on subsequent calls', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      await apiCache.get('test-key', fetcher);
      const result = await apiCache.get('test-key', fetcher);

      expect(result).toEqual({ data: 'test' });
      expect(fetcher).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should fetch fresh data after TTL expires', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce({ data: 'first' })
        .mockResolvedValueOnce({ data: 'second' });

      await apiCache.get('test-key', fetcher, { ttl: 1000, staleWhileRevalidate: false });

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      const result = await apiCache.get('test-key', fetcher, { ttl: 1000, staleWhileRevalidate: false });

      expect(result).toEqual({ data: 'second' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should return stale data while revalidating', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce({ data: 'first' })
        .mockResolvedValueOnce({ data: 'second' });

      await apiCache.get('test-key', fetcher, { ttl: 1000 });

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      // Should return stale data immediately
      const result = await apiCache.get('test-key', fetcher, { ttl: 1000 });

      expect(result).toEqual({ data: 'first' }); // Returns stale data
    });

    it('should deduplicate concurrent requests', async () => {
      let resolveCount = 0;
      const fetcher = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolveCount++;
            resolve({ data: `result-${resolveCount}` });
          }, 100);
        });
      });

      // Make multiple concurrent requests
      const promise1 = apiCache.get('test-key', fetcher);
      const promise2 = apiCache.get('test-key', fetcher);
      const promise3 = apiCache.get('test-key', fetcher);

      vi.advanceTimersByTime(100);

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // All should get the same result
      expect(result1).toEqual({ data: 'result-1' });
      expect(result2).toEqual({ data: 'result-1' });
      expect(result3).toEqual({ data: 'result-1' });

      // Fetcher should only be called once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('set', () => {
    it('should manually set cache values', async () => {
      apiCache.set('manual-key', { data: 'manual' });

      const fetcher = vi.fn().mockResolvedValue({ data: 'fetched' });
      const result = await apiCache.get('manual-key', fetcher);

      expect(result).toEqual({ data: 'manual' });
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('should invalidate specific cache key', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce({ data: 'first' })
        .mockResolvedValueOnce({ data: 'second' });

      await apiCache.get('test-key', fetcher);

      apiCache.invalidate('test-key');

      const result = await apiCache.get('test-key', fetcher);

      expect(result).toEqual({ data: 'second' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should not affect other cache keys', async () => {
      const fetcher1 = vi.fn().mockResolvedValue({ data: 'data1' });
      const fetcher2 = vi.fn().mockResolvedValue({ data: 'data2' });

      await apiCache.get('key1', fetcher1);
      await apiCache.get('key2', fetcher2);

      apiCache.invalidate('key1');

      // key2 should still be cached
      await apiCache.get('key2', fetcher2);
      expect(fetcher2).toHaveBeenCalledTimes(1);

      // key1 needs to be refetched
      await apiCache.get('key1', fetcher1);
      expect(fetcher1).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys matching string pattern', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      await apiCache.get('vehicles:1', fetcher);
      await apiCache.get('vehicles:2', fetcher);
      await apiCache.get('bookings:1', fetcher);

      apiCache.invalidatePattern('vehicles');

      const stats = apiCache.getStats();
      expect(stats.keys).toContain('bookings:1');
      expect(stats.keys).not.toContain('vehicles:1');
      expect(stats.keys).not.toContain('vehicles:2');
    });

    it('should invalidate keys matching regex pattern', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      await apiCache.get('vehicle:1:details', fetcher);
      await apiCache.get('vehicle:2:details', fetcher);
      await apiCache.get('booking:1', fetcher);

      apiCache.invalidatePattern(/^vehicle:\d+/);

      const stats = apiCache.getStats();
      expect(stats.keys).toContain('booking:1');
      expect(stats.keys).not.toContain('vehicle:1:details');
      expect(stats.keys).not.toContain('vehicle:2:details');
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      await apiCache.get('key1', fetcher);
      await apiCache.get('key2', fetcher);
      await apiCache.get('key3', fetcher);

      apiCache.clear();

      const stats = apiCache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      await apiCache.get('key1', fetcher);
      await apiCache.get('key2', fetcher);

      const stats = apiCache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });
});

describe('cacheKeys', () => {
  it('should generate correct vehicles key', () => {
    expect(cacheKeys.vehicles()).toBe('vehicles');
  });

  it('should generate correct vehicle key with id', () => {
    expect(cacheKeys.vehicle('123')).toBe('vehicle:123');
  });

  it('should generate correct vehicles by category key', () => {
    expect(cacheKeys.vehiclesByCategory('SUV')).toBe('vehicles:category:SUV');
  });

  it('should generate correct bookings key', () => {
    expect(cacheKeys.bookings()).toBe('bookings');
    expect(cacheKeys.bookings('user-123')).toBe('bookings:user:user-123');
  });

  it('should generate correct booking key with id', () => {
    expect(cacheKeys.booking('booking-456')).toBe('booking:booking-456');
  });
});

describe('cacheTTL', () => {
  it('should have correct TTL values', () => {
    expect(cacheTTL.short).toBe(60000); // 1 minute
    expect(cacheTTL.medium).toBe(300000); // 5 minutes
    expect(cacheTTL.long).toBe(900000); // 15 minutes
    expect(cacheTTL.veryLong).toBe(3600000); // 1 hour
  });
});
