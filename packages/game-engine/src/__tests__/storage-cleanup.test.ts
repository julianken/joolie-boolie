/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLocalStorageUsage,
  clearAllGameState,
  cleanupExpiredGameState,
  markKeyAccessed,
  getKeyLastAccessed,
  formatStorageSize,
} from '../storage-cleanup';

describe('storage-cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getLocalStorageUsage', () => {
    it('should return zero stats when no jb keys exist', () => {
      const usage = getLocalStorageUsage();
      expect(usage.keyCount).toBe(0);
      expect(usage.totalSizeBytes).toBe(0);
    });

    it('should count only jb-prefixed keys (excluding metadata)', () => {
      localStorage.setItem('jb-bingo-theme', '{"mode":"dark"}');
      localStorage.setItem('jb:bingo-statistics', '{"gamesPlayed":5}');
      localStorage.setItem('jb-session-state', '{}');
      localStorage.setItem('other-key', 'value');

      const usage = getLocalStorageUsage();
      expect(usage.keyCount).toBe(3);
    });

    it('should not count metadata keys in keyCount', () => {
      localStorage.setItem('jb-bingo-theme', '{"mode":"dark"}');
      localStorage.setItem('jb-bingo-theme__lastAccessed', '1700000000000');

      const usage = getLocalStorageUsage();
      expect(usage.keyCount).toBe(1);
    });

    it('should include metadata keys in totalSizeBytes', () => {
      localStorage.setItem('jb-test', 'val');
      localStorage.setItem('jb-test__lastAccessed', '1234567890');

      const usage = getLocalStorageUsage();
      // Both keys and values are counted at 2 bytes per character
      const expectedSize =
        ('jb-test'.length + 'val'.length +
         'jb-test__lastAccessed'.length + '1234567890'.length) * 2;
      expect(usage.totalSizeBytes).toBe(expectedSize);
    });

    it('should calculate correct byte size for UTF-16 strings', () => {
      const key = 'jb-data';
      const value = 'hello';
      localStorage.setItem(key, value);

      const usage = getLocalStorageUsage();
      expect(usage.totalSizeBytes).toBe((key.length + value.length) * 2);
    });

    it('should ignore non-jb keys in size calculation', () => {
      localStorage.setItem('jb-key1', 'a');
      localStorage.setItem('other-key', 'this-should-not-count');

      const usage = getLocalStorageUsage();
      expect(usage.totalSizeBytes).toBe(('jb-key1'.length + 'a'.length) * 2);
    });
  });

  describe('clearAllGameState', () => {
    it('should remove all jb-prefixed keys', () => {
      localStorage.setItem('jb-bingo-theme', 'dark');
      localStorage.setItem('jb:bingo-statistics', '{}');
      localStorage.setItem('jb-session-state', '{}');
      localStorage.setItem('other-key', 'keep-me');

      clearAllGameState();

      expect(localStorage.getItem('jb-bingo-theme')).toBeNull();
      expect(localStorage.getItem('jb:bingo-statistics')).toBeNull();
      expect(localStorage.getItem('jb-session-state')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('keep-me');
    });

    it('should also remove metadata keys', () => {
      localStorage.setItem('jb-test', 'value');
      localStorage.setItem('jb-test__lastAccessed', '1700000000000');

      clearAllGameState();

      expect(localStorage.getItem('jb-test')).toBeNull();
      expect(localStorage.getItem('jb-test__lastAccessed')).toBeNull();
    });

    it('should handle empty localStorage gracefully', () => {
      expect(() => clearAllGameState()).not.toThrow();
    });
  });

  describe('markKeyAccessed / getKeyLastAccessed', () => {
    it('should store and retrieve a timestamp', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      markKeyAccessed('jb-test-key');
      const lastAccessed = getKeyLastAccessed('jb-test-key');

      expect(lastAccessed).toBe(now);
    });

    it('should return null for keys without metadata', () => {
      localStorage.setItem('jb-orphan', 'value');
      expect(getKeyLastAccessed('jb-orphan')).toBeNull();
    });

    it('should return null for non-numeric metadata', () => {
      localStorage.setItem('jb-bad__lastAccessed', 'not-a-number');
      expect(getKeyLastAccessed('jb-bad')).toBeNull();
    });

    it('should update the timestamp on subsequent calls', () => {
      const spy = vi.spyOn(Date, 'now');

      spy.mockReturnValue(1000);
      markKeyAccessed('jb-key');
      expect(getKeyLastAccessed('jb-key')).toBe(1000);

      spy.mockReturnValue(2000);
      markKeyAccessed('jb-key');
      expect(getKeyLastAccessed('jb-key')).toBe(2000);
    });
  });

  describe('cleanupExpiredGameState', () => {
    it('should remove keys whose lastAccessed is older than maxAgeDays', () => {
      const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;

      localStorage.setItem('jb-old-data', '{}');
      localStorage.setItem('jb-old-data__lastAccessed', thirtyOneDaysAgo.toString());

      localStorage.setItem('jb-new-data', '{}');
      localStorage.setItem('jb-new-data__lastAccessed', oneDayAgo.toString());

      const result = cleanupExpiredGameState(30);

      expect(result.removedCount).toBe(1);
      expect(localStorage.getItem('jb-old-data')).toBeNull();
      expect(localStorage.getItem('jb-old-data__lastAccessed')).toBeNull();
      expect(localStorage.getItem('jb-new-data')).toBe('{}');
      expect(localStorage.getItem('jb-new-data__lastAccessed')).toBe(oneDayAgo.toString());
    });

    it('should use default max age of 30 days', () => {
      const twentyNineDaysAgo = Date.now() - 29 * 24 * 60 * 60 * 1000;

      localStorage.setItem('jb-recent', 'data');
      localStorage.setItem('jb-recent__lastAccessed', twentyNineDaysAgo.toString());

      const result = cleanupExpiredGameState();

      expect(result.removedCount).toBe(0);
      expect(localStorage.getItem('jb-recent')).toBe('data');
    });

    it('should NOT remove untracked keys by default', () => {
      localStorage.setItem('jb-untracked', 'value');
      // No __lastAccessed metadata

      const result = cleanupExpiredGameState(30);

      expect(result.removedCount).toBe(0);
      expect(localStorage.getItem('jb-untracked')).toBe('value');
    });

    it('should remove untracked keys when removeUntracked is true', () => {
      localStorage.setItem('jb-untracked', 'value');

      const result = cleanupExpiredGameState(30, { removeUntracked: true });

      expect(result.removedCount).toBe(1);
      expect(localStorage.getItem('jb-untracked')).toBeNull();
    });

    it('should handle entries with jb: prefix', () => {
      const oldTimestamp = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days ago

      localStorage.setItem('jb:bingo-statistics', '{}');
      localStorage.setItem('jb:bingo-statistics__lastAccessed', oldTimestamp.toString());

      const result = cleanupExpiredGameState(30);

      expect(result.removedCount).toBe(1);
      expect(localStorage.getItem('jb:bingo-statistics')).toBeNull();
    });

    it('should not remove non-jb keys regardless of age', () => {
      localStorage.setItem('other-key', 'keep');

      const result = cleanupExpiredGameState(0, { removeUntracked: true });

      expect(result.removedCount).toBe(0);
      expect(localStorage.getItem('other-key')).toBe('keep');
    });

    it('should return zero removedCount when no entries exist', () => {
      const result = cleanupExpiredGameState(30);
      expect(result.removedCount).toBe(0);
    });

    it('should accept custom maxAgeDays', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

      localStorage.setItem('jb-temp', 'data');
      localStorage.setItem('jb-temp__lastAccessed', threeDaysAgo.toString());

      // 7 days -- should keep
      expect(cleanupExpiredGameState(7).removedCount).toBe(0);

      // 2 days -- should remove
      expect(cleanupExpiredGameState(2).removedCount).toBe(1);
    });
  });

  describe('formatStorageSize', () => {
    it('should format 0 bytes', () => {
      expect(formatStorageSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatStorageSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatStorageSize(1024)).toBe('1.0 KB');
      expect(formatStorageSize(2560)).toBe('2.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatStorageSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatStorageSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('should format values at boundaries correctly', () => {
      expect(formatStorageSize(1023)).toBe('1023 B');
      expect(formatStorageSize(1024 * 1024 - 1)).toBe('1024.0 KB');
    });
  });
});
