/**
 * Server-side Database Client for Trivia App
 *
 * SECURITY WARNING: This client uses the service role key which has FULL database access.
 * ONLY use this in API routes (server-side). NEVER expose to client-side code.
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  error?: string;
  latency?: number;
}

// =============================================================================
// Client Cache
// =============================================================================

let cachedClient: ReturnType<typeof createClient> | null = null;

// =============================================================================
// Client Factory
// =============================================================================

export function getDbClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables for server-side database client.\n' +
        'Required:\n' +
        '  - NEXT_PUBLIC_SUPABASE_URL\n' +
        '  - SUPABASE_SERVICE_ROLE_KEY (server-side only)\n\n' +
        'See .env.example for setup instructions.\n' +
        'SECURITY: Never expose SUPABASE_SERVICE_ROLE_KEY to the client!'
    );
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

export function resetClient(): void {
  cachedClient = null;
}

// =============================================================================
// Connection Utilities
// =============================================================================

export async function testConnection(): Promise<ConnectionTestResult> {
  try {
    const startTime = Date.now();
    const client = getDbClient();
    const { error } = await client.from('profiles').select('count').limit(1).maybeSingle();
    const latency = Date.now() - startTime;

    if (error) {
      return {
        success: false,
        message: 'Database query failed',
        error: error.message,
        latency,
      };
    }

    return {
      success: true,
      message: 'Database connection successful',
      latency,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to create database client',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getConnectionInfo() {
  return {
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    clientCached: cachedClient !== null,
  };
}
