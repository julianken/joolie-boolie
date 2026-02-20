/**
 * Audience Scene Layer
 *
 * The AudienceScene type controls what the audience display renders.
 * It is orthogonal to GameStatus -- the 5-state engine is completely
 * unchanged. This layer sits on top as a pure visual routing layer.
 *
 * Design principle P5: "The AudienceScene layer is orthogonal to GameStatus."
 *
 * Authority: FINAL_SPEC.md + phase-5/01-types-scene-engine.md
 */

// =============================================================================
// AUDIENCE SCENE
// =============================================================================

/**
 * All 19 audience scene values.
 *
 * Grouped by mode applicability:
 *   - Shared (12): appear in both instant and batch modes
 *   - Instant only (2): answer_reveal, score_flash
 *   - Batch only (5): scoring_pause, question_transition, round_reveal_intro,
 *                     round_reveal_question, round_reveal_answer
 *
 * Scene validity by GameStatus:
 *   setup          -> waiting
 *   playing        -> game_intro, round_intro, question_anticipation,
 *                    question_reading, question_active, question_closed,
 *                    answer_reveal (instant), score_flash (instant),
 *                    scoring_pause (batch), question_transition (batch),
 *                    round_reveal_intro (batch), round_reveal_question (batch),
 *                    round_reveal_answer (batch),
 *                    waiting, paused, emergency_blank
 *   between_rounds -> round_summary, paused, emergency_blank
 *   paused         -> paused, emergency_blank
 *   ended          -> final_buildup, final_podium, paused, emergency_blank
 */
export type AudienceScene =
  // -- Shared scenes (both modes) --
  /** Pre-game: breathing wordmark + room code + team roster grid. */
  | 'waiting'
  /** Game starting: "GET READY" scales in. 6s auto-advance. Skippable. */
  | 'game_intro'
  /** "ROUND N" + category + question count + standings (round 2+). 4s auto. */
  | 'round_intro'
  /** "QUESTION N" + category badge. 1.5s auto-advance. Skippable with D/Enter. */
  | 'question_anticipation'
  /** Question text + answer options. Timer NOT started. Indefinite. */
  | 'question_reading'
  /** Question text + answer options. Circular timer running in bottom-right. */
  | 'question_active'
  /** "TIME'S UP!" badge replaces timer. Question/options remain visible. Indefinite. */
  | 'question_closed'
  /** Full scoreboard + round winner callout + score deltas. Indefinite. */
  | 'round_summary'
  /** "GAME OVER" scales in dramatically. 3s auto-advance. */
  | 'final_buildup'
  /** Staged 3rd -> 2nd -> 1st podium reveal. ~8s animation, then indefinite. */
  | 'final_podium'
  /** "Game Paused" overlay. Timer stopped. Restores to sceneBeforePause on resume. */
  | 'paused'
  /** Fully blank screen for emergency use. Restores to sceneBeforePause on restore. */
  | 'emergency_blank'

  // -- Instant mode only --
  /**
   * Per-question answer reveal with 5-beat choreography.
   * 4s auto-advance to score_flash (skippable).
   * INSTANT MODE ONLY -- never appears when revealMode === 'batch'.
   */
  | 'answer_reveal'
  /**
   * Compact scoreboard with score deltas ("+N this question").
   * 5s auto-advance to next question (skippable).
   * INSTANT MODE ONLY -- never appears when revealMode === 'batch'.
   */
  | 'score_flash'

  // -- Batch mode only --
  /**
   * Presenter is scoring privately. Audience sees QuestionTransitionCard.
   * Indefinite -- advances via Right Arrow (next Q) or C key (last Q -> ceremony).
   * BATCH MODE ONLY -- never appears when revealMode === 'instant'.
   */
  | 'scoring_pause'
  /**
   * Progress ring "X / Y" + category name between questions.
   * 1.5s auto-advance to question_anticipation (skippable with Enter).
   * BATCH MODE ONLY -- never appears when revealMode === 'instant'.
   */
  | 'question_transition'
  /**
   * "ANSWERS" title card opening the round-end reveal ceremony.
   * 2.5s auto-advance to round_reveal_question (skippable with Enter).
   * BATCH MODE ONLY -- never appears when revealMode === 'instant'.
   */
  | 'round_reveal_intro'
  /**
   * Re-shown question with options at neutral (full) opacity.
   * Indefinite -- presenter-paced. Advances with Enter / Right Arrow.
   * BATCH MODE ONLY -- never appears when revealMode === 'instant'.
   */
  | 'round_reveal_question'
  /**
   * Answer revealed on re-shown question: wrong options dimmed, correct glows.
   * 1.1s animation lock, then indefinite (presenter advances with Right Arrow).
   * BATCH MODE ONLY -- never appears when revealMode === 'instant'.
   */
  | 'round_reveal_answer';

// =============================================================================
// REVEAL PHASE
// =============================================================================

