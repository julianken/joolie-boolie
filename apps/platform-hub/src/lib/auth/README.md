# OAuth to Supabase Auth Bridge

This module provides bridge functions that convert OAuth 2.1 access tokens (issued by Supabase's OAuth server) into full Supabase auth sessions with synchronized user profiles.

## Overview

When a client application (Bingo or Trivia) completes the OAuth authorization flow, it receives access and refresh tokens from Supabase's OAuth server. These tokens need to be converted into Supabase auth sessions for the application to function properly.

This bridge handles:
- ✅ Session creation from OAuth tokens
- ✅ User profile synchronization to `public.profiles` table
- ✅ Token refresh when sessions expire
- ✅ Session revocation on logout
- ✅ Error handling for invalid/expired tokens
- ✅ Token TTL alignment (1-hour expiration)

## Usage

### Creating a Session from OAuth Tokens

```typescript
import { createSupabaseSession } from '@/lib/auth';

// After OAuth callback, exchange authorization code for tokens
const oauthTokens = await exchangeAuthorizationCode(code);

// Create Supabase session from OAuth tokens
const result = await createSupabaseSession(
  oauthTokens.access_token,
  oauthTokens.refresh_token,
  {
    facility_name: 'Sunny Acres Retirement',
    default_game_title: 'Bingo Night',
  }
);

if (result.success) {
  // Store session in cookies
  cookies().set('sb-session', JSON.stringify(result.session), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: result.session.expires_in,
  });

  // Redirect to application
  redirect('/play');
} else {
  console.error('Session creation failed:', result.error);
  redirect('/login?error=' + result.error.code);
}
```

### Refreshing an Expired Session

```typescript
import { refreshSupabaseSession } from '@/lib/auth';

// Get current session from cookies
const session = JSON.parse(cookies().get('sb-session')?.value || '{}');

// Check if session is expired or expiring soon
const expiresAt = session.expires_at;
const now = Math.floor(Date.now() / 1000);
const isExpiring = expiresAt - now < 300; // Less than 5 minutes left

if (isExpiring) {
  const result = await refreshSupabaseSession(session.refresh_token);

  if (result.success) {
    // Update session in cookies
    cookies().set('sb-session', JSON.stringify(result.session), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: result.session.expires_in,
    });
  } else {
    // Refresh failed - redirect to login
    redirect('/login?error=session_expired');
  }
}
```

### Revoking a Session (Logout)

```typescript
import { revokeSupabaseSession } from '@/lib/auth';

// Get current session
const session = JSON.parse(cookies().get('sb-session')?.value || '{}');

// Revoke the session
const revoked = await revokeSupabaseSession(session.access_token);

if (revoked) {
  // Clear session cookie
  cookies().delete('sb-session');
  redirect('/login');
} else {
  console.error('Failed to revoke session');
}
```

## API Reference

### `createSupabaseSession(accessToken, refreshToken?, profileOptions?)`

Creates a Supabase auth session from OAuth access token.

**Parameters:**
- `accessToken` (string, required) - OAuth access token (JWT) from Supabase OAuth server
- `refreshToken` (string, optional) - OAuth refresh token for session renewal
- `profileOptions` (ProfileSyncOptions, optional) - User profile data to sync

**Returns:** `Promise<CreateSessionResult>`

**Example:**
```typescript
const result = await createSupabaseSession(
  'eyJhbGciOiJIUzI1NiIs...',
  'refresh-token-xyz',
  {
    facility_name: 'Sunny Acres',
    default_game_title: 'Trivia'
  }
);
```

### `refreshSupabaseSession(refreshToken)`

Refreshes an expired Supabase session using a refresh token.

**Parameters:**
- `refreshToken` (string, required) - Current refresh token

**Returns:** `Promise<CreateSessionResult>`

**Example:**
```typescript
const result = await refreshSupabaseSession('refresh-token-xyz');
```

### `revokeSupabaseSession(accessToken)`

Revokes a Supabase session, invalidating all tokens.

**Parameters:**
- `accessToken` (string, required) - Current access token to revoke

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const revoked = await revokeSupabaseSession('eyJhbGciOiJIUzI1NiIs...');
```

## Types

### `CreateSessionResult`

```typescript
interface CreateSessionResult {
  success: boolean;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;      // Unix timestamp
    expires_in: number;      // Seconds until expiration
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
  error?: {
    code: BridgeErrorCode;
    message: string;
    details?: string;
  };
}
```

### `ProfileSyncOptions`

```typescript
interface ProfileSyncOptions {
  facility_name?: string;
  default_game_title?: string;
  logo_url?: string;
}
```

### `BridgeErrorCode`

```typescript
enum BridgeErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  SESSION_CREATE_FAILED = 'SESSION_CREATE_FAILED',
  PROFILE_SYNC_FAILED = 'PROFILE_SYNC_FAILED',
  MISSING_ENV_VARS = 'MISSING_ENV_VARS',
}
```

## Error Handling

All bridge functions return error objects with descriptive codes and messages:

```typescript
const result = await createSupabaseSession(invalidToken);

