/**
 * Category utilities and default configurations for trivia questions.
 * Categories help organize questions and provide filtering/statistics capabilities.
 */

import type { QuestionCategory, Question } from '@/types';

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

export interface CategoryConfig {
  id: QuestionCategory;
  name: string;
  color: string; // Tailwind color class (e.g., 'blue', 'green', etc.)
  description?: string;
}

/**
 * Default category configurations with colors and display names.
 * Colors use Tailwind CSS color palette names.
 */
export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'general_knowledge',
    name: 'General Knowledge',
    color: 'slate',
    description: 'A mix of everyday facts and common knowledge',
  },
  {
    id: 'science',
    name: 'Science',
    color: 'green',
    description: 'Biology, chemistry, physics, and the natural world',
  },
  {
    id: 'history',
    name: 'History',
    color: 'amber',
    description: 'Past events, historical figures, and milestones',
  },
  {
    id: 'geography',
    name: 'Geography',
    color: 'cyan',
    description: 'Countries, capitals, landmarks, and maps',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    color: 'purple',
    description: 'Movies, TV, music, and pop culture',
  },
  {
    id: 'sports',
    name: 'Sports',
    color: 'orange',
    description: 'Athletics, teams, and sporting events',
  },
  {
    id: 'art_literature',
    name: 'Art & Literature',
    color: 'rose',
    description: 'Visual arts, books, and literary works',
  },
];

/**
 * Legacy category mappings for backwards compatibility.
 * Maps old category IDs to new ones.
 */
export const LEGACY_CATEGORY_MAPPING = {
  music: 'entertainment',
  movies: 'entertainment',
  tv: 'entertainment',
} as const satisfies Record<string, QuestionCategory>;

// =============================================================================
// EXTERNAL API CATEGORY MAPPING (The Trivia API v2)
// =============================================================================

/**
 * Maps category slugs from the-trivia-api.com (v2) to internal QuestionCategory values.
 *
 * The external API uses 10 categories. Our app uses 7 canonical categories.
 *
 * | API Category          | Internal Category    |
 * |-----------------------|----------------------|
 * | music                 | entertainment        |
 * | film_and_tv           | entertainment        |
 * | sport_and_leisure     | sports               |
 * | arts_and_literature   | art_literature       |
 * | history               | history              |
 * | science               | science              |
 * | geography             | geography            |
 * | society_and_culture   | general_knowledge    |
 * | food_and_drink        | general_knowledge    |
 * | general_knowledge     | general_knowledge    |
 */
export const TRIVIA_API_CATEGORY_MAP: Readonly<Record<string, QuestionCategory>> = {
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
} as const;

/**
 * Map an external API category string to an internal QuestionCategory.
 *
 * Lookup order:
 * 1. Exact match in TRIVIA_API_CATEGORY_MAP (covers all known API categories)
 * 2. Delegated to normalizeCategoryId() (handles legacy aliases + canonical pass-through + fallback)
 *
 * @param apiCategory - The category string from the external API.
 * @returns The corresponding internal QuestionCategory.
 */
export function mapApiCategory(apiCategory: string): QuestionCategory {
  const apiMapped = TRIVIA_API_CATEGORY_MAP[apiCategory];
  if (apiMapped !== undefined) {
    return apiMapped;
  }
  return normalizeCategoryId(apiCategory);
}

/**
 * Reverse-map: get the external API category strings that correspond to a
 * given internal QuestionCategory. Used to build API query parameters.
 *
 * @param internalCategory - An internal QuestionCategory.
 * @returns Array of external API category strings that map to this internal category.
 */
export function getApiCategoriesForInternal(
  internalCategory: QuestionCategory
): string[] {
  return Object.entries(TRIVIA_API_CATEGORY_MAP)
    .filter(([, internal]) => internal === internalCategory)
    .map(([apiCat]) => apiCat);
}

// =============================================================================
// CATEGORY UTILITIES
// =============================================================================

/**
 * Get all available category IDs.
 */
export function getCategoryIds(): QuestionCategory[] {
  return DEFAULT_CATEGORIES.map((c) => c.id);
}

/**
 * Get a category configuration by ID.
 * Returns undefined if not found.
 */
export function getCategoryById(id: QuestionCategory): CategoryConfig | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get the display name for a category.
 * Returns the ID if category not found.
 */
export function getCategoryName(id: QuestionCategory): string {
  const category = getCategoryById(id);
  return category?.name ?? id;
}

/**
 * Get the color for a category.
 * Returns 'slate' as default if category not found.
 */
export function getCategoryColor(id: QuestionCategory): string {
  const category = getCategoryById(id);
  return category?.color ?? 'slate';
}

/**
 * Get Tailwind CSS classes for a category badge.
 * Includes background, text, and border colors.
 */
