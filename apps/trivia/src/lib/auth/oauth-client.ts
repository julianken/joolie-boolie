/**
 * OAuth 2.1 Client Implementation for Trivia Night
 *
 * Implements OAuth 2.1 Authorization Code Flow with PKCE:
 * 1. User clicks login → initiateLogin()
 * 2. Generate PKCE params, redirect to Platform Hub
 * 3. User consents on Platform Hub
 * 4. Redirected back to /auth/callback with code
 * 5. Exchange code for tokens → exchangeCodeForTokens()
 * 6. Store tokens in httpOnly cookies
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749 (OAuth 2.0)
 * @see https://datatracker.ietf.org/doc/html/rfc7636 (PKCE)
 * @see https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1 (OAuth 2.1)
 */

import { generatePKCE } from './pkce';
import {
  storeCodeVerifier,
  storeState,
  generateState,
  type OAuthTokens,
} from './token-storage';

/**
 * OAuth 2.1 configuration for Trivia Night
 */
export interface OAuthConfig {
  /** OAuth client ID (from Supabase Dashboard) */
  clientId: string;
  /** Redirect URI after authorization (must match registered URI) */
  redirectUri: string;
  /** Authorization endpoint URL (Platform Hub BFF) */
  authorizationEndpoint: string;
  /** Token endpoint URL (Platform Hub BFF) */
  tokenEndpoint: string;
  /** Space-separated list of requested scopes */
  scopes: string;
}

/**
 * OAuth error response
 */
export interface OAuthError {
  /** Error code (e.g., 'access_denied', 'invalid_request') */
  error: string;
  /** Human-readable error description */
  error_description?: string;
  /** URI with error information */
  error_uri?: string;
}

/**
 * Default OAuth configuration for Trivia Night
 */
const DEFAULT_CONFIG: OAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '',
  redirectUri:
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ||
    'http://localhost:3001/auth/callback',
  authorizationEndpoint:
    process.env.NEXT_PUBLIC_OAUTH_AUTHORIZATION_URL ||
    'http://localhost:3002/oauth/authorize',
  tokenEndpoint:
    process.env.NEXT_PUBLIC_OAUTH_TOKEN_URL ||
    'http://localhost:3002/oauth/token',
  scopes: 'read:profile write:profile read:trivia write:trivia',
};

/**
 * Initiates OAuth 2.1 authorization flow with PKCE.
 *
 * Process:
 * 1. Generate PKCE code_verifier and code_challenge
 * 2. Generate random state parameter
 * 3. Store code_verifier and state in sessionStorage
 * 4. Build authorization URL with parameters
 * 5. Redirect to Platform Hub authorization endpoint
 *
 * @param config - Optional OAuth configuration (uses defaults if not provided)
 * @throws Error if required config is missing
 */
export async function initiateLogin(
  config: Partial<OAuthConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate required config
  if (!finalConfig.clientId) {
    throw new Error('OAuth client ID is not configured');
  }

  if (!finalConfig.redirectUri) {
    throw new Error('OAuth redirect URI is not configured');
  }

  if (!finalConfig.authorizationEndpoint) {
    throw new Error('OAuth authorization endpoint is not configured');
  }

  // Generate PKCE parameters
  const pkce = await generatePKCE();

  // Generate state parameter
  const state = generateState();

  // Store for callback
  storeCodeVerifier(pkce.codeVerifier);
  storeState(state);

  // Build authorization URL
  const authUrl = new URL(finalConfig.authorizationEndpoint);
  authUrl.searchParams.set('client_id', finalConfig.clientId);
  authUrl.searchParams.set('redirect_uri', finalConfig.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', finalConfig.scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', pkce.codeChallenge);
  authUrl.searchParams.set('code_challenge_method', pkce.codeChallengeMethod);

  // Redirect to authorization endpoint
  window.location.href = authUrl.toString();
}

/**
 * Exchanges authorization code for access and refresh tokens.
 *
 * Process:
 * 1. Validate authorization code and code_verifier
 * 2. POST to token endpoint with code, code_verifier, client_id
 * 3. Receive access_token and refresh_token
 * 4. Return tokens for storage
 *
 * @param code - Authorization code from callback
 * @param codeVerifier - PKCE code_verifier from sessionStorage
 * @param config - Optional OAuth configuration
 * @returns OAuth tokens
 * @throws Error if token exchange fails
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  config: Partial<OAuthConfig> = {}
): Promise<OAuthTokens> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate required config
  if (!finalConfig.clientId) {
    throw new Error('OAuth client ID is not configured');
  }

  if (!finalConfig.redirectUri) {
    throw new Error('OAuth redirect URI is not configured');
  }

  if (!finalConfig.tokenEndpoint) {
    throw new Error('OAuth token endpoint is not configured');
  }

  // Build token request
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: finalConfig.clientId,
    redirect_uri: finalConfig.redirectUri,
    code_verifier: codeVerifier,
  });

  // Exchange code for tokens
  const response = await fetch(finalConfig.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error: OAuthError = await response.json().catch(() => ({
      error: 'token_exchange_failed',
      error_description: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new Error(
      `Token exchange failed: ${error.error} - ${error.error_description || 'Unknown error'}`
    );
  }

  const tokens: OAuthTokens = await response.json();

  // Validate token response
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Invalid token response: missing required tokens');
  }

  return tokens;
}

/**
 * Refreshes access token using refresh token.
 *
 * Note: Refresh tokens should be stored in httpOnly cookies.
 * This function should be called from a server-side API route.
 *
 * @param refreshToken - Current refresh token
 * @param config - Optional OAuth configuration
 * @returns New OAuth tokens
 * @throws Error if refresh fails
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: Partial<OAuthConfig> = {}
): Promise<OAuthTokens> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate required config
  if (!finalConfig.clientId) {
    throw new Error('OAuth client ID is not configured');
  }

  if (!finalConfig.tokenEndpoint) {
    throw new Error('OAuth token endpoint is not configured');
  }

  // Build refresh request
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: finalConfig.clientId,
  });

  // Request new tokens
  const response = await fetch(finalConfig.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error: OAuthError = await response.json().catch(() => ({
      error: 'refresh_failed',
      error_description: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new Error(
      `Token refresh failed: ${error.error} - ${error.error_description || 'Unknown error'}`
    );
  }

  const tokens: OAuthTokens = await response.json();

  // Validate token response
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Invalid token response: missing required tokens');
  }

  return tokens;
}
