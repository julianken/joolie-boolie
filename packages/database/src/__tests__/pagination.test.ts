import { describe, it, expect } from 'vitest';
import {
  normalizePaginationParams,
  calculatePagination,
  createPaginatedResult,
  encodeCursor,
  decodeCursor,
  calculateRange,
  buildPaginationParams,
  parsePaginationParams,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE,
} from '../pagination';

describe('normalizePaginationParams', () => {
  it('uses defaults when no params provided', () => {
    const result = normalizePaginationParams({});

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(result.offset).toBe(0);
  });

  it('respects provided page and pageSize', () => {
    const result = normalizePaginationParams({ page: 3, pageSize: 10 });

    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.offset).toBe(20);
  });

  it('enforces minimum page', () => {
    const result = normalizePaginationParams({ page: 0 });

    expect(result.page).toBe(MIN_PAGE);
  });

  it('enforces maximum page size', () => {
    const result = normalizePaginationParams({ pageSize: 1000 });

    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('calculates offset correctly', () => {
    expect(normalizePaginationParams({ page: 1, pageSize: 20 }).offset).toBe(0);
    expect(normalizePaginationParams({ page: 2, pageSize: 20 }).offset).toBe(20);
    expect(normalizePaginationParams({ page: 5, pageSize: 10 }).offset).toBe(40);
  });
});

describe('calculatePagination', () => {
  it('calculates pagination without total', () => {
    const result = calculatePagination({ page: 1, pageSize: 20 }, 20);

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBeUndefined();
    expect(result.totalPages).toBeUndefined();
    expect(result.hasMore).toBe(true); // Full page returned, might have more
  });

  it('calculates pagination with total', () => {
    const result = calculatePagination({ page: 1, pageSize: 20 }, 20, 50);

    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(3);
    expect(result.hasMore).toBe(true);
  });

  it('knows when there are no more pages', () => {
    const result = calculatePagination({ page: 3, pageSize: 20 }, 10, 50);

    expect(result.hasMore).toBe(false);
  });

  it('handles partial last page', () => {
    const result = calculatePagination({ page: 1, pageSize: 20 }, 15);

    expect(result.hasMore).toBe(false);
  });
});

describe('createPaginatedResult', () => {
  it('creates result with data and pagination', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = createPaginatedResult(data, { page: 1, pageSize: 20 }, 2);

    expect(result.data).toEqual(data);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe('cursor encoding/decoding', () => {
  it('encodes and decodes string values', () => {
    const original = '2024-01-15T10:30:00.000Z';
    const encoded = encodeCursor(original);
    const decoded = decodeCursor(encoded);

    expect(decoded).toBe(original);
  });

  it('encodes Date objects', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    const encoded = encodeCursor(date);
    const decoded = decodeCursor(encoded);

    expect(decoded).toBe(date.toISOString());
  });

  it('throws on invalid cursor', () => {
    expect(() => decodeCursor('not-valid-base64!!!')).toThrow('Invalid cursor format');
  });
});

describe('calculateRange', () => {
  it('calculates range for first page', () => {
    const [start, end] = calculateRange({ page: 1, pageSize: 20 });

    expect(start).toBe(0);
    expect(end).toBe(19);
  });

  it('calculates range for subsequent pages', () => {
    const [start, end] = calculateRange({ page: 3, pageSize: 10 });

    expect(start).toBe(20);
    expect(end).toBe(29);
  });
});

describe('buildPaginationParams', () => {
  it('builds URLSearchParams from pagination params', () => {
    const params = buildPaginationParams({ page: 2, pageSize: 50 });

    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('50');
  });

  it('includes cursor when provided', () => {
    const params = buildPaginationParams({ cursor: 'abc123' });

    expect(params.get('cursor')).toBe('abc123');
  });

  it('omits undefined values', () => {
    const params = buildPaginationParams({ page: 1 });

    expect(params.has('pageSize')).toBe(false);
    expect(params.has('cursor')).toBe(false);
  });
});

describe('parsePaginationParams', () => {
  it('parses pagination params from URLSearchParams', () => {
    const searchParams = new URLSearchParams('page=3&pageSize=25');
    const result = parsePaginationParams(searchParams);

    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(25);
  });

  it('parses cursor', () => {
    const searchParams = new URLSearchParams('cursor=abc123');
    const result = parsePaginationParams(searchParams);

    expect(result.cursor).toBe('abc123');
  });

  it('returns undefined for missing params', () => {
    const searchParams = new URLSearchParams('');
    const result = parsePaginationParams(searchParams);

    expect(result.page).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.cursor).toBeUndefined();
  });
});
