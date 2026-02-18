import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock uuid -- matches existing conversion.test.ts pattern
vi.mock('uuid', () => ({ v4: vi.fn(() => 'test-uuid-1234') }));

import {
  fisherYatesShuffle,
  sanitizeText,
  triviaApiQuestionToQuestion,
  triviaApiQuestionToTriviaQuestion,
  triviaApiQuestionsToQuestions,
  triviaApiQuestionsToTriviaQuestions,
  filterNicheQuestions,
  getApiConversionSummary,
} from '../api-adapter';

import {
  mapApiCategory,
  getApiCategoriesForInternal,
  TRIVIA_API_CATEGORY_MAP,
} from '@/lib/categories';

import {
  MUSIC_KISS,
  FOOD_KAHLUA,
  SCIENCE_NANOTECH,
  MIXED_CATEGORY_BATCH,
  SCIENCE_HISTORY_BATCH,
  BATCH_WITH_NICHE,
  EXPECTED_CATEGORY_MAP,
} from '@/lib/trivia-api/__fixtures__/trivia-api';

// ---------------------------------------------------------------------------
// Deterministic RNG for shuffle tests
// ---------------------------------------------------------------------------

/** Always returns 0 so Fisher-Yates produces a predictable output. */
const IDENTITY_RNG = () => 0;

// ==========================================================================
// fisherYatesShuffle
// ==========================================================================

