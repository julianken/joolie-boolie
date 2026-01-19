import { describe, it, expect } from 'vitest';
import {
  DatabaseError,
  NotFoundError,
  DuplicateError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConnectionError,
  TimeoutError,
  RateLimitError,
  ConstraintViolationError,
  isDatabaseError,
  mapSupabaseError,
  withErrorHandling,
} from '../errors';

describe('DatabaseError', () => {
  it('creates error with correct properties', () => {
    const error = new DatabaseError('Test error', 'UNKNOWN', 500, { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('UNKNOWN');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('DatabaseError');
  });

  it('serializes to JSON correctly', () => {
    const error = new DatabaseError('Test error', 'NOT_FOUND', 404);
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'DatabaseError',
      message: 'Test error',
      code: 'NOT_FOUND',
      statusCode: 404,
      details: undefined,
    });
  });
});

describe('NotFoundError', () => {
  it('creates error with resource name', () => {
    const error = new NotFoundError('User');

    expect(error.message).toBe('User not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('creates error with resource name and id', () => {
    const error = new NotFoundError('User', '123');

    expect(error.message).toBe("User with id '123' not found");
  });
});

describe('DuplicateError', () => {
  it('creates error with resource name', () => {
    const error = new DuplicateError('User');

    expect(error.message).toBe('User already exists');
    expect(error.code).toBe('DUPLICATE');
    expect(error.statusCode).toBe(409);
  });

  it('creates error with field name', () => {
    const error = new DuplicateError('User', 'email');

    expect(error.message).toBe('User with this email already exists');
  });
});

describe('ValidationError', () => {
  it('creates error with message and field', () => {
    const error = new ValidationError('Invalid email format', 'email');

    expect(error.message).toBe('Invalid email format');
    expect(error.field).toBe('email');
    expect(error.code).toBe('VALIDATION');
    expect(error.statusCode).toBe(400);
  });

  it('includes field in JSON', () => {
    const error = new ValidationError('Invalid', 'email');
    const json = error.toJSON();

    expect(json.field).toBe('email');
  });
});

describe('UnauthorizedError', () => {
  it('creates error with default message', () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe('Authentication required');
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.statusCode).toBe(401);
  });
});

describe('ForbiddenError', () => {
  it('creates error with default message', () => {
    const error = new ForbiddenError();

    expect(error.message).toBe('You do not have permission to perform this action');
    expect(error.code).toBe('FORBIDDEN');
    expect(error.statusCode).toBe(403);
  });
});

describe('ConnectionError', () => {
  it('creates error with default message', () => {
    const error = new ConnectionError();

    expect(error.message).toBe('Failed to connect to database');
    expect(error.code).toBe('CONNECTION');
    expect(error.statusCode).toBe(503);
  });
});

describe('TimeoutError', () => {
  it('creates error with default message', () => {
    const error = new TimeoutError();

    expect(error.message).toBe('Database operation timed out');
    expect(error.code).toBe('TIMEOUT');
    expect(error.statusCode).toBe(504);
  });
});

describe('RateLimitError', () => {
  it('creates error with retry info', () => {
    const error = new RateLimitError('Too many requests', 60);

    expect(error.message).toBe('Too many requests');
    expect(error.code).toBe('RATE_LIMIT');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
  });

  it('includes retryAfter in JSON', () => {
    const error = new RateLimitError('Rate limited', 30);
    const json = error.toJSON();

    expect(json.retryAfter).toBe(30);
  });
});

describe('ConstraintViolationError', () => {
  it('creates error with constraint name', () => {
    const error = new ConstraintViolationError('Foreign key constraint failed', '23503');

    expect(error.message).toBe('Foreign key constraint failed');
    expect(error.code).toBe('CONSTRAINT_VIOLATION');
    expect(error.statusCode).toBe(422);
    expect(error.constraint).toBe('23503');
  });
});

describe('isDatabaseError', () => {
  it('returns true for DatabaseError instances', () => {
    expect(isDatabaseError(new DatabaseError('test'))).toBe(true);
    expect(isDatabaseError(new NotFoundError('test'))).toBe(true);
    expect(isDatabaseError(new ValidationError('test'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isDatabaseError(new Error('test'))).toBe(false);
    expect(isDatabaseError('string')).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
  });
});

describe('mapSupabaseError', () => {
  it('maps unique violation to DuplicateError', () => {
    const error = mapSupabaseError({ code: '23505', message: 'Duplicate key' });

    expect(error).toBeInstanceOf(DuplicateError);
  });

  it('maps foreign key violation to ConstraintViolationError', () => {
    const error = mapSupabaseError({ code: '23503', message: 'FK constraint' });

    expect(error).toBeInstanceOf(ConstraintViolationError);
  });

  it('maps PGRST116 to NotFoundError', () => {
    const error = mapSupabaseError({ code: 'PGRST116', message: 'No rows' });

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('maps privilege violation to ForbiddenError', () => {
    const error = mapSupabaseError({ code: '42501', message: 'Permission denied' });

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('maps JWT errors to UnauthorizedError', () => {
    const error = mapSupabaseError({ message: 'Invalid JWT token' });

    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it('returns generic DatabaseError for unknown codes', () => {
    const error = mapSupabaseError({ code: 'UNKNOWN', message: 'Something went wrong' });

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.code).toBe('UNKNOWN');
  });
});

describe('withErrorHandling', () => {
  it('returns result on success', async () => {
    const result = await withErrorHandling(async () => 'success');

    expect(result).toBe('success');
  });

  it('rethrows DatabaseError as-is', async () => {
    const originalError = new NotFoundError('Test');

    await expect(
      withErrorHandling(async () => {
        throw originalError;
      })
    ).rejects.toBe(originalError);
  });

  it('maps Supabase errors', async () => {
    await expect(
      withErrorHandling(async () => {
        throw { code: '23505', message: 'Duplicate' };
      })
    ).rejects.toBeInstanceOf(DuplicateError);
  });

  it('wraps unknown errors', async () => {
    await expect(
      withErrorHandling(async () => {
        throw new Error('Unknown');
      })
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  it('uses custom error mapper', async () => {
    const result = await withErrorHandling(
      async () => {
        throw { custom: true };
      },
      (error) => {
        if (typeof error === 'object' && error !== null && 'custom' in error) {
          return new ValidationError('Custom error');
        }
        return null;
      }
    ).catch((e) => e);

    expect(result).toBeInstanceOf(ValidationError);
  });
});
