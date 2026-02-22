'use client';

import { useGameStore, useGameSelectors } from '@/stores/game-store';
import type { ScoreDelta } from '@/types';
import { ScoreboardRows } from './shared/ScoreboardRows';

/**
 * RoundSummaryScene (T2.7)
 *
 * Full scoreboard with score deltas and rank changes. Replaces the fallback
 * AudienceScoreboard in SceneRouter for the round_summary scene.
 *
 * Shows:
 * - Round X Complete / Final Standings header
 * - All teams sorted by score (descending)
 * - Score delta badges ("+2 this round") from scoreDeltas store
 * - Rank change indicators (up arrow, down arrow, dash)
 * - Team accent colors via getTeamColor()
 *
 * Motion: staggered row entry from left (via ScoreboardRows).
 * Reduced motion: rows appear instantly.
 */
export function RoundSummaryScene() {
  const currentRound = useGameStore((state) => state.currentRound);
  const totalRounds = useGameStore((state) => state.totalRounds);
  const scoreDeltas = useGameStore((state) => state.scoreDeltas);

  const { teamsSortedByScore } = useGameSelectors();

  const isLastRound = currentRound >= totalRounds - 1;
  const maxScore =
    teamsSortedByScore.length > 0
      ? Math.max(...teamsSortedByScore.map((t) => t.score), 1)
      : 1;

  // Build delta lookup
  const deltaMap = new Map<string, ScoreDelta>(
    scoreDeltas.map((d) => [d.teamId, d]),
  );

  return (
    <section
      className="flex flex-col items-center h-full min-h-[60vh] gap-6 w-full"
      role="region"
      aria-label={isLastRound ? 'Final standings' : `Round ${currentRound + 1} complete`}
    >
      {/* Header */}
      <div className="text-center" aria-live="polite">
        <h2
          className="font-bold text-foreground"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.75rem)',
            letterSpacing: '-0.02em',
          }}
        >
          {isLastRound ? 'Final Standings' : `Round ${currentRound + 1} Complete!`}
        </h2>
        <p
          className="mt-2 text-foreground-secondary"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
        >
          {isLastRound
            ? 'Game Over'
            : `${totalRounds - currentRound - 1} round${totalRounds - currentRound - 1 !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Scoreboard rows */}
      <ScoreboardRows
        teams={teamsSortedByScore}
        deltaMap={deltaMap}
        maxScore={maxScore}
      />

      {/* Navigation footer */}
      <div className="text-center mt-4" role="status" aria-live="polite">
        <p
          className="text-foreground-secondary"
          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
        >
          Scoring in progress... &rarr; Review answers &middot; N Skip to next round
        </p>
      </div>
    </section>
  );
}
