'use client';

import { useEffect, useCallback, useRef } from 'react';
import { BroadcastSync } from './broadcast';
import { SyncRole, SyncMessage, SyncStore } from './types';

interface UseSyncOptions<TState> {
  /** Role of this window in the sync system */
  role: SyncRole;
  /** BroadcastSync instance for this game */
  broadcastSync: BroadcastSync<TState>;
  /** Sync store for managing connection state */
  syncStore: SyncStore;
  /** Get the current game state to broadcast (presenter only) */
  getCurrentState: () => TState;
  /** Apply received state from presenter (audience only) */
  onStateUpdate: (state: TState) => void;
  /** Subscribe to game state changes for auto-broadcasting (presenter only) */
  subscribeToStateChanges?: (callback: () => void) => () => void;
}

/**
 * Generic hook for managing dual-screen synchronization.
 *
 * Presenter: Broadcasts state changes to audience windows.
 * Audience: Receives and applies state updates from presenter.
 */
export function useSync<TState>({
  role,
  broadcastSync,
  syncStore,
  getCurrentState,
  onStateUpdate,
  subscribeToStateChanges,
}: UseSyncOptions<TState>) {
  const isInitializedRef = useRef(false);

  // Broadcast state update (presenter only)
  const broadcastState = useCallback(() => {
    if (role !== 'presenter') return;
    const state = getCurrentState();
    broadcastSync.broadcastState(state);
  }, [role, getCurrentState, broadcastSync]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: SyncMessage<TState>) => {
      switch (message.type) {
        case 'STATE_UPDATE':
          if (role === 'audience' && message.payload) {
            onStateUpdate(message.payload);
            syncStore.updateLastSync();
          }
          break;
        case 'REQUEST_SYNC':
          if (role === 'presenter') {
            broadcastState();
          }
          break;
      }
    },
    [role, onStateUpdate, syncStore, broadcastState]
  );

  // Initialize broadcast channel
  useEffect(() => {
    if (isInitializedRef.current) return;

    const success = broadcastSync.initialize();
    if (!success) {
      syncStore.setConnectionError('Failed to initialize sync channel');
      return;
    }

    syncStore.setRole(role);
    syncStore.setConnected(true);
    isInitializedRef.current = true;

    // Subscribe to messages
    const unsubscribe = broadcastSync.subscribe(handleMessage);

    // If audience, request initial sync
    if (role === 'audience') {
      broadcastSync.requestSync();
    }

    return () => {
      unsubscribe();
      broadcastSync.close();
      syncStore.reset();
      isInitializedRef.current = false;
    };
  }, [role, broadcastSync, syncStore, handleMessage]);

  // Subscribe to game state changes (presenter only)
  useEffect(() => {
    if (role !== 'presenter' || !subscribeToStateChanges) return;

    const unsubscribe = subscribeToStateChanges(() => {
      broadcastSync.broadcastState(getCurrentState());
    });

    return unsubscribe;
  }, [role, subscribeToStateChanges, broadcastSync, getCurrentState]);

  return {
    isConnected: syncStore.isConnected,
    lastSyncTimestamp: syncStore.lastSyncTimestamp,
    connectionError: syncStore.connectionError,
    broadcastState,
    requestSync: () => broadcastSync.requestSync(),
  };
}
