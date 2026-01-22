import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Rate Limiting Middleware for OAuth Endpoints
 *
 * Protects OAuth endpoints from brute force and DDoS attacks.
 * Implements a simple in-memory token bucket algorithm.
 *
 * Limits:
 * - 10 requests per minute per IP address
 * - Returns HTTP 429 (Too Many Requests) when exceeded
 * - Includes Retry-After header with seconds until reset
 *
 * Note: In-memory implementation suitable for MVP/development.
 * For production with multiple instances, use Redis-backed solution
 * (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limit tracking
// Key: IP address, Value: { count, resetAt }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window

/**
 * Clean up expired rate limit entries every 5 minutes
 * Prevents memory leaks in long-running processes
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    rateLimitStore.forEach((entry, ip) => {
      if (entry.resetAt < now) {
        entriesToDelete.push(ip);
      }
    });

    entriesToDelete.forEach((ip) => rateLimitStore.delete(ip));
  }, CLEANUP_INTERVAL_MS);
}

// Start cleanup timer
if (typeof window === 'undefined') {
  startCleanup();
}

/**
 * Extract client IP address from request
 * Handles common proxy headers (Vercel, Cloudflare, etc.)
 */
function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Fallback to a default (should not happen in production)
  return 'unknown';
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or response object if rate limited
 */
export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request);
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt < now) {
    // Create new entry (first request or window expired)
    entry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(ip, entry);
    return null; // Allow request
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    // Log rate limit violation
    console.warn(
      `[Rate Limit] IP ${ip} exceeded limit on ${request.nextUrl.pathname} ` +
      `(${entry.count} requests in window, limit: ${RATE_LIMIT_MAX_REQUESTS})`
    );

    // Return 429 Too Many Requests
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: retryAfterSeconds,
      },
      { status: 429 }
    );

    // Add standard rate limit headers
    response.headers.set('Retry-After', retryAfterSeconds.toString());
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', entry.resetAt.toString());

    return response;
  }

  // Request allowed, update entry
  rateLimitStore.set(ip, entry);
  return null;
}

/**
 * Get rate limit headers for successful requests
 * Allows clients to track their usage
 */
export function getRateLimitHeaders(request: NextRequest): Record<string, string> {
  const ip = getClientIp(request);
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    return {
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': RATE_LIMIT_MAX_REQUESTS.toString(),
    };
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);

  return {
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': entry.resetAt.toString(),
  };
}

/**
 * Apply rate limiting to a Next.js middleware response
 * Usage in middleware.ts:
 *
 * const rateLimitResponse = checkRateLimit(request);
 * if (rateLimitResponse) return rateLimitResponse;
 */
export function applyRateLimit(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  // Check rate limit
  const limitResponse = checkRateLimit(request);
  if (limitResponse) {
    return limitResponse;
  }

  // Add rate limit headers to successful response
  const headers = getRateLimitHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Reset rate limits for a specific IP (for testing)
 * Should only be used in development/test environments
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Clear all rate limits (for testing)
 * Should only be used in development/test environments
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
