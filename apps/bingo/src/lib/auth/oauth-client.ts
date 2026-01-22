/**
 * OAuth 2.1 Client with PKCE for Bingo App
 *
 * Implements "Sign in with Beak Gaming" functionality
 * - Authorization code flow with PKCE (S256)
 * - Token exchange and refresh
 * - Secure token storage
 *
 * OAuth Server: Platform Hub (http://localhost:3002)
 */

import { generatePKCEPair } from './pkce';
import {
  storeTokens,
  getTokens,
  clearTokens,
  storeCodeVerifier,
  getAndClearCodeVerifier,
  isAccessTokenExpired,
  type TokenPair,
} from './token-storage';

/**
 * OAuth error response from server
 */
export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Token response from OAuth server
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope?: string;
}

/**
 * OAuth client configuration
 */
export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
}

/**
 * Get OAuth configuration from environment variables
 */
function getOAuthConfig(): OAuthConfig {
  const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;
  const consentUrl = process.env.NEXT_PUBLIC_OAUTH_CONSENT_URL;

  if (!clientId) {
    throw new Error('NEXT_PUBLIC_OAUTH_CLIENT_ID is not configured');
  }

  if (!redirectUri) {
    throw new Error('NEXT_PUBLIC_OAUTH_REDIRECT_URI is not configured');
  }

  if (!consentUrl) {
    throw new Error('NEXT_PUBLIC_OAUTH_CONSENT_URL is not configured');
  }

  // Extract base URL from consent URL (e.g., http://localhost:3002/oauth/consent -> http://localhost:3002)
  const baseUrl = new URL(consentUrl).origin;

  return {
    clientId,
    redirectUri,
    authorizationUrl: `${baseUrl}/oauth/authorize`,
    tokenUrl: `${baseUrl}/oauth/token`,
    scopes: ['read:profile', 'write:profile', 'read:bingo', 'write:bingo'],
  };
}

/**
 * Generate random state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store state parameter in sessionStorage
 */
function storeState(state: string): void {
  sessionStorage.setItem('bingo_oauth_state', state);
}

/**
 * Retrieve and validate state parameter
 */
function getAndClearState(): string | null {
  const state = sessionStorage.getItem('bingo_oauth_state');
  if (state) {
    sessionStorage.removeItem('bingo_oauth_state');
  }
  return state;
}

/**
 * Initiate OAuth authorization flow
 *
 * Redirects user to Platform Hub login page with PKCE parameters
 *
 * @throws Error if OAuth configuration is missing
 */
export async function initiateLogin(): Promise<void> {
  const config = getOAuthConfig();

  // Generate PKCE pair
  const { verifier, challenge } = await generatePKCEPair();

  // Store verifier for later use in token exchange
  storeCodeVerifier(verifier);

  // Generate state for CSRF protection
  const state = generateState();
  storeState(state);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: config.scopes.join(' '),
    state,
  });

  const authorizationUrl = `${config.authorizationUrl}?${params.toString()}`;

  // Redirect to Platform Hub
  window.location.href = authorizationUrl;
}

/**
 * Handle OAuth callback and exchange authorization code for tokens
 *
 * Call this from the /auth/callback page
 *
 * @param code - Authorization code from query parameter
 * @param state - State parameter from query parameter
 * @returns Token pair or error
 */
export async function handleCallback(
  code: string,
  state: string
): Promise<{ success: true; tokens: TokenPair } | { success: false; error: OAuthError }> {
  // Validate state parameter (CSRF protection)
  const storedState = getAndClearState();
  if (!storedState || storedState !== state) {
    return {
      success: false,
      error: {
        error: 'invalid_state',
        error_description: 'State parameter mismatch. Possible CSRF attack.',
      },
    };
  }

  // Retrieve code_verifier
  const codeVerifier = getAndClearCodeVerifier();
  if (!codeVerifier) {
    return {
      success: false,
      error: {
        error: 'missing_verifier',
        error_description: 'PKCE code verifier not found. Please restart login flow.',
      },
    };
  }

  // Exchange code for tokens
  return exchangeCodeForTokens(code, codeVerifier);
}

/**
 * Exchange authorization code for access/refresh tokens
 *
 * @param code - Authorization code from callback
 * @param codeVerifier - PKCE code_verifier
 * @returns Token pair or error
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ success: true; tokens: TokenPair } | { success: false; error: OAuthError }> {
  const config = getOAuthConfig();

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        code_verifier: codeVerifier,
      }),
    });

    const data = (await response.json()) as TokenResponse | OAuthError;

    if (!response.ok) {
      return {
        success: false,
        error: data as OAuthError,
      };
    }

    const tokenResponse = data as TokenResponse;

    // Store tokens securely
    storeTokens({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type,
    });

    return {
      success: true,
      tokens: getTokens()!,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        error: 'network_error',
        error_description: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

/**
 * Refresh access token using refresh token
 *
 * @returns New token pair or error
 */
export async function refreshAccessToken(): Promise<
  { success: true; tokens: TokenPair } | { success: false; error: OAuthError }
> {
  const currentTokens = getTokens();
  if (!currentTokens) {
    return {
      success: false,
      error: {
        error: 'no_tokens',
        error_description: 'No tokens found to refresh',
      },
    };
  }

  const config = getOAuthConfig();

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refresh_token,
        client_id: config.clientId,
      }),
    });

    const data = (await response.json()) as TokenResponse | OAuthError;

    if (!response.ok) {
      // Refresh token invalid/expired - clear tokens and require re-login
      clearTokens();
      return {
        success: false,
        error: data as OAuthError,
      };
    }

    const tokenResponse = data as TokenResponse;

    // Update tokens (refresh token rotation)
    storeTokens({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type,
    });

    return {
      success: true,
      tokens: getTokens()!,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        error: 'network_error',
        error_description: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

/**
 * Get valid access token, refreshing if necessary
 *
 * @returns Valid access token or null if unable to refresh
 */
export async function getValidAccessToken(): Promise<string | null> {
  // Check if we have tokens
  const tokens = getTokens();
  if (!tokens) {
    return null;
  }

  // If access token is still valid, return it
  if (!isAccessTokenExpired()) {
    return tokens.access_token;
  }

  // Access token expired - try to refresh
  const refreshResult = await refreshAccessToken();
  if (refreshResult.success) {
    return refreshResult.tokens.access_token;
  }

  // Refresh failed - user needs to re-login
  return null;
}

/**
 * Logout user and clear all tokens
 *
 * TODO: In future, call Platform Hub /oauth/revoke endpoint to revoke tokens server-side
 */
export function logout(): void {
  clearTokens();

  // Redirect to home page or login page
  window.location.href = '/';
}

/**
 * Check if user is authenticated
 *
 * @returns True if user has valid tokens
 */
export function isAuthenticated(): boolean {
  const tokens = getTokens();
  return tokens !== null;
}
