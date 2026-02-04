import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldRefreshToken, isTokenExpired, refreshTokens } from '../token-refresh';

/**
 * Helper to create a mock JWT with a given expiry time
 */
function createMockJWT(expiresInSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'user-123',
    exp: now + expiresInSeconds,
    iat: now,
  };
  // JWT format: header.payload.signature (we only need payload for these tests)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${encodedPayload}.${signature}`;
}

describe('shouldRefreshToken', () => {
  it('returns true when token expires within 5 minutes', () => {
    // Token expires in 4 minutes (240 seconds)
    const token = createMockJWT(240);
    expect(shouldRefreshToken(token)).toBe(true);
  });

  it('returns true when token expires exactly at 5 minutes', () => {
    // Token expires in exactly 5 minutes (300 seconds)
    const token = createMockJWT(300);
    expect(shouldRefreshToken(token)).toBe(true);
  });

  it('returns false when token expires in more than 5 minutes', () => {
    // Token expires in 10 minutes (600 seconds)
    const token = createMockJWT(600);
    expect(shouldRefreshToken(token)).toBe(false);
  });

  it('returns false when token is already expired', () => {
    // Token expired 1 minute ago
    const token = createMockJWT(-60);
    expect(shouldRefreshToken(token)).toBe(false);
  });

  it('returns false for invalid token format', () => {
    expect(shouldRefreshToken('invalid-token')).toBe(false);
    expect(shouldRefreshToken('')).toBe(false);
    expect(shouldRefreshToken('a.b')).toBe(false);
  });

  it('returns false when payload is not valid JSON', () => {
    const token = 'header.not-valid-base64!.signature';
    expect(shouldRefreshToken(token)).toBe(false);
  });
});

describe('isTokenExpired', () => {
  it('returns true when token is expired', () => {
    // Token expired 1 minute ago
    const token = createMockJWT(-60);
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true when token just expired', () => {
    // Token expired just now (0 seconds remaining)
    const token = createMockJWT(0);
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns false when token is still valid', () => {
    // Token expires in 10 minutes
    const token = createMockJWT(600);
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns false when token expires in 1 second', () => {
    // Token expires in 1 second (still valid)
    const token = createMockJWT(1);
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for invalid token format', () => {
    expect(isTokenExpired('invalid-token')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
    expect(isTokenExpired('a.b')).toBe(true);
  });

  it('returns true when payload is not valid JSON', () => {
    const token = 'header.not-valid-base64!.signature';
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('refreshTokens', () => {
  const mockPlatformHubUrl = 'http://localhost:3002';
  const mockRefreshToken = 'mock-refresh-token';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns new tokens on successful refresh', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await refreshTokens(mockRefreshToken, mockPlatformHubUrl);

    expect(result.success).toBe(true);
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.error).toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(`${mockPlatformHubUrl}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: mockRefreshToken,
      }),
    });
  });

  it('returns error on failed refresh with error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    const result = await refreshTokens(mockRefreshToken, mockPlatformHubUrl);

    expect(result.success).toBe(false);
    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
    expect(result.error).toBe('invalid_grant');
  });

  it('returns fallback error when response has no error field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const result = await refreshTokens(mockRefreshToken, mockPlatformHubUrl);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Token refresh failed');
  });

  it('returns fallback error when response JSON parsing fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('Parse error')),
    });

    const result = await refreshTokens(mockRefreshToken, mockPlatformHubUrl);

    expect(result.success).toBe(false);
    // When JSON parsing fails, the catch returns { error: 'Unknown error' }
    // then error.error || 'Token refresh failed' returns 'Unknown error'
    expect(result.error).toBe('Unknown error');
  });

  it('handles network errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await refreshTokens(mockRefreshToken, mockPlatformHubUrl);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('handles non-Error thrown values', async () => {
    global.fetch = vi.fn().mockRejectedValue('string error');

    const result = await refreshTokens(mockRefreshToken, mockPlatformHubUrl);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error during refresh');
  });
});
