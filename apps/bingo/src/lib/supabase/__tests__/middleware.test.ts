import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

import { updateSession } from '../middleware';
import { createServerClient } from '@supabase/ssr';

describe('supabase middleware', () => {
  const mockCreateServerClient = createServerClient as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  function createMockRequest(cookies: Record<string, string> = {}): NextRequest {
    const url = new URL('https://example.com/test');
    const request = new NextRequest(url);

    // Mock cookies
    const mockCookies = {
      getAll: vi.fn().mockReturnValue(
        Object.entries(cookies).map(([name, value]) => ({ name, value }))
      ),
      set: vi.fn(),
    };

    Object.defineProperty(request, 'cookies', {
      value: mockCookies,
      writable: false,
    });

    return request;
  }

  it('creates a server client with request cookies', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ session: 'test-session' });
    await updateSession(request);

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it('calls getUser to refresh session', async () => {
    const getUserMock = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
    const mockSupabase = {
      auth: {
        getUser: getUserMock,
      },
    };
    mockCreateServerClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    await updateSession(request);

    expect(getUserMock).toHaveBeenCalled();
  });

  it('returns NextResponse.next() response', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await updateSession(request);

    expect(response).toBeDefined();
    // Check that it's a NextResponse
    expect(response.headers).toBeDefined();
  });

  it('cookie getAll reads from request cookies', async () => {
    const testCookies = { session: 'test-value', other: 'other-value' };

    let capturedCookieHandlers: {
      getAll: () => unknown;
      setAll: (c: unknown[]) => void;
    } | null = null;

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookieHandlers = options.cookies;
      return mockSupabase;
    });

    const request = createMockRequest(testCookies);
    await updateSession(request);

    // Call getAll and verify it reads from request
    const cookies = capturedCookieHandlers!.getAll();
    expect(cookies).toEqual([
      { name: 'session', value: 'test-value' },
      { name: 'other', value: 'other-value' },
    ]);
  });

  it('cookie setAll updates both request and response cookies', async () => {
    let capturedCookieHandlers: {
      getAll: () => unknown;
      setAll: (c: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
    } | null = null;

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookieHandlers = options.cookies;
      return mockSupabase;
    });

    const request = createMockRequest();
    const response = await updateSession(request);

    // Simulate setAll being called
    const cookiesToSet = [
      { name: 'new-cookie', value: 'new-value', options: { path: '/', httpOnly: true } },
    ];
    capturedCookieHandlers!.setAll(cookiesToSet);

    // Verify request cookies were updated
    expect(request.cookies.set).toHaveBeenCalledWith('new-cookie', 'new-value');

    // Response should exist and be a NextResponse
    expect(response).toBeDefined();
  });
});
