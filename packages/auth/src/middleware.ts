import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { AuthConfig, AuthUser } from './types';

/**
 * Middleware configuration options
 */
export interface MiddlewareConfig extends AuthConfig {
  /**
   * Paths that require authentication (supports glob patterns)
   * @example ['/dashboard/*', '/api/protected/*']
   */
  protectedPaths?: string[];
  /**
   * Paths that should redirect to home if already authenticated
   * @example ['/login', '/signup']
   */
  authPaths?: string[];
  /**
   * URL to redirect to when authentication is required
   * @default '/login'
   */
  loginUrl?: string;
  /**
   * URL to redirect to after successful authentication
   * @default '/'
   */
  homeUrl?: string;
  /**
   * Callback for custom redirect logic
   */
  onAuthRequired?: (request: NextRequest, user: AuthUser | null) => NextResponse | null;
}

/**
 * Updates the Supabase session from cookies and refreshes tokens if needed.
 * This is the core session management function for Next.js middleware.
 *
 * @param request - The Next.js request object
 * @param config - Optional configuration overrides
 * @returns NextResponse with updated cookies
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { updateSession } from '@beak-gaming/auth/middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request);
 * }
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * };
 * ```
 */
export async function updateSession(
  request: NextRequest,
  config?: AuthConfig
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = config?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config?.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      '[Auth Middleware] Missing Supabase configuration. Skipping session update.'
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session - this will update cookies if needed
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * Creates middleware that handles session management and route protection.
 * Use this for more advanced auth requirements with protected routes.
 *
 * @param config - Middleware configuration options
 * @returns Middleware handler function
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createAuthMiddleware } from '@beak-gaming/auth/middleware';
 *
 * export const middleware = createAuthMiddleware({
 *   protectedPaths: ['/dashboard/*', '/api/protected/*'],
 *   authPaths: ['/login', '/signup'],
 *   loginUrl: '/login',
 *   homeUrl: '/dashboard',
 * });
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * };
 * ```
 */
export function createAuthMiddleware(config: MiddlewareConfig = {}) {
  const {
    protectedPaths = [],
    authPaths = [],
    loginUrl = '/login',
    homeUrl = '/',
    onAuthRequired,
    ...authConfig
  } = config;

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    let supabaseResponse = NextResponse.next({ request });

    const url = authConfig.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = authConfig.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.warn(
        '[Auth Middleware] Missing Supabase configuration. Skipping auth check.'
      );
      return supabaseResponse;
    }

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // Check if path matches any protected paths
    const isProtectedPath = protectedPaths.some((pattern) =>
      matchPath(pathname, pattern)
    );

    // Check if path is an auth path (login/signup)
    const isAuthPath = authPaths.some((pattern) =>
      matchPath(pathname, pattern)
    );

    // Custom auth handling
    if (onAuthRequired && isProtectedPath) {
      const customResponse = onAuthRequired(request, user);
      if (customResponse) {
        return customResponse;
      }
    }

    // Redirect to login if accessing protected path without auth
    if (isProtectedPath && !user) {
      const redirectUrl = new URL(loginUrl, request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect to home if accessing auth paths while already authenticated
    if (isAuthPath && user) {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || homeUrl;
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    return supabaseResponse;
  };
}

/**
 * Simple glob-style path matching
 * Supports:
 * - Exact matches: '/dashboard' matches '/dashboard'
 * - Wildcard suffix: '/api/*' matches '/api/users', '/api/posts/123'
 * - Single segment wildcard: '/users/[id]' matches '/users/123'
 */
function matchPath(pathname: string, pattern: string): boolean {
  // Exact match
  if (pattern === pathname) {
    return true;
  }

  // Wildcard suffix match (e.g., '/api/*')
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return pathname === prefix || pathname.startsWith(prefix + '/');
  }

  // Convert [param] style to regex
  if (pattern.includes('[') && pattern.includes(']')) {
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, '[^/]+')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  }

  return false;
}

/**
 * Helper to get user from middleware context
 * Use this in middleware when you need to access the user
 *
 * @param request - The Next.js request object
 * @param config - Optional configuration overrides
 * @returns The authenticated user or null
 */
export async function getMiddlewareUser(
  request: NextRequest,
  config?: AuthConfig
): Promise<AuthUser | null> {
  const url = config?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config?.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // No-op for read-only access
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
