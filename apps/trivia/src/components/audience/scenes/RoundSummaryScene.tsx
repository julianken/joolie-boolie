'use client';

import { useGameStore } from '@/stores/game-store';

/**
 * RoundSummaryScene (T2.7)
 *
 * Transition screen shown when a round ends, before the recap flow.
 * Scores are intentionally hidden here — they are only revealed at
 * `recap_scores` after the presenter tallies them in `round_scoring`.
 */
export function RoundSummaryScene() {
  const currentRound = useGameStore((state) => state.currentRound);
  const totalRounds = useGameStore((state) => state.totalRounds);

  const isLastRound = currentRound >= totalRounds - 1;
  const roundNumber = currentRound + 1;

  return (
    <section
      className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 w-full"
      role="region"
      aria-label={isLastRound ? 'Final round complete' : `Round ${roundNumber} complete`}
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
          {isLastRound ? 'Final Round Complete!' : `Round ${roundNumber} Complete!`}
        </h2>
        <p
          className="mt-2 text-foreground-secondary"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
        >
          {isLastRound
            ? 'Time to review the answers'
            : `${totalRounds - currentRound - 1} round${totalRounds - currentRound - 1 !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Navigation hint */}
      <div className="text-center mt-4" role="status" aria-live="polite">
        <p
          className="text-foreground-secondary"
          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
        >
          &rarr; Review answers &middot; N Skip to next round
        </p>
      </div>
    </section>
  );
}
