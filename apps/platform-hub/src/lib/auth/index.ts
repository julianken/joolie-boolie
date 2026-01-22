/**
 * Authentication Library
 *
 * Exports:
 * - OAuth to Supabase bridge functions
 * - Auth types and error codes
 */

export {
  createSupabaseSession,
  refreshSupabaseSession,
  revokeSupabaseSession,
  BridgeErrorCode,
  type OAuthUserInfo,
  type CreateSessionResult,
  type ProfileSyncOptions,
} from './supabase-bridge';
