'use client';

import { motion, useReducedMotion } from 'motion/react';
import { heroSceneEnter, heroSceneEnterReduced } from '@/lib/motion/presets';

/**
 * FinalBuildupScene (T3.3)
 *
 * "GAME OVER" hero text scene before the final podium reveal.
 * Uses heroSceneEnter motion variant (scale + fade, springDramatic).
 * Text uses display-gradient-text class.
 * Subtitle: "Let's see the final scores!"
 * Background: glow-pulse-radial ambient CSS animation.
 *
 * Auto-advances at SCENE_TIMING.FINAL_BUILDUP_MS (3000ms) via useAudienceScene.
 * Reduced motion: opacity-only fade.
 */
export function FinalBuildupScene() {
  const shouldReduceMotion = useReducedMotion();

  const variants = shouldReduceMotion ? heroSceneEnterReduced : heroSceneEnter;

  return (
    <section
      className="relative flex flex-col items-center justify-center h-full min-h-[60vh] gap-8 w-full px-4 overflow-hidden"
      role="region"
      aria-label="Game over — final scores incoming"
      aria-live="polite"
    >
      {/* Ambient radial glow (CSS animation) */}
      <div
        className="glow-pulse-radial"
        aria-hidden="true"
        style={{
          '--display-glow-center': 'radial-gradient(circle at 50% 50%, rgba(126, 82, 228, 0.20) 0%, transparent 65%)',
        } as React.CSSProperties}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 text-center"
        variants={variants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero text: "GAME OVER" with gradient fill */}
        <h2
          className="display-gradient-text font-black uppercase tracking-tight leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(5rem, 16vw, 14rem)',
            letterSpacing: '-0.03em',
            lineHeight: 0.9,
          }}
        >
          GAME OVER
        </h2>

        {/* Subtitle */}
        <motion.p
          className="text-foreground-secondary"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
            letterSpacing: '0.05em',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.4,
            delay: shouldReduceMotion ? 0 : 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {"Let's see the final scores!"}
        </motion.p>
      </motion.div>
    </section>
  );
}
