import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}));

import { createClient } from '../server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

describe('supabase server', () => {
  const mockCookies = cookies as ReturnType<typeof vi.fn>;
  const mockCreateServerClient = createServerClient as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  it('creates a server client with correct environment variables', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([{ name: 'session', value: 'test' }]),
      set: vi.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
    mockCreateServerClient.mockReturnValue({ auth: {}, from: vi.fn() });

    await createClient();

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

  it('cookie getAll returns cookies from cookie store', async () => {
    const testCookies = [{ name: 'session', value: 'test-session-value' }];
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue(testCookies),
      set: vi.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);

    let capturedCookieHandlers: { getAll: () => unknown; setAll: (c: unknown[]) => void } | null = null;
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookieHandlers = options.cookies;
      return { auth: {}, from: vi.fn() };
    });

    await createClient();

    // Call getAll
    const result = capturedCookieHandlers!.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
    expect(result).toEqual(testCookies);
  });

  it('cookie setAll sets cookies on cookie store', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);

    let capturedCookieHandlers: { getAll: () => unknown; setAll: (c: unknown[]) => void } | null = null;
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookieHandlers = options.cookies;
      return { auth: {}, from: vi.fn() };
    });

    await createClient();

    // Call setAll
    const cookiesToSet = [
      { name: 'session', value: 'new-value', options: { path: '/' } },
    ];
    capturedCookieHandlers!.setAll(cookiesToSet);

    expect(mockCookieStore.set).toHaveBeenCalledWith('session', 'new-value', { path: '/' });
  });

  it('cookie setAll silently handles errors from Server Components', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cannot set cookies in Server Component');
      }),
    };
    mockCookies.mockResolvedValue(mockCookieStore);

    let capturedCookieHandlers: { getAll: () => unknown; setAll: (c: unknown[]) => void } | null = null;
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      capturedCookieHandlers = options.cookies;
      return { auth: {}, from: vi.fn() };
    });

    await createClient();

    // Call setAll - should not throw
    const cookiesToSet = [
      { name: 'session', value: 'new-value', options: { path: '/' } },
    ];

    // This should not throw even though set() throws
    expect(() => capturedCookieHandlers!.setAll(cookiesToSet)).not.toThrow();
  });
});
