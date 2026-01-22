/**
 * Tests for OAuth to Supabase Auth Bridge
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSupabaseSession,
  refreshSupabaseSession,
  revokeSupabaseSession,
  BridgeErrorCode,
} from '../supabase-bridge';

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('supabase-bridge', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('createSupabaseSession', () => {
    it('should create a session from valid OAuth token', async () => {
      // Create a mock JWT token
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const mockToken = createMockJWT(mockPayload);

      // Mock Supabase client responses
      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: {
            session: {
              access_token: mockToken,
              refresh_token: 'mock-refresh-token',
              expires_at: mockPayload.exp,
              expires_in: 3600,
            },
            user: {
              id: mockPayload.sub,
              email: mockPayload.email,
              role: mockPayload.role,
            },
          },
          error: null,
        },
        profileCheckResponse: {
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        },
        profileInsertResponse: {
          data: null,
          error: null,
        },
      });

      // Mock createClient to return our mock
      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await createSupabaseSession(mockToken, 'mock-refresh-token');

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe(mockToken);
      expect(result.session?.refresh_token).toBe('mock-refresh-token');
      expect(result.session?.user.id).toBe(mockPayload.sub);
      expect(result.session?.user.email).toBe(mockPayload.email);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid token format', async () => {
      const invalidToken = 'not-a-valid-jwt';

      const result = await createSupabaseSession(invalidToken);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(BridgeErrorCode.INVALID_TOKEN);
      expect(result.error?.message).toContain('Invalid access token format');
    });

    it('should return error for expired token', async () => {
      const expiredPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const expiredToken = createMockJWT(expiredPayload);

      const result = await createSupabaseSession(expiredToken);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(BridgeErrorCode.TOKEN_EXPIRED);
      expect(result.error?.message).toContain('expired');
    });

    it('should return error for missing user claims', async () => {
      const invalidPayload = {
        // Missing sub and email
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const invalidToken = createMockJWT(invalidPayload);

      const result = await createSupabaseSession(invalidToken);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(BridgeErrorCode.INVALID_TOKEN);
    });

    it('should return error when Supabase setSession fails', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockToken = createMockJWT(mockPayload);

      // Mock Supabase client with error response
      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: null,
          error: { message: 'Invalid token signature' },
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await createSupabaseSession(mockToken, 'mock-refresh-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(BridgeErrorCode.SESSION_CREATE_FAILED);
      expect(result.error?.details).toContain('Invalid token signature');
    });

    it('should sync user profile on successful session creation', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockToken = createMockJWT(mockPayload);

      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: {
            session: {
              access_token: mockToken,
              refresh_token: 'mock-refresh-token',
              expires_at: mockPayload.exp,
              expires_in: 3600,
            },
            user: {
              id: mockPayload.sub,
              email: mockPayload.email,
              role: mockPayload.role,
            },
          },
          error: null,
        },
        profileCheckResponse: {
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        },
        profileInsertResponse: {
          data: null,
          error: null,
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const profileOptions = {
        facility_name: 'Sunny Acres',
        default_game_title: 'Bingo',
      };

      const result = await createSupabaseSession(mockToken, 'mock-refresh-token', profileOptions);

      expect(result.success).toBe(true);

      // Verify profile insert was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.mockProfileInsert).toHaveBeenCalled();
    });

    it('should update existing profile if it exists', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockToken = createMockJWT(mockPayload);

      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: {
            session: {
              access_token: mockToken,
              refresh_token: 'mock-refresh-token',
              expires_at: mockPayload.exp,
              expires_in: 3600,
            },
            user: {
              id: mockPayload.sub,
              email: mockPayload.email,
              role: mockPayload.role,
            },
          },
          error: null,
        },
        profileCheckResponse: {
          data: { id: mockPayload.sub },
          error: null,
        },
        profileUpdateResponse: {
          data: null,
          error: null,
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await createSupabaseSession(mockToken, 'mock-refresh-token');

      expect(result.success).toBe(true);

      // Verify profile queries were made (update path taken)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should succeed even if profile sync fails', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockToken = createMockJWT(mockPayload);

      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: {
            session: {
              access_token: mockToken,
              refresh_token: 'mock-refresh-token',
              expires_at: mockPayload.exp,
              expires_in: 3600,
            },
            user: {
              id: mockPayload.sub,
              email: mockPayload.email,
              role: mockPayload.role,
            },
          },
          error: null,
        },
        profileCheckResponse: {
          data: null,
          error: { message: 'Database error' }, // Non-404 error
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      // Session should still succeed even if profile sync fails
      const result = await createSupabaseSession(mockToken, 'mock-refresh-token');

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
    });

    it('should return error when missing environment variables', async () => {
      // Clear env vars
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const mockToken = createMockJWT({
        sub: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const result = await createSupabaseSession(mockToken);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.details).toContain('environment variables');
    });
  });

  describe('refreshSupabaseSession', () => {
    it('should refresh session with valid refresh token', async () => {
      const mockSupabaseClient = createMockSupabaseClient({
        refreshSessionResponse: {
          data: {
            session: {
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              expires_in: 3600,
            },
            user: {
              id: 'user-123',
              email: 'user@example.com',
              role: 'authenticated',
            },
          },
          error: null,
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await refreshSupabaseSession('valid-refresh-token');

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe('new-access-token');
      expect(result.session?.refresh_token).toBe('new-refresh-token');
    });

    it('should return error when refresh token is invalid', async () => {
      const mockSupabaseClient = createMockSupabaseClient({
        refreshSessionResponse: {
          data: null,
          error: { message: 'Invalid refresh token' },
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await refreshSupabaseSession('invalid-refresh-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(BridgeErrorCode.SESSION_CREATE_FAILED);
      expect(result.error?.details).toContain('Invalid refresh token');
    });
  });

  describe('revokeSupabaseSession', () => {
    it('should revoke session successfully', async () => {
      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: {
            session: { access_token: 'test', refresh_token: '' },
            user: { id: 'user-123', email: 'user@example.com', role: 'authenticated' },
          },
          error: null,
        },
        signOutResponse: {
          error: null,
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await revokeSupabaseSession('valid-access-token');

      expect(result).toBe(true);
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should return false when revocation fails', async () => {
      const mockSupabaseClient = createMockSupabaseClient({
        setSessionResponse: {
          data: {
            session: { access_token: 'test', refresh_token: '' },
            user: { id: 'user-123', email: 'user@example.com', role: 'authenticated' },
          },
          error: null,
        },
        signOutResponse: {
          error: { message: 'Sign out failed' },
        },
      });

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

      const result = await revokeSupabaseSession('valid-access-token');

      expect(result).toBe(false);
    });
  });
});

/**
 * Helper function to create a mock JWT token
 */
