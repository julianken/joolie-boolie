/**
 * Statistics Calculator Functions
 *
 * Pure functions for calculating statistics from session records.
 */

import type {
  BingoStatistics,
  BingoSessionRecord,
  BingoPatternStats,
  TriviaStatistics,
  TriviaSessionRecord,
  TriviaCategoryStats,
} from './types';

// =============================================================================
// BINGO STATISTICS CALCULATORS
// =============================================================================

/**
 * Create an empty bingo statistics object.
 */
export function createEmptyBingoStats(): BingoStatistics {
  return {
    gameType: 'bingo',
    gamesPlayed: 0,
    totalPlayTime: 0,
    firstGameAt: null,
    lastGameAt: null,
    averageBallsToWin: 0,
    totalBallsCalled: 0,
    patternStats: [],
    recentSessions: [],
  };
}

/**
 * Calculate bingo statistics from session records.
 */
export function calculateBingoStats(sessions: BingoSessionRecord[]): BingoStatistics {
  if (sessions.length === 0) {
    return createEmptyBingoStats();
  }

  // Sort by startedAt for first/last game
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  const totalPlayTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalBallsCalled = sessions.reduce((sum, s) => sum + s.ballsCalled, 0);

  // Calculate average balls to win (only for sessions with winners)
  const winSessions = sessions.filter((s) => s.hasWinner);
  const averageBallsToWin =
    winSessions.length > 0
      ? winSessions.reduce((sum, s) => sum + s.ballsCalled, 0) / winSessions.length
      : 0;

  // Calculate pattern statistics
  const patternStats = calculatePatternStats(sessions);

  return {
    gameType: 'bingo',
    gamesPlayed: sessions.length,
    totalPlayTime,
    firstGameAt: sortedSessions[0].startedAt,
    lastGameAt: sortedSessions[sortedSessions.length - 1].startedAt,
    averageBallsToWin: Math.round(averageBallsToWin * 10) / 10,
    totalBallsCalled,
    patternStats,
    recentSessions: sessions,
  };
}

/**
 * Calculate per-pattern statistics from bingo sessions.
 */
function calculatePatternStats(sessions: BingoSessionRecord[]): BingoPatternStats[] {
  const patternMap = new Map<string, BingoPatternStats>();

  for (const session of sessions) {
    const existing = patternMap.get(session.patternId);

    if (existing) {
      existing.timesPlayed++;
      if (session.hasWinner) {
        existing.wins++;
        // Recalculate average
        const totalBalls = existing.averageBallsToWin * (existing.wins - 1) + session.ballsCalled;
        existing.averageBallsToWin = Math.round((totalBalls / existing.wins) * 10) / 10;
      }
    } else {
      patternMap.set(session.patternId, {
        patternId: session.patternId,
        patternName: session.patternName,
        timesPlayed: 1,
        wins: session.hasWinner ? 1 : 0,
        averageBallsToWin: session.hasWinner ? session.ballsCalled : 0,
      });
    }
  }

  // Sort by times played (descending)
  return Array.from(patternMap.values()).sort((a, b) => b.timesPlayed - a.timesPlayed);
}

/**
 * Get the most common winning patterns from statistics.
 */
export function getMostCommonPatterns(
  stats: BingoStatistics,
  limit: number = 5
): BingoPatternStats[] {
  return stats.patternStats.slice(0, limit);
}

/**
 * Format duration in milliseconds to human-readable string.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

// =============================================================================
// TRIVIA STATISTICS CALCULATORS
// =============================================================================

/**
 * Create an empty trivia statistics object.
 */
export function createEmptyTriviaStats(): TriviaStatistics {
  return {
    gameType: 'trivia',
    gamesPlayed: 0,
    totalPlayTime: 0,
    firstGameAt: null,
    lastGameAt: null,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    overallAccuracy: 0,
    averageTeamScore: 0,
    highestTeamScore: 0,
    categoryStats: [],
    recentSessions: [],
  };
}

/**
 * Calculate trivia statistics from session records.
 */
export function calculateTriviaStats(sessions: TriviaSessionRecord[]): TriviaStatistics {
  if (sessions.length === 0) {
    return createEmptyTriviaStats();
  }

  // Sort by startedAt for first/last game
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  const totalPlayTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalQuestionsAnswered = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);

  // Calculate average team score
  const allTeamScores = sessions.map((s) => s.averageTeamScore);
  const averageTeamScore =
    allTeamScores.length > 0
      ? allTeamScores.reduce((sum, s) => sum + s, 0) / allTeamScores.length
      : 0;

  // Find highest team score
  const winnerScores = sessions.filter((s) => s.winnerScore !== null).map((s) => s.winnerScore!);
  const highestTeamScore = winnerScores.length > 0 ? Math.max(...winnerScores) : 0;

  // Calculate category statistics
  const categoryStats = calculateCategoryStats(sessions);

  // Calculate overall accuracy from category stats
  const totalCorrectAnswers = categoryStats.reduce((sum, c) => sum + c.correctAnswers, 0);
  const totalCategoryQuestions = categoryStats.reduce((sum, c) => sum + c.questionsAnswered, 0);
  const overallAccuracy =
    totalCategoryQuestions > 0
      ? Math.round((totalCorrectAnswers / totalCategoryQuestions) * 100)
      : 0;

  return {
    gameType: 'trivia',
    gamesPlayed: sessions.length,
    totalPlayTime,
    firstGameAt: sortedSessions[0].startedAt,
    lastGameAt: sortedSessions[sortedSessions.length - 1].startedAt,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    overallAccuracy,
    averageTeamScore: Math.round(averageTeamScore * 10) / 10,
    highestTeamScore,
    categoryStats,
    recentSessions: sessions,
  };
}

/**
 * Calculate per-category statistics from trivia sessions.
 */
function calculateCategoryStats(sessions: TriviaSessionRecord[]): TriviaCategoryStats[] {
  const categoryMap = new Map<string, TriviaCategoryStats>();

  for (const session of sessions) {
    for (const category of session.categoriesPlayed) {
      const existing = categoryMap.get(category);

      if (existing) {
        // We don't have per-category breakdown in session records,
        // so we estimate based on total questions divided by categories
        const estimatedQuestions = Math.ceil(
          session.questionsAnswered / Math.max(session.categoriesPlayed.length, 1)
        );
        existing.questionsAnswered += estimatedQuestions;
      } else {
        const estimatedQuestions = Math.ceil(
          session.questionsAnswered / Math.max(session.categoriesPlayed.length, 1)
        );
        categoryMap.set(category, {
          category,
          questionsAnswered: estimatedQuestions,
          correctAnswers: 0, // Will be updated when we have detailed data
          accuracy: 0,
        });
      }
    }
  }

  // Sort by questions answered (descending)
  return Array.from(categoryMap.values()).sort(
    (a, b) => b.questionsAnswered - a.questionsAnswered
  );
}

/**
 * Get the most popular categories from statistics.
 */
export function getMostPopularCategories(
  stats: TriviaStatistics,
  limit: number = 5
): TriviaCategoryStats[] {
  return stats.categoryStats.slice(0, limit);
}
