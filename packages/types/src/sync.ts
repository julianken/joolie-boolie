/**
 * Sync-related types for the dual-screen system.
 *
 * This module re-exports relevant types from @hosted-game-night/sync
 * and adds platform-specific sync types.
 */

// =============================================================================
// RE-EXPORTS FROM @hosted-game-night/sync
// =============================================================================

// Note: These types are re-exported for convenience.
// The canonical definitions live in @hosted-game-night/sync.
// Import from @hosted-game-night/sync directly if you need the full sync package.

/**
 * Sync role in the dual-screen system.
 * - presenter: Controls the game, broadcasts state changes
 * - audience: Receives and displays state from presenter
 */
export type SyncRole = 'presenter' | 'audience';

/**
 * Connection state for the broadcast channel.
 */
export type ConnectionState = 'disconnected' | 'connected' | 'error';

// =============================================================================
// SYNC MESSAGE TYPES
// =============================================================================

/**
 * Base sync message types shared across all games.
 */
export type BaseSyncMessageType =
  | 'STATE_UPDATE'
  | 'REQUEST_SYNC'
  | 'DISPLAY_THEME_CHANGED';

/**
 * Generic sync message wrapper.
 *
 * @template TType - The message type string
 * @template TPayload - The payload type for this message
 */
export interface SyncMessage<TType extends string = string, TPayload = unknown> {
  /** Message type identifier */
  type: TType;
  /** Message payload (null for messages without data) */
  payload: TPayload | null;
  /** Unix timestamp when the message was created */
  timestamp: number;
  /** Unique identifier of the sender to prevent echo */
  originId?: string;
}

// =============================================================================
// THEME SYNC
// =============================================================================

/**
 * Payload for theme change sync messages.
 */
export interface ThemeSyncPayload {
  /** The new theme mode */
  theme: 'light' | 'dark' | 'system';
}

// =============================================================================
// SYNC STATE
// =============================================================================

/**
 * Base sync state shared across all games.
 */
export interface BaseSyncState {
  /** Current role of this window */
  role: SyncRole | null;
  /** Whether the broadcast channel is connected */
  isConnected: boolean;
  /** Timestamp of last successful sync */
  lastSyncTimestamp: number | null;
  /** Current connection error message, if any */
  connectionError: string | null;
}