describe('fisherYatesShuffle', () => {
  it('returns a new array without mutating the input', () => {
    const input = ['A', 'B', 'C', 'D'];
    const original = [...input];
    const result = fisherYatesShuffle(input);
    expect(input).toEqual(original);
    expect(result).toHaveLength(4);
  });

  it('contains all original elements', () => {
    const input = ['A', 'B', 'C', 'D'];
    const result = fisherYatesShuffle(input);
    expect(result.sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('produces deterministic output with a fixed RNG', () => {
    const input = ['A', 'B', 'C', 'D'];
    const result1 = fisherYatesShuffle(input, IDENTITY_RNG);
    const result2 = fisherYatesShuffle(input, IDENTITY_RNG);
    expect(result1).toEqual(result2);
  });

  it('handles empty array', () => {
    expect(fisherYatesShuffle([])).toEqual([]);
  });

  it('handles single-element array', () => {
    expect(fisherYatesShuffle(['X'])).toEqual(['X']);
  });
});

// ==========================================================================
// sanitizeText
// ==========================================================================

describe('sanitizeText', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('removes trailing non-breaking space (NBSP)', () => {
    expect(sanitizeText('Kahlua\u00a0')).toBe('Kahlua');
  });

  it('collapses internal whitespace runs', () => {
    expect(sanitizeText('hello   world')).toBe('hello world');
  });

  it('handles mixed whitespace characters', () => {
    expect(sanitizeText('\t  hello \u00a0 world  \n')).toBe('hello world');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeText('   \u00a0  ')).toBe('');
  });
});

// ==========================================================================
// Category mapping (additions to categories.ts)
// ==========================================================================

describe('TRIVIA_API_CATEGORY_MAP', () => {
  it('maps all 10 known API categories', () => {
    expect(Object.keys(TRIVIA_API_CATEGORY_MAP)).toHaveLength(10);
  });
});

describe('mapApiCategory', () => {
  it.each(Object.entries(EXPECTED_CATEGORY_MAP))(
    'maps API category "%s" to internal "%s"',
    (apiCategory, expected) => {
      expect(mapApiCategory(apiCategory)).toBe(expected);
    }
  );

  it('falls back to general_knowledge for unknown category', () => {
    expect(mapApiCategory('underwater_basket_weaving')).toBe('general_knowledge');
  });

  it('falls back to general_knowledge for empty string', () => {
    expect(mapApiCategory('')).toBe('general_knowledge');
  });

  it('passes through canonical category IDs unchanged', () => {
    expect(mapApiCategory('entertainment')).toBe('entertainment');
    expect(mapApiCategory('sports')).toBe('sports');
    expect(mapApiCategory('art_literature')).toBe('art_literature');
  });

  it('maps legacy category "movies" to entertainment via normalizeCategoryId fallback', () => {
    expect(mapApiCategory('movies')).toBe('entertainment');
  });
});

describe('getApiCategoriesForInternal', () => {
  it('returns both music and film_and_tv for entertainment', () => {
    const result = getApiCategoriesForInternal('entertainment');
    expect(result).toContain('music');
    expect(result).toContain('film_and_tv');
    expect(result).toHaveLength(2);
  });

  it('returns three categories for general_knowledge', () => {
    const result = getApiCategoriesForInternal('general_knowledge');
    expect(result).toContain('society_and_culture');
    expect(result).toContain('food_and_drink');
    expect(result).toContain('general_knowledge');
    expect(result).toHaveLength(3);
  });

  it('returns single-entry for 1:1 mappings', () => {
    expect(getApiCategoriesForInternal('sports')).toEqual(['sport_and_leisure']);
    expect(getApiCategoriesForInternal('history')).toEqual(['history']);
    expect(getApiCategoriesForInternal('science')).toEqual(['science']);
    expect(getApiCategoriesForInternal('geography')).toEqual(['geography']);
    expect(getApiCategoriesForInternal('art_literature')).toEqual([
      'arts_and_literature',
    ]);
  });
});

// ==========================================================================
// triviaApiQuestionToQuestion
// ==========================================================================

describe('triviaApiQuestionToQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converts a science question to Question format', () => {
    const result = triviaApiQuestionToQuestion(SCIENCE_NANOTECH, 0, IDENTITY_RNG);

    expect(result.id).toBe('test-uuid-1234');
    expect(result.text).toBe('What is Nanotechnology the study of?');
    expect(result.type).toBe('multiple_choice');
    expect(result.category).toBe('science');
    expect(result.roundIndex).toBe(0);
    expect(result.options).toEqual(['A', 'B', 'C', 'D']);
    expect(result.optionTexts).toHaveLength(4);
  });

  it('includes the correct answer in optionTexts', () => {
    const result = triviaApiQuestionToQuestion(SCIENCE_NANOTECH, 0, IDENTITY_RNG);
    expect(result.optionTexts).toContain(
      'the study and design of machines at the molecular level'
    );
  });

  it('sets correctAnswers to the letter of the correct option', () => {
    const result = triviaApiQuestionToQuestion(SCIENCE_NANOTECH, 0, IDENTITY_RNG);
    const correctLetter = result.correctAnswers[0];
    const correctIndex = result.options.indexOf(correctLetter);
    expect(result.optionTexts[correctIndex]).toBe(
      'the study and design of machines at the molecular level'
    );
  });

  it('maps "music" category to "entertainment"', () => {
    const result = triviaApiQuestionToQuestion(MUSIC_KISS, 0, IDENTITY_RNG);
    expect(result.category).toBe('entertainment');
  });

  it('maps "food_and_drink" category to "general_knowledge"', () => {
    const result = triviaApiQuestionToQuestion(FOOD_KAHLUA, 0, IDENTITY_RNG);
    expect(result.category).toBe('general_knowledge');
  });

  it('sanitizes trailing NBSP from answer text', () => {
    const result = triviaApiQuestionToQuestion(FOOD_KAHLUA, 0, IDENTITY_RNG);
    const kahlua = result.optionTexts.find((t) => t.startsWith('Kahlua'));
    expect(kahlua).toBe('Kahlua');
  });

  it('preserves Unicode characters in answer text', () => {
    const result = triviaApiQuestionToQuestion(MUSIC_KISS, 0, IDENTITY_RNG);
    expect(result.optionTexts).toContain('M\u00f6tley Cr\u00fce');
  });

  it('uses the provided roundIndex', () => {
    const result = triviaApiQuestionToQuestion(SCIENCE_NANOTECH, 3, IDENTITY_RNG);
    expect(result.roundIndex).toBe(3);
  });

  it('defaults roundIndex to 0', () => {
    const result = triviaApiQuestionToQuestion(SCIENCE_NANOTECH);
    expect(result.roundIndex).toBe(0);
  });
});

