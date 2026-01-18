import { GameStatus } from '@/types';

/**
 * Game actions that trigger state transitions.
 */
export type GameAction =
  | 'START_GAME'
  | 'CALL_BALL'
  | 'UNDO_CALL'
  | 'PAUSE_GAME'
  | 'RESUME_GAME'
  | 'END_GAME'
  | 'RESET_GAME';

/**
 * Valid transitions from each game status.
 */
const VALID_TRANSITIONS: Record<GameStatus, GameAction[]> = {
  idle: ['START_GAME'],
  playing: ['CALL_BALL', 'UNDO_CALL', 'PAUSE_GAME', 'END_GAME', 'RESET_GAME'],
  paused: ['RESUME_GAME', 'END_GAME', 'RESET_GAME'],
  ended: ['RESET_GAME'],
};

/**
 * Next status after each action (when valid).
 */
const ACTION_RESULTS: Record<GameAction, GameStatus> = {
  START_GAME: 'playing',
  CALL_BALL: 'playing',
  UNDO_CALL: 'playing',
  PAUSE_GAME: 'paused',
  RESUME_GAME: 'playing',
  END_GAME: 'ended',
  RESET_GAME: 'idle',
};

/**
 * Check if an action is valid for the current game status.
 */
export function canTransition(status: GameStatus, action: GameAction): boolean {
  return VALID_TRANSITIONS[status].includes(action);
}

/**
 * Get the next status after an action.
 * Returns null if the transition is invalid.
 */
export function getNextStatus(
  currentStatus: GameStatus,
  action: GameAction
): GameStatus | null {
  if (!canTransition(currentStatus, action)) {
    return null;
  }
  return ACTION_RESULTS[action];
}

/**
 * Transition to a new status if valid.
 * Throws an error if the transition is invalid.
 */
export function transition(
  currentStatus: GameStatus,
  action: GameAction
): GameStatus {
  const nextStatus = getNextStatus(currentStatus, action);
  if (nextStatus === null) {
    throw new Error(
      `Invalid transition: cannot ${action} when game is ${currentStatus}`
    );
  }
  return nextStatus;
}

/**
 * Get all valid actions for the current status.
 */
export function getValidActions(status: GameStatus): GameAction[] {
  return [...VALID_TRANSITIONS[status]];
}

/**
 * Check if the game is in a state where balls can be called.
 */
export function canCallBall(status: GameStatus): boolean {
  return status === 'playing';
}

/**
 * Check if the game is in a state where it can be paused.
 */
export function canPause(status: GameStatus): boolean {
  return status === 'playing';
}

/**
 * Check if the game is in a state where it can be resumed.
 */
export function canResume(status: GameStatus): boolean {
  return status === 'paused';
}

/**
 * Check if the game is in a state where it can be started.
 */
export function canStart(status: GameStatus): boolean {
  return status === 'idle';
}

/**
 * Check if the game is active (playing or paused).
 */
export function isGameActive(status: GameStatus): boolean {
  return status === 'playing' || status === 'paused';
}
