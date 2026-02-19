'use client';

import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import type { Team } from '@/types';
import { winnerCard, podiumCard, scoreboardRowStagger, scoreboardRow, springSceneTransition } from '@/lib/motion/presets';
import { getTeamColor } from '@/lib/motion/team-colors';
import { AnimatedScore } from './AnimatedScore';

export interface GameEndDisplayProps {
  teams: Team[];
}

/**
 * Final results display in podium arrangement: 2nd | 1st | 3rd.
 *
 * Winner card: team-colored glow, WINNER text label (NO trophy emoji — rule 1).
 * 2nd and 3rd: flanking cards with smaller presence.
 * Other teams: ranked list below the podium.
 *
 * Scores use AnimatedScore rolling counter.
 * Respects prefers-reduced-motion.
 *
 * Team colors used only as border/glow accents.
 * Names and scores displayed in --foreground (Issue A-08: team colors at 20px+ bold only).
 */
export function GameEndDisplay({ teams }: GameEndDisplayProps) {
  const shouldReduceMotion = useReducedMotion();

  const winner = teams[0];
  const second = teams[1];
  const third = teams[2];
  const otherTeams = teams.slice(3);

  const winnerColor = winner ? getTeamColor(0) : null;
  const secondColor = second ? getTeamColor(1) : null;
  const thirdColor = third ? getTeamColor(2) : null;

  return (
    <section
      className="flex flex-col items-center h-full min-h-[60vh] gap-8 py-6 px-4"
      role="region"
      aria-label="Final game results"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {winner ? `Game over. Winner: ${winner.name} with ${winner.score} points.` : 'Game over. No teams.'}
      </div>

      {/* Header */}
      <div className="text-center">
        <h1
          className="font-bold text-foreground"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            letterSpacing: '-0.03em',
          }}
        >
          Game Over
        </h1>
      </div>

      {/* Podium: 2nd | 1st | 3rd */}
      <div className="flex items-end justify-center gap-4 w-full max-w-4xl">

        {/* 2nd place — left flanking */}
        {second && secondColor && (
          <motion.div
            variants={podiumCard}
            initial={shouldReduceMotion ? 'visible' : 'hidden'}
            animate="visible"
            transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 0.3 }}
            role="article"
            aria-label={`2nd place: ${second.name} with ${second.score} points`}
            className="flex-1 max-w-xs flex flex-col items-center text-center rounded-2xl overflow-hidden"
            style={{
              background: secondColor.subtle,
              border: `2px solid ${secondColor.border}`,
              padding: '24px 16px',
              alignSelf: 'flex-end',
              minHeight: '200px',
            }}
          >
            <span
              className="font-bold mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                color: secondColor.bg,
              }}
              aria-hidden="true"
            >
              2ND
            </span>
            <h3
              className="font-bold text-foreground mb-2"
              style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)' }}
            >
              {second.name}
            </h3>
            <AnimatedScore
              value={second.score}
              className="font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                color: secondColor.bg,
              }}
            />
            <span className="sr-only">points</span>
          </motion.div>
        )}

        {/* 1st place — center hero */}
        {winner && winnerColor && (
          <motion.div
            variants={winnerCard}
            initial={shouldReduceMotion ? 'visible' : 'hidden'}
            animate="visible"
            transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 0.1 }}
            role="article"
            aria-label={`Winner: ${winner.name} with ${winner.score} points`}
            className="flex-1 max-w-sm flex flex-col items-center text-center rounded-2xl overflow-hidden"
            style={{
              background: winnerColor.subtle,
              border: `3px solid ${winnerColor.border}`,
              boxShadow: shouldReduceMotion ? 'none' : `0 0 40px 12px ${winnerColor.glow}`,
              padding: '32px 20px',
              minHeight: '280px',
            }}
          >
            {/* WINNER label — NO emoji */}
            <span
              className="font-bold tracking-widest uppercase mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                color: winnerColor.bg,
                letterSpacing: '0.12em',
              }}
              aria-hidden="true"
            >
              WINNER
            </span>

            {/* Crown icon (SVG, not emoji) */}
            <svg
              className="mb-3"
              style={{ width: '48px', height: '48px', color: winnerColor.bg }}
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2L9 9H2l5.5 4-2 7 6.5-4.5L18 20l-2-7L21.5 9H15L12 2z" />
            </svg>

            <h2
              className="font-bold text-foreground mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3.5vw, 3rem)',
                letterSpacing: '-0.02em',
              }}
            >
              {winner.name}
            </h2>
            <AnimatedScore
              value={winner.score}
              className="font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                color: winnerColor.bg,
              }}
            />
            <span className="sr-only">points</span>
            <p
              className="mt-1 text-foreground-secondary"
              style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}
              aria-hidden="true"
            >
              points
            </p>
          </motion.div>
        )}

        {/* 3rd place — right flanking */}
        {third && thirdColor && (
          <motion.div
            variants={podiumCard}
            initial={shouldReduceMotion ? 'visible' : 'hidden'}
            animate="visible"
            transition={shouldReduceMotion ? { duration: 0 } : { ...springSceneTransition, delay: 0.5 }}
            role="article"
            aria-label={`3rd place: ${third.name} with ${third.score} points`}
            className="flex-1 max-w-xs flex flex-col items-center text-center rounded-2xl overflow-hidden"
            style={{
              background: thirdColor.subtle,
              border: `2px solid ${thirdColor.border}`,
              padding: '24px 16px',
              alignSelf: 'flex-end',
              minHeight: '180px',
            }}
          >
            <span
              className="font-bold mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                color: thirdColor.bg,
              }}
              aria-hidden="true"
            >
              3RD
            </span>
            <h3
              className="font-bold text-foreground mb-2"
              style={{ fontSize: 'clamp(1.125rem, 2vw, 1.75rem)' }}
            >
              {third.name}
            </h3>
            <AnimatedScore
              value={third.score}
              className="font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                color: thirdColor.bg,
              }}
            />
            <span className="sr-only">points</span>
          </motion.div>
        )}
      </div>

      {/* Other teams */}
      {otherTeams.length > 0 && (
        <div className="w-full max-w-3xl px-4">
          <h3
            id="other-participants-heading"
            className="font-semibold text-foreground-secondary text-center mb-4"
            style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}
          >
            Other Participants
          </h3>
          <motion.ul
            className="space-y-2"
            role="list"
            aria-labelledby="other-participants-heading"
            variants={scoreboardRowStagger}
            initial={shouldReduceMotion ? 'visible' : 'hidden'}
            animate="visible"
          >
            <AnimatePresence>
              {otherTeams.map((team, index) => {
                const teamColor = getTeamColor(index + 3);
                return (
                  <motion.li
                    key={team.id}
                    variants={scoreboardRow}
                    transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.07 }}
                    className="flex items-center justify-between rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(26, 23, 32, 0.6)',
                      borderLeft: `3px solid ${teamColor.bg}`,
                      padding: '12px 20px',
                    }}
                    aria-label={`${index + 4}th place: ${team.name} with ${team.score} points`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="font-semibold text-foreground-secondary w-8"
                        style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}
                        aria-hidden="true"
                      >
                        {index + 4}.
                      </span>
                      <span
                        className="font-medium text-foreground"
                        style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
                      >
                        {team.name}
                      </span>
                    </div>
                    <AnimatedScore
                      value={team.score}
                      className="font-semibold"
                      style={{
                        fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                        color: teamColor.bg,
                      }}
                    />
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </div>
      )}

      {/* No teams */}
      {teams.length === 0 && (
        <div className="text-center py-8" role="status">
          <p
            className="text-foreground-secondary"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            No teams participated
          </p>
        </div>
      )}

      {/* Thank you — no emojis */}
      <div className="text-center mt-4">
        <p
          className="text-foreground-secondary"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
        >
          Thanks for playing!
        </p>
      </div>
    </section>
  );
}
