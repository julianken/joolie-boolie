// Auth package - Supabase authentication wrappers
// TODO: Extract from apps/bingo/src/lib/supabase/

export const AUTH_PLACEHOLDER = true;

// Re-export types that will be implemented
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
}
