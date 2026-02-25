/**
 * localStorage Cleanup Utilities
 *
 * Provides functions to inspect, clean up, and clear game-related
 * localStorage entries that use the `jb-` or `jb:` prefix.
 *
 * These utilities help manage storage hygiene by:
 * - Reporting storage usage stats
 * - Clearing all game data on demand
 * - Removing stale entries that exceed a configurable age threshold
 */

/** Prefixes used by Joolie Boolie localStorage keys */
const JB_PREFIXES = ['jb-', 'jb:'] as const;

/** Default maximum age in days before an entry is considered expired */
const DEFAULT_MAX_AGE_DAYS = 30;

/** Metadata key suffix used to track when entries were last accessed */
const LAST_ACCESSED_SUFFIX = '__lastAccessed';

/**
 * Check whether a localStorage key belongs to Joolie Boolie.
 */
function isJbKey(key: string): boolean {
  return JB_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Check whether a key is a metadata tracking key (not user data).
 */
function isMetadataKey(key: string): boolean {
  return key.endsWith(LAST_ACCESSED_SUFFIX);
}

/**
 * Get all Joolie Boolie prefixed keys from localStorage.
 * Excludes internal metadata keys.
 */
function getJbKeys(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isJbKey(key) && !isMetadataKey(key)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Get all Joolie Boolie keys including metadata keys.
 */
function getAllJbKeys(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isJbKey(key)) {
      keys.push(key);
    }
  }
  return keys;
}

// =============================================================================
// PUBLIC API
// =============================================================================

export interface LocalStorageUsage {
  /** Number of jb-prefixed keys (excluding metadata) */
  keyCount: number;
  /** Total size in bytes of all jb-prefixed entries (keys + values, including metadata) */
  totalSizeBytes: number;
}

/**
 * Get storage usage statistics for all Joolie Boolie localStorage entries.
 *
 * @returns Object with key count and total size in bytes
 */
export function getLocalStorageUsage(): LocalStorageUsage {
  if (typeof window === 'undefined') {
    return { keyCount: 0, totalSizeBytes: 0 };
  }

  const dataKeys = getJbKeys();
  const allKeys = getAllJbKeys();

  let totalSizeBytes = 0;
  for (const key of allKeys) {
    const value = localStorage.getItem(key);
    // In JS, strings are UTF-16, so each character is 2 bytes
    totalSizeBytes += key.length * 2;
    if (value) {
      totalSizeBytes += value.length * 2;
    }
  }

  return {
    keyCount: dataKeys.length,
    totalSizeBytes,
  };
}

/**
 * Clear all Joolie Boolie prefixed entries from localStorage.
 * This removes both data keys and their associated metadata.
 */
export function clearAllGameState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Collect keys first to avoid modifying localStorage while iterating
  const keys = getAllJbKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

/**
 * Record the current timestamp as the last-accessed time for a key.
 * Call this when data is written to keep track of staleness.
 *
 * @param key - The localStorage key to mark as accessed
 */
export function markKeyAccessed(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      `${key}${LAST_ACCESSED_SUFFIX}`,
      Date.now().toString()
    );
  } catch {
    // Storage full or unavailable -- silently ignore
  }
}

/**
 * Get the last-accessed timestamp for a key.
 *
 * @param key - The localStorage key to check
 * @returns The timestamp in milliseconds, or null if not tracked
 */
export function getKeyLastAccessed(key: string): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = localStorage.getItem(`${key}${LAST_ACCESSED_SUFFIX}`);
    if (value) {
      const ts = parseInt(value, 10);
      return isNaN(ts) ? null : ts;
    }
    return null;
  } catch {
    return null;
  }
}

export interface CleanupResult {
  /** Number of entries removed */
  removedCount: number;
}

/**
 * Remove Joolie Boolie localStorage entries that are older than the given threshold.
 *
 * An entry is considered expired if:
 * 1. It has a `__lastAccessed` metadata key and that timestamp exceeds maxAgeDays, OR
 * 2. It has no metadata key (never tracked), in which case it is treated as potentially
 *    stale and is removed. This handles legacy entries that predate the tracking system.
 *
 * Entries without metadata are only removed if the `removeUntracked` option is true
 * (defaults to false to be conservative).
 *
 * @param maxAgeDays - Maximum age in days (default: 30)
 * @param options - Additional options
 * @param options.removeUntracked - Whether to remove entries without access tracking (default: false)
 * @returns Object with the count of removed entries
 */
export function cleanupExpiredGameState(
  maxAgeDays: number = DEFAULT_MAX_AGE_DAYS,
  options: { removeUntracked?: boolean } = {}
): CleanupResult {
  if (typeof window === 'undefined') {
    return { removedCount: 0 };
  }

  const { removeUntracked = false } = options;
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const cutoff = now - maxAgeMs;

  const dataKeys = getJbKeys();
  let removedCount = 0;

  for (const key of dataKeys) {
    const lastAccessed = getKeyLastAccessed(key);

    if (lastAccessed !== null) {
      // Has tracking -- remove if older than threshold
      if (lastAccessed < cutoff) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}${LAST_ACCESSED_SUFFIX}`);
        removedCount++;
      }
    } else if (removeUntracked) {
      // No tracking and removeUntracked is enabled -- remove it
      localStorage.removeItem(key);
      removedCount++;
    }
  }

  return { removedCount };
}

/**
 * Format bytes into a human-readable string.
 *
 * @param bytes - The number of bytes
 * @returns A formatted string like "1.2 KB" or "3.4 MB"
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
