'use client';

import { useContext, useMemo } from 'react';
import { AuthContext } from '../components/auth-provider';
import type { AuthUser } from '../types';

/**
 * Result of useUser hook
 */
export interface UseUserResult {
  /**
   * Current user or null if not authenticated
   */
  user: AuthUser | null;
  /**
   * Whether the user is being loaded
   */
  isLoading: boolean;
  /**
   * Whether there is an authenticated user
   */
  isAuthenticated: boolean;
  /**
   * User's email (convenience accessor)
   */
  email: string | null;
  /**
   * User's ID (convenience accessor)
   */
  userId: string | null;
  /**
   * User metadata (custom data set during signup)
   */
  metadata: Record<string, unknown> | null;
}

/**
 * Hook to access the current authenticated user.
 * Provides user data and common accessors for user properties.
 *
 * @returns User data and utilities
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```typescript
 * function UserProfile() {
 *   const { user, email, isAuthenticated, isLoading } = useUser();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <div>Not logged in</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {email}</h1>
 *       <pre>{JSON.stringify(user, null, 2)}</pre>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUser(): UseUserResult {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useUser must be used within an AuthProvider. ' +
      'Make sure you have wrapped your app with <AuthProvider>.'
    );
  }

  const { user, isLoading } = context;

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      email: user?.email ?? null,
      userId: user?.id ?? null,
      metadata: user?.user_metadata ?? null,
    }),
    [user, isLoading]
  );
}
