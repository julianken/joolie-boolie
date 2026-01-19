/**
 * Generic query hook with loading/error states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TypedSupabaseClient } from '../client';
import { isDatabaseError, type DatabaseError } from '../errors';

// =============================================================================
// Types
// =============================================================================

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryState<T> {
  /** The query data */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Success state */
  isSuccess: boolean;
  /** Current status */
  status: QueryStatus;
  /** Error if query failed */
  error: DatabaseError | Error | null;
  /** Whether data has been fetched at least once */
  isFetched: boolean;
  /** Whether the query is currently being refetched */
  isRefetching: boolean;
}

export interface QueryOptions<T> {
  /** Whether to run the query immediately (default: true) */
  enabled?: boolean;
  /** Initial data before query completes */
  initialData?: T;
  /** Callback when query succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when query fails */
  onError?: (error: Error) => void;
  /** Refetch interval in milliseconds (0 = disabled) */
  refetchInterval?: number;
  /** Whether to refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Stale time in milliseconds - data is considered fresh within this time */
  staleTime?: number;
}

export interface QueryResult<T> extends QueryState<T> {
  /** Manually refetch the data */
  refetch: () => Promise<void>;
  /** Reset the query state */
  reset: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Generic query hook for database operations
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useQuery(
 *   client,
 *   async (client) => getProfile(client, userId),
 *   { enabled: !!userId }
 * );
 * ```
 */
export function useQuery<T>(
  client: TypedSupabaseClient | null,
  queryFn: (client: TypedSupabaseClient) => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const {
    enabled = true,
    initialData,
    onSuccess,
    onError,
    refetchInterval = 0,
    refetchOnWindowFocus = false,
    staleTime = 0,
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: initialData ?? null,
    isLoading: enabled && !!client,
    isError: false,
    isSuccess: !!initialData,
    status: initialData ? 'success' : 'idle',
    error: null,
    isFetched: !!initialData,
    isRefetching: false,
  });

  const lastFetchedAt = useRef<number | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(
    async (isRefetch = false) => {
      if (!client) return;

      // Check if data is still fresh
      if (
        staleTime > 0 &&
        lastFetchedAt.current &&
        Date.now() - lastFetchedAt.current < staleTime &&
        !isRefetch
      ) {
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: !isRefetch,
        isRefetching: isRefetch,
        status: 'loading',
      }));

      try {
        const data = await queryFn(client);
        lastFetchedAt.current = Date.now();

        if (isMounted.current) {
          setState({
            data,
            isLoading: false,
            isError: false,
            isSuccess: true,
            status: 'success',
            error: null,
            isFetched: true,
            isRefetching: false,
          });
          onSuccess?.(data);
        }
      } catch (err) {
        const error = isDatabaseError(err) ? err : (err instanceof Error ? err : new Error(String(err)));

        if (isMounted.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isError: true,
            isSuccess: false,
            status: 'error',
            error,
            isFetched: true,
            isRefetching: false,
          }));
          onError?.(error);
        }
      }
    },
    [client, queryFn, onSuccess, onError, staleTime]
  );

  const refetch = useCallback(async () => {
    await fetch(true);
  }, [fetch]);

  const reset = useCallback(() => {
    setState({
      data: initialData ?? null,
      isLoading: false,
      isError: false,
      isSuccess: !!initialData,
      status: initialData ? 'success' : 'idle',
      error: null,
      isFetched: !!initialData,
      isRefetching: false,
    });
    lastFetchedAt.current = null;
  }, [initialData]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;

    if (enabled && client) {
      fetch();
    }

    return () => {
      isMounted.current = false;
    };
  }, [enabled, client, fetch]);

  // Refetch interval
  useEffect(() => {
    if (!enabled || !client || refetchInterval <= 0) return;

    const interval = setInterval(() => {
      fetch(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, client, refetchInterval, fetch]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled || !client) return;

    const handleFocus = () => {
      fetch(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, client, fetch]);

  return {
    ...state,
    refetch,
    reset,
  };
}

/**
 * Hook for queries that depend on a parameter
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useParamQuery(
 *   client,
 *   userId,
 *   async (client, id) => getProfile(client, id),
 *   { enabled: !!userId }
 * );
 * ```
 */
export function useParamQuery<T, P>(
  client: TypedSupabaseClient | null,
  param: P,
  queryFn: (client: TypedSupabaseClient, param: P) => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const boundQueryFn = useCallback(
    (c: TypedSupabaseClient) => queryFn(c, param),
    [queryFn, param]
  );

  return useQuery(client, boundQueryFn, options);
}

/**
 * Hook for list queries with pagination support
 */
export interface ListQueryOptions<T> extends QueryOptions<T> {
  /** Current page number */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

export function useListQuery<T>(
  client: TypedSupabaseClient | null,
  queryFn: (
    client: TypedSupabaseClient,
    pagination: { page: number; pageSize: number }
  ) => Promise<T>,
  options: ListQueryOptions<T> = {}
): QueryResult<T> & { setPage: (page: number) => void } {
  const { page = 1, pageSize = 20, ...queryOptions } = options;
  const [currentPage, setCurrentPage] = useState(page);

  const boundQueryFn = useCallback(
    (c: TypedSupabaseClient) => queryFn(c, { page: currentPage, pageSize }),
    [queryFn, currentPage, pageSize]
  );

  const result = useQuery(client, boundQueryFn, queryOptions);

  return {
    ...result,
    setPage: setCurrentPage,
  };
}

export default useQuery;
