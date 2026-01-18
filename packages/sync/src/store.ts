import { create } from 'zustand';
import { SyncStore, SyncRole } from './types';

/**
 * Create a sync store for managing sync state.
 * Each app should create its own instance.
 */
export function createSyncStore() {
  return create<SyncStore>()((set) => ({
    // Initial state
    role: null,
    isConnected: false,
    lastSyncTimestamp: null,
    connectionError: null,

    // Actions
    setRole: (role: SyncRole) => {
      set({ role });
    },

    setConnected: (connected: boolean) => {
      set({
        isConnected: connected,
        connectionError: null,
      });
    },

    updateLastSync: () => {
      set({ lastSyncTimestamp: Date.now() });
    },

    setConnectionError: (error: string | null) => {
      set({ connectionError: error, isConnected: false });
    },

    reset: () => {
      set({
        role: null,
        isConnected: false,
        lastSyncTimestamp: null,
        connectionError: null,
      });
    },
  }));
}

/**
 * Type helper for the store hook returned by createSyncStore.
 */
export type UseSyncStore = ReturnType<typeof createSyncStore>;
