/**
 * Audit Middleware Utilities
 *
 * Provides helper functions for extracting request metadata and logging audit events
 * from Next.js API routes and Server Actions.
 *
 * Features:
 * - Extract IP addresses from various headers (x-forwarded-for, x-real-ip, etc.)
 * - Extract user agent strings
 * - High-level wrappers for common audit logging scenarios
 *
 * @module audit-middleware
 */

import {
  logAuthorizationSuccess,
  logAuthorizationDenial,
  logAuthorizationError,
} from '@/lib/audit-log';

/**
 * Request metadata extracted for audit logging
 */
export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract IP address from Next.js request headers.
 * Prioritizes headers in the following order:
 * 1. x-forwarded-for (first IP in list) - Standard proxy header
 * 2. x-real-ip - Nginx proxy header
 * 3. x-vercel-forwarded-for - Vercel-specific header
 *
 * @param request - Next.js request object (API route or middleware)
 * @returns IP address string or undefined if not found
 *
 * @example
 * ```typescript
 * const ipAddress = extractIpAddress(request);
 * console.log('Client IP:', ipAddress);
 * ```
 */
export function extractIpAddress(request: Request): string | undefined {
  // Try x-forwarded-for (proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
    // First IP is the original client
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // Try x-real-ip (nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Try x-vercel-forwarded-for (Vercel)
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }

  // No IP address found
  return undefined;
}

/**
 * Extract user agent from Next.js request headers.
 *
 * @param request - Next.js request object (API route or middleware)
 * @returns User agent string or undefined if not found
 *
 * @example
 * ```typescript
 * const userAgent = extractUserAgent(request);
 * console.log('Client User Agent:', userAgent);
 * ```
 */
export function extractUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') ?? undefined;
}

/**
 * Extract all request metadata for audit logging.
 * Combines IP address and user agent extraction into a single call.
 *
 * @param request - Next.js request object (API route or middleware)
 * @returns Object containing IP address and user agent
 *
 * @example
 * ```typescript
 * const metadata = extractRequestMetadata(request);
 * console.log('IP:', metadata.ipAddress);
 * console.log('User Agent:', metadata.userAgent);
 * ```
 */
export function extractRequestMetadata(request: Request): RequestMetadata {
  return {
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  };
}

/**
 * High-level wrapper for logging authorization success events.
 * Automatically extracts IP address and user agent from request.
 *
 * @param request - Next.js request object
 * @param userId - UUID of the user who approved the authorization
 * @param clientId - OAuth client identifier
 * @param authorizationId - Authorization request ID
 * @param scopes - Array of approved scopes
 * @returns Promise resolving to the inserted record or null on error
 *
 * @example
 * ```typescript
 * // In API route handler
 * export async function POST(request: Request) {
 *   // ... OAuth approval logic ...
 *
 *   await auditAuthorizationSuccess(
 *     request,
 *     session.user.id,
 *     clientId,
 *     authorizationId,
 *     ['openid', 'email']
 *   );
 *
 *   return NextResponse.json({ redirect_url });
 * }
 * ```
 */
export async function auditAuthorizationSuccess(
  request: Request,
  userId: string,
  clientId: string,
  authorizationId: string,
  scopes: string[]
): Promise<{ id: string } | null> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  return logAuthorizationSuccess(
    userId,
    clientId,
    authorizationId,
    scopes,
    ipAddress,
    userAgent
  );
}

/**
 * High-level wrapper for logging authorization denial events.
 * Automatically extracts IP address and user agent from request.
 *
 * @param request - Next.js request object
 * @param userId - UUID of the user who denied the authorization
 * @param clientId - OAuth client identifier
 * @param authorizationId - Authorization request ID
 * @param reason - Optional reason for denial
 * @returns Promise resolving to the inserted record or null on error
 *
 * @example
 * ```typescript
 * // In API route handler
 * export async function POST(request: Request) {
 *   // ... OAuth denial logic ...
 *
 *   await auditAuthorizationDenial(
 *     request,
 *     session.user.id,
 *     clientId,
 *     authorizationId,
 *     'user_cancelled'
 *   );
 *
 *   return NextResponse.json({ redirect_url });
 * }
 * ```
 */
export async function auditAuthorizationDenial(
  request: Request,
  userId: string,
  clientId: string,
  authorizationId: string,
  reason?: string
): Promise<{ id: string } | null> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  return logAuthorizationDenial(
    userId,
    clientId,
    authorizationId,
    reason,
    ipAddress,
    userAgent
  );
}

/**
 * High-level wrapper for logging authorization error events.
 * Automatically extracts IP address and user agent from request.
 *
 * @param request - Next.js request object
 * @param clientId - OAuth client identifier
 * @param authorizationId - Authorization request ID (if available)
 * @param errorCode - Error code or type
 * @param errorMessage - Human-readable error message
 * @param userId - UUID of the user (optional)
 * @returns Promise resolving to the inserted record or null on error
 *
 * @example
 * ```typescript
 * // In API route handler
 * export async function POST(request: Request) {
 *   try {
 *     // ... OAuth logic ...
 *   } catch (error) {
 *     await auditAuthorizationError(
 *       request,
 *       clientId,
 *       authorizationId,
 *       'invalid_request',
 *       error.message,
 *       session?.user?.id
 *     );
 *
 *     return NextResponse.json({ error: error.message }, { status: 400 });
 *   }
 * }
 * ```
 */
export async function auditAuthorizationError(
  request: Request,
  clientId: string,
  authorizationId: string | undefined,
  errorCode: string,
  errorMessage: string,
  userId?: string
): Promise<{ id: string } | null> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  return logAuthorizationError(
    clientId,
    authorizationId,
    errorCode,
    errorMessage,
    userId,
    ipAddress,
    userAgent
  );
}
