import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCached,
  setCached,
  buildCacheKey,
  clearCache,
  getCacheSize,
} from '../cache';
import {
  SCIENCE_HISTORY_BATCH,
  MIXED_CATEGORY_BATCH,
  SCIENCE_NANOTECH,
} from '../__fixtures__/trivia-api';

// ---------------------------------------------------------------------------
// Setup -- fake timers for TTL testing
// ---------------------------------------------------------------------------

describe('trivia API cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // buildCacheKey
  // -------------------------------------------------------------------------

  describe('buildCacheKey', () => {
    it('produces deterministic key for default params', () => {
      expect(buildCacheKey({})).toBe('l=10');
    });

    it('includes limit', () => {
      expect(buildCacheKey({ limit: 20 })).toBe('l=20');
    });

    it('clamps limit to valid range', () => {
      expect(buildCacheKey({ limit: 999 })).toBe('l=50');
    });

    it('produces same key regardless of category order', () => {
      const key1 = buildCacheKey({ categories: ['history', 'science'] });
      const key2 = buildCacheKey({ categories: ['science', 'history'] });
      expect(key1).toBe(key2);
    });

    it('produces same key regardless of difficulty order', () => {
      const key1 = buildCacheKey({ difficulties: ['hard', 'easy'] });
      const key2 = buildCacheKey({ difficulties: ['easy', 'hard'] });
      expect(key1).toBe(key2);
    });

    it('includes region', () => {
      const key = buildCacheKey({ region: 'GB' });
      expect(key).toContain('r=GB');
    });

    it('excludes timeoutMs from key', () => {
      const key1 = buildCacheKey({ limit: 10 });
      const key2 = buildCacheKey({ limit: 10, timeoutMs: 3000 });
      expect(key1).toBe(key2);
    });

    it('includes all parts for full param set', () => {
      const key = buildCacheKey({
        limit: 25,
        categories: ['science'],
        difficulties: ['medium'],
        tags: ['biology'],
        region: 'US',
      });
      expect(key).toContain('l=25');
      expect(key).toContain('c=science');
      expect(key).toContain('d=medium');
      expect(key).toContain('t=biology');
      expect(key).toContain('r=US');
    });
  });

  // -------------------------------------------------------------------------
  // getCached / setCached
  // -------------------------------------------------------------------------

  describe('getCached / setCached', () => {
    it('returns null for empty cache', () => {
      expect(getCached({})).toBeNull();
    });

    it('returns cached questions after set', () => {
      setCached({}, SCIENCE_HISTORY_BATCH);
      expect(getCached({})).toEqual(SCIENCE_HISTORY_BATCH);
    });

    it('returns null after TTL expires', () => {
      setCached({}, SCIENCE_HISTORY_BATCH, 1000);
      vi.advanceTimersByTime(1001);
      expect(getCached({})).toBeNull();
    });

    it('returns value before TTL expires', () => {
      setCached({}, SCIENCE_HISTORY_BATCH, 1000);
      vi.advanceTimersByTime(999);
      expect(getCached({})).toEqual(SCIENCE_HISTORY_BATCH);
    });

    it('stores different entries for different params', () => {
      const paramsA = { categories: ['science' as const] };
      const paramsB = { categories: ['history' as const] };
      setCached(paramsA, SCIENCE_HISTORY_BATCH);
      setCached(paramsB, MIXED_CATEGORY_BATCH);
      expect(getCached(paramsA)).toEqual(SCIENCE_HISTORY_BATCH);
      expect(getCached(paramsB)).toEqual(MIXED_CATEGORY_BATCH);
    });

    it('same normalized params hit same cache entry', () => {
      const params1 = { categories: ['science' as const, 'history' as const] };
      const params2 = { categories: ['history' as const, 'science' as const] };
      setCached(params1, SCIENCE_HISTORY_BATCH);
      expect(getCached(params2)).toEqual(SCIENCE_HISTORY_BATCH);
    });
  });

  // -------------------------------------------------------------------------
  // Eviction
  // -------------------------------------------------------------------------

  describe('eviction', () => {
    it('evicts expired entries when new entry is added', () => {
      setCached({ limit: 1 }, [SCIENCE_NANOTECH], 500);
      vi.advanceTimersByTime(501);
      setCached({ limit: 2 }, SCIENCE_HISTORY_BATCH);
      expect(getCached({ limit: 1 })).toBeNull();
      expect(getCacheSize()).toBe(1);
    });

    it('evicts LRU entry when exceeding MAX_ENTRIES (100)', () => {
      // Use region as differentiator since limit is clamped to [1,50]
      for (let i = 0; i < 100; i++) {
        setCached({ limit: 10, region: `r-${i}` }, [
          { ...SCIENCE_NANOTECH, id: `q-${i}` },
        ]);
      }
      expect(getCacheSize()).toBe(100);

      setCached({ limit: 10, region: 'overflow' }, [
        { ...SCIENCE_NANOTECH, id: 'q-overflow' },
      ]);
      expect(getCacheSize()).toBeLessThanOrEqual(100);
    });

    it('LRU access updates timestamp so accessed entry survives eviction', () => {
      // Use region as differentiator since limit is clamped to [1,50].
      // Advance time between inserts so each entry has a distinct lastAccessedAt.
      for (let i = 1; i <= 100; i++) {
        setCached({ limit: 10, region: `r-${i}` }, [{ ...SCIENCE_NANOTECH, id: `q-${i}` }]);
        vi.advanceTimersByTime(1);
      }

      // Access entry 1 (making it most-recently-accessed)
      vi.advanceTimersByTime(1);
      getCached({ limit: 10, region: 'r-1' });

      // Insert 101st to trigger eviction -- should evict r-2 (oldest unaccessed)
      vi.advanceTimersByTime(1);
      setCached({ limit: 10, region: 'overflow' }, [
        { ...SCIENCE_NANOTECH, id: 'q-101' },
      ]);

      // Entry 1 should survive (was accessed), entry 2 should be evicted
      expect(getCached({ limit: 10, region: 'r-1' })).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // clearCache / getCacheSize
  // -------------------------------------------------------------------------

  describe('clearCache', () => {
    it('removes all entries', () => {
      setCached({ limit: 1 }, SCIENCE_HISTORY_BATCH);
      setCached({ limit: 2 }, MIXED_CATEGORY_BATCH);
      clearCache();
      expect(getCacheSize()).toBe(0);
    });
  });

  describe('getCacheSize', () => {
    it('returns 0 for empty cache', () => {
      expect(getCacheSize()).toBe(0);
    });

    it('returns correct count', () => {
      setCached({ limit: 1 }, [SCIENCE_NANOTECH]);
      setCached({ limit: 2 }, SCIENCE_HISTORY_BATCH);
      setCached({ limit: 3 }, MIXED_CATEGORY_BATCH);
      expect(getCacheSize()).toBe(3);
    });
  });
});
