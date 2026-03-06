import type { TriviaGameState, Question } from '@/types';
import { deepFreeze } from './helpers';
import { normalizeCategoryId } from '@/lib/categories';

// =============================================================================
// QUESTION NAVIGATION
// =============================================================================

export function selectQuestion(
  state: TriviaGameState,
  index: number
): TriviaGameState {
  if (index < 0 || index >= state.questions.length) return state;

  return deepFreeze({
    ...state,
    selectedQuestionIndex: index,
  });
}

export function setDisplayQuestion(
  state: TriviaGameState,
  index: number | null
): TriviaGameState {
  if (index !== null && (index < 0 || index >= state.questions.length)) {
    return state;
  }

  return deepFreeze({
    ...state,
    displayQuestionIndex: index,
  });
}

// =============================================================================
// QUESTION IMPORT / EXPORT
// =============================================================================

/**
 * Import questions into the game state.
 * Can either replace existing questions or append to them.
 * Only allowed during setup phase.
 */
export function importQuestions(
  state: TriviaGameState,
  questions: Question[],
  mode: 'replace' | 'append' = 'replace'
): TriviaGameState {
  // Only allow import during setup
  if (state.status !== 'setup') return state;

  if (questions.length === 0) return state;

  let newQuestions: Question[];

  if (mode === 'replace') {
    newQuestions = questions;
  } else {
    // Append mode: add new questions after existing ones
    newQuestions = [...state.questions, ...questions];
  }

  // Calculate total rounds based on question roundIndex values
  const maxRoundIndex = Math.max(...newQuestions.map(q => q.roundIndex));
  const totalRounds = maxRoundIndex + 1;

  return deepFreeze({
    ...state,
    questions: newQuestions,
    totalRounds,
    selectedQuestionIndex: 0,
    displayQuestionIndex: null,
    settings: {
      ...state.settings,
      roundsCount: totalRounds,
    },
  });
}

/**
 * Export questions from the game state.
 * Returns a copy of the questions array.
 */
export function exportQuestionsFromState(state: TriviaGameState): Question[] {
  return [...state.questions];
}

/**
 * Clear all questions from the game state.
 * Only allowed during setup phase.
 */
export function clearQuestions(state: TriviaGameState): TriviaGameState {
  if (state.status !== 'setup') return state;

  return deepFreeze({
    ...state,
    questions: [],
    selectedQuestionIndex: 0,
    displayQuestionIndex: null,
  });
}

/**
 * Reassign each question's `roundIndex` field based on the chosen mode.
 *
 * Only runs during setup and when questions exist. Returns the same state
 * reference when the resulting assignments are already correct (idempotent),
 * so Zustand skips unnecessary re-renders.
 *
 * Modes:
 *   - 'by_count'    : Fill each round sequentially, `questionsPerRound` per round.
 *   - 'by_category' : Walk questions in order; each unique (normalized) category
 *                     gets its own round index, assigned on first occurrence.
 *
 * Hard constraint: MUST NOT write settings.roundsCount, totalRounds, or
 * selectedQuestionIndex.
 */
export function redistributeQuestions(
  state: TriviaGameState,
  roundsCount: number,
  questionsPerRound: number,
  mode: 'by_count' | 'by_category'
): TriviaGameState {
  // Guard: only during setup
  if (state.status !== 'setup') return state;
  // Guard: nothing to do when question list is empty
  if (state.questions.length === 0) return state;

  // Compute target roundIndex for every question
  let targetAssignments: number[];

  if (mode === 'by_count') {
    targetAssignments = state.questions.map((_, i) =>
      Math.floor(i / questionsPerRound)
    );
  } else {
    // by_category: first-occurrence ordering
    const categoryToRound = new Map<string, number>();
    targetAssignments = state.questions.map((q) => {
      const key = normalizeCategoryId(q.category);
      if (!categoryToRound.has(key)) {
        categoryToRound.set(key, categoryToRound.size);
      }
      return categoryToRound.get(key)!;
    });
  }

  // Idempotency: return the same reference when nothing would change
  if (state.questions.every((q, i) => q.roundIndex === targetAssignments[i])) {
    return state;
  }

  return deepFreeze({
    ...state,
    questions: state.questions.map((q, i) =>
      q.roundIndex === targetAssignments[i]
        ? q
        : { ...q, roundIndex: targetAssignments[i] }
    ),
  });
}

/**
 * Add a single question to the game state.
 * Only allowed during setup phase.
 */
export function addQuestion(
  state: TriviaGameState,
  question: Question
): TriviaGameState {
  if (state.status !== 'setup') return state;

  const newQuestions = [...state.questions, question];

  return deepFreeze({
    ...state,
    questions: newQuestions,
  });
}

/**
 * Remove a question from the game state by index.
 * Only allowed during setup phase.
 */
export function removeQuestion(
  state: TriviaGameState,
  index: number
): TriviaGameState {
  if (state.status !== 'setup') return state;
  if (index < 0 || index >= state.questions.length) return state;

  const newQuestions = state.questions.filter((_, i) => i !== index);

  // Adjust selected index if needed
  let selectedQuestionIndex = state.selectedQuestionIndex;
  if (selectedQuestionIndex >= newQuestions.length) {
    selectedQuestionIndex = Math.max(0, newQuestions.length - 1);
  }

  return deepFreeze({
    ...state,
    questions: newQuestions,
    selectedQuestionIndex,
    displayQuestionIndex: null,
  });
}

/**
 * Update a question at a specific index.
 * Only allowed during setup phase.
 */
export function updateQuestion(
  state: TriviaGameState,
  index: number,
  question: Question
): TriviaGameState {
  if (state.status !== 'setup') return state;
  if (index < 0 || index >= state.questions.length) return state;

  const newQuestions = state.questions.map((q, i) =>
    i === index ? question : q
  );

  return deepFreeze({
    ...state,
    questions: newQuestions,
  });
}
