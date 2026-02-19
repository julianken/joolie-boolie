'use client';

import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';
import { BingoBall, BingoColumn } from '@/types';

/**
 * Bingo-specific spring preset for ball reveal.
 * High-energy, bouncy — stiffness 120, damping 14.
 */
const springBallReveal = { type: 'spring' as const, stiffness: 120, damping: 14, mass: 1 };

export interface BallRevealProps {
  ball: BingoBall | null;
  /** Auto-call interval in seconds. Controls animation complexity. */
  autoCallInterval?: number;
  /** Whether auto-call is active. Manual calls always get full animation. */
  isAutoCall?: boolean;
}

/**
 * Determine animation tier based on auto-call speed.
 * Issue 2.4: Ball animation scaling.
 *   - Manual / interval >= 8s: Full (rotateY + scale + blur)
 *   - Interval 5-8s: Simplified (scale only, 300ms ease-out)
 *   - Interval < 5s: Instant (150ms opacity crossfade)
 */
function getAnimationTier(isAutoCall?: boolean, interval?: number): 'full' | 'simple' | 'instant' {
  if (!isAutoCall || interval === undefined) return 'full';
  if (interval >= 8) return 'full';
  if (interval >= 5) return 'simple';
  return 'instant';
}

function getBallBackground(column: BingoColumn): string {
  const map: Record<BingoColumn, string> = {
    B: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, transparent 55%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.15) 0%, transparent 50%), #3B82F6',
    I: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, transparent 55%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.15) 0%, transparent 50%), #EF4444',
    N: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65) 0%, transparent 55%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.10) 0%, transparent 50%), #E8E6EB',
    G: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, transparent 55%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.15) 0%, transparent 50%), #22C55E',
    O: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, transparent 55%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.15) 0%, transparent 50%), #F59E0B',
  };
  return map[column];
}

function getBallBoxShadow(column: BingoColumn): string {
  const glows: Record<BingoColumn, string> = {
    B: '0 4px 32px rgba(59, 130, 246, 0.65), 0 2px 12px rgba(0,0,0,0.6)',
    I: '0 4px 32px rgba(239, 68, 68, 0.65), 0 2px 12px rgba(0,0,0,0.6)',
    N: '0 4px 32px rgba(232, 230, 235, 0.45), 0 2px 12px rgba(0,0,0,0.5)',
    G: '0 4px 32px rgba(34, 197, 94, 0.65), 0 2px 12px rgba(0,0,0,0.6)',
    O: '0 4px 32px rgba(245, 158, 11, 0.65), 0 2px 12px rgba(0,0,0,0.6)',
  };
  return `inset 0 -6px 12px rgba(0,0,0,0.35), inset 0 3px 8px rgba(255,255,255,0.25), ${glows[column]}`;
}

function getBallTextColor(column: BingoColumn): string {
  return column === 'N' ? '#1A1720' : '#FFFFFF';
}

/**
 * BallReveal — Motion-powered spring ball entrance for audience display.
 *
 * Uses AnimatePresence for exit animations and useReducedMotion for
 * accessibility compliance (Issue A-20).
 *
 * Role is "status" with aria-live="assertive" per Issue A-17.
 */
export function BallReveal({ ball, autoCallInterval, isAutoCall }: BallRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const tier = getAnimationTier(isAutoCall, autoCallInterval);

  // Determine animation based on tier and reduced motion preference
  const getInitial = () => {
    if (prefersReducedMotion) return { opacity: 0 };
    if (tier === 'full') return { scale: 0, rotateY: 180, filter: 'blur(8px)', opacity: 0 };
    if (tier === 'simple') return { scale: 0.6, opacity: 0 };
    return { opacity: 0 };
  };

  const getAnimate = () => {
    if (prefersReducedMotion) return { opacity: 1 };
    if (tier === 'full') return { scale: 1, rotateY: 0, filter: 'blur(0px)', opacity: 1 };
    if (tier === 'simple') return { scale: 1, opacity: 1 };
    return { opacity: 1 };
  };

  const getExit = () => {
    if (prefersReducedMotion) return { opacity: 0 };
    if (tier === 'instant') return { opacity: 0 };
    return { scale: 0.8, opacity: 0 };
  };

  const getTransition = (): Transition => {
    if (prefersReducedMotion) return { duration: 0 };
    if (tier === 'full') return springBallReveal;
    if (tier === 'simple') return { duration: 0.3, ease: [0, 0, 0.58, 1] };
    return { duration: 0.15, ease: [0, 0, 0.58, 1] };
  };


  if (!ball) {
    return (
      <div
        className="
          w-[320px] h-[320px] md:w-[400px] md:h-[400px]
          rounded-full flex items-center justify-center
          border-8 border-dashed border-border
        "
        style={{ backgroundColor: 'var(--surface-elevated)' }}
        role="status"
        aria-label="Waiting for first ball"
      >
        <span className="text-8xl md:text-9xl font-bold text-foreground-muted">?</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label={`Ball ${ball.label}`}
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={ball.label}
          initial={getInitial()}
          animate={getAnimate()}
          exit={getExit()}
          transition={getTransition()}
          style={{
            width: 'clamp(280px, 40vw, 400px)',
            height: 'clamp(280px, 40vw, 400px)',
            borderRadius: '9999px',
            background: getBallBackground(ball.column),
            boxShadow: getBallBoxShadow(ball.column),
            color: getBallTextColor(ball.column),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible',
            fontWeight: 700,
          }}
        >
          {/* White horizontal stripe */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '5%',
              right: '5%',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '28%',
              background: ball.column === 'N' ? 'rgba(26, 23, 32, 0.10)' : 'rgba(255, 255, 255, 0.88)',
              borderRadius: '9999px',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />

          {/* Ball content — above stripe */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            <span
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 600, opacity: 0.9 }}
              aria-hidden="true"
            >
              {ball.column}
            </span>
            <span style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
              {ball.number}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