// ==========================================================================
// triviaApiQuestionToTriviaQuestion
// ==========================================================================

describe('triviaApiQuestionToTriviaQuestion', () => {
  it('converts to TriviaQuestion with correctIndex', () => {
    const result = triviaApiQuestionToTriviaQuestion(
      SCIENCE_NANOTECH,
      'the-trivia-api',
      IDENTITY_RNG
    );

    expect(result.question).toBe('What is Nanotechnology the study of?');
    expect(result.options).toHaveLength(4);
    expect(result.options).toContain(
      'the study and design of machines at the molecular level'
    );
    expect(result.options[result.correctIndex]).toBe(
      'the study and design of machines at the molecular level'
    );
    expect(result.category).toBe('science');
  });

  it('includes source and externalId fields', () => {
    const result = triviaApiQuestionToTriviaQuestion(
      SCIENCE_NANOTECH,
      'the-trivia-api',
      IDENTITY_RNG
    );
    expect(result.source).toBe('the-trivia-api');
    expect(result.externalId).toBe('622a1c377cc59eab6f9504f0');
  });

  it('uses default source when not provided', () => {
    const result = triviaApiQuestionToTriviaQuestion(SCIENCE_NANOTECH);
    expect(result.source).toBe('the-trivia-api');
  });

  it('sanitizes trailing NBSP from answer', () => {
    const result = triviaApiQuestionToTriviaQuestion(
      FOOD_KAHLUA,
      'the-trivia-api',
      IDENTITY_RNG
    );
    expect(result.options[result.correctIndex]).toBe('Kahlua');
  });

  it('maps API categories correctly', () => {
    const music = triviaApiQuestionToTriviaQuestion(MUSIC_KISS);
    expect(music.category).toBe('entertainment');
    const food = triviaApiQuestionToTriviaQuestion(FOOD_KAHLUA);
    expect(food.category).toBe('general_knowledge');
  });
});

// ==========================================================================
// triviaApiQuestionsToQuestions (batch with round assignment)
// ==========================================================================

describe('triviaApiQuestionsToQuestions', () => {
  it('assigns roundIndex based on questionsPerRound', () => {
    const result = triviaApiQuestionsToQuestions(
      SCIENCE_HISTORY_BATCH,
      { questionsPerRound: 2 },
      IDENTITY_RNG
    );

    expect(result).toHaveLength(5);
    expect(result[0].roundIndex).toBe(0);
    expect(result[1].roundIndex).toBe(0);
    expect(result[2].roundIndex).toBe(1);
    expect(result[3].roundIndex).toBe(1);
    expect(result[4].roundIndex).toBe(2);
  });

  it('defaults to 5 questions per round', () => {
    const result = triviaApiQuestionsToQuestions(
      SCIENCE_HISTORY_BATCH,
      {},
      IDENTITY_RNG
    );
    expect(result[0].roundIndex).toBe(0);
    expect(result[4].roundIndex).toBe(0);
  });

  it('filters niche questions when excludeNiche is true', () => {
    const result = triviaApiQuestionsToQuestions(
      BATCH_WITH_NICHE,
      { excludeNiche: true },
      IDENTITY_RNG
    );
    expect(result).toHaveLength(2);
    expect(result.every((q) => q.text !== 'An extremely niche science question?')).toBe(
      true
    );
  });

  it('includes niche questions by default', () => {
    const result = triviaApiQuestionsToQuestions(
      BATCH_WITH_NICHE,
      {},
      IDENTITY_RNG
    );
    expect(result).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(triviaApiQuestionsToQuestions([])).toEqual([]);
  });
});

