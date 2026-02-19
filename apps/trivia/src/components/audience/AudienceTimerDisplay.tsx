'use client';

import { useReducedMotion } from 'motion/react';
import type { Timer } from '@/types';

export interface AudienceTimerDisplayProps {
  /** Timer state from game store */
  timer: Timer;
  /** Whether the timer should be visible (from settings) */
  visible?: boolean;
}

/**
 * Timer color thresholds using --trivia-timer-* tokens.
 * Using hex values directly for older TV/projector compatibility (FINAL-DESIGN-PLAN.md 9.9).
 *
 * >50% time remaining: safe (green)
 * 25-50%: warning (amber)
 * <25%: danger (red) + heartbeat pulse
 */
function getTimerColors(remaining: number, duration: number): {
  stroke: string;
  textColor: string;
  trackColor: string;
  glow: string;
  isDanger: boolean;
} {
  if (duration === 0) {
    return {
      stroke:     '#6E7388',
      textColor:  '#6E7388',
      trackColor: 'rgba(110, 115, 136, 0.15)',
      glow:       'none',
      isDanger:   false,
    };
  }

  const pct = (remaining / duration) * 100;

  if (pct > 50) {
    // Safe — green (#34D399 = --trivia-timer-safe)
    return {
      stroke:     '#34D399',
      textColor:  '#34D399',
      trackColor: 'rgba(52, 211, 153, 0.10)',
      glow:       '0 0 16px 4px rgba(52, 211, 153, 0.30)',
      isDanger:   false,
    };
  } else if (pct > 25) {
    // Warning — amber (#FBBF24 = --trivia-timer-warning)
    return {
      stroke:     '#FBBF24',
      textColor:  '#FBBF24',
      trackColor: 'rgba(251, 191, 36, 0.10)',
      glow:       '0 0 16px 4px rgba(251, 191, 36, 0.25)',
      isDanger:   false,
    };
  } else {
    // Danger — red (#F43F5E = --trivia-timer-danger) + heartbeat
    return {
      stroke:     '#F43F5E',
      textColor:  '#F43F5E',
      trackColor: 'rgba(244, 63, 94, 0.12)',
      glow:       '0 0 20px 6px rgba(244, 63, 94, 0.40)',
      isDanger:   true,
    };
  }
}

/**
 * Large audience timer display with circular SVG countdown.
 *
 * - SVG stroke-dasharray depletes clockwise as time ticks down.
 * - Color transitions: green (>50%) -> amber (25-50%) -> red (<25%).
 * - Heartbeat pulse animation in final 25% (or final 5 seconds).
 * - role="timer" with aria-live="polite" for screen readers.
 * - Respects prefers-reduced-motion via useReducedMotion().
 *
 * Minimum readable size: 280px diameter. At 1920x1080 this is
 * clearly readable from 30+ feet. (Issue A-23)
 */
export function AudienceTimerDisplay({
  timer,
  visible = true,
}: AudienceTimerDisplayProps) {
  const shouldReduceMotion = useReducedMotion();
  const { remaining, duration, isRunning } = timer;

  if (!visible) return null;

  const progressPct = duration > 0 ? (remaining / duration) * 100 : 0;
  const colors = getTimerColors(remaining, duration);

  // Heartbeat kicks in at <25% or when 5 seconds remain
  const isHeartbeat = colors.isDanger && isRunning && !shouldReduceMotion;
  const isFinalFive = remaining <= 5 && remaining > 0 && isRunning && !shouldReduceMotion;

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}`;
  };

  // SVG circular progress calculations
  const svgSize = 280;
  const strokeWidth = 14;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      role="region"
      aria-label="Question timer"
    >
      {/* Circular timer */}
      <div
        className="relative"
        style={{
          filter: shouldReduceMotion ? 'none' : `drop-shadow(${colors.glow})`,
        }}
      >
        {/* SVG ring — rotated so 12 o'clock is start */}
        <svg
          width={svgSize}
          height={svgSize}
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          {/* Track ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={colors.trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: shouldReduceMotion ? 'none' : 'stroke-dashoffset 1s linear, stroke 0.4s ease',
            }}
          />
        </svg>

        {/* Center time display */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-full m-4 ${
            isHeartbeat || isFinalFive ? 'timer-heartbeat' : ''
          }`}
          style={{
            background: colors.trackColor,
          }}
        >
          <span
            className="font-bold tabular-nums"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              color: colors.textColor,
              lineHeight: 1,
              transition: shouldReduceMotion ? 'none' : 'color 0.4s ease',
            }}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatTime(remaining)}
          </span>
          <span
            className="font-medium mt-1"
            style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)',
              color: colors.textColor,
              opacity: 0.7,
            }}
          >
            {remaining >= 60 ? 'min' : 'sec'}
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        <span
          aria-hidden="true"
          className={`w-3 h-3 rounded-full ${isRunning ? 'motion-safe:animate-pulse' : ''}`}
          style={{ background: isRunning ? colors.stroke : '#6E7388' }}
        />
        <span
          className="font-medium"
          style={{
            color: '#6E7388',
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
          }}
        >
          {isRunning ? 'Time Running' : remaining <= 0 ? "Time's Up!" : 'Timer Paused'}
        </span>
      </div>

      {/* Time up announcement */}
      {remaining <= 0 && duration > 0 && (
        <div
          className="font-bold motion-safe:animate-pulse"
          style={{
            color: '#F43F5E',
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          }}
          aria-live="assertive"
        >
          TIME!
        </div>
      )}
    </div>
  );
}