if (!result.success) {
  switch (result.error.code) {
    case BridgeErrorCode.INVALID_TOKEN:
      // Token format is invalid or missing required claims
      console.error('Invalid token:', result.error.details);
      break;

    case BridgeErrorCode.TOKEN_EXPIRED:
      // Token has expired, need to refresh or re-authenticate
      console.error('Token expired:', result.error.details);
      break;

    case BridgeErrorCode.SESSION_CREATE_FAILED:
      // Supabase rejected the token or session creation failed
      console.error('Session creation failed:', result.error.details);
      break;

    case BridgeErrorCode.MISSING_ENV_VARS:
      // Required environment variables are not set
      console.error('Configuration error:', result.error.message);
      break;
  }
}
```

## Environment Variables

Required environment variables:

```bash
# Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Service role key (server-side only, NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Implementation Details

### Session TTL Alignment

OAuth access tokens from Supabase expire after 1 hour. The bridge ensures:
- Supabase sessions have matching 1-hour expiration
- `expires_at` timestamp matches OAuth token expiration
- `expires_in` is set to 3600 seconds (1 hour)

### Profile Synchronization

When creating a session, the bridge:
1. Checks if user profile exists in `public.profiles`
2. Creates profile if missing
3. Updates profile if it exists
4. **Does NOT fail session creation** if profile sync fails (logged as error)

### Token Validation

The bridge:
1. Decodes JWT to extract user claims (sub, email)
2. Validates token is not expired
3. Passes token to Supabase for signature verification
4. Returns error if validation fails

### Security Notes

- ⚠️ **Service role key** must only be used server-side
- ⚠️ **Never expose** service role key in client-side code
- ✅ Store sessions in httpOnly cookies
- ✅ Use secure and sameSite flags in production
- ✅ Implement CSRF protection for cookie-based auth

## Testing

Comprehensive unit tests cover:
- ✅ Valid token session creation
- ✅ Invalid token format handling
- ✅ Expired token handling
- ✅ Missing user claims handling
- ✅ Supabase API error handling
- ✅ Profile creation and updates
- ✅ Profile sync failures (non-blocking)
- ✅ Session refresh
- ✅ Session revocation
- ✅ Missing environment variables

Run tests:
```bash
pnpm test src/lib/auth/__tests__/supabase-bridge.test.ts
```

## Integration with OAuth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Client App (Bingo/Trivia)                                    │
│    - User clicks "Login with Platform Hub"                      │
│    - Redirects to OAuth authorization endpoint                  │
└─────────────────────────┬───────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Platform Hub Consent Page                                    │
│    - User reviews permissions and approves                      │
│    - Supabase OAuth server issues authorization code            │
└─────────────────────────┬───────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Client App Callback                                          │
│    - Exchanges authorization code for tokens                    │
│    - Calls: createSupabaseSession(access_token, refresh_token)  │
└─────────────────────────┬───────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Bridge (this module)                                         │
│    - Validates and decodes OAuth token                          │
│    - Creates Supabase session via setSession()                  │
│    - Syncs user profile to public.profiles                      │
│    - Returns session data                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Client App                                                   │
│    - Stores session in httpOnly cookie                          │
│    - Redirects to /play or /display                             │
│    - User can access protected resources                        │
└─────────────────────────────────────────────────────────────────┘
```

## Related Documentation

- [OAuth Integration Plan](../../../../docs/INITIATIVE_1_REVISED_OAUTH.md)
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/oauth-server)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
