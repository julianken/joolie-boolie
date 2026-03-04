import { useRef } from 'react';
import { useIsPresent } from 'motion/react';

/**
 * Freezes a value during AnimatePresence exit animation.
 *
 * While the component is present (normal rendering), returns the live value.
 * During exit (isPresent === false), returns the last value from before exit.
 *
 * Use this in scene components to prevent Zustand subscriptions from updating
 * visible content during the SceneRouter's exit animation. Without this,
 * exiting components re-render with new store data (e.g. next question)
 * causing a visual flash before the fade-out completes.
 */
export function useFrozenOnExit<T>(value: T): T {
  const isPresent = useIsPresent();
  const ref = useRef(value);

  if (isPresent) {
    ref.current = value;
  }

  return ref.current;
}
