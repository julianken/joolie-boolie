/**
 * CSRF Token Tests
 *
 * Tests for CSRF token generation, storage, validation, and rotation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  generateCsrfToken,
  setCsrfToken,
  getCsrfToken,
  validateCsrfToken,
  clearCsrfToken,
} from '../csrf';

// Mock Next.js cookies
const mockCookies = new Map<string, { value: string; options: Record<string, unknown> }>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => mockCookies.get(name)),
    set: vi.fn((name: string, value: string, options: Record<string, unknown>) => {
      mockCookies.set(name, { value, options });
    }),
    delete: vi.fn((name: string) => {
      mockCookies.delete(name);
    }),
  })),
}));

describe('CSRF Token Library', () => {
  beforeEach(() => {
    mockCookies.clear();
  });

  describe('generateCsrfToken', () => {
    it('should generate a base64-encoded token', () => {
      const token = generateCsrfToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify it's valid base64
      const buffer = Buffer.from(token, 'base64');
      expect(buffer.length).toBe(32); // 32 bytes
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
    });

    it('should use cryptographically secure random bytes', () => {
      const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');

      generateCsrfToken();

      expect(randomBytesSpy).toHaveBeenCalledWith(32);
    });
  });

  describe('setCsrfToken', () => {
    it('should store token in httpOnly cookie', async () => {
      const token = generateCsrfToken();

      await setCsrfToken(token);

      const stored = mockCookies.get('oauth_csrf_token');
      expect(stored).toBeDefined();
      expect(stored?.value).toBe(token);
    });

    it('should set correct cookie options', async () => {
      const token = generateCsrfToken();

      await setCsrfToken(token);

      const stored = mockCookies.get('oauth_csrf_token');
      expect(stored?.options).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
      });
    });

    it('should set secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const token = generateCsrfToken();
      await setCsrfToken(token);

      const stored = mockCookies.get('oauth_csrf_token');
      expect(stored?.options.secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not set secure flag in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const token = generateCsrfToken();
      await setCsrfToken(token);

      const stored = mockCookies.get('oauth_csrf_token');
      expect(stored?.options.secure).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getCsrfToken', () => {
    it('should retrieve stored token', async () => {
      const token = generateCsrfToken();
      mockCookies.set('oauth_csrf_token', { value: token, options: {} });

      const retrieved = await getCsrfToken();

      expect(retrieved).toBe(token);
    });

    it('should return null if token not found', async () => {
      const retrieved = await getCsrfToken();

      expect(retrieved).toBeNull();
    });
  });

  describe('validateCsrfToken', () => {
    it('should return true for valid token', async () => {
      const token = generateCsrfToken();
      await setCsrfToken(token);

      const isValid = await validateCsrfToken(token);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      await setCsrfToken(token1);

      const isValid = await validateCsrfToken(token2);

      expect(isValid).toBe(false);
    });

    it('should return false for null token', async () => {
      const isValid = await validateCsrfToken(null);

      expect(isValid).toBe(false);
    });

    it('should return false for undefined token', async () => {
      const isValid = await validateCsrfToken(undefined);

      expect(isValid).toBe(false);
    });

    it('should return false if no token stored', async () => {
      const token = generateCsrfToken();

      const isValid = await validateCsrfToken(token);

      expect(isValid).toBe(false);
    });

    it('should use timing-safe comparison', async () => {
      const token = generateCsrfToken();
      await setCsrfToken(token);

      const timingSafeEqualSpy = vi.spyOn(crypto, 'timingSafeEqual');

      await validateCsrfToken(token);

      expect(timingSafeEqualSpy).toHaveBeenCalled();
    });
  });

  describe('clearCsrfToken', () => {
    it('should remove token from cookies', async () => {
      const token = generateCsrfToken();
      await setCsrfToken(token);

      expect(mockCookies.has('oauth_csrf_token')).toBe(true);

      await clearCsrfToken();

      expect(mockCookies.has('oauth_csrf_token')).toBe(false);
    });
  });

  describe('Token Rotation', () => {
    it('should allow token to be rotated after validation', async () => {
      const token1 = generateCsrfToken();
      await setCsrfToken(token1);

      const isValid1 = await validateCsrfToken(token1);
      expect(isValid1).toBe(true);

      // Clear old token (simulating rotation)
      await clearCsrfToken();

      // Generate and set new token
      const token2 = generateCsrfToken();
      await setCsrfToken(token2);

      // Old token should now be invalid
      const isValid2 = await validateCsrfToken(token1);
      expect(isValid2).toBe(false);

      // New token should be valid
      const isValid3 = await validateCsrfToken(token2);
      expect(isValid3).toBe(true);
    });
  });
});
