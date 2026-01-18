import { describe, it, expect, beforeEach } from 'vitest';
import { patternRegistry, createPattern } from '../registry';
import { BingoPattern } from '@/types';

describe('registry', () => {
  beforeEach(() => {
    patternRegistry.clear();
  });

  describe('createPattern', () => {
    it('creates a pattern with required fields', () => {
      const pattern = createPattern('test', 'Test Pattern', 'lines', [{ row: 0, col: 0 }]);
      expect(pattern.id).toBe('test');
      expect(pattern.name).toBe('Test Pattern');
      expect(pattern.category).toBe('lines');
      expect(pattern.cells).toHaveLength(1);
    });

    it('creates a pattern with optional description', () => {
      const pattern = createPattern(
        'test',
        'Test Pattern',
        'lines',
        [{ row: 0, col: 0 }],
        'A test description'
      );
      expect(pattern.description).toBe('A test description');
    });

    it('creates a pattern without description', () => {
      const pattern = createPattern('test', 'Test Pattern', 'lines', [{ row: 0, col: 0 }]);
      expect(pattern.description).toBeUndefined();
    });
  });

  describe('PatternRegistry', () => {
    const testPattern: BingoPattern = {
      id: 'test-pattern',
      name: 'Test Pattern',
      category: 'lines',
      cells: [{ row: 0, col: 0 }],
    };

    describe('register', () => {
      it('registers a new pattern', () => {
        patternRegistry.register(testPattern);
        expect(patternRegistry.has('test-pattern')).toBe(true);
      });

      it('throws when registering duplicate id', () => {
        patternRegistry.register(testPattern);
        expect(() => patternRegistry.register(testPattern)).toThrow(
          'Pattern with id "test-pattern" already registered'
        );
      });

      it('throws when registering pattern with invalid cells', () => {
        const invalidPattern: BingoPattern = {
          id: 'invalid',
          name: 'Invalid',
          category: 'lines',
          cells: [{ row: 5, col: 0 }], // invalid row
        };
        expect(() => patternRegistry.register(invalidPattern)).toThrow(
          'Pattern "invalid" has invalid cell positions'
        );
      });
    });

    describe('registerAll', () => {
      it('registers multiple patterns', () => {
        const pattern2: BingoPattern = {
          id: 'pattern-2',
          name: 'Pattern 2',
          category: 'shapes',
          cells: [{ row: 1, col: 1 }],
        };
        patternRegistry.registerAll([testPattern, pattern2]);
        expect(patternRegistry.count).toBe(2);
      });

      it('stops on first error', () => {
        const pattern2: BingoPattern = { ...testPattern, id: 'test-pattern' }; // duplicate
        expect(() => patternRegistry.registerAll([testPattern, pattern2])).toThrow();
        expect(patternRegistry.count).toBe(1);
      });
    });

    describe('get', () => {
      it('returns registered pattern', () => {
        patternRegistry.register(testPattern);
        expect(patternRegistry.get('test-pattern')).toEqual(testPattern);
      });

      it('returns undefined for non-existent pattern', () => {
        expect(patternRegistry.get('non-existent')).toBeUndefined();
      });
    });

    describe('has', () => {
      it('returns true for registered pattern', () => {
        patternRegistry.register(testPattern);
        expect(patternRegistry.has('test-pattern')).toBe(true);
      });

      it('returns false for non-existent pattern', () => {
        expect(patternRegistry.has('non-existent')).toBe(false);
      });
    });

    describe('getAll', () => {
      it('returns empty array when no patterns registered', () => {
        expect(patternRegistry.getAll()).toEqual([]);
      });

      it('returns all registered patterns', () => {
        const pattern2: BingoPattern = {
          id: 'pattern-2',
          name: 'Pattern 2',
          category: 'shapes',
          cells: [{ row: 1, col: 1 }],
        };
        patternRegistry.register(testPattern);
        patternRegistry.register(pattern2);
        const all = patternRegistry.getAll();
        expect(all).toHaveLength(2);
        expect(all).toContainEqual(testPattern);
        expect(all).toContainEqual(pattern2);
      });
    });

    describe('getByCategory', () => {
      it('returns patterns in specified category', () => {
        const linesPattern: BingoPattern = {
          id: 'lines-1',
          name: 'Lines 1',
          category: 'lines',
          cells: [{ row: 0, col: 0 }],
        };
        const shapesPattern: BingoPattern = {
          id: 'shapes-1',
          name: 'Shapes 1',
          category: 'shapes',
          cells: [{ row: 1, col: 1 }],
        };
        patternRegistry.register(linesPattern);
        patternRegistry.register(shapesPattern);

        const lines = patternRegistry.getByCategory('lines');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toEqual(linesPattern);
      });

      it('returns empty array for category with no patterns', () => {
        patternRegistry.register(testPattern);
        expect(patternRegistry.getByCategory('corners')).toEqual([]);
      });
    });

    describe('count', () => {
      it('returns 0 when empty', () => {
        expect(patternRegistry.count).toBe(0);
      });

      it('returns correct count after registration', () => {
        patternRegistry.register(testPattern);
        expect(patternRegistry.count).toBe(1);
      });
    });

    describe('getCategories', () => {
      it('returns empty array when no patterns registered', () => {
        expect(patternRegistry.getCategories()).toEqual([]);
      });

      it('returns unique categories', () => {
        const linesPattern: BingoPattern = {
          id: 'lines-1',
          name: 'Lines 1',
          category: 'lines',
          cells: [{ row: 0, col: 0 }],
        };
        const linesPattern2: BingoPattern = {
          id: 'lines-2',
          name: 'Lines 2',
          category: 'lines',
          cells: [{ row: 1, col: 0 }],
        };
        const shapesPattern: BingoPattern = {
          id: 'shapes-1',
          name: 'Shapes 1',
          category: 'shapes',
          cells: [{ row: 1, col: 1 }],
        };
        patternRegistry.register(linesPattern);
        patternRegistry.register(linesPattern2);
        patternRegistry.register(shapesPattern);

        const categories = patternRegistry.getCategories();
        expect(categories).toHaveLength(2);
        expect(categories).toContain('lines');
        expect(categories).toContain('shapes');
      });
    });

    describe('clear', () => {
      it('removes all patterns', () => {
        patternRegistry.register(testPattern);
        expect(patternRegistry.count).toBe(1);
        patternRegistry.clear();
        expect(patternRegistry.count).toBe(0);
      });

      it('allows re-registration after clear', () => {
        patternRegistry.register(testPattern);
        patternRegistry.clear();
        patternRegistry.register(testPattern);
        expect(patternRegistry.has('test-pattern')).toBe(true);
      });
    });
  });
});
