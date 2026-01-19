import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase SSR
const mockSupabaseCreateServerClient = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockSupabaseCreateServerClient,
}));

describe('server', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockSupabaseCreateServerClient.mockClear();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();
  });

  describe('createServerSupabaseClient', () => {
    it('should create a server client with cookie store', async () => {
      const { createServerSupabaseClient } = await import('../server');

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([{ name: 'sb-token', value: 'token123' }]),
        set: vi.fn(),
      };

      const client = createServerSupabaseClient(mockCookieStore);

      expect(mockSupabaseCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
      expect(client).toBeDefined();
    });

    it('should use config overrides when provided', async () => {
      const { createServerSupabaseClient } = await import('../server');

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      };

      createServerSupabaseClient(mockCookieStore, {
        supabaseUrl: 'https://custom.supabase.co',
        supabaseAnonKey: 'custom-key',
      });

      expect(mockSupabaseCreateServerClient).toHaveBeenCalledWith(
        'https://custom.supabase.co',
        'custom-key',
        expect.any(Object)
      );
    });

    it('should throw when config is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { createServerSupabaseClient } = await import('../server');

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      };

      expect(() => createServerSupabaseClient(mockCookieStore)).toThrow(
        'Missing Supabase configuration'
      );
    });

    it('should delegate cookie operations to cookie store', async () => {
      const { createServerSupabaseClient } = await import('../server');

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([{ name: 'test', value: 'value' }]),
        set: vi.fn(),
      };

      createServerSupabaseClient(mockCookieStore);

      // Get the cookies object passed to createServerClient
      const call = mockSupabaseCreateServerClient.mock.calls[0] as unknown[];
      const options = call[2] as { cookies: { getAll: () => unknown[]; setAll: (cookies: unknown[]) => void } };
      const cookiesArg = options.cookies;

      // Test getAll
      const cookies = cookiesArg.getAll();
      expect(mockCookieStore.getAll).toHaveBeenCalled();
      expect(cookies).toEqual([{ name: 'test', value: 'value' }]);

      // Test setAll
      cookiesArg.setAll([
        { name: 'cookie1', value: 'val1', options: { path: '/' } },
        { name: 'cookie2', value: 'val2', options: { secure: true } },
      ]);
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenCalledWith('cookie1', 'val1', { path: '/' });
      expect(mockCookieStore.set).toHaveBeenCalledWith('cookie2', 'val2', { secure: true });
    });

    it('should handle setAll errors gracefully (Server Component context)', async () => {
      const { createServerSupabaseClient } = await import('../server');

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn().mockImplementation(() => {
          throw new Error('Cannot set cookies in Server Component');
        }),
      };

      createServerSupabaseClient(mockCookieStore);

      // Get the cookies object passed to createServerClient
      const call = mockSupabaseCreateServerClient.mock.calls[0] as unknown[];
      const options = call[2] as { cookies: { setAll: (cookies: unknown[]) => void } };
      const cookiesArg = options.cookies;

      // setAll should not throw even when cookie.set throws
      expect(() => {
        cookiesArg.setAll([{ name: 'test', value: 'val', options: {} }]);
      }).not.toThrow();
    });
  });

  describe('createAsyncServerClient', () => {
    it('should await getCookies and create client', async () => {
      const { createAsyncServerClient } = await import('../server');

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      };

      const getCookies = vi.fn().mockResolvedValue(mockCookieStore);

      const client = await createAsyncServerClient(getCookies);

      expect(getCookies).toHaveBeenCalled();
      expect(mockSupabaseCreateServerClient).toHaveBeenCalled();
      expect(client).toBeDefined();
    });
  });
});
