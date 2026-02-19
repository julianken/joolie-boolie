'use client';

import { useReducedMotion } from 'motion/react';

export interface WaitingDisplayProps {
  message: string;
  /** Room code to display prominently (Issue 2.5) */
  roomCode?: string;
}

/**
 * Cinematic waiting display for the audience view.
 *
 * Features (Issue 2.5 — Player Join Flow):
 * - Large "Trivia" wordmark in display font with breathing scale animation.
 * - Room code displayed prominently in large font when provided.
 * - Join URL: trivia.joolie-boolie.com/join shown below room code.
 * - Ambient gradient background with 20s loop animation.
 *
 * Reduced motion (Issue A-19):
 * - Ambient gradient: motion-reduce:animate-none (stops waiting-ambient keyframe).
 * - Breathing: motion-reduce:animate-none (stops waiting-breathe keyframe).
 * - Spinner: replaced with static dot when reduced motion is on.
 */
export function WaitingDisplay({ message, roomCode }: WaitingDisplayProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`flex flex-col items-center justify-center h-full min-h-[60vh] gap-8 text-center relative overflow-hidden ${
        shouldReduceMotion ? '' : 'trivia-ambient-bg'
      }`}
      role="status"
      aria-live="polite"
      aria-label={message}
      style={shouldReduceMotion ? { background: '#0a0b14' } : undefined}
    >
      {/* Large "Trivia" wordmark with breathing animation */}
      <div
        className={`${shouldReduceMotion ? '' : '[animation:waiting-breathe_4s_ease-in-out_infinite]'}`}
        aria-hidden="true"
        style={shouldReduceMotion ? { opacity: 0.9 } : undefined}
      >
        <span
          className="font-bold text-foreground"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(5rem, 15vw, 12rem)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #4F7BF7 0%, #7E52E4 60%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Trivia
        </span>
      </div>

      {/* Room code — displayed prominently (Issue 2.5) */}
      {roomCode && (
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-foreground-secondary font-medium uppercase tracking-widest"
            style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)', letterSpacing: '0.15em' }}
          >
            Room Code
          </span>
          <span
            className="font-bold text-foreground font-mono"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #4F7BF7 0%, #7E52E4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            aria-label={`Room code: ${roomCode}`}
          >
            {roomCode}
          </span>
          {/* Join URL (Issue 2.5) */}
          <p
            className="text-foreground-secondary font-medium"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            trivia.joolie-boolie.com/join
          </p>
        </div>
      )}

      {/* Status message + spinner / dot */}
      <div className="flex flex-col items-center gap-4">
        {shouldReduceMotion ? (
          <div
            className="w-4 h-4 rounded-full bg-primary"
            aria-hidden="true"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        <p
          className="text-foreground-secondary font-medium"
          style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
        >
          {message}
        </p>
        <p
          className="text-foreground-secondary"
          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
        >
          The game will appear here when the presenter is ready.
        </p>
      </div>
    </div>
  );
}
