/**
 * @joolie-boolie/types
 *
 * Shared TypeScript types for the Joolie Boolie.
 *
 * This package provides common types used across the monorepo, including:
 * - Theme types (ThemeMode)
 * - Sync types (SyncRole, SyncMessage)
 * - Branded types (TeamId, QuestionId, BallNumber)
 *
 * @example
 * import type { ThemeMode, SyncMessage, TeamId } from '@joolie-boolie/types';
 */

// =============================================================================
// THEME TYPES
// =============================================================================

export type { ThemeMode } from './game';

// =============================================================================
// SYNC TYPES
// =============================================================================

export type {
  SyncRole,
  ConnectionState,
  BaseSyncMessageType,
  SyncMessage,
  ThemeSyncPayload,
  BaseSyncState,
} from './sync';

// =============================================================================
// BRANDED TYPES
// =============================================================================

export type {
  Branded,
  TeamId,
  QuestionId,
  BallNumber,
} from './branded';

export {
  makeTeamId,
  makeQuestionId,
  makeBallNumber,
} from './branded';
