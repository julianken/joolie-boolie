/**
 * Pagination utilities for database queries
 */

// =============================================================================
// Types
// =============================================================================

export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Use cursor-based pagination instead */
  cursor?: string;
}

export interface PaginatedResult<T> {
  /** The data items */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page (1-indexed) */
    page: number;
    /** Items per page */
    pageSize: number;
    /** Total number of items (if known) */
    total?: number;
    /** Total number of pages (if total is known) */
    totalPages?: number;
    /** Whether there are more items */
    hasMore: boolean;
    /** Cursor for the next page (for cursor-based pagination) */
    nextCursor?: string;
    /** Cursor for the previous page (for cursor-based pagination) */
    prevCursor?: string;
  };
}

export interface CursorPaginationParams {
  /** Cursor for the starting point */
  cursor?: string;
  /** Direction to paginate */
  direction?: 'forward' | 'backward';
  /** Number of items to fetch */
  limit?: number;
  /** Field to use for cursor (default: 'created_at') */
  cursorField?: string;
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE = 1;

// =============================================================================
// Functions
// =============================================================================

/**
 * Normalizes pagination parameters with defaults and validation
 */
export function normalizePaginationParams(params: PaginationParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(MIN_PAGE, params.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Calculates pagination metadata from results
 */
export function calculatePagination(
  params: { page: number; pageSize: number },
  resultCount: number,
  total?: number
): PaginatedResult<never>['pagination'] {
  const totalPages = total !== undefined ? Math.ceil(total / params.pageSize) : undefined;
  const hasMore =
    total !== undefined ? params.page < (totalPages ?? 0) : resultCount === params.pageSize;

  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages,
    hasMore,
  };
}

/**
 * Creates a paginated result object
 */
export function createPaginatedResult<T>(
  data: T[],
  params: { page: number; pageSize: number },
  total?: number
): PaginatedResult<T> {
  return {
    data,
    pagination: calculatePagination(params, data.length, total),
  };
}

/**
 * Encodes a cursor value for use in URLs
 */
export function encodeCursor(value: string | Date): string {
  const stringValue = value instanceof Date ? value.toISOString() : value;
  return Buffer.from(stringValue).toString('base64');
}

/**
 * Decodes a cursor value from URL
 */
export function decodeCursor(cursor: string): string {
  // Check if the cursor is valid base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cursor)) {
    throw new Error('Invalid cursor format');
  }

  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    // Re-encode to verify it was valid base64
    const reencoded = Buffer.from(decoded, 'utf-8').toString('base64');
    // Padding may differ, so compare without padding
    if (cursor.replace(/=+$/, '') !== reencoded.replace(/=+$/, '')) {
      throw new Error('Invalid cursor format');
    }
    return decoded;
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Calculates range for Supabase query
 * Returns [start, end] for .range() method
 */
export function calculateRange(params: PaginationParams): [number, number] {
  const { offset, pageSize } = normalizePaginationParams(params);
  return [offset, offset + pageSize - 1];
}

/**
 * Extracts cursor from a record for cursor-based pagination
 */
export function extractCursor<T extends Record<string, unknown>>(
  record: T,
  cursorField: string = 'created_at'
): string | null {
  const value = record[cursorField];
  if (value === undefined || value === null) {
    return null;
  }
  return encodeCursor(String(value));
}

/**
 * Creates cursor-based pagination result
 */
export function createCursorPaginatedResult<T extends Record<string, unknown>>(
  data: T[],
  params: CursorPaginationParams
): PaginatedResult<T> {
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const cursorField = params.cursorField ?? 'created_at';
  const hasMore = data.length === limit;

  const firstItem = data[0];
  const lastItem = data[data.length - 1];

  return {
    data,
    pagination: {
      page: 1, // Not applicable for cursor pagination
      pageSize: limit,
      hasMore,
      nextCursor: hasMore && lastItem ? extractCursor(lastItem, cursorField) ?? undefined : undefined,
      prevCursor: firstItem ? extractCursor(firstItem, cursorField) ?? undefined : undefined,
    },
  };
}

/**
 * Builds URL search params for pagination
 */
export function buildPaginationParams(params: PaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.pageSize !== undefined) {
    searchParams.set('pageSize', String(params.pageSize));
  }
  if (params.cursor !== undefined) {
    searchParams.set('cursor', params.cursor);
  }

  return searchParams;
}

/**
 * Parses pagination params from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = searchParams.get('page');
  const pageSize = searchParams.get('pageSize');
  const cursor = searchParams.get('cursor');

  return {
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    cursor: cursor ?? undefined,
  };
}
