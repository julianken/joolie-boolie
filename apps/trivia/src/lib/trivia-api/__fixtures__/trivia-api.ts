/**
 * Shared test fixtures for the trivia API integration.
 *
 * All question data is copied VERBATIM from real API responses
 * in tmpy/trivia-plan/mocks/mixed-50.json. This ensures tests
 * validate against the actual the-trivia-api.com data shape,
 * including Unicode characters and trailing non-breaking spaces.
 */

import type { TriviaApiQuestion } from '../client';

// ---------------------------------------------------------------------------
// Single-question fixtures (one per API category, from mixed-50.json)
// ---------------------------------------------------------------------------

/** API category: music -> internal: entertainment */
export const MUSIC_KISS: TriviaApiQuestion = {
  category: 'music',
  id: '622a1c397cc59eab6f950d83',
  correctAnswer: 'Kiss',
  incorrectAnswers: ['Swans', 'The Pussycat Dolls', 'M\u00f6tley Cr\u00fce'],
  question: { text: 'Gene Simmons is a member of which band?' },
  tags: ['music'],
  type: 'text_choice',
  difficulty: 'medium',
  regions: [],
  isNiche: false,
};

/** API category: food_and_drink -> internal: general_knowledge. NOTE: trailing NBSP in correctAnswer */
export const FOOD_KAHLUA: TriviaApiQuestion = {
  category: 'food_and_drink',
  id: '622a1c367cc59eab6f95021d',
  correctAnswer: 'Kahlua\u00a0',
  incorrectAnswers: ['Advocaat', 'Baileys', 'Limoncello'],
  question: {
    text: 'White Russian Cocktails Are Made From Milk, Vodka And _______',
  },
  tags: ['drink', 'cocktails', 'food_and_drink'],
  type: 'text_choice',
  difficulty: 'hard',
  regions: [],
  isNiche: false,
};

/** API category: sport_and_leisure -> internal: sports */
export const SPORT_SURFING: TriviaApiQuestion = {
  category: 'sport_and_leisure',
  id: '622a1c367cc59eab6f950084',
  correctAnswer: 'Surfing',
  incorrectAnswers: ['Skate Boarding', 'Skiing', 'Boxing'],
  question: {
    text: 'What sport do the following terms belong to - "Hotdog & Bottom Trun"?',
  },
  tags: ['sport'],
  type: 'text_choice',
  difficulty: 'hard',
  regions: [],
  isNiche: false,
};

/** API category: geography */
export const GEOGRAPHY_MINSK: TriviaApiQuestion = {
  category: 'geography',
  id: '62373f9ecb85f7ce9e949caa',
  correctAnswer: 'Minsk',
  incorrectAnswers: ['Budapest', 'Vienna', 'Vaduz'],
  question: { text: 'What is the capital city of Belarus?' },
  tags: ['capital_cities', 'cities', 'geography'],
  type: 'text_choice',
  difficulty: 'hard',
  regions: [],
  isNiche: false,
};

/** API category: science */
export const SCIENCE_NANOTECH: TriviaApiQuestion = {
  category: 'science',
  id: '622a1c377cc59eab6f9504f0',
  correctAnswer: 'the study and design of machines at the molecular level',
  incorrectAnswers: [
    'things in order of time or time',
    'movement in relation to human anatomy; a branch of medicine',
    'wine',
  ],
  question: { text: 'What is Nanotechnology the study of?' },
  tags: ['science'],
  type: 'text_choice',
  difficulty: 'medium',
  regions: [],
  isNiche: false,
};

/** API category: arts_and_literature -> internal: art_literature */
export const ARTS_DIGTE: TriviaApiQuestion = {
  category: 'arts_and_literature',
  id: '622a1c397cc59eab6f950e7f',
  correctAnswer: 'Johannes V. Jensen',
  incorrectAnswers: [
    'Hans Christian Andersen',
    'S\u00f8ren Kierkegaard',
    'Agatha Christie',
  ],
  question: { text: "Which author wrote 'Digte'?" },
  tags: ['literature', 'arts_and_literature'],
  type: 'text_choice',
  difficulty: 'hard',
  regions: [],
  isNiche: false,
};

/** API category: film_and_tv -> internal: entertainment */
export const FILM_GREASE: TriviaApiQuestion = {
  category: 'film_and_tv',
  id: '622a1c347cc59eab6f94f948',
  correctAnswer: 'Grease',
  incorrectAnswers: [
    'Gangs of New York',
    'The Good, the Bad, and the Ugly',
    'Terms of Endearment',
  ],
  question: { text: "Which film contains the character 'Sandy Olsson'?" },
  tags: ['fictitious_characters', 'film', 'general_knowledge', 'film_and_tv'],
  type: 'text_choice',
  difficulty: 'medium',
  regions: [],
  isNiche: false,
};

