/**
 * Generic mutation hook for database operations
 */

import { useState, useCallback, useRef } from 'react';
import type { TypedSupabaseClient } from '../client';
import { isDatabaseError, type DatabaseError } from '../errors';

// =============================================================================
// Types
// =============================================================================

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MutationState<TData> {
  /** The mutation result data */
  data: TData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Success state */
  isSuccess: boolean;
  /** Idle state (not yet mutated) */
  isIdle: boolean;
  /** Current status */
  status: MutationStatus;
  /** Error if mutation failed */
  error: DatabaseError | Error | null;
}

export interface MutationOptions<TData, TVariables> {
  /** Callback when mutation succeeds */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Callback when mutation fails */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
  /** Callback when mutation completes (success or error) */
  onSettled?: (
    data: TData | null,
    error: Error | null,
    variables: TVariables
  ) => void | Promise<void>;
  /** Callback before mutation starts */
  onMutate?: (variables: TVariables) => void | Promise<void>;
}

export interface MutationResult<TData, TVariables> extends MutationState<TData> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => void;
  /** Execute the mutation and return a promise */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Reset the mutation state */
  reset: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Generic mutation hook for database operations
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useMutation(
 *   client,
 *   async (client, data) => createBingoTemplate(client, data),
 *   {
 *     onSuccess: (template) => {
 *       console.log('Created template:', template.id);
 *     },
 *   }
 * );
 *
 * // Later:
 * mutate({ user_id: userId, name: 'My Template', pattern_id: 'regular' });
 * ```
 */
export function useMutation<TData, TVariables>(
  client: TypedSupabaseClient | null,
  mutationFn: (client: TypedSupabaseClient, variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled, onMutate } = options;

  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: 'idle',
    error: null,
  });

  const isMounted = useRef(true);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      status: 'idle',
      error: null,
    });
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      if (!client) {
        throw new Error('Supabase client is not available');
      }

      setState({
        data: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        isIdle: false,
        status: 'loading',
        error: null,
      });

      try {
        await onMutate?.(variables);
        const data = await mutationFn(client, variables);

        if (isMounted.current) {
          setState({
            data,
            isLoading: false,
            isError: false,
            isSuccess: true,
            isIdle: false,
            status: 'success',
            error: null,
          });
        }

        await onSuccess?.(data, variables);
        await onSettled?.(data, null, variables);

        return data;
      } catch (err) {
        const error = isDatabaseError(err)
          ? err
          : err instanceof Error
            ? err
            : new Error(String(err));

        if (isMounted.current) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            isSuccess: false,
            isIdle: false,
            status: 'error',
            error,
          });
        }

        await onError?.(error, variables);
        await onSettled?.(null, error, variables);

        throw error;
      }
    },
    [client, mutationFn, onMutate, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error is handled by state and callbacks
      });
    },
    [mutateAsync]
  );

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}

/**
 * Convenience hook for create operations
 */
export function useCreateMutation<TData, TInsert>(
  client: TypedSupabaseClient | null,
  createFn: (client: TypedSupabaseClient, data: TInsert) => Promise<TData>,
  options: MutationOptions<TData, TInsert> = {}
): MutationResult<TData, TInsert> {
  return useMutation(client, createFn, options);
}

/**
 * Convenience hook for update operations
 */
export interface UpdateVariables<TUpdate> {
  id: string;
  data: TUpdate;
}

export function useUpdateMutation<TData, TUpdate>(
  client: TypedSupabaseClient | null,
  updateFn: (client: TypedSupabaseClient, id: string, data: TUpdate) => Promise<TData>,
  options: MutationOptions<TData, UpdateVariables<TUpdate>> = {}
): MutationResult<TData, UpdateVariables<TUpdate>> {
  return useMutation(
    client,
    (c, { id, data }) => updateFn(c, id, data),
    options
  );
}

/**
 * Convenience hook for delete operations
 */
export function useDeleteMutation(
  client: TypedSupabaseClient | null,
  deleteFn: (client: TypedSupabaseClient, id: string) => Promise<void>,
  options: MutationOptions<void, string> = {}
): MutationResult<void, string> {
  return useMutation(client, deleteFn, options);
}

/**
 * Hook for optimistic updates
 *
 * @example
 * ```tsx
 * const { mutate } = useOptimisticMutation(
 *   client,
 *   async (client, data) => updateProfile(client, data),
 *   {
 *     optimisticUpdate: (variables) => ({
 *       ...currentProfile,
 *       ...variables,
 *     }),
 *     onSuccess: () => refetch(),
 *   }
 * );
 * ```
 */
export interface OptimisticMutationOptions<TData, TVariables>
  extends MutationOptions<TData, TVariables> {
  /** Function to compute optimistic data */
  optimisticUpdate: (variables: TVariables) => TData;
  /** Function to rollback on error */
  rollback?: () => void;
}

export function useOptimisticMutation<TData, TVariables>(
  client: TypedSupabaseClient | null,
  mutationFn: (client: TypedSupabaseClient, variables: TVariables) => Promise<TData>,
  options: OptimisticMutationOptions<TData, TVariables>
): MutationResult<TData, TVariables> & { optimisticData: TData | null } {
  const { optimisticUpdate, rollback, onError, ...restOptions } = options;

  const [optimisticData, setOptimisticData] = useState<TData | null>(null);

  const mutation = useMutation(client, mutationFn, {
    ...restOptions,
    onMutate: async (variables) => {
      const optimistic = optimisticUpdate(variables);
      setOptimisticData(optimistic);
      await options.onMutate?.(variables);
    },
    onError: async (error, variables) => {
      setOptimisticData(null);
      rollback?.();
      await onError?.(error, variables);
    },
    onSettled: async (data, error, variables) => {
      setOptimisticData(null);
      await options.onSettled?.(data, error, variables);
    },
  });

  return {
    ...mutation,
    optimisticData,
    // Return optimistic data while loading, actual data after success
    data: mutation.isLoading ? optimisticData : mutation.data,
  };
}

export default useMutation;
