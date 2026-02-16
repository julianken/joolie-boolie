import { createServerClient as supabaseCreateServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthConfig, CookieStore } from './types';

/**
 * Creates a Supabase client for server-side usage in Next.js API routes and Server Components.
 * This function requires the cookies() function from next/headers.
 *
 * @param cookieStore - The cookie store from next/headers cookies()
 * @param config - Optional configuration overrides
 * @returns Supabase client instance configured for server-side usage
 *
 * @example
 * ```typescript
 * // In a Server Component or API route
 * import { cookies } from 'next/headers';
 * import { createServerSupabaseClient } from '@joolie-boolie/auth/server';
 *
 * export async function GET() {
 *   const cookieStore = await cookies();
 *   const supabase = createServerSupabaseClient(cookieStore);
 *   const { data: user } = await supabase.auth.getUser();
 *   return Response.json({ user });
 * }
 * ```
 */
export function createServerSupabaseClient(
  cookieStore: CookieStore,
  config?: AuthConfig
): SupabaseClient {
  const url = config?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config?.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  return supabaseCreateServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component where cookies can't be set - ignore
          // The middleware will handle cookie updates
        }
      },
    },
  });
}

/**
 * Convenience function for creating a server client with the standard Next.js cookies() function.
 * This is a wrapper that handles the async cookies() call.
 *
 * @param getCookies - Async function that returns the cookie store (typically () => cookies())
 * @param config - Optional configuration overrides
 * @returns Promise resolving to Supabase client instance
 *
 * @example
 * ```typescript
 * // In a Server Component
 * import { cookies } from 'next/headers';
 * import { createAsyncServerClient } from '@joolie-boolie/auth/server';
 *
 * export default async function Page() {
 *   const supabase = await createAsyncServerClient(() => cookies());
 *   const { data: { user } } = await supabase.auth.getUser();
 *   return <div>Hello {user?.email}</div>;
 * }
 * ```
 */
export async function createAsyncServerClient(
  getCookies: () => Promise<CookieStore>,
  config?: AuthConfig
): Promise<SupabaseClient> {
  const cookieStore = await getCookies();
  return createServerSupabaseClient(cookieStore, config);
}

// Re-export types
export type { SupabaseClient };
