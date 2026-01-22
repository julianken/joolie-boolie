/**
 * PKCE (Proof Key for Code Exchange) utility functions
 *
 * Implements RFC 7636 for OAuth 2.1 authorization code flow
 * - code_verifier: Random string (43-128 chars, base64url)
 * - code_challenge: SHA-256 hash of verifier (base64url)
 */

/**
 * Generate a cryptographically secure random string for PKCE code_verifier
 *
 * @param length - Length of the verifier (43-128 chars per RFC 7636)
 * @returns Base64url-encoded random string
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i]! % charset.length];
  }

  return result;
}

/**
 * Convert ArrayBuffer to base64url string
 *
 * @param buffer - ArrayBuffer to encode
 * @returns Base64url-encoded string
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  const base64 = btoa(binary);

  // Convert base64 to base64url
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate SHA-256 hash of input string
 *
 * @param input - String to hash
 * @returns Base64url-encoded SHA-256 hash
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64Url(hash);
}

/**
 * Generate PKCE code_verifier (random string)
 *
 * Creates a cryptographically secure random string of 128 characters
 * using allowed characters from RFC 7636: [A-Z, a-z, 0-9, -, ., _, ~]
 *
 * @returns PKCE code_verifier string
 */
export function generateCodeVerifier(): string {
  return generateRandomString(128); // Maximum length for security
}

/**
 * Generate PKCE code_challenge from code_verifier
 *
 * Creates SHA-256 hash of the verifier and encodes as base64url
 *
 * @param verifier - PKCE code_verifier
 * @returns Promise resolving to base64url-encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  return sha256(verifier);
}

/**
 * Generate both PKCE code_verifier and code_challenge
 *
 * Convenience function that creates both values needed for OAuth flow
 *
 * @returns Promise resolving to object with verifier and challenge
 */
export async function generatePKCEPair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  return {
    verifier,
    challenge,
  };
}
