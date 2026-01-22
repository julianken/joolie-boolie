import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  storeTokens,
  getTokens,
  clearTokens,
  isAccessTokenExpired,
  storeCodeVerifier,
  getAndClearCodeVerifier,
  updateAccessToken,
} from '../token-storage';

describe('Token Storage', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('storeTokens / getTokens', () => {
    it('should store and retrieve tokens', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);
      const retrieved = getTokens();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.access_token).toBe('access_123');
      expect(retrieved?.refresh_token).toBe('refresh_456');
      expect(retrieved?.token_type).toBe('Bearer');
    });

    it('should calculate expires_at timestamp', () => {
      const beforeStore = Date.now();

      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);
      const retrieved = getTokens();

      expect(retrieved?.expires_at).toBeDefined();
      expect(retrieved?.expires_at).toBeGreaterThan(beforeStore);
      expect(retrieved?.expires_at).toBeLessThanOrEqual(beforeStore + 3600 * 1000 + 100);
    });

    it('should return null when no tokens stored', () => {
      const retrieved = getTokens();
      expect(retrieved).toBeNull();
    });

    it('should return tokens even if expired (for refresh)', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: -1, // Already expired
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);
      const retrieved = getTokens();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.access_token).toBe('access_123');
    });
  });

  describe('clearTokens', () => {
    it('should clear stored tokens', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);
      expect(getTokens()).not.toBeNull();

      clearTokens();
      expect(getTokens()).toBeNull();
    });

    it('should not throw when no tokens to clear', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });

  describe('isAccessTokenExpired', () => {
    it('should return true when no tokens stored', () => {
      expect(isAccessTokenExpired()).toBe(true);
    });

    it('should return false for valid token', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600, // 1 hour in future
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);
      expect(isAccessTokenExpired()).toBe(false);
    });

    it('should return true for expired token', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: -1, // Already expired
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);
      expect(isAccessTokenExpired()).toBe(true);
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token while preserving refresh token', () => {
      const original = {
        access_token: 'access_old',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(original);

      updateAccessToken('access_new', 3600);

      const updated = getTokens();
      expect(updated?.access_token).toBe('access_new');
      expect(updated?.refresh_token).toBe('refresh_456'); // Unchanged
    });

    it('should update expires_at timestamp', () => {
      const original = {
        access_token: 'access_old',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(original);
      const beforeUpdate = Date.now();

      updateAccessToken('access_new', 7200); // 2 hours

      const updated = getTokens();
      expect(updated?.expires_at).toBeGreaterThan(beforeUpdate + 7200 * 1000 - 100);
    });

    it('should throw when no tokens exist to update', () => {
      expect(() => updateAccessToken('access_new', 3600)).toThrow('No tokens to update');
    });
  });

  describe('PKCE code_verifier storage', () => {
    it('should store and retrieve code_verifier', () => {
      const verifier = 'test_verifier_12345';

      storeCodeVerifier(verifier);
      const retrieved = getAndClearCodeVerifier();

      expect(retrieved).toBe(verifier);
    });

    it('should clear code_verifier after retrieval', () => {
      const verifier = 'test_verifier_12345';

      storeCodeVerifier(verifier);
      getAndClearCodeVerifier(); // First call returns verifier
      const secondCall = getAndClearCodeVerifier(); // Second call should return null

      expect(secondCall).toBeNull();
    });

    it('should return null when no verifier stored', () => {
      const retrieved = getAndClearCodeVerifier();
      expect(retrieved).toBeNull();
    });

    it('should use sessionStorage (not localStorage)', () => {
      const verifier = 'test_verifier_12345';

      storeCodeVerifier(verifier);

      // Should be in sessionStorage
      expect(sessionStorage.getItem('bingo_oauth_verifier')).toBe(verifier);

      // Should NOT be in localStorage
      expect(localStorage.getItem('bingo_oauth_verifier')).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('bingo_oauth_tokens', 'invalid json');

      const retrieved = getTokens();
      expect(retrieved).toBeNull();
    });

    it('should handle storage quota exceeded', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      expect(() => storeTokens(tokens)).toThrow('Token storage failed');

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Security considerations', () => {
    it('should not expose tokens in window object', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);

      // Tokens should not be accessible via window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((window as any).access_token).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((window as any).refresh_token).toBeUndefined();
    });

    it('should store tokens only in localStorage (not sessionStorage)', () => {
      const tokens = {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        expires_in: 3600,
        token_type: 'Bearer' as const,
      };

      storeTokens(tokens);

      // Should be in localStorage
      expect(localStorage.getItem('bingo_oauth_tokens')).not.toBeNull();

      // Should NOT be in sessionStorage
      expect(sessionStorage.getItem('bingo_oauth_tokens')).toBeNull();
    });
  });
});
