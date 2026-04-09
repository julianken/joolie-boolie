import { describe, it, expect } from 'vitest';
import { validateEnvironment } from '../env-validation';

describe('env-validation (bingo — standalone)', () => {
  it('should be a no-op that never throws', () => {
    expect(() => validateEnvironment()).not.toThrow();
  });
});
