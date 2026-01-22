/**
 * OAuth token storage using browser localStorage
 *
 * SECURITY NOTES:
 * - Tokens are stored in PLAINTEXT in localStorage
 * - This is a trade-off for simplicity in the initial implementation
 * - Vulnerable to XSS attacks if malicious scripts access localStorage
 * - Refresh tokens have 30-day expiration (server-enforced)
 * - Access tokens have 1-hour expiration (server-enforced)
 *
 * FUTURE IMPROVEMENT: Move to httpOnly cookies via API routes for better
 * XSS protection. This would prevent client-side JavaScript from accessing tokens.
 *
 * WHY PLAINTEXT FOR NOW:
 * - Simplifies OAuth client implementation
 * - Browser-based encryption doesn't prevent XSS attacks
 * - Real security improvement requires httpOnly cookies (server-side storage)
 */

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Seconds until access token expires
  token_type: 'Bearer';
  expires_at: number; // Timestamp when access token expires
}

const STORAGE_KEY = 'bingo_oauth_tokens';
const VERIFIER_KEY = 'bingo_oauth_verifier';

/**
 * Store OAuth tokens securely in localStorage
 *
 * @param tokens - Token pair from OAuth server
 */
export function storeTokens(tokens: Omit<TokenPair, 'expires_at'>): void {
  const tokenPair: TokenPair = {
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenPair));
  } catch (error) {
    console.error('Failed to store tokens:', error);
    throw new Error('Token storage failed');
  }
}

/**
 * Retrieve stored OAuth tokens
 *
 * @returns Token pair or null if not found/expired
 */
export function getTokens(): TokenPair | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const tokens: TokenPair = JSON.parse(stored);

    // Check if access token is expired
    if (Date.now() >= tokens.expires_at) {
      // Access token expired, but refresh token might still be valid
      // Caller should attempt token refresh
      return tokens;
    }

    return tokens;
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    return null;
  }
}

/**
 * Check if access token is expired
 *
 * @returns True if access token is expired or missing
 */
export function isAccessTokenExpired(): boolean {
  const tokens = getTokens();
  if (!tokens) {
    return true;
  }

  return Date.now() >= tokens.expires_at;
}

/**
 * Clear all stored tokens
 *
 * Call this on logout or when tokens are revoked
 */
export function clearTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Store PKCE code_verifier temporarily during OAuth flow
 *
 * The verifier is needed when exchanging the authorization code for tokens.
 * Stored in sessionStorage (cleared on tab close).
 *
 * @param verifier - PKCE code_verifier
 */
export function storeCodeVerifier(verifier: string): void {
  try {
    sessionStorage.setItem(VERIFIER_KEY, verifier);
  } catch (error) {
    console.error('Failed to store code verifier:', error);
    throw new Error('Code verifier storage failed');
  }
}

/**
 * Retrieve and remove stored PKCE code_verifier
 *
 * This is a one-time operation - the verifier is removed after retrieval.
 *
 * @returns Code verifier or null if not found
 */
export function getAndClearCodeVerifier(): string | null {
  try {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    if (verifier) {
      sessionStorage.removeItem(VERIFIER_KEY);
    }
    return verifier;
  } catch (error) {
    console.error('Failed to retrieve code verifier:', error);
    return null;
  }
}

/**
 * Update stored access token after refresh
 *
 * @param accessToken - New access token
 * @param expiresIn - Seconds until new token expires
 */
export function updateAccessToken(accessToken: string, expiresIn: number): void {
  const tokens = getTokens();
  if (!tokens) {
    throw new Error('No tokens to update');
  }

  const updated: TokenPair = {
    ...tokens,
    access_token: accessToken,
    expires_in: expiresIn,
    expires_at: Date.now() + expiresIn * 1000,
  };

  storeTokens(updated);
}
