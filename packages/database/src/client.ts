/**
 * Supabase client wrapper with type safety
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// =============================================================================
// Types
// =============================================================================

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
    db?: {
      schema?: string;
    };
  };
}

// Use a simpler type alias that works with Supabase's complex generics
export type TypedSupabaseClient = SupabaseClient<Database, 'public'>;

// =============================================================================
// Client Factory
// =============================================================================

let defaultClient: TypedSupabaseClient | null = null;

/**
 * Creates a typed Supabase client
 */
export function createClient(config: DatabaseConfig): TypedSupabaseClient {
  return createSupabaseClient<Database, 'public'>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: config.options?.auth?.autoRefreshToken ?? true,
      persistSession: config.options?.auth?.persistSession ?? true,
      detectSessionInUrl: config.options?.auth?.detectSessionInUrl ?? true,
    },
    global: {
      headers: config.options?.global?.headers ?? {},
    },
    db: {
      schema: (config.options?.db?.schema ?? 'public') as 'public',
    },
  });
}

/**
 * Creates a Supabase client from environment variables
 * For use in browser/client components
 */
export function createBrowserClient(): TypedSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createClient({
    supabaseUrl,
    supabaseAnonKey,
    options: {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  });
}

/**
 * Gets or creates a singleton browser client
 * Useful for sharing client across components
 */
export function getBrowserClient(): TypedSupabaseClient {
  if (!defaultClient) {
    defaultClient = createBrowserClient();
  }
  return defaultClient;
}

/**
 * Resets the default client (useful for testing)
 */
export function resetClient(): void {
  defaultClient = null;
}

// =============================================================================
// Server Client Helper Types
// =============================================================================

/**
 * Cookie handler interface for server-side client
 * Compatible with Next.js cookies() API
 */
export interface CookieHandler {
  getAll(): { name: string; value: string }[];
  setAll(
    cookies: {
      name: string;
      value: string;
      options?: {
        domain?: string;
        expires?: Date;
        httpOnly?: boolean;
        maxAge?: number;
        path?: string;
        sameSite?: 'lax' | 'strict' | 'none';
        secure?: boolean;
      };
    }[]
  ): void;
}

/**
 * Creates config for server-side Supabase client
 * Note: The actual createServerClient should be imported from @supabase/ssr
 * This helper provides the typed config for consistency
 */
export function getServerClientConfig(cookieHandler: CookieHandler): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  options: {
    cookies: CookieHandler;
  };
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    options: {
      cookies: cookieHandler,
    },
  };
}

// =============================================================================
// Client Utilities
// =============================================================================

/**
 * Gets the current authenticated user from a client
 */
export async function getCurrentUser(client: TypedSupabaseClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

/**
 * Gets the current session from a client
 */
export async function getSession(client: TypedSupabaseClient) {
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

/**
 * Checks if a user is authenticated
 */
export async function isAuthenticated(client: TypedSupabaseClient): Promise<boolean> {
  try {
    const user = await getCurrentUser(client);
    return user !== null;
  } catch {
    return false;
  }
}
