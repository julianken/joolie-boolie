/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.1
 *
 * Implements RFC 7636 for secure authorization code flow in public clients.
 * Uses Web Crypto API (crypto.subtle) for SHA-256 hashing.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7636
 */

/**
 * PKCE parameters for OAuth authorization
 */
export interface PKCEParams {
  /** Random string (43-128 chars, base64url encoded) */
  codeVerifier: string;
  /** SHA-256 hash of code_verifier (base64url encoded) */
  codeChallenge: string;
  /** Always 'S256' for SHA-256 */
  codeChallengeMethod: 'S256';
}

/**
 * Generates a cryptographically secure PKCE code verifier and challenge.
 *
 * Process:
 * 1. Generate 32 random bytes using crypto.getRandomValues()
 * 2. Base64url-encode to create code_verifier (43 chars)
 * 3. SHA-256 hash the code_verifier
 * 4. Base64url-encode the hash to create code_challenge
 *
 * @returns PKCE parameters ready for OAuth authorization
 * @throws Error if Web Crypto API is not available
 */
export async function generatePKCE(): Promise<PKCEParams> {
  // Check for Web Crypto API availability
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  // Generate code_verifier (32 random bytes = 43 base64url chars)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64URLEncode(array);

  // Generate code_challenge (SHA-256 hash of code_verifier)
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = base64URLEncode(new Uint8Array(hash));

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Encodes a Uint8Array to base64url format (RFC 4648 §5).
 *
 * Base64url encoding:
 * - Replace '+' with '-'
 * - Replace '/' with '_'
 * - Remove padding '='
 *
 * @param buffer - Binary data to encode
 * @returns Base64url-encoded string
 */
function base64URLEncode(buffer: Uint8Array): string {
  // Convert Uint8Array to binary string
  const binary = String.fromCharCode(...buffer);

  // Base64 encode
  const base64 = btoa(binary);

  // Convert to base64url format
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Validates a PKCE code verifier format.
 *
 * Requirements (RFC 7636):
 * - Length: 43-128 characters
 * - Characters: [A-Z] [a-z] [0-9] - . _ ~
 *
 * @param verifier - Code verifier to validate
 * @returns true if valid format
 */
export function isValidCodeVerifier(verifier: string): boolean {
  if (!verifier || verifier.length < 43 || verifier.length > 128) {
    return false;
  }

  // Check allowed characters (unreserved characters from RFC 3986)
  const validPattern = /^[A-Za-z0-9\-._~]+$/;
  return validPattern.test(verifier);
}