/**
 * Sub-state controlling the 5-beat reveal choreography.
 *
 * Applies during:
 *   - instant mode: answer_reveal scene
 *   - batch mode: round_reveal_answer scene
 *
 * SYNCED via TriviaGameState (not presenter-local). The audience display uses
 * this field in settled-state rendering for reconnect scenarios -- it does not
 * drive CSS animations (those play from mount). null means no reveal active.
 *
 * Timing reference (REVEAL_TIMING constants below):
 *   freeze       -> 0ms-300ms    : tension pause, vignette fades in
 *   dim_wrong    -> 300ms-600ms  : incorrect options dim to 32% opacity
 *   illuminate   -> 600ms-800ms  : correct option glows green, scale 1.06x
 *   score_update -> 800ms-1200ms : score deltas (instant) or team count (batch)
 *   breathing    -> 1200ms+      : hold; presenter controls advance
 */
export type RevealPhase =
  | 'freeze'        // Beat 1: tension pause
  | 'dim_wrong'     // Beat 2: incorrect options dim
  | 'illuminate'    // Beat 3: correct answer glows + sound
  | 'score_update'  // Beat 4: score deltas (instant) / team count (batch)
  | 'breathing'     // Beat 5: hold for audience reaction
  | null;           // No reveal in progress

// =============================================================================
// REVEAL MODE
// =============================================================================

/**
 * How answers are revealed to the audience.
 * Stored in GameSettings (persisted user preference), not on TriviaGameState.
 *
 * - 'batch':   Default. Pub quiz style. Answers revealed in round-end ceremony.
 * - 'instant': After each question. Educational settings and small groups.
 *
 * UI labels (never use the code values in UI copy):
 *   'instant' -> "After each question"
 *   'batch'   -> "At end of round"
 */
export type RevealMode = 'instant' | 'batch';

// =============================================================================
// SCORE DELTA
// =============================================================================

/**
 * Score change for a single team at a scene transition.
 *
 * In instant mode: delta = points earned on the just-closed question.
 * In batch mode:   delta = total points earned for the entire round.
 * Both modes use this same type; the caller computes the appropriate delta.
 */
export interface ScoreDelta {
  /** Branded TeamId. */
  teamId: string;
  /** Team display name (snapshot at delta creation time). */
  teamName: string;
  /** Points earned (positive) or lost (negative). */
  delta: number;
  /** Absolute score after this delta. */
  newScore: number;
  /** Rank after this delta (1 = first). */
  newRank: number;
  /** Rank before this delta. */
  previousRank: number;
}

// =============================================================================
// REVEAL CEREMONY TYPES
// =============================================================================

/**
 * Per-question data for the batch reveal ceremony.
 *
 * Built once at ceremony start from the round's teamAnswers. Immutable
 * during the ceremony unless the presenter corrects a score, which
 * triggers a rebuild and re-sync.
 */
export interface RevealCeremonyQuestion {
  /** Global index in state.questions array. */
  questionIndex: number;
  /** Question text (for audience display). */
  questionText: string;
  /** Answer option labels (e.g., ['A', 'B', 'C', 'D']). */
  options: string[];
  /** Human-readable option text matching each option label. */
  optionTexts: string[];
  /** 0-based index into options[] of the correct answer. */
  correctOptionIndex: number;
  /** Optional explanation text shown after reveal. null if no explanation. */
  explanation: string | null;
  /** Number of teams that answered correctly. */
  teamsCorrect: number;
  /** Total number of teams scored for this question. */
  teamsTotal: number;
  /**
   * Per-team correct/incorrect result.
   * Key: teamId (string). Value: true = correct, false = incorrect.
   * Used for presenter-side score correction UI during ceremony.
   * NOT shown on audience display (audience only sees teamsCorrect/teamsTotal).
   */
  teamResults: Record<string, boolean>;
}

/**
 * Snapshot of all questions for the current round's reveal ceremony.
 *
 * Ordered by question appearance in the round (ascending questionIndex).
 * Built by buildRevealCeremonyResults() at ceremony start.
 * Synced via BroadcastChannel as part of STATE_UPDATE (~5KB for 10Q x 20 teams).
 * Cleared when ceremony ends (transition to round_summary).
 */
export interface RevealCeremonyResults {
  /** Round index (0-based) this ceremony covers. */
  roundIndex: number;
  /** Questions in this round, ordered as they appeared. */
  questions: RevealCeremonyQuestion[];
}

// =============================================================================
// TIMING CONSTANTS
// =============================================================================

/**
 * Auto-advance durations for timed scenes (milliseconds).
 *
 * All timed scenes are skippable by the presenter. These are the
 * auto-advance durations when the presenter does not skip.
 */
