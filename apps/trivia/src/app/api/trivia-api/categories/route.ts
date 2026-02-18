/**
 * BFF -- GET /api/trivia-api/categories
 *
 * Public endpoint (no auth required). Returns the static mapping between
 * external API categories and internal app categories, with display names
 * and approximate question counts.
 *
 * Response is immutable metadata cached for 24 hours via Cache-Control.
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@joolie-boolie/error-tracking/server-logger';

const logger = createLogger({ service: 'api-trivia-api-categories' });

// =============================================================================
// STATIC CATEGORY DATA
// =============================================================================

/**
 * Category mapping with display metadata.
 * Counts are approximate text_choice question totals from the-trivia-api.com.
 */
const CATEGORY_MAPPING = [
  {
    apiCategory: 'general_knowledge',
    internalCategory: 'general_knowledge',
    displayName: 'General Knowledge',
    approximateCount: 516,
  },
  {
    apiCategory: 'science',
    internalCategory: 'science',
    displayName: 'Science',
    approximateCount: 1583,
  },
  {
    apiCategory: 'history',
    internalCategory: 'history',
    displayName: 'History',
    approximateCount: 1300,
  },
  {
    apiCategory: 'geography',
    internalCategory: 'geography',
    displayName: 'Geography',
    approximateCount: 1797,
  },
  {
    apiCategory: 'music',
    internalCategory: 'entertainment',
    displayName: 'Music',
    approximateCount: 1667,
  },
  {
    apiCategory: 'film_and_tv',
    internalCategory: 'entertainment',
    displayName: 'Film & TV',
    approximateCount: 2141,
  },
  {
    apiCategory: 'sport_and_leisure',
    internalCategory: 'sports',
    displayName: 'Sport & Leisure',
    approximateCount: 676,
  },
  {
    apiCategory: 'arts_and_literature',
    internalCategory: 'art_literature',
    displayName: 'Arts & Literature',
    approximateCount: 1289,
  },
  {
    apiCategory: 'society_and_culture',
    internalCategory: 'general_knowledge',
    displayName: 'Society & Culture',
    approximateCount: 1522,
  },
  {
    apiCategory: 'food_and_drink',
    internalCategory: 'general_knowledge',
    displayName: 'Food & Drink',
    approximateCount: 934,
  },
] as const;

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

// Build response body once at module load time (static data)
const RESPONSE_BODY = {
  categories: CATEGORY_MAPPING,
  difficulties: DIFFICULTIES,
  meta: {
    totalCategories: CATEGORY_MAPPING.length,
    totalApproximateQuestions: CATEGORY_MAPPING.reduce(
      (sum, c) => sum + c.approximateCount,
      0
    ),
    source: 'the-trivia-api.com',
    note: 'Question counts are approximate and represent approved text_choice questions only.',
  },
};

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function GET() {
  try {
    return NextResponse.json(RESPONSE_BODY, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    // Static data return -- this branch is unreachable in practice.
    logger.error('Unexpected error returning trivia API categories', {
      event: 'trivia_api_categories_error',
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
