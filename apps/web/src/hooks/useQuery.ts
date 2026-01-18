import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache, cacheTTL } from '@/lib/cache';

interface UseQueryOptions<T> {
  /** Cache key for this query */
  cacheKey: string;
  /** Time to live for cache in milliseconds */
  ttl?: number;
  /** Whether to enable caching */
  enabled?: boolean;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Return stale data while revalidating */
  staleWhileRevalidate?: boolean;
  /** Callback when data is successfully fetched */
  onSuccess?: (data: T) => void;
  /** Callback when fetch fails */
  onError?: (error: Error) => void;
}

interface UseQueryResult<T> {
  /** The fetched data */
  data: T | undefined;
  /** Whether the query is currently loading */
  isLoading: boolean;
  /** Whether the data is being revalidated in the background */
  isRevalidating: boolean;
  /** Any error that occurred during fetching */
  error: Error | null;
  /** Manually refetch the data */
  refetch: () => Promise<void>;
  /** Invalidate the cache for this query */
  invalidate: () => void;
}

/**
 * Custom hook for data fetching with caching support
 * Similar to React Query / SWR but simpler
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T>
): UseQueryResult<T> {
  const {
    cacheKey,
    ttl = cacheTTL.medium,
    enabled = true,
    fetchOnMount = true,
    staleWhileRevalidate = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(fetchOnMount && enabled);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled) return;

    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRevalidating(true);
    }
    setError(null);

    try {
      const result = await apiCache.get<T>(
        cacheKey,
        () => fetcherRef.current(),
        { ttl, staleWhileRevalidate }
      );

      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRevalidating(false);
      }
    }
  }, [cacheKey, ttl, enabled, staleWhileRevalidate, onSuccess, onError]);

  const refetch = useCallback(async () => {
    apiCache.invalidate(cacheKey);
    await fetchData(true);
  }, [cacheKey, fetchData]);

  const invalidate = useCallback(() => {
    apiCache.invalidate(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    mountedRef.current = true;

    if (fetchOnMount && enabled) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchOnMount, enabled, fetchData]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
interface UseMutationOptions<T, V> {
  /** Callback when mutation succeeds */
  onSuccess?: (data: T, variables: V) => void;
  /** Callback when mutation fails */
  onError?: (error: Error, variables: V) => void;
  /** Cache keys to invalidate after successful mutation */
  invalidateKeys?: string[];
}

interface UseMutationResult<T, V> {
  /** Execute the mutation */
  mutate: (variables: V) => Promise<T | undefined>;
  /** The result data */
  data: T | undefined;
  /** Whether the mutation is in progress */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Reset the mutation state */
  reset: () => void;
}

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, invalidateKeys } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  const mutate = useCallback(async (variables: V): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFnRef.current(variables);
      setData(result);

      // Invalidate specified cache keys
      if (invalidateKeys) {
        invalidateKeys.forEach(key => apiCache.invalidate(key));
      }

      onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error, variables);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [invalidateKeys, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    data,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for paginated queries
 */
interface UsePaginatedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'cacheKey'> {
  /** Base cache key (page number will be appended) */
  baseCacheKey: string;
  /** Items per page */
  pageSize?: number;
}

interface UsePaginatedQueryResult<T> extends Omit<UseQueryResult<T>, 'data'> {
  data: T | undefined;
  page: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePaginatedQuery<T extends { total?: number; items?: unknown[] }>(
  fetcher: (page: number, pageSize: number) => Promise<T>,
  options: UsePaginatedQueryOptions<T>
): UsePaginatedQueryResult<T> {
  const { baseCacheKey, pageSize = 10, ...queryOptions } = options;

  const [page, setPage] = useState(1);

  const cacheKey = `${baseCacheKey}:page:${page}:size:${pageSize}`;

  const query = useQuery<T>(
    () => fetcher(page, pageSize),
    { ...queryOptions, cacheKey }
  );

  const totalItems = query.data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(p => p + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(p => p - 1);
    }
  }, [hasPrevPage]);

  return {
    ...query,
    page,
    setPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  };
}