export const SCENE_TIMING = {
  /** game_intro: "GET READY" -- 6 seconds */
  GAME_INTRO_MS: 6000,
  /** round_intro: "ROUND N" card -- 4 seconds (5 for final round) */
  ROUND_INTRO_MS: 4000,
  /** round_intro (final round variant): 5 seconds */
  ROUND_INTRO_FINAL_MS: 5000,
  /** question_anticipation: "QUESTION N" badge -- 1.5 seconds */
  QUESTION_ANTICIPATION_MS: 1500,
  /** answer_reveal (instant mode): auto-advance to score_flash -- 4 seconds */
  ANSWER_REVEAL_MS: 4000,
  /** score_flash (instant mode): auto-advance to next question -- 5 seconds */
  SCORE_FLASH_MS: 5000,
  /** final_buildup: "GAME OVER" -- 3 seconds */
  FINAL_BUILDUP_MS: 3000,
} as const;

/**
 * Reveal choreography timing (milliseconds from scene mount).
 *
 * Applies to both instant mode (answer_reveal) and batch mode (round_reveal_answer).
 * The audience CSS animation uses these as keyframe offsets.
 * The presenter's RevealPhase state advances at these intervals.
 */
export const REVEAL_TIMING = {
  /** Beat 1 starts: 0ms. Ends at DIM_WRONG_START_MS. */
  FREEZE_START_MS: 0,
  /** Beat 2 starts: incorrect options begin dimming. */
  DIM_WRONG_START_MS: 300,
  /** Beat 3 starts: correct option begins glowing. Sound fires here. */
  ILLUMINATE_START_MS: 600,
  /** Beat 4 starts: score deltas (instant) or team count (batch) visible. */
  SCORE_UPDATE_START_MS: 800,
  /**
   * Lock expires: presenter can advance after this point.
   * Queued keypresses fire at this boundary.
   */
  POST_REVEAL_LOCK_MS: 1100,
  /** Team count line fades in (batch ceremony only). */
  TEAM_COUNT_FADE_IN_MS: 1200,
  /** Beat 5 starts: breathing phase. Presenter holds as long as needed. */
  BREATHING_START_MS: 1200,
} as const;

/**
 * Batch reveal ceremony timing (milliseconds).
 */
export const BATCH_REVEAL_TIMING = {
  /** round_reveal_intro: "ANSWERS" card auto-advance. */
  ROUND_REVEAL_INTRO_MS: 2500,
  /** question_transition: progress ring auto-advance between questions. */
  QUESTION_TRANSITION_MS: 1500,
  /**
   * Minimum lock time within round_reveal_answer before presenter can advance.
   * Equals POST_REVEAL_LOCK_MS. Defined here for ceremony module import clarity.
   */
  REVEAL_QUESTION_LOCK_MS: 1100,
} as const;

// =============================================================================
// SCENE METADATA
// =============================================================================

/**
 * Set of scenes that auto-advance after a fixed duration.
 * The auto-advance hook consults this to know when to set a timer.
 * All timed scenes are skippable -- the timer is cancelled on skip.
 */
export const TIMED_SCENES = new Set<AudienceScene>([
  'game_intro',
  'round_intro',
  'question_anticipation',
  'answer_reveal',
  'score_flash',
  'final_buildup',
  'round_reveal_intro',
  'question_transition',
]);

/**
 * Set of scenes that only appear in batch mode (revealMode === 'batch').
 * The scene router rejects these if revealMode is 'instant'.
 */
export const BATCH_ONLY_SCENES = new Set<AudienceScene>([
  'scoring_pause',
  'question_transition',
  'round_reveal_intro',
  'round_reveal_question',
  'round_reveal_answer',
]);

/**
 * Set of scenes that only appear in instant mode (revealMode === 'instant').
 * The scene router rejects these if revealMode is 'batch'.
 */
export const INSTANT_ONLY_SCENES = new Set<AudienceScene>([
  'answer_reveal',
  'score_flash',
]);

/**
 * Valid audience scenes per GameStatus.
 * Used by deriveSceneFromStatus() to validate and reset invalid scenes.
 */
export const VALID_SCENES_BY_STATUS: Record<string, ReadonlySet<AudienceScene>> = {
  setup: new Set<AudienceScene>(['waiting']),
  playing: new Set<AudienceScene>([
    'game_intro', 'round_intro', 'question_anticipation',
    'question_reading', 'question_active', 'question_closed',
    'answer_reveal', 'score_flash',
    'scoring_pause', 'question_transition',
    'round_reveal_intro', 'round_reveal_question', 'round_reveal_answer',
    'waiting', 'paused', 'emergency_blank',
  ]),
  between_rounds: new Set<AudienceScene>([
    'round_summary', 'paused', 'emergency_blank',
  ]),
  paused: new Set<AudienceScene>(['paused', 'emergency_blank']),
  ended: new Set<AudienceScene>([
    'final_buildup', 'final_podium', 'paused', 'emergency_blank',
  ]),
};
