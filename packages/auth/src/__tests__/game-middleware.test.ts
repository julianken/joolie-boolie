/**
 * Tests for game-middleware JWT verification utilities
 *
 * Tests verifyAccessToken() — the most security-critical function in the
 * codebase. It guards every production request to both Bingo and Trivia
 * apps via middleware with a 4-step verification chain:
 *
 * 1. E2E secret       (only when E2E_TESTING=true)
 * 2. SUPABASE_JWT_SECRET  (HS256 — Platform Hub OAuth tokens)
 * 3. SESSION_TOKEN_SECRET (HS256 — backward compatibility)
 * 4. Supabase JWKS        (ES256 — fallback to remote key set)
 *
 * Also tests helper functions: getE2EJwtSecret, getSupabaseJwtSecret,
 * getSessionSecret, createJwksGetter, isProtectedRoute, getCookieOptions,
 * clearAuthCookies.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignJWT, generateKeyPair } from 'jose';
import {
  verifyAccessToken,
  getE2EJwtSecret,
  getSupabaseJwtSecret,
  getSessionSecret,
  createJwksGetter,
  isProtectedRoute,
  getCookieOptions,
  clearAuthCookies,
} from '../game-middleware';

// ────────────────────────────────────────────────────────────────────────────
// Test constants
// ────────────────────────────────────────────────────────────────────────────

const E2E_SECRET_STRING = 'e2e-test-secret-key-that-is-at-least-32-characters-long';
const E2E_SECRET = new TextEncoder().encode(E2E_SECRET_STRING);

const SUPABASE_JWT_SECRET_STRING = 'test-supabase-jwt-secret-at-least-32-chars';
const SUPABASE_JWT_SECRET_BYTES = new TextEncoder().encode(SUPABASE_JWT_SECRET_STRING);

const SESSION_TOKEN_SECRET_STRING = 'test-session-token-secret-at-least-32-chars';
const SESSION_TOKEN_SECRET_BYTES = new TextEncoder().encode(SESSION_TOKEN_SECRET_STRING);

const WRONG_SECRET_STRING = 'wrong-secret-that-is-totally-different-32-chars';
const WRONG_SECRET = new TextEncoder().encode(WRONG_SECRET_STRING);

const SUPABASE_URL = 'https://test-project.supabase.co';

// ────────────────────────────────────────────────────────────────────────────
// Token helpers
// ────────────────────────────────────────────────────────────────────────────

async function createHS256Token(options: {
  sub?: string;
  email?: string;
  iss: string;
  aud: string;
  secret: Uint8Array;
  expiresInSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresInSeconds ?? 3600;

  const builder = new SignJWT({
    sub: options.sub ?? 'test-user-id',
    email: options.email ?? 'test@example.com',
    role: 'authenticated',
    aud: options.aud,
    iss: options.iss,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn);

  return builder.sign(options.secret);
}

async function createES256Token(options: {
  sub?: string;
  email?: string;
  iss: string;
  aud: string;
  privateKey: CryptoKey;
  expiresInSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresInSeconds ?? 3600;

  return new SignJWT({
    sub: options.sub ?? 'test-user-id',
    email: options.email ?? 'test@example.com',
    role: 'authenticated',
    aud: options.aud,
    iss: options.iss,
  })
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(options.privateKey);
}

// ────────────────────────────────────────────────────────────────────────────
// Mock JWKS getter that uses a local key pair
// ────────────────────────────────────────────────────────────────────────────

function createMockJWKSGetter(publicKey: CryptoKey) {
  // The jose jwtVerify function accepts a CryptoKey as the second argument.
  // createRemoteJWKSet returns a function that resolves to a key.
  // We mock this by returning a function that returns the public key directly.
  return () => {
    // This matches the return type of createRemoteJWKSet — a function that
    // accepts header/token and returns a promise resolving to a key.
    return async () => publicKey;
  };
}

/**
 * Create a failing JWKS getter that always throws (simulating unreachable JWKS).
 */
