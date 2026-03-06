import { describe, it, expect, vi } from 'vitest';
import type { TriviaGameState, Question, QuestionId } from '@/types';
import { redistributeQuestions, addQuestion, updateQuestion } from '../questions';

// =============================================================================
// MOCK normalizeCategoryId — return input as-is for deterministic testing
// =============================================================================

vi.mock('@/lib/categories', () => ({
  normalizeCategoryId: vi.fn((id: string) => id),
}));

// =============================================================================
// HELPERS
// =============================================================================

function makeQuestion(id: string, category: Question['category'], roundIndex: number = 0): Question {
  return {
    id: id as QuestionId,
    text: 'Sample question?',
    type: 'multiple_choice',
    options: ['A', 'B', 'C', 'D'],
    optionTexts: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswers: ['A'],
    explanation: undefined,
    category,
    roundIndex,
  };
}

function makeState(overrides?: Partial<TriviaGameState>): TriviaGameState {
  return {
    status: 'setup',
    questions: [],
    selectedQuestionIndex: 0,
    displayQuestionIndex: null,
    currentRound: 0,
    totalRounds: 3,
    teams: [],
    teamAnswers: [],
    timer: { duration: 30, remaining: 30, isRunning: false },
    settings: {
      roundsCount: 2,
      questionsPerRound: 5,
      timerDuration: 30,
      timerAutoStart: false,
      timerVisible: true,
      ttsEnabled: false,
    },
    showScoreboard: false,
    emergencyBlank: false,
    ttsEnabled: false,
    audienceScene: 'waiting',
    sceneBeforePause: null,
    sceneTimestamp: 0,
    scoreDeltas: [],
    revealPhase: null,
    recapShowingAnswer: null,
    questionStartScores: {},
    roundScoringInProgress: false,
    roundScoringEntries: {},
    ...overrides,
  } as TriviaGameState;
}

// =============================================================================
// redistributeQuestions — by_count
// =============================================================================

describe('redistributeQuestions — by_count', () => {
  it('10 questions with QPR=5 assigns roundIndex [0,0,0,0,0,1,1,1,1,1]', () => {
    const questions = Array.from({ length: 10 }, (_, i) =>
      makeQuestion(`q${i}`, 'general_knowledge', 0)
    );
    const state = makeState({ questions });
    const result = redistributeQuestions(state, 2, 5, 'by_count');

    expect(result.questions.map((q) => q.roundIndex)).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
  });

  it('3 questions with QPR=5 all land in round 0', () => {
    const questions = Array.from({ length: 3 }, (_, i) =>
      makeQuestion(`q${i}`, 'general_knowledge', 0)
    );
    const state = makeState({ questions });
    const result = redistributeQuestions(state, 2, 5, 'by_count');

    expect(result.questions.map((q) => q.roundIndex)).toEqual([0, 0, 0]);
  });
});

// =============================================================================
// redistributeQuestions — by_category
// =============================================================================

describe('redistributeQuestions — by_category', () => {
  it('[science, history, science, geography] → roundIndex [0,1,0,2]', () => {
    const questions = [
      makeQuestion('q0', 'science', 0),
      makeQuestion('q1', 'history', 0),
      makeQuestion('q2', 'science', 0),
      makeQuestion('q3', 'geography', 0),
    ];
    const state = makeState({ questions });
    const result = redistributeQuestions(state, 3, 5, 'by_category');

    expect(result.questions.map((q) => q.roundIndex)).toEqual([0, 1, 0, 2]);
  });
});

// =============================================================================
// Idempotency
// =============================================================================

describe('redistributeQuestions — idempotency', () => {
  it('by_count: returns the SAME state reference when assignments are already correct', () => {
    const questions = [
      makeQuestion('q0', 'general_knowledge', 0),
      makeQuestion('q1', 'general_knowledge', 0),
      makeQuestion('q2', 'general_knowledge', 1),
      makeQuestion('q3', 'general_knowledge', 1),
    ];
    const state = makeState({ questions });
    const result = redistributeQuestions(state, 2, 2, 'by_count');

    expect(result).toBe(state);
  });

  it('by_category: returns the SAME state reference when assignments are already correct', () => {
    const questions = [
      makeQuestion('q0', 'science', 0),
      makeQuestion('q1', 'history', 1),
      makeQuestion('q2', 'science', 0),
    ];
    const state = makeState({ questions });
    const result = redistributeQuestions(state, 2, 5, 'by_category');

    expect(result).toBe(state);
  });
});

// =============================================================================
// Guards
// =============================================================================

describe('redistributeQuestions — status guard', () => {
  it('returns the same state reference when status is "playing"', () => {
    const questions = Array.from({ length: 5 }, (_, i) =>
      makeQuestion(`q${i}`, 'science', 0)
    );
    const state = makeState({ status: 'playing', questions });
    const result = redistributeQuestions(state, 2, 5, 'by_count');

    expect(result).toBe(state);
  });
});

describe('redistributeQuestions — empty guard', () => {
  it('returns the same state reference when questions array is empty', () => {
    const state = makeState({ questions: [] });
    const result = redistributeQuestions(state, 2, 5, 'by_count');

    expect(result).toBe(state);
  });
});

// =============================================================================
// settings.roundsCount must not be mutated
// =============================================================================

describe('redistributeQuestions — settings immutability', () => {
  it('returned state has the same settings.roundsCount as input (not modified)', () => {
    const questions = Array.from({ length: 10 }, (_, i) =>
      makeQuestion(`q${i}`, 'general_knowledge', 0)
    );
    const state = makeState({
      questions,
      settings: {
        roundsCount: 2,
        questionsPerRound: 5,
        timerDuration: 30,
        timerAutoStart: false,
        timerVisible: true,
        ttsEnabled: false,
      },
    });
    const result = redistributeQuestions(state, 3, 5, 'by_count');

    // Function must NOT write to settings.roundsCount
    expect(result.settings.roundsCount).toBe(2);
  });
});

// =============================================================================
// addQuestion — no longer writes settings.roundsCount
// =============================================================================

describe('addQuestion — settings.roundsCount not written', () => {
  it('result settings.roundsCount is unchanged even when question has a high roundIndex', () => {
    const state = makeState({
      settings: {
        roundsCount: 2,
        questionsPerRound: 5,
        timerDuration: 30,
        timerAutoStart: false,
        timerVisible: true,
        ttsEnabled: false,
      },
    });
    const newQuestion = makeQuestion('nq', 'science', 10);
    const result = addQuestion(state, newQuestion);

    // settings.roundsCount must remain 2 — the function no longer modifies it
    expect(result.settings.roundsCount).toBe(2);
  });
});

// =============================================================================
// updateQuestion — no longer writes settings.roundsCount
// =============================================================================

describe('updateQuestion — settings.roundsCount not written', () => {
  it('result settings.roundsCount is unchanged when updated question has a high roundIndex', () => {
    const initial = makeQuestion('q0', 'science', 0);
    const state = makeState({
      questions: [initial],
      settings: {
        roundsCount: 2,
        questionsPerRound: 5,
        timerDuration: 30,
        timerAutoStart: false,
        timerVisible: true,
        ttsEnabled: false,
      },
    });
    const updated = makeQuestion('q0', 'history', 99);
    const result = updateQuestion(state, 0, updated);

    // settings.roundsCount must remain 2 — the function no longer modifies it
    expect(result.settings.roundsCount).toBe(2);
  });
});
