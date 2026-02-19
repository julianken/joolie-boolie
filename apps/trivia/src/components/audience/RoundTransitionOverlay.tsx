'use client';

import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import type { Team } from '@/types';
import {
  roundTransitionContainer,
  roundTransitionChild,
  scoreboardRowStagger,
  scoreboardRow,
  springSceneTransition,
} from '@/lib/motion/presets';
import { getTeamColor } from '@/lib/motion/team-colors';

export interface RoundTransitionOverlayProps {
  /** Whether this overlay is visible */
  isVisible: boolean;
  /** Round number being introduced (1-based) */
  roundNumber: number;
  /** Total rounds in the game */
  totalRounds: number;
  /** Name/theme for this round (optional) */
  roundName?: string;
  /** Number of questions in this round */
  questionCount: number;
  /** Teams sorted by score for the leaderboard snapshot */
  teamsSortedByScore: Team[];
}

/**
 * Full-screen cinematic overlay for round transitions.
 *
 * Staggered animation sequence (~5 seconds total):
 *   0ms:   "ROUND" label slides up
 *   400ms: Giant round number appears
 *   800ms: Round name fades in
 *   1200ms: Leaderboard snapshot cascades in row by row (80ms stagger)
 *
 * Auto-dismisses after 5 seconds (handled by parent via onComplete callback).
 * Z-index: var(--z-overlay) = 40.
 *
 * No emojis anywhere in this component.
 * Respects prefers-reduced-motion.
 */
export function RoundTransitionOverlay({
  isVisible,
  roundNumber,
  totalRounds,
  roundName,
  questionCount,
  teamsSortedByScore,
}: RoundTransitionOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="round-transition"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.4 } }}
          transition={shouldReduceMotion ? { duration: 0 } : springSceneTransition}
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{
            zIndex: 'var(--z-overlay, 40)',
            background: 'linear-gradient(135deg, #0a0b14 0%, #0d1026 50%, #0a0b14 100%)',
          }}
          role="status"
          aria-live="polite"
          aria-label={`Round ${roundNumber} of ${totalRounds} beginning`}
        >
          {/* Screen reader announcement */}
          <span className="sr-only">
            Round {roundNumber} of {totalRounds} is starting
            {roundName ? `: ${roundName}` : ''}.
            {questionCount} questions.
          </span>

          <motion.div
            className="flex flex-col items-center gap-6 text-center px-8"
            variants={roundTransitionContainer}
            initial={shouldReduceMotion ? 'visible' : 'hidden'}
            animate="visible"
            exit="exit"
          >
            {/* "ROUND" label */}
            <motion.span
              variants={roundTransitionChild}
              transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 0 }}
              className="font-bold tracking-widest text-foreground-secondary uppercase"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                letterSpacing: '0.15em',
              }}
              aria-hidden="true"
            >
              ROUND
            </motion.span>

            {/* Giant round number */}
            <motion.span
              variants={roundTransitionChild}
              transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 0.4 }}
              className="font-bold text-foreground"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(6rem, 18vw, 14rem)',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                background: 'linear-gradient(135deg, #4F7BF7 0%, #7E52E4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            >
              {roundNumber}
            </motion.span>

            {/* Round name / subtitle */}
            {roundName && (
              <motion.span
                variants={roundTransitionChild}
                transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 0.8 }}
                className="font-semibold text-foreground-secondary"
                style={{ fontSize: 'clamp(1.25rem, 3vw, 2.25rem)' }}
                aria-hidden="true"
              >
                {roundName}
              </motion.span>
            )}

            {/* Question count */}
            <motion.span
              variants={roundTransitionChild}
              transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 1.0 }}
              className="text-foreground-secondary"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
              aria-hidden="true"
            >
              {questionCount} question{questionCount !== 1 ? 's' : ''}
            </motion.span>

            {/* Leaderboard snapshot */}
            {teamsSortedByScore.length > 0 && (
              <motion.div
                className="w-full max-w-xl mt-4"
                variants={scoreboardRowStagger}
                transition={shouldReduceMotion ? { duration: 0 } : { delayChildren: 1.2 }}
                initial={shouldReduceMotion ? 'visible' : 'hidden'}
                animate="visible"
                aria-hidden="true"
              >
                <p
                  className="text-foreground-secondary mb-3 font-medium"
                  style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}
                >
                  Current Standings
                </p>
                <div className="space-y-2">
                  {teamsSortedByScore.slice(0, 5).map((team, index) => {
                    const teamColor = getTeamColor(index);
                    return (
                      <motion.div
                        key={team.id}
                        variants={scoreboardRow}
                        transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.2 + index * 0.08 }}
                        className="flex items-center rounded-lg overflow-hidden"
                        style={{
                          background: teamColor.subtle,
                          borderLeft: `3px solid ${teamColor.bg}`,
                          padding: '10px 16px',
                        }}
                      >
                        <span
                          className="text-foreground-secondary font-medium w-8"
                          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}
                        >
                          {index + 1}.
                        </span>
                        <span
                          className="flex-1 font-semibold text-foreground"
                          style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
                        >
                          {team.name}
                        </span>
                        <span
                          className="font-bold tabular-nums"
                          style={{
                            color: teamColor.bg,
                            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {team.score}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
