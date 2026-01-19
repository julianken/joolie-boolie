import { SyncMessage, MessageHandler } from './types';

/**
 * Generate a unique instance ID for this BroadcastSync instance.
 * Used to identify the origin of messages and prevent sync loops.
 */
function generateInstanceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Configuration for deduplication behavior.
 */
const DEDUP_CONFIG = {
  /** Maximum number of recent message timestamps to track */
  MAX_RECENT_MESSAGES: 100,
  /** Time window in ms to consider messages as duplicates */
  DEDUP_WINDOW_MS: 100,
} as const;

/**
 * BroadcastChannel wrapper for dual-screen synchronization.
 * Handles same-device communication between presenter and audience windows.
 *
 * Generic over TPayload - the type of data being synced.
 *
 * Includes protection against sync loops via:
 * 1. Origin tracking - each instance has a unique ID, messages from self are ignored
 * 2. Message deduplication - recent messages within a time window are deduplicated
 */
export class BroadcastSync<TPayload = unknown> {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<MessageHandler<TPayload>> = new Set();
  private isInitialized = false;
  private channelName: string;
  /** Unique identifier for this instance to prevent processing own messages */
  private readonly instanceId: string;
  /** Track recent message timestamps for deduplication */
  private recentMessageKeys: Set<string> = new Set();

  constructor(channelName: string) {
    this.channelName = channelName;
    this.instanceId = generateInstanceId();
  }

  /**
   * Get the unique instance ID for this BroadcastSync.
   * Useful for testing and debugging.
   */
  get origin(): string {
    return this.instanceId;
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
        const message = event.data;

        // SYNC LOOP PROTECTION 1: Ignore messages from self
        if (message.originId === this.instanceId) {
          return;
        }

        // SYNC LOOP PROTECTION 2: Deduplicate recent messages
        if (this.isDuplicateMessage(message)) {
          return;
        }

        this.notifyHandlers(message);
      };
      this.isInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a message is a duplicate based on type and timestamp.
   * This prevents processing the same logical message multiple times
   * within a short time window (e.g., from rapid state changes).
   */
  private isDuplicateMessage(message: SyncMessage<TPayload>): boolean {
    const key = `${message.type}-${message.timestamp}`;

    if (this.recentMessageKeys.has(key)) {
      return true;
    }

    // Add to recent messages
    this.recentMessageKeys.add(key);

    // Clean up old entries if we have too many
    if (this.recentMessageKeys.size > DEDUP_CONFIG.MAX_RECENT_MESSAGES) {
      // Convert to array, remove oldest entries (first half)
      const keys = Array.from(this.recentMessageKeys);
      const toRemove = keys.slice(0, Math.floor(keys.length / 2));
      toRemove.forEach((k) => this.recentMessageKeys.delete(k));
    }

    // Schedule cleanup for this specific key after the dedup window
    setTimeout(() => {
      this.recentMessageKeys.delete(key);
    }, DEDUP_CONFIG.DEDUP_WINDOW_MS);

    return false;
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
   * Includes the instance's originId to enable sync loop prevention.
   */
  send(type: string, payload: TPayload | null): void {
    if (!this.channel) {
      return;
    }

    const message: SyncMessage<TPayload> = {
      type,
      payload,
      timestamp: Date.now(),
      originId: this.instanceId,
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
    this.recentMessageKeys.clear();
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
