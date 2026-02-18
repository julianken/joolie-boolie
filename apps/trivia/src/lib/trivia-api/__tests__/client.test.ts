import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the logger (matches existing codebase pattern from route.test.ts)
vi.mock('@joolie-boolie/error-tracking/server-logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  fetchTriviaApiQuestions,
  buildRequestUrl,
} from '../client';
import { SCIENCE_HISTORY_BATCH } from '../__fixtures__/trivia-api';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;
const originalEnv = process.env.THE_TRIVIA_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.THE_TRIVIA_API_KEY;
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalEnv !== undefined) {
    process.env.THE_TRIVIA_API_KEY = originalEnv;
  } else {
    delete process.env.THE_TRIVIA_API_KEY;
  }
});

// ---------------------------------------------------------------------------
// buildRequestUrl
// ---------------------------------------------------------------------------

describe('buildRequestUrl', () => {
  it('produces default URL with limit=10', () => {
    const url = buildRequestUrl({});
    expect(url).toBe('https://the-trivia-api.com/v2/questions?limit=10');
  });

  it('sets custom limit', () => {
    const url = buildRequestUrl({ limit: 25 });
    expect(url).toContain('limit=25');
  });

  it('clamps limit above 50 down to 50', () => {
    const url = buildRequestUrl({ limit: 100 });
    expect(url).toContain('limit=50');
  });

  it('clamps limit below 1 up to 1', () => {
    const url = buildRequestUrl({ limit: 0 });
    expect(url).toContain('limit=1');
  });

  it('includes categories as comma-joined value', () => {
    const url = buildRequestUrl({ categories: ['science', 'history'] });
    expect(url).toContain('categories=science%2Chistory');
  });

  it('includes difficulties as comma-joined value', () => {
    const url = buildRequestUrl({ difficulties: ['easy', 'hard'] });
    expect(url).toContain('difficulties=easy%2Chard');
  });

  it('includes tags parameter', () => {
    const url = buildRequestUrl({ tags: ['world_war_2'] });
    expect(url).toContain('tags=world_war_2');
  });

  it('includes region parameter', () => {
    const url = buildRequestUrl({ region: 'US' });
    expect(url).toContain('region=US');
  });

  it('combines all parameters', () => {
    const url = buildRequestUrl({
      limit: 20,
      categories: ['science'],
      difficulties: ['medium'],
      tags: ['biology'],
      region: 'GB',
    });
    expect(url).toContain('limit=20');
    expect(url).toContain('categories=science');
    expect(url).toContain('difficulties=medium');
    expect(url).toContain('tags=biology');
    expect(url).toContain('region=GB');
  });
});

// ---------------------------------------------------------------------------
// fetchTriviaApiQuestions -- success
// ---------------------------------------------------------------------------

describe('fetchTriviaApiQuestions', () => {
  describe('successful requests', () => {
    it('returns ok:true with questions array', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => SCIENCE_HISTORY_BATCH,
      });

      const result = await fetchTriviaApiQuestions({ limit: 5 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.questions).toHaveLength(5);
        expect(result.questions[0].question.text).toBe(
          'What is Nanotechnology the study of?'
        );
      }
    });

    it('returns ok:true with empty array for no results', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const result = await fetchTriviaApiQuestions({ limit: 5 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.questions).toEqual([]);
      }
    });

    it('includes x-api-key header when env var is set', async () => {
      process.env.THE_TRIVIA_API_KEY = 'test-api-key-123';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await fetchTriviaApiQuestions({});

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1].headers['x-api-key']).toBe('test-api-key-123');
    });

    it('omits x-api-key header when env var is unset', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await fetchTriviaApiQuestions({});

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1].headers['x-api-key']).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('returns ok:false with statusCode for 429 response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      const result = await fetchTriviaApiQuestions({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.statusCode).toBe(429);
        expect(result.error).toContain('429');
      }
    });

    it('returns ok:false for 500 server error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error',
      });

      const result = await fetchTriviaApiQuestions({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.statusCode).toBe(500);
      }
    });

    it('returns ok:false on JSON parse failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      const result = await fetchTriviaApiQuestions({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('parse');
      }
    });

    it('returns ok:false for invalid response shape (object instead of array)', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      const result = await fetchTriviaApiQuestions({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('unexpected');
      }
    });

    it('returns ok:false on timeout', async () => {
      global.fetch = vi.fn().mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const err = new DOMException('The operation was aborted', 'AbortError');
              reject(err);
            }, 10);
          })
      );

      const result = await fetchTriviaApiQuestions({ timeoutMs: 5 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('timed out');
      }
    });

    it('returns ok:false on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(
        new TypeError('fetch failed')
      );

      const result = await fetchTriviaApiQuestions({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('network');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe('timeout cleanup', () => {
    it('clears timeout on success', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await fetchTriviaApiQuestions({});

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('clears timeout on error', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('fail'));

      await fetchTriviaApiQuestions({});

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
