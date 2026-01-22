/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.1
 * Implements RFC 7636 with S256 challenge method
 */

/**
 * Generate PKCE code_verifier and code_challenge for OAuth 2.1 flow
 *
 * @returns Object containing base64url-encoded code_verifier and SHA-256 code_challenge
 */
export async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  // Generate 32-byte random code_verifier (256 bits)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64URLEncode(array);

  // Generate SHA-256 code_challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = base64URLEncode(new Uint8Array(hash));

  return { codeVerifier, codeChallenge };
}

/**
 * Base64url encode a Uint8Array
 *
 * @param buffer - The buffer to encode
 * @returns Base64url-encoded string (no padding, URL-safe characters)
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
