/**
 * OAuth 2.1 Client for Trivia App
 * Handles authorization code flow with PKCE
 */

import { generatePKCE } from './pkce';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI!;

/**
 * Start OAuth 2.1 authorization code flow with PKCE
 * Generates PKCE parameters, stores code_verifier, and redirects to Platform Hub
 */
export async function startOAuthFlow(): Promise<void> {
  // Validate environment variables
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  if (!CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_OAUTH_CLIENT_ID is not configured');
  }
  if (!REDIRECT_URI) {
    throw new Error('NEXT_PUBLIC_OAUTH_REDIRECT_URI is not configured');
  }

  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = await generatePKCE();

  // Store code_verifier in sessionStorage for callback
  sessionStorage.setItem('trivia_pkce_verifier', codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_type: 'code',
  });

  const authorizeUrl = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;

  // Redirect to Platform Hub OAuth consent page
  window.location.href = authorizeUrl;
}
