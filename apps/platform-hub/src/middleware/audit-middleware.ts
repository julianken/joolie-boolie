/**
 * OAuth Audit Middleware
 *
 * This middleware provides helper functions to extract request metadata
 * and integrate audit logging into OAuth authorization flows.
 *
 * Since Next.js Edge Middleware has limitations (no direct database access,
 * no access to service role keys), this module provides utilities that should
 * be called from API routes or Server Components where audit logging occurs.
 *
 * Usage:
 * 1. Extract request metadata (IP, user agent) in API routes
 * 2. Call audit logging functions with the metadata
 * 3. Ensure audit logs are written before responding to client
 */

import type { NextRequest } from 'next/server';
import {
  logAuthorizationSuccess,
  logAuthorizationDenial,
  logAuthorizationError,
} from '@/lib/audit-log';

/**
 * Request metadata extracted from Next.js request
 */
export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extracts IP address from Next.js request headers.
 *
 * Checks multiple headers in order of preference:
 * 1. x-forwarded-for (proxy/load balancer)
 * 2. x-real-ip (nginx)
 * 3. Direct connection IP
 *
 * @param request - Next.js request object
 * @returns IP address or undefined if not found
 */
export function extractIpAddress(request: NextRequest | Request): string | undefined {
  // Try x-forwarded-for first (most common for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  // Try x-real-ip (nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback: check if there's a connection remote address
  // Note: This may not be available in all deployment environments
  const remoteAddress = request.headers.get('x-vercel-forwarded-for');
  if (remoteAddress) {
    return remoteAddress.split(',')[0].trim();
  }

  return undefined;
}

/**
 * Extracts user agent from request headers
 *
 * @param request - Next.js request object
 * @returns User agent string or undefined if not present
 */
export function extractUserAgent(request: NextRequest | Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Extracts all request metadata (IP + user agent)
 *
 * @param request - Next.js request object
 * @returns Object containing IP address and user agent
 */
export function extractRequestMetadata(request: NextRequest | Request): RequestMetadata {
  return {
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  };
}

/**
 * Audit middleware wrapper for OAuth authorization success
 *
 * Extracts request metadata and logs authorization approval
 *
 * @param request - Next.js request object
 * @param userId - The user who approved
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID
 * @param scopes - The approved scopes
 */
export async function auditAuthorizationSuccess(
  request: NextRequest | Request,
  userId: string,
  clientId: string,
  authorizationId: string,
  scopes: string[]
): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  await logAuthorizationSuccess(
    userId,
    clientId,
    authorizationId,
    scopes,
    ipAddress,
    userAgent
  );
}

/**
 * Audit middleware wrapper for OAuth authorization denial
 *
 * Extracts request metadata and logs authorization denial
 *
 * @param request - Next.js request object
 * @param userId - The user who denied
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID
 * @param reason - Optional denial reason
 */
export async function auditAuthorizationDenial(
  request: NextRequest | Request,
  userId: string,
  clientId: string,
  authorizationId: string,
  reason?: string
): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  await logAuthorizationDenial(
    userId,
    clientId,
    authorizationId,
    reason,
    ipAddress,
    userAgent
  );
}

/**
 * Audit middleware wrapper for OAuth authorization error
 *
 * Extracts request metadata and logs authorization error
 *
 * @param request - Next.js request object
 * @param userId - The user ID (if available)
 * @param clientId - The OAuth client ID
 * @param authorizationId - The authorization request ID (if available)
 * @param error - The error message
 */
export async function auditAuthorizationError(
  request: NextRequest | Request,
  userId: string | null,
  clientId: string,
  authorizationId: string | null,
  error: string
): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  await logAuthorizationError(
    userId,
    clientId,
    authorizationId,
    error,
    ipAddress,
    userAgent
  );
}
