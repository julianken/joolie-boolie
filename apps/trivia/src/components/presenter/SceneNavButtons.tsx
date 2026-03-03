'use client';

import { useGameStore } from '@/stores/game-store';
import { SCENE_TRIGGERS } from '@/lib/game/scene';

/**
 * SceneNavButtons
 *
 * Always-visible ← → buttons that mirror ArrowLeft / ArrowRight keyboard behavior.
 * Forward (→) dispatches ADVANCE trigger; back (←) dispatches BACK trigger.
 * The scene state machine in getNextScene() determines whether the trigger
 * produces a transition — the buttons are pure dispatchers.
 *
 * Forward is disabled during the reveal animation lock on answer_reveal.
 */
export function SceneNavButtons() {
  const revealPhase = useGameStore((state) => state.revealPhase);
  const audienceScene = useGameStore((state) => state.audienceScene);

  const forwardDisabled = revealPhase !== null && audienceScene === 'answer_reveal';

  const handleForward = () => {
    useGameStore.getState().advanceScene(SCENE_TRIGGERS.ADVANCE);
  };

  const handleBack = () => {
    useGameStore.getState().advanceScene(SCENE_TRIGGERS.BACK);
  };

  return (
    <nav aria-label="Scene navigation" className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        title="Back (Arrow Left)"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg px-3 py-2 bg-surface-elevated hover:bg-surface-hover text-foreground border border-border transition-colors focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleForward}
        disabled={forwardDisabled}
        aria-label="Forward"
        title="Forward (Arrow Right)"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg px-3 py-2 bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