function createFailingJWKSGetter() {
  return () => {
    return async () => {
      throw new Error('JWKS endpoint unreachable');
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Secret helper tests
// ────────────────────────────────────────────────────────────────────────────

describe('getE2EJwtSecret', () => {
  afterEach(() => {
    delete process.env.E2E_JWT_SECRET;
  });

  it('returns Uint8Array when E2E_JWT_SECRET is set', () => {
    process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
    const result = getE2EJwtSecret();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(result)).toBe(E2E_SECRET_STRING);
  });

  it('throws when E2E_JWT_SECRET is not set', () => {
    delete process.env.E2E_JWT_SECRET;
    expect(() => getE2EJwtSecret()).toThrow('E2E_JWT_SECRET environment variable is required');
  });
});

describe('getSupabaseJwtSecret', () => {
  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  it('returns Uint8Array when SUPABASE_JWT_SECRET is set', () => {
    process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
    const result = getSupabaseJwtSecret();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(result!)).toBe(SUPABASE_JWT_SECRET_STRING);
  });

  it('returns null when SUPABASE_JWT_SECRET is not set', () => {
    delete process.env.SUPABASE_JWT_SECRET;
    expect(getSupabaseJwtSecret()).toBeNull();
  });
});

describe('getSessionSecret', () => {
  afterEach(() => {
    delete process.env.SESSION_TOKEN_SECRET;
  });

  it('returns Uint8Array when SESSION_TOKEN_SECRET is set', () => {
    process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;
    const result = getSessionSecret();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(result!)).toBe(SESSION_TOKEN_SECRET_STRING);
  });

  it('returns null when SESSION_TOKEN_SECRET is not set', () => {
    delete process.env.SESSION_TOKEN_SECRET;
    expect(getSessionSecret()).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// createJwksGetter tests
// ────────────────────────────────────────────────────────────────────────────

describe('createJwksGetter', () => {
  it('returns a function', () => {
    const getter = createJwksGetter(SUPABASE_URL);
    expect(typeof getter).toBe('function');
  });

  it('returns the same cached instance on repeated calls', () => {
    const getter = createJwksGetter(SUPABASE_URL);
    const jwks1 = getter();
    const jwks2 = getter();
    expect(jwks1).toBe(jwks2);
  });

  it('creates JWKS for the correct URL', () => {
    // We can't easily inspect the URL, but we can verify it doesn't throw
    const getter = createJwksGetter(SUPABASE_URL);
    expect(() => getter()).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// isProtectedRoute tests
// ────────────────────────────────────────────────────────────────────────────

describe('isProtectedRoute', () => {
  const routes = ['/play', '/admin'];

  it('returns true for exact match', () => {
    expect(isProtectedRoute('/play', routes)).toBe(true);
  });

  it('returns true for sub-path', () => {
    expect(isProtectedRoute('/play/settings', routes)).toBe(true);
  });

  it('returns false for non-matching route', () => {
    expect(isProtectedRoute('/display', routes)).toBe(false);
  });

  it('returns false for root', () => {
    expect(isProtectedRoute('/', routes)).toBe(false);
  });

  it('returns false for empty routes', () => {
    expect(isProtectedRoute('/play', [])).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getCookieOptions tests
// ────────────────────────────────────────────────────────────────────────────

describe('getCookieOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns correct options with maxAge', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const opts = getCookieOptions(3600);
    expect(opts.path).toBe('/');
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.maxAge).toBe(3600);
  });

  it('includes domain when provided', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const opts = getCookieOptions(3600, '.joolie-boolie.com');
    expect(opts.domain).toBe('.joolie-boolie.com');
  });

  it('has undefined domain when not provided', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const opts = getCookieOptions(3600);
    expect(opts.domain).toBeUndefined();
  });

  it('sets secure=true in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const opts = getCookieOptions(3600);
    expect(opts.secure).toBe(true);
  });

  it('sets secure=false in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const opts = getCookieOptions(3600);
    expect(opts.secure).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// clearAuthCookies tests
// ────────────────────────────────────────────────────────────────────────────

describe('clearAuthCookies', () => {
  it('clears all three auth cookies', () => {
    const setCalls: Array<[string, string, Record<string, unknown>]> = [];
    const mockResponse = {
      cookies: {
        set: (name: string, value: string, opts: Record<string, unknown>) => {
          setCalls.push([name, value, opts]);
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clearAuthCookies(mockResponse as any);

    expect(setCalls).toHaveLength(3);
    expect(setCalls[0][0]).toBe('jb_access_token');
    expect(setCalls[0][1]).toBe('');
    expect(setCalls[0][2].maxAge).toBe(0);

    expect(setCalls[1][0]).toBe('jb_refresh_token');
    expect(setCalls[1][1]).toBe('');
    expect(setCalls[1][2].maxAge).toBe(0);

    expect(setCalls[2][0]).toBe('jb_user_id');
    expect(setCalls[2][1]).toBe('');
    expect(setCalls[2][2].maxAge).toBe(0);
    expect(setCalls[2][2].httpOnly).toBe(false);
  });

  it('passes cookie domain to cleared cookies', () => {
    const setCalls: Array<[string, string, Record<string, unknown>]> = [];
    const mockResponse = {
      cookies: {
        set: (name: string, value: string, opts: Record<string, unknown>) => {
          setCalls.push([name, value, opts]);
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clearAuthCookies(mockResponse as any, '.joolie-boolie.com');

    for (const [, , opts] of setCalls) {
      expect(opts.domain).toBe('.joolie-boolie.com');
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// verifyAccessToken tests — the core security function
// ────────────────────────────────────────────────────────────────────────────

describe('verifyAccessToken', () => {
  // ES256 key pair for JWKS tests (generated once per suite)
  let es256PrivateKey: CryptoKey;
  let es256PublicKey: CryptoKey;

  // A second ES256 key pair (to test wrong-key rejection)
  let wrongES256PrivateKey: CryptoKey;

  // Mock JWKS getters
  let getJWKS: ReturnType<typeof createMockJWKSGetter>;
  let failingGetJWKS: ReturnType<typeof createFailingJWKSGetter>;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('ES256');
    es256PrivateKey = keyPair.privateKey;
    es256PublicKey = keyPair.publicKey;

    const wrongKeyPair = await generateKeyPair('ES256');
    wrongES256PrivateKey = wrongKeyPair.privateKey;
  });

  beforeEach(() => {
    // Clear all relevant env vars
    delete process.env.E2E_TESTING;
    delete process.env.E2E_JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    delete process.env.SESSION_TOKEN_SECRET;

    // Create fresh mock JWKS getters
    getJWKS = createMockJWKSGetter(es256PublicKey);
    failingGetJWKS = createFailingJWKSGetter();
  });

  afterEach(() => {
    delete process.env.E2E_TESTING;
    delete process.env.E2E_JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    delete process.env.SESSION_TOKEN_SECRET;
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────
  // Branch 1: E2E mode
  // ──────────────────────────────────────────────────────────────────────

  describe('E2E mode branch (E2E_TESTING=true)', () => {
    beforeEach(() => {
      process.env.E2E_TESTING = 'true';
      process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
    });

    it('accepts a valid E2E token', async () => {
      const token = await createHS256Token({
        iss: 'e2e-test',
        aud: 'authenticated',
        secret: E2E_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('rejects E2E token with wrong issuer', async () => {
      const token = await createHS256Token({
        iss: 'wrong-issuer',
        aud: 'authenticated',
        secret: E2E_SECRET,
      });

      // Should fall through to other methods, all fail, return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects E2E token with wrong audience', async () => {
      const token = await createHS256Token({
        iss: 'e2e-test',
        aud: 'wrong-audience',
        secret: E2E_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects E2E token signed with wrong secret', async () => {
      const token = await createHS256Token({
        iss: 'e2e-test',
        aud: 'authenticated',
        secret: WRONG_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects expired E2E token', async () => {
      const token = await createHS256Token({
        iss: 'e2e-test',
        aud: 'authenticated',
        secret: E2E_SECRET,
        expiresInSeconds: -60,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('does not try E2E verification when E2E_TESTING is not "true"', async () => {
      process.env.E2E_TESTING = 'false';

      // Token signed with E2E secret but E2E mode off — should not match any branch
      const token = await createHS256Token({
        iss: 'e2e-test',
        aud: 'authenticated',
        secret: E2E_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('falls through to SUPABASE_JWT_SECRET when E2E verification fails', async () => {
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;

      // Token signed with SUPABASE_JWT_SECRET, not E2E secret
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Branch 2: SUPABASE_JWT_SECRET (HS256)
  // ──────────────────────────────────────────────────────────────────────

  describe('SUPABASE_JWT_SECRET branch (HS256)', () => {
    beforeEach(() => {
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
    });

    it('accepts a valid token signed with SUPABASE_JWT_SECRET', async () => {
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('rejects token with wrong issuer', async () => {
      const token = await createHS256Token({
        iss: 'https://wrong-project.supabase.co/auth/v1',
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects token with wrong audience', async () => {
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'wrong-audience',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects token signed with wrong secret', async () => {
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: WRONG_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects expired token', async () => {
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
        expiresInSeconds: -60,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('is skipped when SUPABASE_JWT_SECRET env var is not set', async () => {
      delete process.env.SUPABASE_JWT_SECRET;

      // Token signed with SUPABASE_JWT_SECRET but env var not set
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // Falls through to JWKS (which fails) -> returns false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Branch 3: SESSION_TOKEN_SECRET (HS256, backward compatibility)
  // ──────────────────────────────────────────────────────────────────────

  describe('SESSION_TOKEN_SECRET branch (backward compat)', () => {
    beforeEach(() => {
      process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;
    });

    it('accepts a valid token signed with SESSION_TOKEN_SECRET', async () => {
      const token = await createHS256Token({
        iss: 'joolie-boolie-platform',
        aud: 'authenticated',
        secret: SESSION_TOKEN_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('rejects token with wrong issuer', async () => {
      const token = await createHS256Token({
        iss: 'wrong-platform',
        aud: 'authenticated',
        secret: SESSION_TOKEN_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects token signed with wrong secret', async () => {
      const token = await createHS256Token({
        iss: 'joolie-boolie-platform',
        aud: 'authenticated',
        secret: WRONG_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects expired token', async () => {
      const token = await createHS256Token({
        iss: 'joolie-boolie-platform',
        aud: 'authenticated',
        secret: SESSION_TOKEN_SECRET_BYTES,
        expiresInSeconds: -60,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('is skipped when SESSION_TOKEN_SECRET env var is not set', async () => {
      delete process.env.SESSION_TOKEN_SECRET;

      const token = await createHS256Token({
        iss: 'joolie-boolie-platform',
        aud: 'authenticated',
        secret: SESSION_TOKEN_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Branch 4: JWKS (ES256, Supabase fallback)
  // ──────────────────────────────────────────────────────────────────────

  describe('JWKS branch (ES256 fallback)', () => {
    it('accepts a valid ES256 token verified via JWKS', async () => {
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        privateKey: es256PrivateKey,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('rejects ES256 token with wrong issuer', async () => {
      const token = await createES256Token({
        iss: 'https://wrong.supabase.co/auth/v1',
        aud: 'authenticated',
        privateKey: es256PrivateKey,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects ES256 token with wrong audience', async () => {
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'wrong-audience',
        privateKey: es256PrivateKey,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects ES256 token signed with wrong private key', async () => {
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        privateKey: wrongES256PrivateKey,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects expired ES256 token', async () => {
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        privateKey: es256PrivateKey,
        expiresInSeconds: -60,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('returns false when JWKS endpoint is unreachable', async () => {
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        privateKey: es256PrivateKey,
      });

      // Suppress expected console.error from the JWKS failure
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Error cases: invalid/malformed tokens
  // ──────────────────────────────────────────────────────────────────────

  describe('error cases', () => {
    it('rejects completely invalid token string', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken('not-a-jwt', failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects empty token string', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken('', failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects tampered token (modified payload)', async () => {
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;

      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // Tamper with the payload by modifying the middle segment
      const parts = token.split('.');
      const payloadBytes = Uint8Array.from(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      payloadBytes[0] = payloadBytes[0] ^ 0xff; // flip bits
      const tamperedPayload = btoa(String.fromCharCode(...payloadBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(tamperedToken, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('rejects token with missing segments', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken('header.payload', failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('returns false when no secrets are configured and JWKS fails', async () => {
      // No E2E, no SUPABASE_JWT_SECRET, no SESSION_TOKEN_SECRET
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Verification chain order and fallthrough behavior
  // ──────────────────────────────────────────────────────────────────────

  describe('verification chain order', () => {
    it('tries all methods in order: E2E -> SUPABASE_JWT_SECRET -> SESSION_TOKEN_SECRET -> JWKS', async () => {
      // Configure all secrets
      process.env.E2E_TESTING = 'true';
      process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
      process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;

      // Create token signed with E2E secret — should succeed at step 1
      const token = await createHS256Token({
        iss: 'e2e-test',
        aud: 'authenticated',
        secret: E2E_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('falls through E2E to SUPABASE_JWT_SECRET', async () => {
      process.env.E2E_TESTING = 'true';
      process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;

      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('falls through E2E and SUPABASE_JWT_SECRET to SESSION_TOKEN_SECRET', async () => {
      process.env.E2E_TESTING = 'true';
      process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
      process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;

      const token = await createHS256Token({
        iss: 'joolie-boolie-platform',
        aud: 'authenticated',
        secret: SESSION_TOKEN_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('falls through all HS256 methods to JWKS (ES256)', async () => {
      process.env.E2E_TESTING = 'true';
      process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
      process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;

      // Token signed with ES256 — doesn't match any HS256 secret
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        privateKey: es256PrivateKey,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });

    it('returns false when all methods fail', async () => {
      process.env.E2E_TESTING = 'true';
      process.env.E2E_JWT_SECRET = E2E_SECRET_STRING;
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
      process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;

      // Token signed with a completely unknown secret
      const token = await createHS256Token({
        iss: 'unknown-issuer',
        aud: 'authenticated',
        secret: WRONG_SECRET,
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('stops at the first successful verification (does not try later methods)', async () => {
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
      process.env.SESSION_TOKEN_SECRET = SESSION_TOKEN_SECRET_STRING;

      // Token valid for SUPABASE_JWT_SECRET — should never reach JWKS
      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // If JWKS were called, it would fail — but it should not be reached
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles token that would match SUPABASE_JWT_SECRET but with wrong issuer format', async () => {
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;

      // Signed with correct secret but issuer missing /auth/v1 suffix
      const token = await createHS256Token({
        iss: SUPABASE_URL, // Missing /auth/v1
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);
      expect(result).toBe(false);
    });

    it('logs error on final JWKS failure', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const token = await createHS256Token({
        iss: 'unknown',
        aud: 'authenticated',
        secret: WRONG_SECRET,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);

      expect(errorSpy).toHaveBeenCalledWith('JWT verification failed:', expect.any(Error));
    });

    it('does not log error when an earlier method succeeds', async () => {
      process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET_STRING;
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const token = await createHS256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        secret: SUPABASE_JWT_SECRET_BYTES,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await verifyAccessToken(token, failingGetJWKS as any, SUPABASE_URL);

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('handles JWKS getter returning a valid key set', async () => {
      // No HS256 secrets configured — only JWKS available
      const token = await createES256Token({
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        privateKey: es256PrivateKey,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await verifyAccessToken(token, getJWKS as any, SUPABASE_URL);
      expect(result).toBe(true);
    });
  });
});
