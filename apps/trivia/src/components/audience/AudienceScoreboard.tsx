'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { Team } from '@/types';
import { scoreboardRowStagger, scoreboardRow, springAnswerReveal } from '@/lib/motion/presets';
import { getTeamColor } from '@/lib/motion/team-colors';

export interface AudienceScoreboardProps {
  teams: Team[];
  currentRound: number;
  totalRounds: number;
}

const rankLabels: Record<number, string> = {
  0: '1st',
  1: '2nd',
  2: '3rd',
};

/**
 * Scoreboard display for between-round and final standings.
 *
 * Layout: Full-width stacked rows sorted by score (descending).
 * Each row has:
 * - 4px left border in team color (Issue A-08: team color as accent, not text)
 * - Team name in --foreground (not white-on-team-color — text too small)
 * - Score bar proportional to the top score
 * - Rank badge for top 3
 *
 * Motion: rows stagger in from left on mount.
 * Reduced motion: rows appear instantly.
 */
export function AudienceScoreboard({
  teams,
  currentRound,
  totalRounds,
}: AudienceScoreboardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isLastRound = currentRound >= totalRounds - 1;
  const maxScore = teams.length > 0 ? Math.max(...teams.map((t) => t.score), 1) : 1;

  return (
    <section
      className="flex flex-col items-center h-full min-h-[60vh] gap-6 w-full"
      role="region"
      aria-label={isLastRound ? 'Final standings' : `Round ${currentRound + 1} standings`}
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
          {isLastRound ? 'Final Round Complete!' : `Round ${currentRound + 1} Complete!`}
        </h2>
        <p
          className="mt-2 text-foreground-secondary"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
        >
          {isLastRound
            ? 'Final Standings'
            : `${totalRounds - currentRound - 1} round${totalRounds - currentRound - 1 > 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Scoreboard rows */}
      <motion.div
        className="w-full max-w-4xl px-4 space-y-3"
        variants={scoreboardRowStagger}
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        animate="visible"
        role="list"
        aria-label="Team standings"
      >
        {teams.length === 0 ? (
          <p
            className="text-center text-foreground-secondary py-8"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            No teams yet
          </p>
        ) : (
          teams.map((team, index) => {
            const teamColor = getTeamColor(index);
            const scoreBarWidth = maxScore > 0 ? (team.score / maxScore) * 100 : 0;
            const isTopThree = index < 3;

            return (
              <motion.div
                key={team.id}
                role="listitem"
                aria-label={`${rankLabels[index] ?? `${index + 1}th`} place: ${team.name}, ${team.score} points`}
                variants={scoreboardRow}
                transition={shouldReduceMotion ? { duration: 0 } : { ...springAnswerReveal, delay: index * 0.07 }}
                className="relative flex items-center rounded-xl overflow-hidden"
                style={{
                  background: isTopThree ? teamColor.subtle : 'rgba(26, 23, 32, 0.6)',
                  borderLeft: `4px solid ${teamColor.bg}`,
                  padding: '16px 20px',
                  minHeight: '72px',
                }}
              >
                {/* Score bar background fill */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    width: `${scoreBarWidth}%`,
                    background: teamColor.subtle,
                    transition: shouldReduceMotion ? 'none' : 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: 0.5,
                  }}
                />

                {/* Rank badge */}
                <div className="relative z-10 flex-shrink-0 w-16 text-center">
                  {isTopThree ? (
                    <span
                      className="inline-flex items-center justify-center rounded-full font-bold text-white"
                      style={{
                        background: teamColor.bg,
                        width: '44px',
                        height: '44px',
                        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      }}
                      aria-hidden="true"
                    >
                      {rankLabels[index]}
                    </span>
                  ) : (
                    <span
                      className="font-semibold text-foreground-secondary"
                      style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Team name — foreground color (not team color, Issue A-08) */}
                <div className="relative z-10 flex-1 px-4">
                  <span
                    className="font-semibold text-foreground"
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                  >
                    {team.name}
                  </span>
                </div>

                {/* Score */}
                <div className="relative z-10 flex-shrink-0">
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                      color: teamColor.bg,
                      fontFamily: 'var(--font-display)',
                    }}
                    aria-hidden="true"
                  >
                    {team.score}
                  </span>
                  <span className="sr-only">{team.score} points</span>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Next round indicator */}
      {!isLastRound && (
        <div className="text-center mt-4" role="status" aria-live="polite">
          <p
            className="text-foreground-secondary motion-safe:animate-pulse"
            style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
          >
            Next round starting soon...
          </p>
        </div>
      )}
    </section>
  );
}
