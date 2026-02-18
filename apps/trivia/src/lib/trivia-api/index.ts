/**
 * Barrel export for the trivia-api module.
 * Server-only -- all exports are used by BFF routes only.
 */

// Client (types + fetch function)
export type {
  TriviaApiCategory,
  TriviaApiDifficulty,
  TriviaApiQuestion,
  TriviaApiParams,
  TriviaApiResult,
  TriviaApiSuccess,
  TriviaApiError,
} from './client';

export { fetchTriviaApiQuestions, buildRequestUrl } from './client';

// Cache
export {
  getCached,
  setCached,
  clearCache,
  getCacheSize,
  buildCacheKey,
} from './cache';
