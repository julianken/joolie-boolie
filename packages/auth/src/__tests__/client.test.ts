import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock @supabase/ssr before importing the module under test
const mockCreateBrowserClient = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe('client', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateBrowserClient.mockClear();
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('createClient', () => {
    it('should create a browser client with env variables', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { createClient } = await import('../client');
      const client = createClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
      expect(client).toBeDefined();
    });

    it('should create a browser client with config overrides', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://env.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'env-key';

      const { createClient } = await import('../client');
      const client = createClient({
        supabaseUrl: 'https://config.supabase.co',
        supabaseAnonKey: 'config-key',
      });

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://config.supabase.co',
        'config-key'
      );
      expect(client).toBeDefined();
    });

    it('should throw if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { createClient } = await import('../client');

      expect(() => createClient()).toThrow('Missing required Supabase URL');
    });

    it('should throw if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

      const { createClient } = await import('../client');

      expect(() => createClient()).toThrow('Missing required Supabase anon key');
    });
  });

  describe('getClient', () => {
    it('should return a singleton client', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { getClient, resetClient } = await import('../client');

      // Reset any cached client
      resetClient();

      const client1 = getClient();
      const client2 = getClient();

      expect(client1).toBe(client2);
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetClient', () => {
    it('should clear the cached client', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { getClient, resetClient } = await import('../client');

      resetClient();
      getClient();
      resetClient();
      getClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2);
    });
  });
});
