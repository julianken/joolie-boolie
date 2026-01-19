import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

// Mock Supabase auth
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Helper to create a NextRequest
function createMockRequest(pathname: string, searchParams?: Record<string, string>): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url, {
    headers: new Headers({
      cookie: 'test-cookie=value',
    }),
  });
}

describe('middleware', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockGetUser.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();
  });

  describe('updateSession', () => {
    it('should return NextResponse with updated cookies', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { updateSession } = await import('../middleware');
      const request = createMockRequest('/dashboard');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
      expect(mockGetUser).toHaveBeenCalled();
    });

    it('should work without authentication', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { updateSession } = await import('../middleware');
      const request = createMockRequest('/public');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('should handle missing config gracefully', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { updateSession } = await import('../middleware');
      const request = createMockRequest('/dashboard');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });

  describe('createAuthMiddleware', () => {
    it('should redirect unauthenticated users from protected paths', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        protectedPaths: ['/dashboard/*'],
        loginUrl: '/login',
      });

      const request = createMockRequest('/dashboard/settings');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirectTo=%2Fdashboard%2Fsettings');
    });

    it('should allow authenticated users on protected paths', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        protectedPaths: ['/dashboard/*'],
        loginUrl: '/login',
      });

      const request = createMockRequest('/dashboard/settings');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should redirect authenticated users from auth paths to home', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        authPaths: ['/login', '/signup'],
        homeUrl: '/dashboard',
      });

      const request = createMockRequest('/login');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should allow unauthenticated users on auth paths', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        authPaths: ['/login', '/signup'],
        homeUrl: '/dashboard',
      });

      const request = createMockRequest('/login');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should respect redirectTo parameter for authenticated users on auth paths', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        authPaths: ['/login'],
        homeUrl: '/default',
      });

      const request = createMockRequest('/login', { redirectTo: '/my-page' });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/my-page');
    });

    it('should allow public paths without authentication', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        protectedPaths: ['/dashboard/*'],
      });

      const request = createMockRequest('/about');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should match exact paths', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        protectedPaths: ['/dashboard'],
      });

      // Exact match should redirect
      const request1 = createMockRequest('/dashboard');
      const response1 = await middleware(request1);
      expect(response1.status).toBe(307);

      // Child path should not redirect (no wildcard)
      const request2 = createMockRequest('/dashboard/settings');
      const response2 = await middleware(request2);
      expect(response2.status).toBe(200);
    });

    it('should support [param] style patterns', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        protectedPaths: ['/users/[id]/profile'],
      });

      const request = createMockRequest('/users/123/profile');
      const response = await middleware(request);

      expect(response.status).toBe(307);
    });

    it('should call onAuthRequired callback', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const onAuthRequired = vi.fn();
      const { createAuthMiddleware } = await import('../middleware');
      const middleware = createAuthMiddleware({
        protectedPaths: ['/dashboard/*'],
        onAuthRequired,
      });

      const request = createMockRequest('/dashboard/settings');
      await middleware(request);

      expect(onAuthRequired).toHaveBeenCalledWith(request, null);
    });
  });

  describe('getMiddlewareUser', () => {
    it('should return the authenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { getMiddlewareUser } = await import('../middleware');
      const request = createMockRequest('/any-path');
      const user = await getMiddlewareUser(request);

      expect(user).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { getMiddlewareUser } = await import('../middleware');
      const request = createMockRequest('/any-path');
      const user = await getMiddlewareUser(request);

      expect(user).toBeNull();
    });

    it('should return null when config is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { getMiddlewareUser } = await import('../middleware');
      const request = createMockRequest('/any-path');
      const user = await getMiddlewareUser(request);

      expect(user).toBeNull();
    });
  });
});
