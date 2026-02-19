'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface AnimatedScoreProps {
  /** Target score value to animate to */
  value: number;
  /** Animation duration in ms */
  duration?: number;
  /** Optional className for the span */
  className?: string;
  /** Optional inline style */
  style?: React.CSSProperties;
}

/**
 * Rolling score counter using requestAnimationFrame + cubic ease-out.
 *
 * When `value` changes, the counter animates from the previous value to the new one.
 * Uses cubic ease-out for the roll: fast at the start, decelerates to land precisely.
 *
 * Respects prefers-reduced-motion: if reduced motion is on, the value jumps instantly.
 *
 * This is pure React + RAF — no Motion library needed for this micro-animation,
 * which keeps it self-contained and fast.
 */
export function AnimatedScore({
  value,
  duration = 600,
  className,
  style,
}: AnimatedScoreProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;

    // Skip animation for reduced motion or same value
    if (shouldReduceMotion || startValue === endValue) {
      setDisplayValue(endValue);
      previousValueRef.current = endValue;
      return;
    }

    // Cancel any in-progress animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out: fast start, decelerates to landing
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration, shouldReduceMotion]);

  return (
    <span
      className={className}
      style={style}
      aria-label={`${value} points`}
    >
      {displayValue}
    </span>
  );
}
