/**
 * Scene transition logic for the audience display layer.
 *
 * All functions are pure -- no store access, no side effects.
 * The store actions in game-store.ts call these to compute next state.
 *
 * Design principle P5: "The AudienceScene layer is orthogonal to GameStatus."
 * The 5-state engine is untouched. This module bridges GameStatus to AudienceScene.
 */

import type { TriviaGameState, GameStatus, AudienceScene, RevealMode } from '@/types';
import {
  SCENE_TIMING,
  BATCH_REVEAL_TIMING,
  TIMED_SCENES,
  BATCH_ONLY_SCENES,
  INSTANT_ONLY_SCENES,
  VALID_SCENES_BY_STATUS,
} from '@/types/audience-scene';

// =============================================================================
// DERIVE SCENE FROM STATUS
// =============================================================================

/**
 * Fallback mapper: given a GameStatus, return the canonical default AudienceScene.
 *
 * Called when:
 *  1. A GameStatus transition invalidates the current audienceScene.
 *  2. A session is loaded from DB (audienceScene is not serialized).
 *  3. A REQUEST_SYNC is received with an unknown scene.
 *
 * The revealMode parameter determines which default to use for 'playing':
 *  - 'batch' (default for new games): 'waiting' -- ceremony hasn't started
 *  - 'instant': 'waiting'
 *  Both modes default to 'waiting' in the playing status because the presenter
 *  explicitly drives scene transitions during play.
 *
 * Backward compat: if revealMode is undefined (old sessions), defaults to 'instant'.
 */
export function deriveSceneFromStatus(
  status: GameStatus,
  revealMode?: RevealMode
): AudienceScene {
  // Unused parameter retained for future per-status defaults by mode.
  void revealMode;

  switch (status) {
    case 'setup':
      return 'waiting';
    case 'playing':
      return 'waiting';
    case 'between_rounds':
      return 'round_summary';
    case 'paused':
      return 'paused';
    case 'ended':
      return 'final_buildup';
    default: {
      // Exhaustiveness guard -- TypeScript ensures all GameStatus values handled.
      const _exhaustive: never = status;
      void _exhaustive;
      return 'waiting';
    }
  }
}

// =============================================================================
// SCENE VALIDATION
// =============================================================================

/**
 * Returns true if the given scene is valid for the given GameStatus.
 * Used to detect stale scenes after status transitions.
 */
export function isSceneValidForStatus(
  scene: AudienceScene,
  status: GameStatus
): boolean {
  const validSet = VALID_SCENES_BY_STATUS[status];
  return validSet ? validSet.has(scene) : false;
}

/**
 * Returns true if the given scene is valid for the given revealMode.
 * Batch-only scenes are invalid in instant mode, and vice versa.
 */
export function isSceneValidForMode(
  scene: AudienceScene,
  revealMode: RevealMode
): boolean {
  if (revealMode === 'instant' && BATCH_ONLY_SCENES.has(scene)) return false;
  if (revealMode === 'batch' && INSTANT_ONLY_SCENES.has(scene)) return false;
  return true;
}

// =============================================================================
// SCENE TIMING
// =============================================================================

/**
 * Returns the auto-advance duration in milliseconds for a timed scene,
 * or null if the scene is not timed (indefinite).
 *
 * The `isFinalRound` parameter adjusts round_intro duration for the final round.
 */
export function getSceneDuration(
  scene: AudienceScene,
  isFinalRound = false
): number | null {
  switch (scene) {
    case 'game_intro':
      return SCENE_TIMING.GAME_INTRO_MS;
    case 'round_intro':
      return isFinalRound
        ? SCENE_TIMING.ROUND_INTRO_FINAL_MS
        : SCENE_TIMING.ROUND_INTRO_MS;
    case 'question_anticipation':
      return SCENE_TIMING.QUESTION_ANTICIPATION_MS;
    case 'answer_reveal':
      return SCENE_TIMING.ANSWER_REVEAL_MS;
    case 'score_flash':
      return SCENE_TIMING.SCORE_FLASH_MS;
    case 'final_buildup':
      return SCENE_TIMING.FINAL_BUILDUP_MS;
    case 'round_reveal_intro':
      return BATCH_REVEAL_TIMING.ROUND_REVEAL_INTRO_MS;
    case 'question_transition':
      return BATCH_REVEAL_TIMING.QUESTION_TRANSITION_MS;
    default:
      return null; // Indefinite scene
  }
}

/**
 * Returns true if the given scene has a fixed auto-advance duration.
 */
export function isSceneTimed(scene: AudienceScene): boolean {
  return TIMED_SCENES.has(scene);
}

/**
 * Returns true if the scene is batch-mode-only.
 */
