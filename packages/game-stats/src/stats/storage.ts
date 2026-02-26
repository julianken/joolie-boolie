/**
 * Statistics Storage Utilities
 *
 * localStorage persistence for game statistics.
 * These functions are designed to be used in a browser environment.
 */

import type {
  BingoStatistics,
  BingoSessionRecord,
  TriviaStatistics,
  TriviaSessionRecord,
} from './types';
import {
  STORAGE_KEYS,
  MAX_RECENT_SESSIONS,
} from './types';
import {
  createEmptyBingoStats,
  calculateBingoStats,
  createEmptyTriviaStats,
  calculateTriviaStats,
} from './calculator';

// =============================================================================
// BINGO STORAGE
// =============================================================================

/**
 * Load bingo statistics from localStorage.
 * Returns empty stats if not found or invalid.
 */
export function loadBingoStats(): BingoStatistics {
  if (typeof window === 'undefined') {
    return createEmptyBingoStats();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BINGO_STATS);
    if (!stored) {
      return createEmptyBingoStats();
    }

    const parsed = JSON.parse(stored) as BingoStatistics;

    // Validate structure
    if (parsed.gameType !== 'bingo' || typeof parsed.gamesPlayed !== 'number') {
      return createEmptyBingoStats();
    }

    return parsed;
  } catch {
    return createEmptyBingoStats();
  }
}

/**
 * Save bingo statistics to localStorage.
 */
export function saveBingoStats(stats: BingoStatistics): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.BINGO_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save bingo statistics:', error);
  }
}

/**
 * Add a new bingo session record and recalculate statistics.
 */
export function addBingoSession(session: BingoSessionRecord): BingoStatistics {
  const currentStats = loadBingoStats();

  // Add new session to the beginning
  const sessions = [session, ...currentStats.recentSessions];

  // Limit the number of stored sessions
  const limitedSessions = sessions.slice(0, MAX_RECENT_SESSIONS);

  // Recalculate stats
  const newStats = calculateBingoStats(limitedSessions);

  // Save to storage
  saveBingoStats(newStats);

  return newStats;
}

/**
 * Clear all bingo statistics from localStorage.
 */
export function clearBingoStats(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.BINGO_STATS);
  } catch (error) {
    console.error('Failed to clear bingo statistics:', error);
  }
}

// =============================================================================
// TRIVIA STORAGE
// =============================================================================

/**
 * Load trivia statistics from localStorage.
 * Returns empty stats if not found or invalid.
 */
export function loadTriviaStats(): TriviaStatistics {
  if (typeof window === 'undefined') {
    return createEmptyTriviaStats();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRIVIA_STATS);
    if (!stored) {
      return createEmptyTriviaStats();
    }

    const parsed = JSON.parse(stored) as TriviaStatistics;

    // Validate structure
    if (parsed.gameType !== 'trivia' || typeof parsed.gamesPlayed !== 'number') {
      return createEmptyTriviaStats();
    }

    return parsed;
  } catch {
    return createEmptyTriviaStats();
  }
}

/**
 * Save trivia statistics to localStorage.
 */
export function saveTriviaStats(stats: TriviaStatistics): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.TRIVIA_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save trivia statistics:', error);
  }
}

/**
 * Add a new trivia session record and recalculate statistics.
 */
export function addTriviaSession(session: TriviaSessionRecord): TriviaStatistics {
  const currentStats = loadTriviaStats();

  // Add new session to the beginning
  const sessions = [session, ...currentStats.recentSessions];

  // Limit the number of stored sessions
  const limitedSessions = sessions.slice(0, MAX_RECENT_SESSIONS);

  // Recalculate stats
  const newStats = calculateTriviaStats(limitedSessions);

  // Save to storage
  saveTriviaStats(newStats);

  return newStats;
}

/**
 * Clear all trivia statistics from localStorage.
 */
export function clearTriviaStats(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.TRIVIA_STATS);
  } catch (error) {
    console.error('Failed to clear trivia statistics:', error);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clear all game statistics from localStorage.
 */
export function clearAllStats(): void {
  clearBingoStats();
  clearTriviaStats();
}

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
