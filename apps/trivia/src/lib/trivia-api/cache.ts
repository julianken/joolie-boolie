/**
 * In-process TTL cache for trivia API responses.
 *
 * Server-only module. Caches TriviaApiQuestion arrays to avoid redundant
 * external API calls when multiple users request the same parameters within
 * the TTL window.
 *
 * The cache is a module-level Map -- it persists across requests within the
 * same Node.js process and is naturally cleared on redeploy or serverless
 * cold start.
 */

import type { TriviaApiParams, TriviaApiQuestion } from './client';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_TTL_MS = 5 * 60 * 1_000; // 5 minutes
const MAX_ENTRIES = 100;

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry {
  questions: TriviaApiQuestion[];
  expiresAt: number;
  lastAccessedAt: number;
}

// =============================================================================
// CACHE STATE
// =============================================================================

const cache = new Map<string, CacheEntry>();

// =============================================================================
// CACHE KEY
// =============================================================================

/**
 * Build a deterministic cache key from TriviaApiParams.
 *
 * - Normalizes array parameter order (sorts) so different orderings of the
 *   same values produce the same key.
 * - Applies the same limit clamping as buildRequestUrl() so the key always
 *   matches the actual API call that will be made.
 * - Excludes `timeoutMs` -- it does not affect the returned data.
 *
 * Key format: `l=<n>|c=<cat1,cat2>|d=<diff1,diff2>|t=<tag1,tag2>|r=<region>`
 * Parts that are absent are omitted entirely.
 */
export function buildCacheKey(params: TriviaApiParams): string {
  const parts: string[] = [];

  const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);
  parts.push(`l=${limit}`);

  if (params.categories && params.categories.length > 0) {
    parts.push(`c=${[...params.categories].sort().join(',')}`);
  }

  if (params.difficulties && params.difficulties.length > 0) {
    parts.push(`d=${[...params.difficulties].sort().join(',')}`);
  }

  if (params.tags && params.tags.length > 0) {
    parts.push(`t=${[...params.tags].sort().join(',')}`);
  }

  if (params.region) {
    parts.push(`r=${params.region}`);
  }

  return parts.join('|');
}

// =============================================================================
// EVICTION
// =============================================================================

/**
 * Evict expired entries; if still over MAX_ENTRIES, evict least-recently-accessed.
 * Called before every setCached() insertion.
 */
function evictIfNeeded(): void {
  const now = Date.now();

  // Pass 1: remove expired
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }

  // Pass 2: LRU eviction if at or over limit (make room for the new entry)
  if (cache.size >= MAX_ENTRIES) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    const toEvict = cache.size - MAX_ENTRIES + 1;
    for (let i = 0; i < toEvict; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Retrieve cached questions for the given parameters.
 * Returns null on cache miss or if the entry has expired.
 * Updates lastAccessedAt on hit (LRU tracking).
 */
export function getCached(params: TriviaApiParams): TriviaApiQuestion[] | null {
  const key = buildCacheKey(params);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  entry.lastAccessedAt = Date.now();
  return entry.questions;
}

/**
 * Store questions in the cache for the given parameters.
 *
 * @param params - Request parameters (used to derive the cache key).
 * @param questions - Questions to cache.
 * @param ttlMs - Time-to-live in milliseconds. Default: 5 minutes.
 */
export function setCached(
  params: TriviaApiParams,
  questions: TriviaApiQuestion[],
  ttlMs: number = DEFAULT_TTL_MS
): void {
  evictIfNeeded();

  const key = buildCacheKey(params);
  const now = Date.now();

  cache.set(key, {
    questions,
    expiresAt: now + ttlMs,
    lastAccessedAt: now,
  });
}

/**
 * Clear all cache entries. Used in tests and for manual invalidation.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Current number of entries in the cache. Exposed for testing and monitoring.
 */
export function getCacheSize(): number {
  return cache.size;
}
