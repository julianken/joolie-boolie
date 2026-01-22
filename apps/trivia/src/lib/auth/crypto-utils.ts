/**
 * Cryptographic utility functions for OAuth security
 *
 * Provides constant-time comparison and other crypto operations.
 */

/**
 * Constant-time string comparison
 *
 * Prevents timing attacks by ensuring comparison takes the same time
 * regardless of where strings differ.
 *
 * Security rationale:
 * - Standard string comparison (`===`) short-circuits on first mismatch
 * - Attacker can measure response time to guess correct values
 * - Constant-time comparison always checks all characters
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 *
 * @example
 * ```typescript
 * const storedState = 'abc123';
 * const returnedState = 'abc124'; // Last char different
 *
 * // Vulnerable (timing attack):
 * storedState === returnedState; // Fast comparison, returns early
 *
 * // Secure (constant-time):
 * constantTimeCompare(storedState, returnedState); // Same time regardless
 * ```
 */
export function constantTimeCompare(a: string, b: string): boolean {
  // Different lengths = not equal (but still constant time for length check)
  if (a.length !== b.length) {
    return false;
  }

  // Convert strings to buffers for constant-time comparison
  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);

  // XOR all bytes and accumulate differences
  // This ensures we check every byte regardless of mismatches
  let result = 0;
  for (let i = 0; i < bufferA.length; i++) {
    result |= bufferA[i] ^ bufferB[i];
  }

  // result === 0 means all bytes matched
  return result === 0;
}

/**
 * Constant-time comparison using Node.js crypto module (server-side only)
 *
 * This is a server-side alternative that uses Node's built-in crypto.timingSafeEqual.
 * Use this in API routes or server components.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function constantTimeCompareNode(a: string, b: string): boolean {
  // Different lengths = not equal
  if (a.length !== b.length) {
    return false;
  }

  try {
    // Use Node's crypto.timingSafeEqual (only available server-side)
    const crypto = require('crypto');
    const bufferA = Buffer.from(a, 'utf-8');
    const bufferB = Buffer.from(b, 'utf-8');

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    // Fallback to client-side implementation if crypto is not available
    return constantTimeCompare(a, b);
  }
}
