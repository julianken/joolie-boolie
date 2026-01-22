# BEA-282: Secure Cookie Settings - Verification Guide

## Overview
This document describes how to verify that secure cookie settings are properly configured for Supabase session tokens.

## Implementation Summary

All Supabase authentication cookies now have the following secure attributes:

- **httpOnly**: `true` - Prevents JavaScript access to cookies (XSS protection)
- **secure**: `true` in production, `false` in development (HTTPS-only in production)
- **sameSite**: `'lax'` - CSRF protection while allowing normal navigation
- **path**: `'/'` - Cookie available across entire site

## Modified Files

### Core Configuration Files
1. **`packages/auth/src/middleware.ts`** - Shared auth middleware (2 locations)
2. **`packages/auth/src/server.ts`** - Shared server-side client

### App-Specific Files
3. **`apps/platform-hub/src/lib/supabase/middleware.ts`**
4. **`apps/platform-hub/src/lib/supabase/server.ts`**
5. **`apps/bingo/src/lib/supabase/middleware.ts`**
6. **`apps/bingo/src/lib/supabase/server.ts`**
7. **`apps/trivia/src/lib/supabase/middleware.ts`**
8. **`apps/trivia/src/lib/supabase/server.ts`**

### Test Files
9. **`packages/auth/src/__tests__/server.test.ts`** - Updated to verify secure options

## Changes Made

### 1. Added Global Cookie Options
```typescript
cookieOptions: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
```

### 2. Enhanced setAll Implementation
```typescript
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value, options }) => {
    // Merge secure cookie options with Supabase defaults
    const secureOptions = {
      ...options,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: options?.path ?? '/',
    };
    cookieStore.set(name, value, secureOptions);
  });
}
```

## Verification Steps

### 1. Development Environment (Local)

```bash
# Start the development server
cd /Users/j/repos/wt-bea-282
pnpm dev:hub

# Open browser to http://localhost:3002
```

**Expected Cookie Attributes (Development):**
- httpOnly: ✅ true
- secure: ❌ false (HTTP allowed in dev)
- sameSite: ✅ Lax
- path: ✅ /

### 2. Browser DevTools Inspection

1. Open Chrome DevTools (F12)
2. Navigate to **Application** tab
3. Select **Cookies** → `http://localhost:3002`
4. Look for Supabase cookies (e.g., `sb-*-auth-token`)
5. Verify attributes match expected values

**Key Supabase Cookies to Check:**
- `sb-{project-ref}-auth-token`
- `sb-{project-ref}-auth-token.0`
- `sb-{project-ref}-auth-token.1` (if chunked)

### 3. Production Environment

When deployed to production (Vercel/other HTTPS hosting):

**Expected Cookie Attributes (Production):**
- httpOnly: ✅ true
- secure: ✅ true (HTTPS only)
- sameSite: ✅ Lax
- path: ✅ /

### 4. Manual Testing Script

You can test cookie behavior programmatically:

```typescript
// In browser console (should fail due to httpOnly):
document.cookie // Should NOT show auth tokens

// In Next.js API route:
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-xxx-auth-token');

  console.log('Cookie attributes:', {
    httpOnly: authCookie?.httpOnly,
    secure: authCookie?.secure,
    sameSite: authCookie?.sameSite,
    path: authCookie?.path,
  });

  return Response.json({ success: true });
}
```

### 5. Automated Test Verification

```bash
# Run the auth package tests
cd /Users/j/repos/wt-bea-282
pnpm --filter=@beak-gaming/auth test

# All tests should pass, including the updated cookie option tests
```

## Security Benefits

### httpOnly Protection
- **Attack Vector**: Cross-Site Scripting (XSS)
- **Protection**: JavaScript cannot access `document.cookie`, preventing token theft
- **Impact**: Even if XSS vulnerability exists, attackers cannot steal session tokens

### Secure Flag Protection
- **Attack Vector**: Man-in-the-Middle (MITM)
- **Protection**: Cookies only sent over HTTPS in production
- **Impact**: Prevents token interception on insecure networks

### SameSite Protection
- **Attack Vector**: Cross-Site Request Forgery (CSRF)
- **Protection**: `Lax` prevents cookies on cross-site POST requests
- **Impact**: Third-party sites cannot trigger authenticated actions
- **Note**: `Lax` chosen over `Strict` to allow normal navigation (e.g., clicking links from email)

## Rollback Plan

If issues arise, revert these commits:

```bash
# Find commit hash
git log --oneline --grep="BEA-282"

# Revert the changes
git revert <commit-hash>
```

Or manually restore original cookie handling:

```typescript
// Original (insecure) version:
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value, options }) =>
    cookieStore.set(name, value, options) // No secure defaults
  );
}
```

## Cookie Expiration

Cookie expiration is controlled by Supabase auth:
- **Access Token**: 1 hour (default)
- **Refresh Token**: 30 days (default)

These are configured in the Supabase Dashboard under Authentication > Settings.

The `maxAge` attribute is set by Supabase based on these values and does not need manual configuration.

## Related Documentation

- [Supabase SSR Cookie Options](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

## Notes

- The `secure` flag is **always false in development** because `localhost` uses HTTP
- The `secure` flag will be **automatically true in production** when `NODE_ENV=production`
- All Supabase auth cookies inherit these settings via both `cookieOptions` and the enhanced `setAll` implementation
- Cookie options are merged, with our secure defaults taking precedence over Supabase's defaults
