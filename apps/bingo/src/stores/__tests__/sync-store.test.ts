import { describe, it, expect, beforeEach } from 'vitest';
import { useSyncStore } from '@beak-gaming/sync';

describe('sync-store', () => {
  beforeEach(() => {
    useSyncStore.getState().reset();
  });

  describe('initial state', () => {
    it('has null role', () => {
      expect(useSyncStore.getState().role).toBeNull();
    });

    it('is not connected', () => {
      expect(useSyncStore.getState().isConnected).toBe(false);
    });

    it('has null lastSyncTimestamp', () => {
      expect(useSyncStore.getState().lastSyncTimestamp).toBeNull();
    });

    it('has null connectionError', () => {
      expect(useSyncStore.getState().connectionError).toBeNull();
    });
  });

  describe('setRole', () => {
    it('sets role to presenter', () => {
      useSyncStore.getState().setRole('presenter');
      expect(useSyncStore.getState().role).toBe('presenter');
    });

    it('sets role to audience', () => {
      useSyncStore.getState().setRole('audience');
      expect(useSyncStore.getState().role).toBe('audience');
    });
  });

  describe('setConnected', () => {
    it('sets connected to true', () => {
      useSyncStore.getState().setConnected(true);
      expect(useSyncStore.getState().isConnected).toBe(true);
    });

    it('sets connected to false', () => {
      useSyncStore.getState().setConnected(true);
      useSyncStore.getState().setConnected(false);
      expect(useSyncStore.getState().isConnected).toBe(false);
    });

    it('clears connectionError when connected', () => {
      useSyncStore.getState().setConnectionError('Test error');
      useSyncStore.getState().setConnected(true);
      expect(useSyncStore.getState().connectionError).toBeNull();
    });
  });

  describe('updateLastSync', () => {
    it('sets lastSyncTimestamp to current time', () => {
      const before = Date.now();
      useSyncStore.getState().updateLastSync();
      const after = Date.now();

      const timestamp = useSyncStore.getState().lastSyncTimestamp;
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('updates timestamp on subsequent calls', () => {
      useSyncStore.getState().updateLastSync();
      const first = useSyncStore.getState().lastSyncTimestamp;

      useSyncStore.getState().updateLastSync();
      const second = useSyncStore.getState().lastSyncTimestamp;

      // Second call should be at least equal to first (same millisecond is okay)
      expect(second).toBeGreaterThanOrEqual(first!);
    });
  });

  describe('setConnectionError', () => {
    it('sets error message', () => {
      useSyncStore.getState().setConnectionError('Connection failed');
      expect(useSyncStore.getState().connectionError).toBe('Connection failed');
    });

    it('sets isConnected to false', () => {
      useSyncStore.getState().setConnected(true);
      useSyncStore.getState().setConnectionError('Error');
      expect(useSyncStore.getState().isConnected).toBe(false);
    });

    it('clears error when set to null', () => {
      useSyncStore.getState().setConnectionError('Error');
      useSyncStore.getState().setConnectionError(null);
      expect(useSyncStore.getState().connectionError).toBeNull();
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Set various state
      useSyncStore.getState().setRole('presenter');
      useSyncStore.getState().setConnected(true);
      useSyncStore.getState().updateLastSync();
      useSyncStore.getState().setConnectionError('Error');

      // Reset
      useSyncStore.getState().reset();

      // Verify all reset
      expect(useSyncStore.getState().role).toBeNull();
      expect(useSyncStore.getState().isConnected).toBe(false);
      expect(useSyncStore.getState().lastSyncTimestamp).toBeNull();
      expect(useSyncStore.getState().connectionError).toBeNull();
    });
  });
});