/** API category: society_and_culture -> internal: general_knowledge */
export const SOCIETY_ECONOMICS: TriviaApiQuestion = {
  category: 'society_and_culture',
  id: '63dd25d2742e43ed64f1f028',
  correctAnswer: 'Consumer Spending',
  incorrectAnswers: [
    'Personal Spending',
    'Investment Spending',
    'Big Spending',
  ],
  question: {
    text: 'In economics, what is the term for the amount of money that individuals spend on goods and services?',
  },
  tags: ['society_and_culture', 'economics'],
  type: 'text_choice',
  difficulty: 'medium',
  regions: [],
  isNiche: false,
};

/** API category: general_knowledge */
export const GK_PREVARICATION: TriviaApiQuestion = {
  category: 'general_knowledge',
  id: '649c9f94e3aef0a3c23f6402',
  correctAnswer: 'A Lie',
  incorrectAnswers: ['A Disaster', 'An Accident', 'A Mistake'],
  question: { text: 'What is another word for a prevarication?' },
  tags: ['words'],
  type: 'text_choice',
  difficulty: 'hard',
  regions: [],
  isNiche: false,
};

/** API category: history */
export const HISTORY_YALTA: TriviaApiQuestion = {
  category: 'history',
  id: '622a1c3c7cc59eab6f95186f',
  correctAnswer: 'Yalta',
  incorrectAnswers: ['Dresden', 'Maastricht', 'Versailles'],
  question: {
    text: 'Where did Churchill, Roosevelt and Stalin meet in 1945?',
  },
  tags: ['politics', 'world_war_2', 'leaders', 'places', 'history'],
  type: 'text_choice',
  difficulty: 'medium',
  regions: [],
  isNiche: false,
};

// ---------------------------------------------------------------------------
// Niche question fixture (synthetic but structurally valid)
// ---------------------------------------------------------------------------

export const NICHE_QUESTION: TriviaApiQuestion = {
  category: 'science',
  id: 'niche-001',
  correctAnswer: 'Obscure Answer',
  incorrectAnswers: ['Wrong A', 'Wrong B', 'Wrong C'],
  question: { text: 'An extremely niche science question?' },
  tags: ['niche', 'science'],
  type: 'text_choice',
  difficulty: 'hard',
  regions: [],
  isNiche: true,
};

// ---------------------------------------------------------------------------
// Batch fixtures
// ---------------------------------------------------------------------------

/** Mixed batch with all 10 API categories represented. */
export const MIXED_CATEGORY_BATCH: TriviaApiQuestion[] = [
  MUSIC_KISS,
  FOOD_KAHLUA,
  SPORT_SURFING,
  GEOGRAPHY_MINSK,
  SCIENCE_NANOTECH,
  ARTS_DIGTE,
  FILM_GREASE,
  SOCIETY_ECONOMICS,
  GK_PREVARICATION,
  HISTORY_YALTA,
];

/** 5 questions from science + history categories. */
export const SCIENCE_HISTORY_BATCH: TriviaApiQuestion[] = [
  SCIENCE_NANOTECH,
  {
    category: 'science',
    id: '645a6490158db1bd1779f19b',
    correctAnswer: 'Ivory',
    incorrectAnswers: ['Diamonds', 'Gold', 'Silver'],
    question: {
      text: 'For what valuable material do some people hunt walruses?',
    },
    tags: ['animals', 'hunting', 'materials'],
    type: 'text_choice',
    difficulty: 'medium',
    regions: [],
    isNiche: false,
  },
  HISTORY_YALTA,
  {
    category: 'history',
    id: '622a1c367cc59eab6f95034f',
    correctAnswer: 'The Elephant Man',
    incorrectAnswers: ['The Zodiac Killer', 'The Red Baron', 'Vanilla Ice'],
    question: { text: 'Who was Joseph Merrick?' },
    tags: ['history'],
    type: 'text_choice',
    difficulty: 'hard',
    regions: [],
    isNiche: false,
  },
  {
    category: 'science',
    id: '622a1c377cc59eab6f9504d6',
    correctAnswer: 'Mountains',
    incorrectAnswers: ['Cats', 'Soil', 'Genetics'],
    question: { text: 'What is Orology the study of?' },
    tags: ['science', 'words'],
    type: 'text_choice',
    difficulty: 'hard',
    regions: [],
    isNiche: false,
  },
];

/** Batch that includes a niche question (for filtering tests). */
export const BATCH_WITH_NICHE: TriviaApiQuestion[] = [
  SCIENCE_NANOTECH,
  NICHE_QUESTION,
  HISTORY_YALTA,
];

// ---------------------------------------------------------------------------
// Expected internal category mappings
// ---------------------------------------------------------------------------

export const EXPECTED_CATEGORY_MAP: Record<string, string> = {
  music: 'entertainment',
  film_and_tv: 'entertainment',
  sport_and_leisure: 'sports',
  arts_and_literature: 'art_literature',
  history: 'history',
  science: 'science',
  geography: 'geography',
  society_and_culture: 'general_knowledge',
  food_and_drink: 'general_knowledge',
  general_knowledge: 'general_knowledge',
};
