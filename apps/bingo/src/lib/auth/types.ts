/**
 * TypeScript type definitions for OAuth 2.1 client
 */

/**
 * OAuth token response from Platform Hub
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number; // Seconds until access token expires
  scope?: string;
}

/**
 * OAuth error response from Platform Hub
 */
export interface OAuthErrorResponse {
  error:
    | 'invalid_request'
    | 'invalid_client'
    | 'invalid_grant'
    | 'unauthorized_client'
    | 'unsupported_grant_type'
    | 'invalid_scope'
    | 'access_denied'
    | 'server_error'
    | 'temporarily_unavailable';
  error_description?: string;
  error_uri?: string;
}

/**
 * Stored token pair with expiration metadata
 */
export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  expires_at: number; // Unix timestamp (ms)
}

/**
 * OAuth authorization request parameters
 */
export interface AuthorizationRequest {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

/**
 * OAuth token request parameters (authorization code grant)
 */
export interface TokenRequest {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  client_id: string;
  code_verifier: string;
}

/**
 * OAuth token request parameters (refresh token grant)
 */
export interface RefreshTokenRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
  client_id: string;
}

/**
 * PKCE code pair
 */
export interface PKCEPair {
  verifier: string; // code_verifier (43-128 chars, base64url)
  challenge: string; // code_challenge (SHA-256 of verifier, base64url)
}

/**
 * OAuth client configuration
 */
export interface OAuthClientConfig {
  clientId: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
}

/**
 * User profile from access token (JWT payload)
 */
export interface OAuthUserProfile {
  sub: string; // User ID
  email: string;
  name?: string;
  role?: string;
  facility_id?: string;
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration (Unix timestamp)
}
