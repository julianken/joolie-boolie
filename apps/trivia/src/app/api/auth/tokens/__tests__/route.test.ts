/**
 * Tests for OAuth Token Storage API Route
 *
 * Tests token storage and deletion in httpOnly cookies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';

// Create mock cookie store
let mockCookieStore: {
  set: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Mock next/headers with factory function
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

describe('/api/auth/tokens', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockCookieStore = {
      set: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe('POST - Store tokens', () => {
    it('should store access_token and refresh_token in httpOnly cookies', async () => {
      const tokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
      };

      const request = new NextRequest(
        'http://localhost:3001/api/auth/tokens',
        {
          method: 'POST',
          body: JSON.stringify(tokens),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify access token cookie was set
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'oauth_access_token',
        'test_access_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600,
        })
      );

      // Verify refresh token cookie was set
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'oauth_refresh_token',
        'test_refresh_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      );
    });

    it('should set secure flag based on NODE_ENV', async () => {
      // Note: In test environment, secure will be false
      // In production, secure will be true
      const tokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
      };

      const request = new NextRequest(
        'http://localhost:3001/api/auth/tokens',
        {
          method: 'POST',
          body: JSON.stringify(tokens),
        }
      );

      await POST(request);

      // Verify secure flag matches environment
      const expectedSecure = process.env.NODE_ENV === 'production';
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'oauth_access_token',
        'test_access_token',
        expect.objectContaining({
          secure: expectedSecure,
        })
      );
    });

    it('should use default expires_in if not provided', async () => {
      const tokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_type: 'Bearer' as const,
        expires_in: 0, // Will use default
      };

      const request = new NextRequest(
        'http://localhost:3001/api/auth/tokens',
        {
          method: 'POST',
          body: JSON.stringify(tokens),
        }
      );

      await POST(request);

      // Should use default 1 hour expiry
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'oauth_access_token',
        'test_access_token',
        expect.objectContaining({
          maxAge: 60 * 60, // 1 hour default
        })
      );
    });

    it('should return 400 if access_token is missing', async () => {
      const invalidTokens = {
        refresh_token: 'test_refresh_token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
      };

      const request = new NextRequest(
        'http://localhost:3001/api/auth/tokens',
        {
          method: 'POST',
          body: JSON.stringify(invalidTokens),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Missing required tokens');
    });

    it('should return 400 if refresh_token is missing', async () => {
      const invalidTokens = {
        access_token: 'test_access_token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
      };

      const request = new NextRequest(
        'http://localhost:3001/api/auth/tokens',
        {
          method: 'POST',
          body: JSON.stringify(invalidTokens),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Missing required tokens');
    });

    it('should return 500 if cookie storage fails', async () => {
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie storage failed');
      });

      const tokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
      };

      const request = new NextRequest(
        'http://localhost:3001/api/auth/tokens',
        {
          method: 'POST',
          body: JSON.stringify(tokens),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to store tokens');
    });
  });

  describe('DELETE - Clear tokens', () => {
    it('should delete access_token and refresh_token cookies', async () => {
      const response = await DELETE();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify both cookies were deleted
      expect(mockCookieStore.delete).toHaveBeenCalledWith(
        'oauth_access_token'
      );
      expect(mockCookieStore.delete).toHaveBeenCalledWith(
        'oauth_refresh_token'
      );
    });

    it('should return 500 if cookie deletion fails', async () => {
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error('Cookie deletion failed');
      });

      const response = await DELETE();
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to clear tokens');
    });
  });
});
