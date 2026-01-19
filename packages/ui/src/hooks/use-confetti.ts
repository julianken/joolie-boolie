'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConfettiOptions } from '../confetti';

export interface UseConfettiOptions extends ConfettiOptions {
  /** Auto-stop confetti after duration (default: true) */
  autoStop?: boolean;
}

export interface UseConfettiReturn {
  /** Whether confetti is currently active */
  isActive: boolean;
  /** Trigger confetti animation */
  fire: (options?: Partial<ConfettiOptions>) => void;
  /** Stop confetti animation */
  stop: () => void;
  /** Current options being used */
  options: ConfettiOptions;
}

const DEFAULT_OPTIONS: Required<UseConfettiOptions> = {
  particleCount: 150,
  duration: 4000,
  colors: [
    '#FFD700', // Gold
    '#FF6B6B', // Coral Red
    '#4ECDC4', // Teal
    '#45B7D1', // Sky Blue
    '#96CEB4', // Sage Green
    '#FFEAA7', // Pale Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Lemon
    '#BB8FCE', // Lavender
  ],
  spread: 70,
  startY: 50,
  gravity: 1,
  autoStop: true,
};

/**
 * Hook to control confetti animation programmatically.
 *
 * @example
 * ```tsx
 * const { isActive, fire, stop, options } = useConfetti({
 *   particleCount: 200,
 *   duration: 5000,
 * });
 *
 * // In component
 * <button onClick={() => fire()}>Celebrate!</button>
 * <Confetti active={isActive} {...options} onComplete={stop} />
 * ```
 */
export function useConfetti(initialOptions: UseConfettiOptions = {}): UseConfettiReturn {
  const [isActive, setIsActive] = useState(false);
  const [options, setOptions] = useState<ConfettiOptions>(() => ({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  }));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialOptionsRef = useRef(initialOptions);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fire = useCallback(
    (fireOptions?: Partial<ConfettiOptions>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Merge options
      const mergedOptions: ConfettiOptions = {
        ...DEFAULT_OPTIONS,
        ...initialOptionsRef.current,
        ...fireOptions,
      };

      setOptions(mergedOptions);
      setIsActive(true);

      // Auto-stop after duration if enabled
      const autoStop = (initialOptionsRef.current.autoStop ?? DEFAULT_OPTIONS.autoStop) !== false;
      if (autoStop) {
        const duration = mergedOptions.duration ?? DEFAULT_OPTIONS.duration;
        timeoutRef.current = setTimeout(() => {
          setIsActive(false);
        }, duration);
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsActive(false);
  }, []);

  return {
    isActive,
    fire,
    stop,
    options,
  };
}
