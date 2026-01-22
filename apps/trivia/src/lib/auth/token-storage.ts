/**
 * Token storage utilities for OAuth 2.1 client
 *
 * Manages secure storage of OAuth tokens and PKCE parameters:
 * - Code verifier: sessionStorage (temporary, same-tab only)
 * - Access tokens: httpOnly cookies via API routes (secure, HTTP-only)
 * - Refresh tokens: httpOnly cookies via API routes (secure, HTTP-only)
 */

/**
 * OAuth token response from authorization server
 */
export interface OAuthTokens {
  /** JWT access token */
  access_token: string;
  /** Opaque refresh token */
  refresh_token: string;
  /** Token type (always 'Bearer') */
  token_type: 'Bearer';
  /** Access token lifetime in seconds */
  expires_in: number;
  /** Space-separated list of granted scopes */
  scope?: string;
}

/**
 * Storage keys for OAuth flow
 */
const STORAGE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  STATE: 'oauth_state',
} as const;

/**
 * Stores PKCE code verifier in sessionStorage.
 *
 * sessionStorage is used (vs localStorage) because:
 * - Scoped to single tab/window (more secure)
 * - Automatically cleared on tab close
 * - Prevents CSRF across tabs
 *
 * @param codeVerifier - PKCE code verifier to store
 * @throws Error if sessionStorage is not available
 */
export function storeCodeVerifier(codeVerifier: string): void {
  if (typeof sessionStorage === 'undefined') {
    throw new Error('sessionStorage is not available');
  }

  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
}

/**
 * Retrieves PKCE code verifier from sessionStorage.
 *
 * @returns Code verifier or null if not found
 */
export function getCodeVerifier(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
}

/**
 * Removes PKCE code verifier from sessionStorage.
 *
 * Should be called after successful token exchange.
 */
export function clearCodeVerifier(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
}

/**
 * Stores OAuth state parameter in sessionStorage.
 *
 * State is used to prevent CSRF attacks by:
 * 1. Generating random value before redirect
 * 2. Storing in sessionStorage
 * 3. Validating match in callback
 *
 * @param state - Random state value
 */
export function storeState(state: string): void {
  if (typeof sessionStorage === 'undefined') {
    throw new Error('sessionStorage is not available');
  }

  sessionStorage.setItem(STORAGE_KEYS.STATE, state);
}

/**
 * Retrieves OAuth state parameter from sessionStorage.
 *
 * @returns State value or null if not found
 */
export function getState(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(STORAGE_KEYS.STATE);
}

/**
 * Removes OAuth state parameter from sessionStorage.
 *
 * Should be called after successful state validation.
 */
export function clearState(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.removeItem(STORAGE_KEYS.STATE);
}

/**
 * Stores OAuth tokens in httpOnly cookies via API route.
 *
 * Tokens are stored server-side as httpOnly cookies for security:
 * - Not accessible to JavaScript (prevents XSS)
 * - Automatically sent with requests
 * - SameSite=Lax (prevents CSRF)
 *
 * @param tokens - OAuth tokens to store
 * @returns true if successful
 */
export async function storeTokens(tokens: OAuthTokens): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokens),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to store tokens:', error);
    return false;
  }
}

/**
 * Clears OAuth tokens from httpOnly cookies via API route.
 *
 * @returns true if successful
 */
export async function clearTokens(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/tokens', {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    return false;
  }
}

/**
 * Generates a cryptographically secure random state parameter.
 *
 * @returns 32-character base64url-encoded random string
 */
export function generateState(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);

  const binary = String.fromCharCode(...array);
  const base64 = btoa(binary);

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
