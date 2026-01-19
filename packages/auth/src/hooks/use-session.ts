'use client';

import { useContext, useMemo } from 'react';
import { AuthContext } from '../components/auth-provider';
import type { AuthSession } from '../types';

/**
 * Result of useSession hook
 */
export interface UseSessionResult {
  /**
   * Current session or null if not authenticated
   */
  session: AuthSession | null;
  /**
   * Whether the session is being loaded
   */
  isLoading: boolean;
  /**
   * Whether there is an active session
   */
  isAuthenticated: boolean;
  /**
   * Access token for API requests
   */
  accessToken: string | null;
  /**
   * Refresh the session
   */
  refresh: () => Promise<void>;
}

/**
 * Hook to access the current auth session.
 * Provides session data, loading state, and refresh capability.
 *
 * @returns Session data and utilities
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```typescript
 * function ApiCaller() {
 *   const { session, accessToken, isAuthenticated } = useSession();
 *
 *   const fetchData = async () => {
 *     if (!accessToken) return;
 *
 *     const response = await fetch('/api/data', {
 *       headers: { Authorization: `Bearer ${accessToken}` }
 *     });
 *     return response.json();
 *   };
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return <button onClick={fetchData}>Fetch Data</button>;
 * }
 * ```
 */
export function useSession(): UseSessionResult {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useSession must be used within an AuthProvider. ' +
      'Make sure you have wrapped your app with <AuthProvider>.'
    );
  }

  const { session, isLoading, refreshSession } = context;

  return useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: !!session,
      accessToken: session?.access_token ?? null,
      refresh: refreshSession,
    }),
    [session, isLoading, refreshSession]
  );
}
