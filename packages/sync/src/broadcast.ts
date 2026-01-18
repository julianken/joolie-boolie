import { SyncMessage, MessageHandler } from './types';

/**
 * BroadcastChannel wrapper for dual-screen synchronization.
 * Handles same-device communication between presenter and audience windows.
 *
 * Generic over TPayload - the type of data being synced.
 */
export class BroadcastSync<TPayload = unknown> {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<MessageHandler<TPayload>> = new Set();
  private isInitialized = false;
  private channelName: string;

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  /**
   * Initialize the broadcast channel.
   * Safe to call multiple times - will only initialize once.
   */
  initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    // Check if BroadcastChannel is available (not available in SSR)
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return false;
    }

    try {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event: MessageEvent<SyncMessage<TPayload>>) => {
        this.notifyHandlers(event.data);
      };
      this.isInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to incoming messages.
   * Returns an unsubscribe function.
   */
  subscribe(handler: MessageHandler<TPayload>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Send a typed message on the channel.
   */
  send(type: string, payload: TPayload | null): void {
    if (!this.channel) {
      return;
    }

    const message: SyncMessage<TPayload> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      this.channel.postMessage(message);
    } catch {
      // Silently fail - could add error callback in future
    }
  }

  /**
   * Broadcast the full game state.
   */
  broadcastState(state: TPayload): void {
    this.send('STATE_UPDATE', state);
  }

  /**
   * Request a sync from the presenter.
   * Used by audience windows when they first connect.
   */
  requestSync(): void {
    this.send('REQUEST_SYNC', null);
  }

  /**
   * Close the broadcast channel and clean up.
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.handlers.clear();
    this.isInitialized = false;
  }

  /**
   * Check if the channel is initialized.
   */
  get connected(): boolean {
    return this.isInitialized && this.channel !== null;
  }

  /**
   * Notify all handlers of an incoming message.
   */
  private notifyHandlers(message: SyncMessage<TPayload>): void {
    for (const handler of this.handlers) {
      try {
        handler(message);
      } catch {
        // Silently fail - could add error callback in future
      }
    }
  }
}

/**
 * Create a BroadcastSync instance for a specific channel.
 */
export function createBroadcastSync<TPayload = unknown>(
  channelName: string
): BroadcastSync<TPayload> {
  return new BroadcastSync<TPayload>(channelName);
}