export function getCategoryBadgeClasses(id: QuestionCategory): string {
  const color = getCategoryColor(id);

  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    green: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
    amber: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700',
    purple: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
    orange: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    rose: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-700',
  };

  return colorClasses[color] ?? colorClasses.slate;
}

/**
 * Get Tailwind CSS classes for a category filter button (active state).
 */
export function getCategoryFilterActiveClasses(id: QuestionCategory): string {
  const color = getCategoryColor(id);

  // Use -700 backgrounds in light mode and -800 in dark mode for WCAG AA contrast with white text.
  // The -500 shades previously used here failed contrast checks (e.g. green-500, amber-500, cyan-500).
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-700 text-white border-slate-800 dark:bg-slate-600 dark:border-slate-500',
    green: 'bg-green-700 text-white border-green-800 dark:bg-green-800 dark:border-green-700',
    amber: 'bg-amber-700 text-white border-amber-800 dark:bg-amber-800 dark:border-amber-700',
    cyan: 'bg-cyan-700 text-white border-cyan-800 dark:bg-cyan-800 dark:border-cyan-700',
    purple: 'bg-purple-700 text-white border-purple-800 dark:bg-purple-800 dark:border-purple-700',
    orange: 'bg-orange-700 text-white border-orange-800 dark:bg-orange-800 dark:border-orange-700',
    rose: 'bg-rose-700 text-white border-rose-800 dark:bg-rose-800 dark:border-rose-700',
  };

  return colorClasses[color] ?? colorClasses.slate;
}

/**
 * Normalize a legacy category ID to the new category system.
 * Returns the original ID if no mapping exists.
 */
export function normalizeCategoryId(id: string): QuestionCategory {
  const legacyMapping = LEGACY_CATEGORY_MAPPING[id as keyof typeof LEGACY_CATEGORY_MAPPING];
  if (legacyMapping) {
    return legacyMapping;
  }

  // Check if it's already a valid category
  if (getCategoryIds().includes(id as QuestionCategory)) {
    return id as QuestionCategory;
  }

  // Default to general_knowledge for unknown categories
  return 'general_knowledge';
}

// =============================================================================
// QUESTION STATISTICS
// =============================================================================

export interface CategoryStatistics {
  categoryId: QuestionCategory;
  categoryName: string;
  color: string;
  questionCount: number;
  percentage: number;
}

/**
 * Calculate statistics for questions by category.
 * Returns an array of statistics sorted by question count (descending).
 */
export function getCategoryStatistics(questions: Question[]): CategoryStatistics[] {
  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return [];
  }

  // Count questions per category
  const counts = new Map<QuestionCategory, number>();

  for (const question of questions) {
    const categoryId = normalizeCategoryId(question.category);
    const currentCount = counts.get(categoryId) ?? 0;
    counts.set(categoryId, currentCount + 1);
  }

  // Build statistics array
  const statistics: CategoryStatistics[] = [];

  for (const [categoryId, count] of counts) {
    statistics.push({
      categoryId,
      categoryName: getCategoryName(categoryId),
      color: getCategoryColor(categoryId),
      questionCount: count,
      percentage: Math.round((count / totalQuestions) * 100),
    });
  }

  // Sort by count descending
  statistics.sort((a, b) => b.questionCount - a.questionCount);

  return statistics;
}

/**
 * Get count of questions for a specific category.
 */
export function getQuestionCountByCategory(
  questions: Question[],
  categoryId: QuestionCategory
): number {
  return questions.filter(
    (q) => normalizeCategoryId(q.category) === categoryId
  ).length;
}

// =============================================================================
// FILTERING UTILITIES
// =============================================================================

/**
 * Filter questions by one or more categories.
 * If no categories are specified, returns all questions.
 */
export function filterQuestionsByCategory(
  questions: Question[],
  categoryIds: QuestionCategory[]
): Question[] {
  if (categoryIds.length === 0) {
    return questions;
  }

  return questions.filter((q) =>
    categoryIds.includes(normalizeCategoryId(q.category))
  );
}

/**
 * Filter questions by a single category.
 */
export function filterQuestionsBySingleCategory(
  questions: Question[],
  categoryId: QuestionCategory
): Question[] {
  return questions.filter(
    (q) => normalizeCategoryId(q.category) === categoryId
  );
}

/**
 * Get unique categories present in a list of questions.
 */
export function getUniqueCategories(questions: Question[]): QuestionCategory[] {
  const categories = new Set<QuestionCategory>();

  for (const question of questions) {
    categories.add(normalizeCategoryId(question.category));
  }

  return Array.from(categories);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if a category ID is valid.
 */
export function isValidCategoryId(id: string): id is QuestionCategory {
  return getCategoryIds().includes(id as QuestionCategory);
}

/**
 * Validate and return a category ID, or default to 'general_knowledge'.
 */
export function validateCategoryId(id: string | undefined | null): QuestionCategory {
  if (id && isValidCategoryId(id)) {
    return id;
  }
  return 'general_knowledge';
}