export function isSceneBatchOnly(scene: AudienceScene): boolean {
  return BATCH_ONLY_SCENES.has(scene);
}

/**
 * Returns true if the scene is instant-mode-only.
 */
export function isSceneInstantOnly(scene: AudienceScene): boolean {
  return INSTANT_ONLY_SCENES.has(scene);
}

// =============================================================================
// SCENE STATE MACHINE
// =============================================================================

/**
 * Context bag for getNextScene(). Callers provide only the fields
 * relevant to the current transition.
 */
export interface SceneTransitionContext {
  /** Current reveal mode from state.settings.revealMode. */
  revealMode: RevealMode;
  /** True if this is the last question of the current round. */
  isLastQuestion?: boolean;
  /** True if this is the last round of the game. */
  isLastRound?: boolean;
  /** True if the ceremony is currently active (revealCeremonyResults !== null). */
  ceremonyActive?: boolean;
}

/**
 * Scene state machine: given the current scene and a transition trigger,
 * returns the next scene.
 *
 * This function encodes the complete scene transition graph from the design.
 * It is the single source of truth for "what scene comes after X when Y happens."
 *
 * The `trigger` parameter is a string key representing the presenter action
 * or system event that caused the transition. The action semantics:
 *
 *   'auto'       -- timed auto-advance fired (timer expired)
 *   'skip'       -- presenter skipped a timed scene (Enter/Space/D)
 *   'timer_start'-- presenter pressed T to start timer
 *   'close'      -- presenter pressed S to close question / enter scoring
 *   'reveal'     -- presenter pressed A to reveal answer (instant mode)
 *   'advance'    -- presenter pressed Right Arrow / Enter (ceremony/scoring)
 *   'retreat'    -- presenter pressed Left Arrow (ceremony)
 *   'complete'   -- presenter pressed C to complete round (last question)
 *   'next_round' -- presenter pressed N (from round_summary)
 *   'pause'      -- presenter pressed P
 *   'resume'     -- presenter pressed P to resume
 *   'emergency'  -- presenter pressed E
 *   'restore'    -- presenter pressed E to restore from emergency blank
 *   'start_game' -- presenter started the game
 *   'end_game'   -- game ended
 *   'display_question' -- presenter set a display question (D key)
 *
 * Returns null if no valid transition exists for the (scene, trigger) pair.
 * The store action should treat null as a no-op.
 */
