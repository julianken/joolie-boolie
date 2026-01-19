'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import type { ProtectedRouteConfig } from '../types';

/**
 * ProtectedRoute props
 */
export interface ProtectedRouteProps extends ProtectedRouteConfig {
  children: React.ReactNode;
  /**
   * Fallback content to show when not authenticated
   * If not provided, children are hidden
   */
  fallback?: React.ReactNode;
  /**
   * Whether to use client-side redirect (for App Router)
   */
  useClientRedirect?: boolean;
}

/**
 * Default loading component
 */
const DefaultLoading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      fontSize: '18px',
    }}
    role="status"
    aria-label="Loading authentication status"
  >
    Loading...
  </div>
);

/**
 * Component that protects its children behind authentication.
 * Shows loading state while checking auth, redirects to login if not authenticated.
 *
 * @example
 * ```typescript
 * // Protect a page
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute loginUrl="/login">
 *       <Dashboard />
 *     </ProtectedRoute>
 *   );
 * }
 *
 * // With custom loading
 * export default function ProfilePage() {
 *   return (
 *     <ProtectedRoute
 *       loginUrl="/login"
 *       loadingComponent={<Skeleton />}
 *       fallback={<LoginPrompt />}
 *     >
 *       <Profile />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  loginUrl = '/login',
  loadingComponent,
  fallback,
  onAuthFail,
  useClientRedirect = true,
}: ProtectedRouteProps): React.ReactElement | null {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      onAuthFail?.();

      if (useClientRedirect && typeof window !== 'undefined') {
        // Build redirect URL with current path
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = new URL(loginUrl, window.location.origin);
        redirectUrl.searchParams.set('redirectTo', currentPath);
        window.location.href = redirectUrl.toString();
      }
    }
  }, [isLoading, user, loginUrl, onAuthFail, useClientRedirect]);

  // Show loading state
  if (isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  // Not authenticated
  if (!user) {
    // Show fallback if provided, otherwise return null (redirect will happen)
    return fallback ? <>{fallback}</> : null;
  }

  // Authenticated - render children
  return <>{children}</>;
}

/**
 * Higher-order component version of ProtectedRoute.
 * Use this to wrap page components.
 *
 * @example
 * ```typescript
 * // Wrap a page component
 * function DashboardPage() {
 *   return <Dashboard />;
 * }
 *
 * export default withAuth(DashboardPage, { loginUrl: '/login' });
 * ```
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: ProtectedRouteConfig = {}
): React.FC<P> {
  const WithAuthComponent: React.FC<P> = (props) => {
    return (
      <ProtectedRoute {...config}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}

/**
 * Component that only renders its children when NOT authenticated.
 * Useful for showing login/signup forms only to unauthenticated users.
 *
 * @example
 * ```typescript
 * export default function LoginPage() {
 *   return (
 *     <GuestOnly redirectTo="/dashboard">
 *       <LoginForm />
 *     </GuestOnly>
 *   );
 * }
 * ```
 */
export interface GuestOnlyProps {
  children: React.ReactNode;
  /**
   * URL to redirect to if user is authenticated
   */
  redirectTo?: string;
  /**
   * Loading component while checking auth
   */
  loadingComponent?: React.ReactNode;
}

export function GuestOnly({
  children,
  redirectTo = '/',
  loadingComponent,
}: GuestOnlyProps): React.ReactElement | null {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [isLoading, user, redirectTo]);

  // Show loading state
  if (isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  // Authenticated - redirect will happen
  if (user) {
    return null;
  }

  // Not authenticated - render children
  return <>{children}</>;
}
