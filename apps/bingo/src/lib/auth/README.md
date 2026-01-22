# Bingo OAuth 2.1 Client

OAuth 2.1 client implementation with PKCE for "Sign in with Beak Gaming" functionality.

## Architecture

This module implements the **Authorization Code Flow with PKCE (Proof Key for Code Exchange)** as specified in OAuth 2.1 and RFC 7636.

### Flow Diagram

```
┌─────────────┐              ┌──────────────┐
│   Bingo     │              │ Platform Hub │
│   (Client)  │              │ (OAuth)      │
└─────────────┘              └──────────────┘
      │                              │
      │ 1. User clicks "Sign In"    │
      │                              │
      │ 2. Generate PKCE pair        │
      │    code_verifier (random)    │
      │    code_challenge (SHA-256)  │
      │                              │
      │ 3. Redirect to /authorize    │
      │    + code_challenge          │
      ├─────────────────────────────>│
      │                              │
      │                              │ 4. User logs in
      │                              │    & approves
      │                              │
      │ 5. Redirect with auth code   │
      │<─────────────────────────────│
      │                              │
      │ 6. POST /token               │
      │    code + code_verifier      │
      ├─────────────────────────────>│
      │                              │
      │                              │ 7. Validate PKCE
      │                              │    verifier
      │                              │
      │ 8. Return tokens             │
      │    (access + refresh)        │
      │<─────────────────────────────│
      │                              │
      │ 9. Store tokens securely     │
      │                              │
```

## Files

### Core Implementation

- **`oauth-client.ts`** (~150 lines) - Main OAuth client
  - `initiateLogin()` - Start OAuth flow
  - `handleCallback()` - Process authorization code
  - `refreshAccessToken()` - Refresh expired tokens
  - `getValidAccessToken()` - Get valid token (auto-refresh)
  - `logout()` - Clear tokens and redirect

- **`pkce.ts`** (~80 lines) - PKCE code generation
  - `generateCodeVerifier()` - Random 128-char string
  - `generateCodeChallenge()` - SHA-256 hash (base64url)
  - `generatePKCEPair()` - Generate both verifier and challenge

- **`token-storage.ts`** (~100 lines) - Secure token storage
  - `storeTokens()` - Store access/refresh tokens
  - `getTokens()` - Retrieve stored tokens
  - `clearTokens()` - Clear all tokens
  - `isAccessTokenExpired()` - Check token expiration
  - `storeCodeVerifier()` - Store PKCE verifier (sessionStorage)
  - `getAndClearCodeVerifier()` - Retrieve and remove verifier

### UI Components

- **`/app/auth/callback/page.tsx`** (~100 lines) - OAuth callback handler
  - Processes authorization code from Platform Hub
  - Exchanges code for tokens
  - Handles errors gracefully
  - Redirects to intended destination

### Type Definitions

- **`types.ts`** - TypeScript types
  - `OAuthTokenResponse` - Token response from server
  - `OAuthErrorResponse` - Error response from server
  - `StoredTokens` - Token storage format
  - `AuthorizationRequest` - Authorization parameters
  - `PKCEPair` - Code verifier/challenge pair

## Usage

### 1. Environment Configuration

Add to `.env.local`:

```bash
# OAuth Client Configuration
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id_from_platform_hub
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_OAUTH_CONSENT_URL=http://localhost:3002/oauth/consent
```

### 2. Login Button

```tsx
import { initiateLogin } from '@/lib/auth/oauth-client';

function LoginButton() {
  const handleLogin = () => {
    initiateLogin(); // Redirects to Platform Hub
  };

  return <button onClick={handleLogin}>Sign in with Beak Gaming</button>;
}
```

### 3. Callback Page

The callback page at `/auth/callback` automatically handles:
- Authorization code exchange
- Token storage
- Error handling
- Redirect to intended page

### 4. Protected Routes

```tsx
import { isAuthenticated, getValidAccessToken } from '@/lib/auth/oauth-client';

async function ProtectedPage() {
  if (!isAuthenticated()) {
    redirect('/login');
  }

  const token = await getValidAccessToken();
  if (!token) {
    redirect('/login');
  }

  // Use token for API calls
  const response = await fetch('/api/games', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
```

### 5. API Calls with Token

```tsx
import { getValidAccessToken } from '@/lib/auth/oauth-client';

async function callAPI() {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/games', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Token invalid/expired - redirect to login
    logout();
  }

  return response.json();
}
```

### 6. Logout

```tsx
import { logout } from '@/lib/auth/oauth-client';

function LogoutButton() {
  const handleLogout = () => {
    logout(); // Clears tokens and redirects to home
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
```

## Security Features

### PKCE (RFC 7636)
- **Code Verifier:** 128-character random string (maximum length for security)
- **Code Challenge:** SHA-256 hash of verifier (S256 method)
- **Storage:** Verifier stored in sessionStorage (cleared after use)

### Token Security
- **Access Token:** JWT, 1-hour expiration
- **Refresh Token:** Opaque UUID, 30-day expiration with rotation
- **Storage:** localStorage (consider httpOnly cookies for production)
- **Auto-Refresh:** Automatic token refresh on expiration

### CSRF Protection
- **State Parameter:** Random 32-byte string
- **Validation:** State verified on callback

### XSS Prevention
- Tokens never exposed in URL
- No token access via JavaScript (when using httpOnly cookies)
- Content-Security-Policy headers recommended

## Testing

Run tests:

```bash
pnpm test src/lib/auth/__tests__
```

Test coverage:
- PKCE generation and validation
- Token storage and retrieval
- Token expiration checks
- Error handling

## OAuth 2.1 Compliance

This implementation follows:
- [RFC 6749](https://tools.ietf.org/html/rfc6749) - OAuth 2.0
- [RFC 7636](https://tools.ietf.org/html/rfc7636) - PKCE
- [OAuth 2.1 Draft](https://oauth.net/2.1/) - Latest best practices

Key requirements:
- PKCE required for all clients
- S256 code challenge method (SHA-256)
- No implicit grant flow
- Refresh token rotation

## Future Enhancements

1. **httpOnly Cookies:** Move token storage to server-side cookies (more secure)
2. **Token Revocation:** Call `/oauth/revoke` on logout
3. **Device Flow:** Support for TV/console devices
4. **Biometric Auth:** WebAuthn integration
5. **Session Management:** Cross-tab logout synchronization

## Related Documentation

- [Initiative 1: OAuth Server](../../../../../docs/INITIATIVE_1_OAUTH_SERVER.md)
- [Platform Hub OAuth Implementation](../../../../../apps/platform-hub/CLAUDE.md)
- [OAuth 2.1 Specification](https://oauth.net/2.1/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