function createMockJWT(payload: Record<string, unknown>): string {
  // Create a simple mock JWT (header.payload.signature)
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'mock-signature';

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Helper function to create a mock Supabase client
 */
function createMockSupabaseClient(responses: {
  setSessionResponse?: { data: unknown; error: unknown };
  refreshSessionResponse?: { data: unknown; error: unknown };
  signOutResponse?: { error: unknown };
  profileCheckResponse?: { data: unknown; error: unknown };
  profileInsertResponse?: { data: unknown; error: unknown };
  profileUpdateResponse?: { data: unknown; error: unknown };
}) {
  const mockProfileSelect = vi.fn().mockReturnThis();
  const mockProfileEq = vi.fn().mockReturnThis();
  const mockProfileSingle = vi.fn().mockReturnValue({
    data: responses.profileCheckResponse?.data || null,
    error: responses.profileCheckResponse?.error || null,
  });
  const mockProfileInsert = vi.fn().mockReturnValue({
    data: responses.profileInsertResponse?.data || null,
    error: responses.profileInsertResponse?.error || null,
  });
  const mockProfileUpdateEq = vi.fn().mockReturnValue({
    data: responses.profileUpdateResponse?.data || null,
    error: responses.profileUpdateResponse?.error || null,
  });

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: mockProfileSelect,
        insert: mockProfileInsert,
        update: () => ({
          eq: mockProfileUpdateEq,
        }),
        eq: mockProfileEq,
        single: mockProfileSingle,
      };
    }
    return {};
  });

  return {
    auth: {
      setSession: vi.fn().mockResolvedValue(responses.setSessionResponse || { data: null, error: null }),
      refreshSession: vi.fn().mockResolvedValue(responses.refreshSessionResponse || { data: null, error: null }),
      signOut: vi.fn().mockResolvedValue(responses.signOutResponse || { error: null }),
    },
    from: mockFrom,
    // Store mocks for verification in tests
    mockProfileSelect,
    mockProfileEq,
    mockProfileSingle,
    mockProfileInsert,
  };
}
