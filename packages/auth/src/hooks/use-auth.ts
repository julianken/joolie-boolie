'use client';

import { useContext } from 'react';
import { AuthContext } from '../components/auth-provider';
import type { AuthContextValue } from '../types';

/**
 * Hook to access the full auth context including user, session, and auth actions.
 *
 * @returns Auth context with user, session, loading state, and auth methods
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```typescript
 * function LoginButton() {
 *   const { user, signIn, signOut, isLoading } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   if (user) {
 *     return <button onClick={signOut}>Sign Out</button>;
 *   }
 *
 *   return (
 *     <button onClick={() => signIn('user@example.com', 'password')}>
 *       Sign In
 *     </button>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure you have wrapped your app with <AuthProvider>.'
    );
  }

  return context;
}