export function getNextScene(
  current: AudienceScene,
  trigger: string,
  context: SceneTransitionContext
): AudienceScene | null {
  const { revealMode, isLastQuestion = false, isLastRound = false } = context;

  switch (current) {
    // -- Pre-game -----------------------------------------------------------
    case 'waiting':
      if (trigger === 'start_game') return 'game_intro';
      if (trigger === 'display_question') return 'question_anticipation';
      return null;

    // -- Game start ---------------------------------------------------------
    case 'game_intro':
      if (trigger === 'auto' || trigger === 'skip') return 'round_intro';
      return null;

    // -- Round start --------------------------------------------------------
    case 'round_intro':
      if (trigger === 'auto' || trigger === 'skip') return 'question_anticipation';
      return null;

    // -- Question lifecycle -------------------------------------------------
    case 'question_anticipation':
      if (trigger === 'auto' || trigger === 'skip') return 'question_reading';
      return null;

    case 'question_reading':
      if (trigger === 'timer_start') return 'question_active';
      if (trigger === 'close') {
        // S key skips timer entirely -- goes straight to scoring
        return revealMode === 'batch' ? 'scoring_pause' : 'answer_reveal';
      }
      if (trigger === 'reveal' && revealMode === 'instant') return 'answer_reveal';
      return null;

    case 'question_active':
      if (trigger === 'auto' || trigger === 'close') return 'question_closed';
      // S key during active timer ends timer early -- same as timer expiry
      return null;

    case 'question_closed':
      if (trigger === 'close') {
        // S key: enter scoring phase
        return revealMode === 'batch' ? 'scoring_pause' : 'answer_reveal';
      }
      if (trigger === 'reveal' && revealMode === 'instant') return 'answer_reveal';
      return null;

    // -- Instant mode reveal ------------------------------------------------
    case 'answer_reveal':
      if (revealMode !== 'instant') return null; // Safety -- should never be in this scene
      if (trigger === 'auto' || trigger === 'advance') return 'score_flash';
      return null;

    case 'score_flash':
      if (revealMode !== 'instant') return null;
      if (trigger === 'auto' || trigger === 'advance') {
        if (isLastQuestion) {
          return isLastRound ? 'final_buildup' : 'round_summary';
        }
        return 'question_anticipation';
      }
      if (trigger === 'complete' && isLastQuestion) {
        return isLastRound ? 'final_buildup' : 'round_summary';
      }
      return null;

    // -- Batch mode: between-question ---------------------------------------
    case 'scoring_pause':
      if (revealMode !== 'batch') return null;
      if (trigger === 'advance' && !isLastQuestion) return 'question_transition';
      if (trigger === 'complete' && isLastQuestion) return 'round_reveal_intro';
      return null;

    case 'question_transition':
      if (revealMode !== 'batch') return null;
      if (trigger === 'auto' || trigger === 'skip') return 'question_anticipation';
      return null;

    // -- Batch ceremony -----------------------------------------------------
    case 'round_reveal_intro':
      if (revealMode !== 'batch') return null;
      if (trigger === 'auto' || trigger === 'skip' || trigger === 'advance') {
        return 'round_reveal_question';
      }
      return null;

    case 'round_reveal_question':
      if (revealMode !== 'batch') return null;
      if (trigger === 'advance') return 'round_reveal_answer';
      if (trigger === 'retreat') {
        // retreat to previous question's revealed state or intro
        // The ceremony functions handle index decrement -- scene.ts returns scene only
        return 'round_reveal_intro'; // Caller interprets: retreat from Q0 = intro
      }
      if (trigger === 'abort') return 'round_summary';
      return null;

    case 'round_reveal_answer':
      if (revealMode !== 'batch') return null;
      if (trigger === 'advance') {
        // More questions -> next question's show state; last question -> scoreboard
        // Context tells us if last question in ceremony -- caller uses isLastQuestion
        // relative to revealCeremonyResults.questions[]
        return isLastQuestion ? 'round_summary' : 'round_reveal_question';
      }
      if (trigger === 'retreat') return 'round_reveal_question';
      if (trigger === 'abort') return 'round_summary';
      return null;

    // -- Round summary ------------------------------------------------------
    case 'round_summary':
      if (trigger === 'next_round') {
        return isLastRound ? 'final_buildup' : 'round_intro';
      }
      return null;

    // -- Game end -----------------------------------------------------------
    case 'final_buildup':
      if (trigger === 'auto' || trigger === 'skip') return 'final_podium';
      return null;

    case 'final_podium':
      // Indefinite end state -- no auto-advance
      return null;

    // -- Pause / emergency --------------------------------------------------
    case 'paused':
      if (trigger === 'resume') {
        // Caller uses state.sceneBeforePause -- scene.ts returns a sentinel
        // The actual target is in sceneBeforePause; store action handles this
        return null; // Store action restores from sceneBeforePause directly
      }
      return null;

    case 'emergency_blank':
      if (trigger === 'restore') {
        // Same pattern as paused -- store action restores from sceneBeforePause
        return null;
      }
      return null;

    default: {
      const _exhaustive: never = current;
      void _exhaustive;
      return null;
    }
  }
}

// =============================================================================
// SCENE SETTER HELPER
// =============================================================================

/**
 * Returns a partial state update that correctly sets the audience scene
 * and records the timestamp. Used by store actions to build new state.
 *
 * Does NOT validate mode compatibility -- callers must ensure the scene
 * is valid for the current revealMode (use isSceneValidForMode()).
 */
export function buildSceneUpdate(scene: AudienceScene): {
  audienceScene: AudienceScene;
  sceneTimestamp: number;
} {
  return {
    audienceScene: scene,
    sceneTimestamp: Date.now(),
  };
}

/**
 * Returns a partial state update for entering pause or emergency_blank.
 * Saves the current scene to sceneBeforePause.
 */
export function buildPauseSceneUpdate(
  currentScene: AudienceScene,
  type: 'pause' | 'emergency'
): {
  audienceScene: AudienceScene;
  sceneBeforePause: AudienceScene;
  sceneTimestamp: number;
} {
  const targetScene: AudienceScene = type === 'emergency' ? 'emergency_blank' : 'paused';
  return {
    audienceScene: targetScene,
    sceneBeforePause: currentScene,
    sceneTimestamp: Date.now(),
  };
}

/**
 * Returns a partial state update for resuming from pause or emergency_blank.
 * Restores the scene from sceneBeforePause.
 * Falls back to deriveSceneFromStatus() if sceneBeforePause is null.
 */
export function buildResumeSceneUpdate(
  state: Pick<TriviaGameState, 'sceneBeforePause' | 'status' | 'settings'>
): {
  audienceScene: AudienceScene;
  sceneBeforePause: null;
  sceneTimestamp: number;
} {
  const scene = state.sceneBeforePause
    ?? deriveSceneFromStatus(state.status, state.settings.revealMode);
  return {
    audienceScene: scene,
    sceneBeforePause: null,
    sceneTimestamp: Date.now(),
  };
}
