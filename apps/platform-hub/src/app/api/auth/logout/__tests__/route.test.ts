/**
 * Logout API Route Tests
 *
 * Tests for POST /api/auth/logout
 * Covers: cookie clearing, admin session revocation, error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks ---

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  getAll: vi.fn(() => []),
  set: vi.fn(),
};
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock @supabase/supabase-js createClient with admin.signOut
const mockAdminSignOut = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        signOut: mockAdminSignOut,
      },
    },
  })),
}));

// Import after mocks
import { POST } from '../route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.COOKIE_DOMAIN = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Happy path ---

  describe('successful logout', () => {
    it('should return success response', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'jb_user_id') return { value: 'user-123' };
        return undefined;
      });
      mockAdminSignOut.mockResolvedValue({ data: null, error: null });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should clear all SSO cookies', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await POST();

      // Should clear jb_access_token, jb_refresh_token, jb_user_id
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);

      const cookieCalls = mockCookieStore.set.mock.calls;

      expect(cookieCalls[0][0]).toBe('jb_access_token');
      expect(cookieCalls[0][1]).toBe('');
      expect(cookieCalls[0][2]).toMatchObject({ maxAge: 0, path: '/' });

      expect(cookieCalls[1][0]).toBe('jb_refresh_token');
      expect(cookieCalls[1][1]).toBe('');
      expect(cookieCalls[1][2]).toMatchObject({ maxAge: 0, path: '/' });

      expect(cookieCalls[2][0]).toBe('jb_user_id');
      expect(cookieCalls[2][1]).toBe('');
      expect(cookieCalls[2][2]).toMatchObject({ maxAge: 0, path: '/' });
    });

    it('should include COOKIE_DOMAIN in cleared cookies when set', async () => {
      process.env.COOKIE_DOMAIN = '.joolie-boolie.com';
      mockCookieStore.get.mockReturnValue(undefined);

      await POST();

      const cookieCalls = mockCookieStore.set.mock.calls;
      cookieCalls.forEach((call: unknown[]) => {
        expect((call[2] as Record<string, unknown>).domain).toBe('.joolie-boolie.com');
      });
    });
  });

  // --- Admin session revocation ---

  describe('admin session revocation', () => {
    it('should call admin.signOut with userId when jb_user_id cookie exists', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'jb_user_id') return { value: 'user-abc-123' };
        return undefined;
      });
      mockAdminSignOut.mockResolvedValue({ data: null, error: null });

      await POST();

      expect(mockAdminSignOut).toHaveBeenCalledWith('user-abc-123');
    });

    it('should NOT call admin.signOut when jb_user_id cookie is missing', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await POST();

      expect(mockAdminSignOut).not.toHaveBeenCalled();
    });

    it('should still clear cookies when admin.signOut returns an API error', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'jb_user_id') return { value: 'user-123' };
        return undefined;
      });
      mockAdminSignOut.mockResolvedValue({ data: null, error: { message: 'Invalid user' } });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);
    });

    it('should still clear cookies even if admin.signOut throws', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'jb_user_id') return { value: 'user-123' };
        return undefined;
      });
      mockAdminSignOut.mockRejectedValue(new Error('Supabase network error'));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);
    });

    it('should skip admin.signOut when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'jb_user_id') return { value: 'user-123' };
        return undefined;
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAdminSignOut).not.toHaveBeenCalled();
      // Cookies should still be cleared
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);
    });

    it('should skip admin.signOut when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'jb_user_id') return { value: 'user-123' };
        return undefined;
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAdminSignOut).not.toHaveBeenCalled();
      // Cookies should still be cleared
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);
    });
  });

  // --- Error handling ---

  describe('error handling', () => {
    it('should return 500 when cookie store throws', async () => {
      // Override the cookies mock to throw
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockRejectedValueOnce(new Error('Cookie store unavailable'));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
