'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BingoStatistics, BingoSessionRecord } from '@joolie-boolie/game-stats';
import {
  loadBingoStats,
  addBingoSession,
  clearBingoStats,
  createEmptyBingoStats,
  getMostCommonPatterns,
  formatDuration,
  generateSessionId,
} from '@joolie-boolie/game-stats';

/**
 * Hook for managing bingo game statistics.
 * Provides statistics data and methods to record new sessions.
 */
export function useStatistics() {
  const [stats, setStats] = useState<BingoStatistics>(createEmptyBingoStats);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stats from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadedStats = loadBingoStats();
      setStats(loadedStats);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Record a completed bingo session.
   */
  const recordSession = useCallback(
    (session: Omit<BingoSessionRecord, 'id'>) => {
      const fullSession: BingoSessionRecord = {
        ...session,
        id: generateSessionId(),
      };

      const newStats = addBingoSession(fullSession);
      setStats(newStats);
      return newStats;
    },
    []
  );

  /**
   * Clear all statistics.
   */
  const clearStats = useCallback(() => {
    clearBingoStats();
    setStats(createEmptyBingoStats());
  }, []);

  /**
   * Get the most common winning patterns.
   */
  const mostCommonPatterns = getMostCommonPatterns(stats, 3);

  /**
   * Get formatted total play time.
   */
  const formattedPlayTime = formatDuration(stats.totalPlayTime);

  return {
    // Statistics data
    stats,
    isLoaded,

    // Computed values
    gamesPlayed: stats.gamesPlayed,
    averageBallsToWin: stats.averageBallsToWin,
    mostCommonPatterns,
    formattedPlayTime,
    recentSessions: stats.recentSessions,

    // Actions
    recordSession,
    clearStats,
  };
}

/**
 * Hook for tracking an active game session.
 * Call startSession when game starts, endSession when game ends.
 */
export function useSessionTracking() {
  const sessionRef = useRef<{
    patternId: string;
    patternName: string;
    startedAt: string;
  } | null>(null);

  const { recordSession } = useStatistics();

  /**
   * Start tracking a new session.
   */
  const startSession = useCallback((patternId: string, patternName: string) => {
    sessionRef.current = {
      patternId,
      patternName,
      startedAt: new Date().toISOString(),
    };
  }, []);

  /**
   * End the current session and record statistics.
   */
  const endSession = useCallback(
    (ballsCalled: number, hasWinner: boolean) => {
      if (!sessionRef.current) {
        return null;
      }

      const endedAt = new Date().toISOString();
      const startedAtDate = new Date(sessionRef.current.startedAt);
      const endedAtDate = new Date(endedAt);
      const duration = endedAtDate.getTime() - startedAtDate.getTime();

      const session: Omit<BingoSessionRecord, 'id'> = {
        patternId: sessionRef.current.patternId,
        patternName: sessionRef.current.patternName,
        ballsCalled,
        hasWinner,
        startedAt: sessionRef.current.startedAt,
        endedAt,
        duration,
      };

      sessionRef.current = null;

      return recordSession(session);
    },
    [recordSession]
  );

  /**
   * Cancel the current session without recording.
   */
  const cancelSession = useCallback(() => {
    sessionRef.current = null;
  }, []);

  /**
   * Check if a session is currently active.
   */
  const getIsSessionActive = useCallback(() => {
    return sessionRef.current !== null;
  }, []);

  return {
    startSession,
    endSession,
    cancelSession,
    getIsSessionActive,
  };
}
