/**
 * CSRF Token Generation and Validation
 *
 * Provides cryptographically secure CSRF protection for OAuth flows.
 * Tokens are stored in httpOnly cookies and validated on form submission.
 *
 * Security features:
 * - Cryptographically random tokens (32 bytes)
 * - HttpOnly cookies (prevents XSS)
 * - SameSite=Lax (prevents CSRF)
 * - Token rotation after each use
 * - Short expiration (15 minutes)
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'oauth_csrf_token';
const CSRF_TOKEN_BYTES = 32;
const CSRF_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds

/**
 * Generate a cryptographically secure CSRF token
 *
 * @returns Base64-encoded random token (44 characters)
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_BYTES).toString('base64');
}

/**
 * Store CSRF token in secure httpOnly cookie
 *
 * @param token - CSRF token to store
 */
export async function setCsrfToken(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: '/',
  });
}

/**
 * Retrieve CSRF token from cookie
 *
 * @returns CSRF token or null if not found
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);

  return cookie?.value || null;
}

/**
 * Validate CSRF token against stored cookie
 *
 * @param token - Token from form submission
 * @returns true if token is valid, false otherwise
 */
export async function validateCsrfToken(token: string | null | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }

  const storedToken = await getCsrfToken();

  if (!storedToken) {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token, 'base64'),
    Buffer.from(storedToken, 'base64')
  );
}

/**
 * Clear CSRF token cookie (used after validation)
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}
