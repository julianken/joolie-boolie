/**
 * The Trivia API v2 client.
 *
 * Server-only module for fetching questions from the-trivia-api.com.
 * Used by BFF API routes -- never imported from client components.
 *
 * Returns a discriminated TriviaApiResult union -- callers check result.ok
 * rather than catching exceptions.
 */

import { createLogger } from '@hosted-game-night/error-tracking/server-logger';

const logger = createLogger({ service: 'trivia-api-client' });

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_URL = 'https://the-trivia-api.com/v2/questions';
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// =============================================================================
// TYPES -- External API shapes
// =============================================================================

/**
 * Category slugs returned by the-trivia-api.com v2.
 * These differ from internal QuestionCategory values and must be mapped.
 */
export type TriviaApiCategory =
  | 'music'
  | 'sport_and_leisure'
  | 'film_and_tv'
  | 'arts_and_literature'
  | 'history'
  | 'society_and_culture'
  | 'science'
  | 'geography'
  | 'food_and_drink'
  | 'general_knowledge';

/** Difficulty levels from the external API. */
export type TriviaApiDifficulty = 'easy' | 'medium' | 'hard';

/**
 * A single question as returned by the-trivia-api.com v2.
 * Shape validated against real API responses.
 */
export interface TriviaApiQuestion {
  id: string;
  category: TriviaApiCategory;
  correctAnswer: string;
  incorrectAnswers: string[];
  question: { text: string };
  tags: string[];
  type: string; // 'text_choice' for free tier
  difficulty: TriviaApiDifficulty;
  regions: string[];
  isNiche: boolean;
}

// =============================================================================
// TYPES -- Request parameters
// =============================================================================

/**
 * Parameters for fetching questions from the external API.
 * All fields are optional -- sensible defaults are applied.
 */
export interface TriviaApiParams {
  /** Number of questions to fetch (1-50, default 10). */
  limit?: number;
  /** API category values to filter by. */
  categories?: TriviaApiCategory[];
  /** Difficulty levels to filter by. */
  difficulties?: TriviaApiDifficulty[];
  /** Tags to filter by. */
  tags?: string[];
  /** ISO 3166-1 alpha-2 region code. */
  region?: string;
  /** Request timeout in milliseconds. Default 5000. Not included in cache key. */
  timeoutMs?: number;
}

// =============================================================================
// TYPES -- Result (discriminated union)
// =============================================================================

export interface TriviaApiSuccess {
  ok: true;
  questions: TriviaApiQuestion[];
}

export interface TriviaApiError {
  ok: false;
  error: string;
  /** HTTP status code if the error came from a non-200 API response. */
  statusCode?: number;
}

/**
 * Discriminated union result. Callers check `result.ok` to narrow the type.
 * This module never throws -- all failure paths return TriviaApiError.
 */
export type TriviaApiResult = TriviaApiSuccess | TriviaApiError;

// =============================================================================
// URL CONSTRUCTION
// =============================================================================

/**
 * Build the full request URL from TriviaApiParams.
 * All values are properly encoded via URLSearchParams.
 * Exported for testability.
 */
export function buildRequestUrl(params: TriviaApiParams): string {
  const url = new URL(BASE_URL);
  const sp = url.searchParams;

  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  sp.set('limit', String(limit));

  if (params.categories && params.categories.length > 0) {
    sp.set('categories', params.categories.join(','));
  }

  if (params.difficulties && params.difficulties.length > 0) {
    sp.set('difficulties', params.difficulties.join(','));
  }

  if (params.tags && params.tags.length > 0) {
    sp.set('tags', params.tags.join(','));
  }

  if (params.region) {
    sp.set('region', params.region);
  }

  return url.toString();
}

// =============================================================================
// RESPONSE VALIDATION
// =============================================================================

/**
 * Structural check -- is data a TriviaApiQuestion[]?
 * Spot-checks the first element only (performance). Empty arrays are valid.
 */
function isValidQuestionArray(data: unknown): data is TriviaApiQuestion[] {
  if (!Array.isArray(data)) {
    return false;
  }
  if (data.length === 0) {
    return true;
  }
  const first = data[0];
  return (
    typeof first === 'object' &&
    first !== null &&
    typeof (first as Record<string, unknown>).id === 'string' &&
    typeof (first as Record<string, unknown>).correctAnswer === 'string' &&
    Array.isArray((first as Record<string, unknown>).incorrectAnswers) &&
    typeof (first as Record<string, unknown>).question === 'object' &&
    (first as Record<string, unknown>).question !== null &&
    typeof ((first as Record<string, { text: unknown }>).question).text === 'string' &&
    typeof (first as Record<string, unknown>).category === 'string' &&
    typeof (first as Record<string, unknown>).difficulty === 'string'
  );
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch trivia questions from the-trivia-api.com v2.
 *
 * - Returns TriviaApiSuccess on success (even if questions array is empty)
 * - Returns TriviaApiError on any failure (timeout, non-200, parse error, network error)
 * - Never throws -- all failure paths return the error union branch
 * - Optional API key via THE_TRIVIA_API_KEY env var (x-api-key header)
 */
export async function fetchTriviaApiQuestions(
  params: TriviaApiParams = {}
): Promise<TriviaApiResult> {
  const url = buildRequestUrl(params);
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const apiKey = process.env.THE_TRIVIA_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    logger.info('Fetching questions from trivia API', {
      event: 'trivia_api_request',
      url,
      limit: String(params.limit ?? DEFAULT_LIMIT),
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // Ignore body read errors on non-200 responses
      }

      const errorMessage = `Trivia API returned ${response.status}: ${errorBody || response.statusText}`;
      logger.warn('Trivia API non-200 response', {
        event: 'trivia_api_upstream_error',
        statusCode: String(response.status),
        error: errorMessage,
      });

      return {
        ok: false,
        error: errorMessage,
        statusCode: response.status,
      };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (parseError) {
      const errorMessage = `Failed to parse trivia API response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
      logger.error('Trivia API JSON parse error', {
        event: 'trivia_api_parse_error',
        error: errorMessage,
      });
      return { ok: false, error: errorMessage };
    }

    if (!isValidQuestionArray(data)) {
      const errorMessage = `Trivia API returned unexpected response structure (expected array, got ${typeof data})`;
      logger.error('Trivia API invalid response shape', {
        event: 'trivia_api_invalid_shape',
        error: errorMessage,
      });
      return { ok: false, error: errorMessage };
    }

    logger.info('Successfully fetched trivia questions', {
      event: 'trivia_api_success',
      count: String(data.length),
    });

    return { ok: true, questions: data };

  } catch (error) {
    // AbortController fired (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      const errorMessage = `Trivia API request timed out after ${timeoutMs}ms`;
      logger.warn('Trivia API request timed out', {
        event: 'trivia_api_timeout',
        error: errorMessage,
        timeoutMs: String(timeoutMs),
      });
      return { ok: false, error: errorMessage };
    }

    // Network errors (DNS failure, connection refused, etc.)
    const errorMessage = `Trivia API network error: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('Trivia API network error', {
      event: 'trivia_api_network_error',
      error: errorMessage,
    });
    return { ok: false, error: errorMessage };

  } finally {
    clearTimeout(timeoutId);
  }
}
