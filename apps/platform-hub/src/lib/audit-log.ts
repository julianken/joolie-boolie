/**
 * OAuth Audit Logging System
 *
 * This module provides functions to log OAuth authorization events
 * to the oauth_audit_log table for security and compliance.
 *
 * All audit logs are written using the service role to bypass RLS,
 * ensuring that audit trails cannot be tampered with by users.
 *
 * Features:
 * - Logs authorization approvals, denials, and errors
 * - Captures IP address and user agent for forensics
 * - Supports flexible metadata for context-specific data
 * - Uses service role client for secure writes
 * - Type-safe with TypeScript
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Valid audit log action types
 */
export type AuditAction =
  | 'authorize_success'  // User approved authorization
  | 'authorize_deny'     // User denied authorization
  | 'authorize_error'    // Error during authorization flow
  | 'token_exchange'     // Authorization code exchanged for token
  | 'token_refresh'      // Refresh token used
  | 'token_revoke';      // Token revoked

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  user_id: string | null;
  client_id: string;
  action: AuditAction;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a service role Supabase client for audit logging.
 * This client bypasses RLS and can write to the audit log table.
 *
 * @throws {Error} If service role key is not configured
 */
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Logs an OAuth audit event to the database.
 *
 * This function should be called from server-side code only
 * (API routes, Server Components, middleware) to ensure the
 * service role key is not exposed to clients.
 *
 * @param entry - The audit log entry to write
 * @returns Promise that resolves when log is written
 * @throws {Error} If the database write fails
 *
 * @example
 * ```typescript
 * await logAuditEvent({
 *   user_id: 'uuid',
 *   client_id: 'my-app',
 *   action: 'authorize_success',
 *   ip_address: '192.168.1.1',
 *   user_agent: 'Mozilla/5.0...',
 *   metadata: {
 *     authorization_id: 'auth-123',
 *     scopes: ['openid', 'email']
 *   }
 * });
 * ```
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from('oauth_audit_log')
      .insert({
        user_id: entry.user_id,
        client_id: entry.client_id,
        action: entry.action,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
        metadata: entry.metadata || {},
      });

    if (error) {
      // Log error but don't throw - audit logging should not break the flow
      console.error('[Audit Log] Failed to write audit log:', error);
      throw error;
    }
  } catch (error) {
    // Log error for monitoring
    console.error('[Audit Log] Exception during audit logging:', error);
    throw error;
  }
}

/**
 * Helper function to log successful authorization
 *
 * @param userId - The user who approved the authorization
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID
 * @param scopes - The scopes that were approved
 * @param ipAddress - The user's IP address
 * @param userAgent - The user's browser user agent
 */
export async function logAuthorizationSuccess(
  userId: string,
  clientId: string,
  authorizationId: string,
  scopes: string[],
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    client_id: clientId,
    action: 'authorize_success',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      authorization_id: authorizationId,
      scopes,
    },
  });
}

/**
 * Helper function to log authorization denial
 *
 * @param userId - The user who denied the authorization
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID
 * @param reason - Optional reason for denial
 * @param ipAddress - The user's IP address
 * @param userAgent - The user's browser user agent
 */
export async function logAuthorizationDenial(
  userId: string,
  clientId: string,
  authorizationId: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    client_id: clientId,
    action: 'authorize_deny',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      authorization_id: authorizationId,
      reason: reason || 'user_denied',
    },
  });
}

/**
 * Helper function to log authorization errors
 *
 * @param userId - The user ID (if available)
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID (if available)
 * @param error - The error that occurred
 * @param ipAddress - The user's IP address
 * @param userAgent - The user's browser user agent
 */
export async function logAuthorizationError(
  userId: string | null,
  clientId: string,
  authorizationId: string | null,
  error: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    client_id: clientId,
    action: 'authorize_error',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      authorization_id: authorizationId,
      error,
    },
  });
}

/**
 * Helper function to log token exchange
 *
 * @param userId - The user who owns the token
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID
 * @param ipAddress - The client's IP address
 * @param userAgent - The client's user agent
 */
export async function logTokenExchange(
  userId: string,
  clientId: string,
  authorizationId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    client_id: clientId,
    action: 'token_exchange',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      authorization_id: authorizationId,
    },
  });
}

/**
 * Helper function to log token refresh
 *
 * @param userId - The user who owns the token
 * @param clientId - The OAuth client ID
 * @param ipAddress - The client's IP address
 * @param userAgent - The client's user agent
 */
export async function logTokenRefresh(
  userId: string,
  clientId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    client_id: clientId,
    action: 'token_refresh',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {},
  });
}

/**
 * Helper function to log token revocation
 *
 * @param userId - The user who owns the token
 * @param clientId - The OAuth client ID
 * @param reason - Reason for revocation
 * @param ipAddress - The client's IP address
 * @param userAgent - The client's user agent
 */
export async function logTokenRevoke(
  userId: string,
  clientId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    client_id: clientId,
    action: 'token_revoke',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      reason,
    },
  });
}
