/**
 * Common query patterns for database operations
 */

import type { TypedSupabaseClient } from './client';
import type { Database, TableName, TableRow, TableInsert, TableUpdate } from './types';
import { NotFoundError, withErrorHandling } from './errors';
import {
  type PaginationParams,
  type PaginatedResult,
  normalizePaginationParams,
  calculateRange,
  createPaginatedResult,
} from './pagination';
import {
  type FilterCondition,
  type SortCondition,
  applyFilters,
  applySorts,
  applyTextSearch,
} from './filters';

// =============================================================================
// Types
// =============================================================================

export interface QueryOptions {
  /** Columns to select (default: all) */
  select?: string;
  /** Filter conditions */
  filters?: FilterCondition[];
  /** Sort conditions */
  sort?: SortCondition[];
  /** Enable count for pagination */
  count?: boolean;
}

export interface ListOptions extends QueryOptions, PaginationParams {
  /** Search query for text search */
  search?: string;
  /** Columns to search in */
  searchColumns?: string[];
}

// =============================================================================
// Generic Query Functions
// =============================================================================

/**
 * Gets a single record by ID
 */
export async function getById<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  id: string,
  options: Pick<QueryOptions, 'select'> = {}
): Promise<TableRow<T>> {
  return withErrorHandling(async () => {
    const { data, error } = await client
      .from(table)
      .select(options.select ?? '*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(table, id);
      }
      throw error;
    }

    return data as TableRow<T>;
  });
}

/**
 * Gets a single record matching filters
 */
export async function getOne<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  options: QueryOptions = {}
): Promise<TableRow<T> | null> {
  return withErrorHandling(async () => {
    let query = client.from(table).select(options.select ?? '*');

    if (options.filters) {
      query = applyFilters(query, options.filters);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      throw error;
    }

    return data as TableRow<T> | null;
  });
}

/**
 * Lists records with pagination, filtering, and sorting
 */
export async function list<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  options: ListOptions = {}
): Promise<PaginatedResult<TableRow<T>>> {
  return withErrorHandling(async () => {
    const { page, pageSize } = normalizePaginationParams(options);
    const [rangeStart, rangeEnd] = calculateRange(options);

    // Build query with count if requested
    let query = client
      .from(table)
      .select(options.select ?? '*', { count: options.count ? 'exact' : undefined });

    // Apply filters
    if (options.filters) {
      query = applyFilters(query, options.filters);
    }

    // Apply text search
    if (options.search && options.searchColumns && options.searchColumns.length > 0) {
      query = applyTextSearch(query, options.search, options.searchColumns);
    }

    // Apply sorting
    if (options.sort && options.sort.length > 0) {
      query = applySorts(query, options.sort);
    } else {
      // Default sort by created_at descending
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination range
    query = query.range(rangeStart, rangeEnd);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return createPaginatedResult(
      (data ?? []) as TableRow<T>[],
      { page, pageSize },
      count ?? undefined
    );
  });
}

/**
 * Lists all records (no pagination)
 */
export async function listAll<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  options: QueryOptions = {}
): Promise<TableRow<T>[]> {
  return withErrorHandling(async () => {
    let query = client.from(table).select(options.select ?? '*');

    if (options.filters) {
      query = applyFilters(query, options.filters);
    }

    if (options.sort && options.sort.length > 0) {
      query = applySorts(query, options.sort);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []) as TableRow<T>[];
  });
}

/**
 * Creates a new record
 */
export async function create<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  data: TableInsert<T>,
  options: Pick<QueryOptions, 'select'> = {}
): Promise<TableRow<T>> {
  return withErrorHandling(async () => {
    const { data: created, error } = await client
      .from(table)
      .insert(data as Database['public']['Tables'][T]['Insert'])
      .select(options.select ?? '*')
      .single();

    if (error) {
      throw error;
    }

    return created as TableRow<T>;
  });
}

/**
 * Creates multiple records
 */
export async function createMany<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  data: TableInsert<T>[],
  options: Pick<QueryOptions, 'select'> = {}
): Promise<TableRow<T>[]> {
  return withErrorHandling(async () => {
    const { data: created, error } = await client
      .from(table)
      .insert(data as Database['public']['Tables'][T]['Insert'][])
      .select(options.select ?? '*');

    if (error) {
      throw error;
    }

    return (created ?? []) as TableRow<T>[];
  });
}

/**
 * Updates a record by ID
 */
export async function update<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  id: string,
  data: TableUpdate<T>,
  options: Pick<QueryOptions, 'select'> = {}
): Promise<TableRow<T>> {
  return withErrorHandling(async () => {
    const { data: updated, error } = await client
      .from(table)
      .update(data as Database['public']['Tables'][T]['Update'])
      .eq('id', id)
      .select(options.select ?? '*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(table, id);
      }
      throw error;
    }

    return updated as TableRow<T>;
  });
}

/**
 * Updates multiple records matching filters
 */
export async function updateMany<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  data: TableUpdate<T>,
  filterConditions: FilterCondition[],
  options: Pick<QueryOptions, 'select'> = {}
): Promise<TableRow<T>[]> {
  return withErrorHandling(async () => {
    let query = client.from(table).update(data as Database['public']['Tables'][T]['Update']);

    query = applyFilters(query, filterConditions);

    const { data: updated, error } = await query.select(options.select ?? '*');

    if (error) {
      throw error;
    }

    return (updated ?? []) as TableRow<T>[];
  });
}

/**
 * Deletes a record by ID
 */
export async function remove<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  id: string
): Promise<void> {
  return withErrorHandling(async () => {
    const { error } = await client.from(table).delete().eq('id', id);

    if (error) {
      throw error;
    }
  });
}

/**
 * Deletes multiple records matching filters
 */
export async function removeMany<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  filterConditions: FilterCondition[]
): Promise<void> {
  return withErrorHandling(async () => {
    let query = client.from(table).delete();
    query = applyFilters(query, filterConditions);

    const { error } = await query;

    if (error) {
      throw error;
    }
  });
}

/**
 * Counts records matching filters
 */
export async function count<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  filterConditions?: FilterCondition[]
): Promise<number> {
  return withErrorHandling(async () => {
    let query = client.from(table).select('*', { count: 'exact', head: true });

    if (filterConditions) {
      query = applyFilters(query, filterConditions);
    }

    const { count: total, error } = await query;

    if (error) {
      throw error;
    }

    return total ?? 0;
  });
}

/**
 * Checks if a record exists
 */
export async function exists<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  filterConditions: FilterCondition[]
): Promise<boolean> {
  const total = await count(client, table, filterConditions);
  return total > 0;
}

/**
 * Upserts a record (insert or update based on conflict)
 */
export async function upsert<T extends TableName>(
  client: TypedSupabaseClient,
  table: T,
  data: TableInsert<T>,
  options: Pick<QueryOptions, 'select'> & { onConflict?: string } = {}
): Promise<TableRow<T>> {
  return withErrorHandling(async () => {
    const { data: upserted, error } = await client
      .from(table)
      .upsert(data as Database['public']['Tables'][T]['Insert'], {
        onConflict: options.onConflict,
      })
      .select(options.select ?? '*')
      .single();

    if (error) {
      throw error;
    }

    return upserted as TableRow<T>;
  });
}
