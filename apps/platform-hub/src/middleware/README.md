# Rate Limiting Middleware

## Overview

Rate limiting middleware to protect OAuth endpoints from brute force attacks and DDoS. Implements a token bucket algorithm with in-memory storage.

## Configuration

- **Rate Limit:** 10 requests per minute per IP address
- **Window:** 60 seconds (sliding window)
- **Protected Endpoints:**
  - `/oauth/consent`
  - `/oauth/authorize`
  - `/oauth/token`

## Usage

The rate limiting is automatically applied via Next.js middleware (`src/middleware.ts`). No additional configuration needed.

```typescript
// Middleware automatically checks rate limits for OAuth endpoints
export async function middleware(request: NextRequest) {
  if (shouldRateLimit(request.nextUrl.pathname)) {
    const rateLimitResponse = applyRateLimit(request, NextResponse.next());
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse; // Return 429 Too Many Requests
    }
  }
  return updateSession(request);
}
```

## Response Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 10          # Maximum requests allowed per window
X-RateLimit-Remaining: 7       # Requests remaining in current window
X-RateLimit-Reset: 1706038260  # Unix timestamp when limit resets
```

When rate limited (HTTP 429):

```
Retry-After: 45                # Seconds until limit resets
```

## Error Response

When rate limit is exceeded, clients receive:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

## Implementation Details

### Redis-Based Rate Limiting (Production)

The implementation uses **@upstash/ratelimit** with Redis for production deployments. This provides:

- **Multi-instance consistency:** Rate limits are shared across all instances
- **Atomic operations:** No race conditions (INCR is atomic in Redis)
- **Sliding window algorithm:** More accurate than fixed windows
- **Automatic persistence:** Survives server restarts
- **Edge Runtime compatible:** Works with Vercel Edge Functions

**Requirements:**
```bash
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-token-here
```

Get credentials from [Upstash Console](https://console.upstash.com/).

### In-Memory Fallback

When Redis is not configured (REDIS_URL or REDIS_TOKEN missing), the system automatically falls back to in-memory storage (`Map`). This is suitable for:

- Development environments
- Single-instance deployments
- Testing

**Limitations:**
- Resets on server restart
- Not shared across multiple instances
- Memory grows with unique IPs (mitigated by automatic cleanup every 5 minutes)

### IP Extraction

The middleware extracts client IP from multiple sources:

1. `x-forwarded-for` (first IP in chain)
2. `x-real-ip`
3. `x-vercel-forwarded-for` (Vercel-specific)
4. Falls back to `unknown` if no headers present

This ensures compatibility with various proxy configurations (Vercel, Cloudflare, nginx, etc.).

## Testing

Comprehensive test suite covers:

- Basic rate limiting (10 requests allowed, 11th blocked)
- Time window expiration and reset
- Multiple IP tracking
- Header extraction from various proxy sources
- Concurrent request handling
- Edge cases (missing headers, etc.)

Run tests:

```bash
pnpm test src/middleware/__tests__/rate-limit.test.ts
```

## Monitoring

Rate limit violations are logged to console:

```
[Rate Limit] IP 192.168.1.100 exceeded limit on /oauth/consent (11 requests in window, limit: 10)
```

In production, these logs should be forwarded to a monitoring service (Datadog, Sentry, etc.) for:

- Detecting potential attacks
- Identifying legitimate users hitting limits
- Capacity planning

## Security Notes

1. **IP Spoofing:** Trust proxy headers only from verified sources (Vercel, Cloudflare). Configure `X-Forwarded-For` validation at the edge.

2. **Distributed Attacks:** In-memory rate limiting won't protect against distributed attacks from many IPs. Consider:
   - CDN-level rate limiting (Cloudflare, Fastly)
   - Web Application Firewall (WAF)
   - IP reputation services

3. **Resource Exhaustion:** Automatic cleanup runs every 5 minutes to prevent memory leaks.

## Configuration Options

To adjust rate limits, modify constants in `src/middleware/rate-limit.ts`:

```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;     // 10 requests per window
```

To add/remove protected endpoints, edit `src/middleware.ts`:

```typescript
const OAUTH_PATHS = [
  '/oauth/consent',
  '/oauth/authorize',
  '/oauth/token',
  '/api/auth/login',  // Add new endpoint
];
```

## References

- [IETF Rate Limiting Headers](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
