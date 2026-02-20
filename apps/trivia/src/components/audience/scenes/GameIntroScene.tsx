'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useGameStore } from '@/stores/game-store';
import { heroSceneEnter, heroSceneEnterReduced } from '@/lib/motion/presets';

/**
 * GameIntroScene (T3.2)
 *
 * "GET READY" hero text scene shown at game start.
 * Uses heroSceneEnter motion variant (scale + fade, springDramatic).
 * Text uses display-gradient-text class (CSS gradient fill from globals.css).
 *
 * Shows game info below hero text: round count and team count.
 *
 * Auto-advances at SCENE_TIMING.GAME_INTRO_MS (6000ms) via useAudienceScene.
 * Reduced motion: instant fade-in, no scale animation.
 */
export function GameIntroScene() {
  const shouldReduceMotion = useReducedMotion();

  const totalRounds = useGameStore((state) => state.totalRounds);
  const teams = useGameStore((state) => state.teams);

  const variants = shouldReduceMotion ? heroSceneEnterReduced : heroSceneEnter;

  return (
    <section
      className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-8 w-full px-4"
      role="region"
      aria-label="Game introduction"
      aria-live="polite"
    >
      <motion.div
        className="flex flex-col items-center gap-6 text-center"
        variants={variants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero text: "GET READY" with gradient fill */}
        <h2
          className="display-gradient-text font-black uppercase tracking-tight leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(5rem, 16vw, 14rem)',
            letterSpacing: '-0.03em',
            lineHeight: 0.9,
          }}
        >
          GET READY
        </h2>

        {/* Game info */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            delay: shouldReduceMotion ? 0 : 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="flex items-center gap-6">
            <div
              className="px-6 py-2 rounded-full border"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <span
                className="font-semibold text-foreground-secondary"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
              >
                {totalRounds} {totalRounds === 1 ? 'Round' : 'Rounds'}
              </span>
            </div>

            {teams.length > 0 && (
              <div
                className="px-6 py-2 rounded-full border"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <span
                  className="font-semibold text-foreground-secondary"
                  style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
                >
                  {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
