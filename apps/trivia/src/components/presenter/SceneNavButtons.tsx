'use client';

import { useGameStore } from '@/stores/game-store';
import { SCENE_NAV_CONFIG } from '@/lib/presenter/scene-nav-config';

/**
 * SceneNavButtons (WU-03)
 *
 * Zero-prop, store-connected navigation button component.
 * Reads audienceScene and revealPhase from the game store, then renders
 * forward/back buttons based on SCENE_NAV_CONFIG.
 *
 * Forward button is disabled during the reveal animation lock on answer_reveal.
 * Returns null when both forward and back actions are 'none' (e.g. question_display,
 * final_podium, paused, emergency_blank).
 */
export function SceneNavButtons() {
  const audienceScene = useGameStore((state) => state.audienceScene);
  const revealPhase = useGameStore((state) => state.revealPhase);

  const config = SCENE_NAV_CONFIG[audienceScene];
  const isRevealLocked = revealPhase !== null;

  const handleForward = () => {
    const { forward } = config;
    if (forward.kind === 'none') return;
    if (forward.kind === 'startGame') {
      useGameStore.getState().startGame();
      return;
    }
    if (forward.kind === 'advanceScene') {
      useGameStore.getState().advanceScene(forward.trigger);
    }
  };

  const handleBack = () => {
    const { back } = config;
    if (back.kind === 'none') return;
    if (back.kind === 'advanceScene') {
      useGameStore.getState().advanceScene(back.trigger);
    }
  };

  const showForward = config.forward.kind !== 'none';
  const showBack = config.back.kind !== 'none';
  const forwardDisabled = isRevealLocked && audienceScene === 'answer_reveal';

  if (!showForward && !showBack) return null;

  return (
    <nav aria-label="Scene navigation" className="flex items-center gap-2">
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          aria-label={config.backLabel}
          title={`${config.backLabel} (Arrow Left)`}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-surface-elevated hover:bg-surface-hover text-foreground border border-border transition-colors focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{config.backLabel}</span>
        </button>
      )}
      {showForward && (
        <button
          type="button"
          onClick={handleForward}
          disabled={forwardDisabled}
          aria-label={config.forwardLabel}
          title={`${config.forwardLabel} (Arrow Right)`}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2"
        >
          <span>{config.forwardLabel}</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </nav>
  );
}