// ==========================================================================
// triviaApiQuestionsToTriviaQuestions (batch for DB)
// ==========================================================================

describe('triviaApiQuestionsToTriviaQuestions', () => {
  it('converts batch with source and externalId', () => {
    const result = triviaApiQuestionsToTriviaQuestions(
      [SCIENCE_NANOTECH, MUSIC_KISS],
      {},
      IDENTITY_RNG
    );

    expect(result).toHaveLength(2);
    expect(result[0].source).toBe('the-trivia-api');
    expect(result[0].externalId).toBe(SCIENCE_NANOTECH.id);
    expect(result[1].source).toBe('the-trivia-api');
    expect(result[1].externalId).toBe(MUSIC_KISS.id);
  });

  it('uses custom source when provided', () => {
    const result = triviaApiQuestionsToTriviaQuestions(
      [SCIENCE_NANOTECH],
      { source: 'custom-source' },
      IDENTITY_RNG
    );
    expect(result[0].source).toBe('custom-source');
  });

  it('filters niche questions when excludeNiche is true', () => {
    const result = triviaApiQuestionsToTriviaQuestions(
      BATCH_WITH_NICHE,
      { excludeNiche: true },
      IDENTITY_RNG
    );
    expect(result).toHaveLength(2);
    expect(result[0].externalId).toBe(SCIENCE_NANOTECH.id);
  });
});

// ==========================================================================
// filterNicheQuestions
// ==========================================================================

describe('filterNicheQuestions', () => {
  it('removes niche questions', () => {
    const result = filterNicheQuestions(BATCH_WITH_NICHE);
    expect(result).toHaveLength(2);
    expect(result.every((q) => !q.isNiche)).toBe(true);
  });

  it('returns all questions when none are niche', () => {
    expect(filterNicheQuestions(SCIENCE_HISTORY_BATCH)).toHaveLength(5);
  });

  it('does not mutate the input array', () => {
    const input = [...BATCH_WITH_NICHE];
    filterNicheQuestions(input);
    expect(input).toHaveLength(3);
  });

  it('handles empty input', () => {
    expect(filterNicheQuestions([])).toEqual([]);
  });
});

// ==========================================================================
// getApiConversionSummary
// ==========================================================================

describe('getApiConversionSummary', () => {
  it('computes category counts with API category mapping', () => {
    const summary = getApiConversionSummary(MIXED_CATEGORY_BATCH);
    expect(summary.totalReceived).toBe(10);
    expect(summary.totalConverted).toBe(10);
    expect(summary.categoryCounts['science']).toBe(1);
    expect(summary.categoryCounts['entertainment']).toBe(2);
    expect(summary.categoryCounts['general_knowledge']).toBe(3);
  });

  it('computes difficulty counts', () => {
    const summary = getApiConversionSummary(MIXED_CATEGORY_BATCH);
    expect(summary.difficultyCounts['medium']).toBeDefined();
    expect(summary.difficultyCounts['hard']).toBeDefined();
  });

  it('computes rounds generated', () => {
    const summary = getApiConversionSummary(MIXED_CATEGORY_BATCH, {
      questionsPerRound: 3,
    });
    expect(summary.roundsGenerated).toBe(4);
  });

  it('reports niche filtering', () => {
    const withFilter = getApiConversionSummary(BATCH_WITH_NICHE, {
      excludeNiche: true,
    });
    expect(withFilter.nicheFiltered).toBe(1);
    expect(withFilter.totalConverted).toBe(2);

    const withoutFilter = getApiConversionSummary(BATCH_WITH_NICHE, {
      excludeNiche: false,
    });
    expect(withoutFilter.nicheFiltered).toBe(0);
    expect(withoutFilter.totalConverted).toBe(3);
  });

  it('handles empty input', () => {
    const summary = getApiConversionSummary([]);
    expect(summary.totalReceived).toBe(0);
    expect(summary.totalConverted).toBe(0);
    expect(summary.roundsGenerated).toBe(0);
  });
});
