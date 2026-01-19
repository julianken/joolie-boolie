/**
 * Custom error types for database operations
 */

export type DatabaseErrorCode =
  | 'UNKNOWN'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONNECTION'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'CONSTRAINT_VIOLATION';

/**
 * Base error class for all database operations
 */
export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: DatabaseErrorCode = 'UNKNOWN',
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends DatabaseError {
  constructor(resource: string, id?: string, details?: Record<string, unknown>) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Duplicate resource error (e.g., unique constraint violation)
 */
export class DuplicateError extends DatabaseError {
  constructor(resource: string, field?: string, details?: Record<string, unknown>) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super(message, 'DUPLICATE', 409, details);
    this.name = 'DuplicateError';
  }
}

/**
 * Validation error for invalid data
 */
export class ValidationError extends DatabaseError {
  readonly field?: string;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION', 400, details);
    this.name = 'ValidationError';
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Unauthorized error (not authenticated)
 */
export class UnauthorizedError extends DatabaseError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (authenticated but not allowed)
 */
export class ForbiddenError extends DatabaseError {
  constructor(
    message = 'You do not have permission to perform this action',
    details?: Record<string, unknown>
  ) {
    super(message, 'FORBIDDEN', 403, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * Connection error
 */
export class ConnectionError extends DatabaseError {
  constructor(message = 'Failed to connect to database', details?: Record<string, unknown>) {
    super(message, 'CONNECTION', 503, details);
    this.name = 'ConnectionError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends DatabaseError {
  constructor(message = 'Database operation timed out', details?: Record<string, unknown>) {
    super(message, 'TIMEOUT', 504, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends DatabaseError {
  readonly retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number, details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT', 429, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Constraint violation error (foreign key, check constraint, etc.)
 */
export class ConstraintViolationError extends DatabaseError {
  readonly constraint?: string;

  constructor(message: string, constraint?: string, details?: Record<string, unknown>) {
    super(message, 'CONSTRAINT_VIOLATION', 422, details);
    this.name = 'ConstraintViolationError';
    this.constraint = constraint;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      constraint: this.constraint,
    };
  }
}

// =============================================================================
// Error Utilities
// =============================================================================

/**
 * Type guard to check if an error is a DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Maps Supabase/PostgreSQL error codes to DatabaseError types
 */
export function mapSupabaseError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): DatabaseError {
  const code = error.code || '';
  const message = error.message || 'Unknown database error';
  const details = {
    postgresCode: error.code,
    hint: error.hint,
    details: error.details,
  };

  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (code) {
    // Class 23 - Integrity Constraint Violation
    case '23000': // integrity_constraint_violation
    case '23001': // restrict_violation
    case '23502': // not_null_violation
    case '23503': // foreign_key_violation
    case '23514': // check_violation
      return new ConstraintViolationError(message, code, details);

    case '23505': // unique_violation
      return new DuplicateError('Resource', undefined, details);

    // Class 28 - Invalid Authorization Specification
    case '28000': // invalid_authorization_specification
    case '28P01': // invalid_password
      return new UnauthorizedError(message, details);

    // Class 42 - Syntax Error or Access Rule Violation
    case '42501': // insufficient_privilege
      return new ForbiddenError(message, details);

    // PGRST (PostgREST) error codes
    case 'PGRST116': // No rows returned
      return new NotFoundError('Resource', undefined, details);

    default:
      // Check for common Supabase auth errors in message
      if (message.toLowerCase().includes('jwt') || message.toLowerCase().includes('token')) {
        return new UnauthorizedError(message, details);
      }

      return new DatabaseError(message, 'UNKNOWN', 500, details);
  }
}

/**
 * Wraps a database operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMap?: (error: unknown) => DatabaseError | null
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Try custom error mapping first
    if (errorMap) {
      const mappedError = errorMap(error);
      if (mappedError) {
        throw mappedError;
      }
    }

    // Already a DatabaseError, rethrow
    if (isDatabaseError(error)) {
      throw error;
    }

    // Try to map Supabase error
    if (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error || 'message' in error)
    ) {
      throw mapSupabaseError(error as { code?: string; message?: string });
    }

    // Unknown error
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN',
      500
    );
  }
}
