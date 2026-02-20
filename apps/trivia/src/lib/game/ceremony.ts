/**
 * Batch reveal ceremony state transitions.
 *
 * All functions are pure -- they take TriviaGameState and return a new
 * TriviaGameState (or partial updates). No store access, no side effects.
 *
 * The ceremony lifecycle:
 *   1. buildRevealCeremonyResults(state) -- builds the snapshot
 *   2. startRevealCeremony(state)        -- transitions to round_reveal_intro, sets index 0
 *   3. advanceCeremonyQuestion(state)    -- steps forward through the ceremony
 *   4. retreatCeremonyQuestion(state)    -- steps backward through the ceremony
 *   5. abortCeremony(state)              -- jumps to round_summary, clears state
 *
 * These functions are called by game-store.ts action implementations.
 * They delegate to scene.ts for scene validation but do NOT call getNextScene()
 * directly -- they implement the ceremony sub-graph as explicit state mutations.
 */

import type { TriviaGameState, RevealCeremonyResults, RevealCeremonyQuestion } from '@/types';
import { deepFreeze } from './helpers';
import { getQuestionsForRound } from './selectors';
import { buildSceneUpdate } from './scene';

// =============================================================================
// CEREMONY RESULTS BUILDER
// =============================================================================

/**
 * Builds the RevealCeremonyResults snapshot from the current round's teamAnswers.
 *
 * Call this BEFORE transitioning to round_reveal_intro (i.e., at the moment
 * the presenter presses C). This captures the scoring state at that instant.
 *
 * If the presenter corrects a score during the ceremony, call this again and
 * set the result back on state.revealCeremonyResults. The audience will
 * receive a STATE_UPDATE with the corrected data.
 *
 * Questions with no team answers (never shown/scored) are included with
 * teamsCorrect: 0, teamsTotal: 0.
 */
export function buildRevealCeremonyResults(
  state: TriviaGameState
): RevealCeremonyResults {
  const roundQuestions = getQuestionsForRound(state, state.currentRound);

  const questions: RevealCeremonyQuestion[] = roundQuestions.map((question) => {
    // Collect all team answers for this question
    const answersForQuestion = state.teamAnswers.filter(
      (ta) => ta.questionId === question.id
    );

    // Build per-team results map (teamId -> correct)
    const teamResults: Record<string, boolean> = {};
    for (const answer of answersForQuestion) {
      teamResults[answer.teamId as string] = answer.isCorrect;
    }

    const teamsTotal = answersForQuestion.length;
    const teamsCorrect = answersForQuestion.filter((ta) => ta.isCorrect).length;

    // Find the correct option index (0-based) from the question's correctAnswers
    // correctAnswers contains option labels (e.g., 'B'). options[] is ['A','B','C','D'].
    const correctOptionIndex = question.options.findIndex(
      (opt) => question.correctAnswers.includes(opt)
    );

    return {
      questionIndex: state.questions.indexOf(question),
      questionText: question.text,
      options: question.options,
      optionTexts: question.optionTexts,
      correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
      explanation: question.explanation ?? null,
      teamsCorrect,
      teamsTotal,
      teamResults,
    };
  });

  return { roundIndex: state.currentRound, questions };
}

// =============================================================================
// CEREMONY START
// =============================================================================

/**
 * Transitions the game into the reveal ceremony.
 *
 * Prerequisites (callers must enforce):
 *   - state.settings.revealMode === 'batch'
 *
 * Side effects encoded in returned state:
 *   - audienceScene -> 'round_reveal_intro'
 *   - revealCeremonyQuestionIndex -> 0
 *   - revealCeremonyResults -> built from current teamAnswers
 *   - revealCeremonyAnswerShown -> false
 *   - revealPhase -> null
 */
export function startRevealCeremony(state: TriviaGameState): TriviaGameState {
  if (state.settings.revealMode !== 'batch') return state;

  const results = buildRevealCeremonyResults(state);

  return deepFreeze({
    ...state,
    ...buildSceneUpdate('round_reveal_intro'),
    revealCeremonyQuestionIndex: 0,
    revealCeremonyResults: results,
    revealCeremonyAnswerShown: false,
    revealPhase: null,
  });
}

// =============================================================================
// CEREMONY ADVANCE
// =============================================================================

/**
 * Advances one step forward in the reveal ceremony.
 *
 * Transition table:
 *   round_reveal_intro  -> round_reveal_question (Q0, not shown)
 *   round_reveal_question -> round_reveal_answer (same Q, start animation)
 *   round_reveal_answer -> round_reveal_question (next Q) if more questions remain
 *   round_reveal_answer -> round_summary if last question
 *
 * Returns state unchanged if not in a valid ceremony scene.
 *
 * NOTE: Callers are responsible for enforcing the 1.1s POST_REVEAL_LOCK_MS
 * before allowing advance from round_reveal_answer. This function does not
 * time-guard -- it transitions immediately when called.
 */
export function advanceCeremonyQuestion(state: TriviaGameState): TriviaGameState {
  const {
    audienceScene,
    revealCeremonyQuestionIndex,
    revealCeremonyResults,
  } = state;

  if (!revealCeremonyResults || revealCeremonyQuestionIndex === null) {
    return state; // Not in a ceremony
  }

  const totalQuestions = revealCeremonyResults.questions.length;

  switch (audienceScene) {
    case 'round_reveal_intro':
      // Intro -> first question (show phase)
      return deepFreeze({
        ...state,
        ...buildSceneUpdate('round_reveal_question'),
        revealCeremonyQuestionIndex: 0,
        revealCeremonyAnswerShown: false,
        revealPhase: null,
      });

    case 'round_reveal_question':
      // Question shown -> reveal answer (start animation)
      return deepFreeze({
        ...state,
        ...buildSceneUpdate('round_reveal_answer'),
        revealCeremonyAnswerShown: true,
        revealPhase: 'freeze', // Animation begins
      });

    case 'round_reveal_answer': {
      const isLastCeremonyQuestion =
        revealCeremonyQuestionIndex >= totalQuestions - 1;

      if (isLastCeremonyQuestion) {
        // Last question revealed -> transition to round_summary, clear ceremony
        return deepFreeze({
          ...state,
          ...buildSceneUpdate('round_summary'),
          revealCeremonyQuestionIndex: null,
          revealCeremonyResults: null,
          revealCeremonyAnswerShown: false,
          revealPhase: null,
        });
      } else {
        // More questions -> next question (show phase)
        return deepFreeze({
          ...state,
          ...buildSceneUpdate('round_reveal_question'),
          revealCeremonyQuestionIndex: revealCeremonyQuestionIndex + 1,
          revealCeremonyAnswerShown: false,
          revealPhase: null,
        });
      }
    }

    default:
      return state; // Not a ceremony scene
  }
}

// =============================================================================
// CEREMONY RETREAT
// =============================================================================

/**
 * Steps backward one position in the reveal ceremony.
 *
 * Transition table:
 *   round_reveal_question (Q0) -> round_reveal_intro
 *   round_reveal_question (Qn) -> round_reveal_answer (Qn-1, settled state)
 *   round_reveal_answer         -> round_reveal_question (same Q, answer hidden)
 *
 * "Settled state" means the answer is shown without re-animating -- the audience
 * display reads revealCeremonyAnswerShown to know whether to render the revealed
 * or neutral state. No chime replay.
 *
 * Returns state unchanged if retreating from the intro (already at start).
 */
export function retreatCeremonyQuestion(state: TriviaGameState): TriviaGameState {
  const {
    audienceScene,
    revealCeremonyQuestionIndex,
  } = state;

  if (revealCeremonyQuestionIndex === null) return state;

  switch (audienceScene) {
    case 'round_reveal_question':
      if (revealCeremonyQuestionIndex === 0) {
        // First question -> back to the "ANSWERS" intro card
        return deepFreeze({
          ...state,
          ...buildSceneUpdate('round_reveal_intro'),
          revealCeremonyAnswerShown: false,
          revealPhase: null,
        });
      } else {
        // Not first question -> go to previous question's revealed state (settled)
        return deepFreeze({
          ...state,
          ...buildSceneUpdate('round_reveal_answer'),
          revealCeremonyQuestionIndex: revealCeremonyQuestionIndex - 1,
          revealCeremonyAnswerShown: true,
          revealPhase: 'breathing', // Settled state -- skip to final beat
        });
      }

    case 'round_reveal_answer':
      // Back to the current question's "show" state (answer hidden again)
      return deepFreeze({
        ...state,
        ...buildSceneUpdate('round_reveal_question'),
        revealCeremonyAnswerShown: false,
        revealPhase: null,
      });

    case 'round_reveal_intro':
      // Already at the start -- retreat does nothing
      return state;

    default:
      return state;
  }
}

// =============================================================================
// CEREMONY ABORT
// =============================================================================

/**
 * Aborts the reveal ceremony and jumps directly to round_summary.
 *
 * All remaining unrevealed questions are skipped. Scores are preserved
 * (they were recorded during the round). The audience sees the full
 * round scoreboard immediately.
 *
 * Use case: ceremony is taking too long, or presenter activated batch mode
 * accidentally and wants to move on.
 *
 * Returns state unchanged if not in a ceremony scene.
 */
export function abortCeremony(state: TriviaGameState): TriviaGameState {
  const { audienceScene } = state;

  const inCeremony =
    audienceScene === 'round_reveal_intro' ||
    audienceScene === 'round_reveal_question' ||
    audienceScene === 'round_reveal_answer';

  if (!inCeremony) return state;

  return deepFreeze({
    ...state,
    ...buildSceneUpdate('round_summary'),
    revealCeremonyQuestionIndex: null,
    revealCeremonyResults: null,
    revealCeremonyAnswerShown: false,
    revealPhase: null,
  });
}

// =============================================================================
// CEREMONY GUARDS
// =============================================================================

/**
 * Returns true if the game is currently in an active reveal ceremony.
 */
export function isCeremonyActive(state: TriviaGameState): boolean {
  return (
    state.revealCeremonyResults !== null &&
    state.revealCeremonyQuestionIndex !== null
  );
}

/**
 * Returns true if the current ceremony position is the last question.
 * Used by keyboard handlers to determine the behavior of Right Arrow.
 */
export function isLastCeremonyQuestion(state: TriviaGameState): boolean {
  if (!state.revealCeremonyResults || state.revealCeremonyQuestionIndex === null) {
    return false;
  }
  return (
    state.revealCeremonyQuestionIndex >=
    state.revealCeremonyResults.questions.length - 1
  );
}

/**
 * Returns the current ceremony question data, or null if not in ceremony.
 */
export function getCurrentCeremonyQuestion(
  state: TriviaGameState
): RevealCeremonyQuestion | null {
  if (!state.revealCeremonyResults || state.revealCeremonyQuestionIndex === null) {
    return null;
  }
  return (
    state.revealCeremonyResults.questions[state.revealCeremonyQuestionIndex] ?? null
  );
}
