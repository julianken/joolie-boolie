import { describe, it, expect } from 'vitest';
import {
  cell,
  row,
  column,
  diagonalDown,
  diagonalUp,
  combineCells,
  isFreeSpace,
  excludeFreeSpace,
  includeFreeSpace,
  corners,
  outerFrame,
  innerFrame,
  validateCells,
  allCells,
} from '../validators';

describe('validators', () => {
  describe('cell', () => {
    it('creates a valid cell', () => {
      const c = cell(2, 3);
      expect(c).toEqual({ row: 2, col: 3 });
    });

    it('throws for negative row', () => {
      expect(() => cell(-1, 0)).toThrow('Invalid cell position: (-1, 0)');
    });

    it('throws for negative column', () => {
      expect(() => cell(0, -1)).toThrow('Invalid cell position: (0, -1)');
    });

    it('throws for row > 4', () => {
      expect(() => cell(5, 0)).toThrow('Invalid cell position: (5, 0)');
    });

    it('throws for column > 4', () => {
      expect(() => cell(0, 5)).toThrow('Invalid cell position: (0, 5)');
    });

    it('allows boundary values (0 and 4)', () => {
      expect(cell(0, 0)).toEqual({ row: 0, col: 0 });
      expect(cell(4, 4)).toEqual({ row: 4, col: 4 });
    });
  });

  describe('row', () => {
    it('creates cells for a complete row', () => {
      const cells = row(0);
      expect(cells).toHaveLength(5);
      expect(cells).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
      ]);
    });

    it('throws for invalid row index', () => {
      expect(() => row(-1)).toThrow('Invalid row index: -1');
      expect(() => row(5)).toThrow('Invalid row index: 5');
    });

    it('works for all valid row indices', () => {
      for (let i = 0; i <= 4; i++) {
        const cells = row(i);
        expect(cells).toHaveLength(5);
        expect(cells.every((c) => c.row === i)).toBe(true);
      }
    });
  });

  describe('column', () => {
    it('creates cells for a complete column', () => {
      const cells = column(0);
      expect(cells).toHaveLength(5);
      expect(cells).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
      ]);
    });

    it('throws for invalid column index', () => {
      expect(() => column(-1)).toThrow('Invalid column index: -1');
      expect(() => column(5)).toThrow('Invalid column index: 5');
    });

    it('works for all valid column indices', () => {
      for (let i = 0; i <= 4; i++) {
        const cells = column(i);
        expect(cells).toHaveLength(5);
        expect(cells.every((c) => c.col === i)).toBe(true);
      }
    });
  });

  describe('diagonalDown', () => {
    it('creates cells from top-left to bottom-right', () => {
      const cells = diagonalDown();
      expect(cells).toHaveLength(5);
      expect(cells).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
        { row: 3, col: 3 },
        { row: 4, col: 4 },
      ]);
    });

    it('includes the free space', () => {
      const cells = diagonalDown();
      expect(cells.some((c) => c.row === 2 && c.col === 2)).toBe(true);
    });
  });

  describe('diagonalUp', () => {
    it('creates cells from top-right to bottom-left', () => {
      const cells = diagonalUp();
      expect(cells).toHaveLength(5);
      expect(cells).toEqual([
        { row: 0, col: 4 },
        { row: 1, col: 3 },
        { row: 2, col: 2 },
        { row: 3, col: 1 },
        { row: 4, col: 0 },
      ]);
    });

    it('includes the free space', () => {
      const cells = diagonalUp();
      expect(cells.some((c) => c.row === 2 && c.col === 2)).toBe(true);
    });
  });

  describe('combineCells', () => {
    it('combines multiple cell arrays', () => {
      const cells1 = [{ row: 0, col: 0 }];
      const cells2 = [{ row: 1, col: 1 }];
      const combined = combineCells(cells1, cells2);
      expect(combined).toHaveLength(2);
    });

    it('removes duplicates', () => {
      const cells1 = [{ row: 0, col: 0 }, { row: 1, col: 1 }];
      const cells2 = [{ row: 1, col: 1 }, { row: 2, col: 2 }];
      const combined = combineCells(cells1, cells2);
      expect(combined).toHaveLength(3);
    });

    it('handles empty arrays', () => {
      const combined = combineCells([], []);
      expect(combined).toHaveLength(0);
    });

    it('handles single array', () => {
      const cells = [{ row: 0, col: 0 }];
      const combined = combineCells(cells);
      expect(combined).toEqual(cells);
    });
  });

  describe('isFreeSpace', () => {
    it('returns true for center cell (2,2)', () => {
      expect(isFreeSpace({ row: 2, col: 2 })).toBe(true);
    });

    it('returns false for non-center cells', () => {
      expect(isFreeSpace({ row: 0, col: 0 })).toBe(false);
      expect(isFreeSpace({ row: 2, col: 0 })).toBe(false);
      expect(isFreeSpace({ row: 0, col: 2 })).toBe(false);
    });
  });

  describe('excludeFreeSpace', () => {
    it('removes the free space from array', () => {
      const cells = [
        { row: 0, col: 0 },
        { row: 2, col: 2 },
        { row: 4, col: 4 },
      ];
      const filtered = excludeFreeSpace(cells);
      expect(filtered).toHaveLength(2);
      expect(filtered.some((c) => c.row === 2 && c.col === 2)).toBe(false);
    });

    it('returns same array if no free space', () => {
      const cells = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ];
      const filtered = excludeFreeSpace(cells);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('includeFreeSpace', () => {
    it('adds free space if not present', () => {
      const cells = [{ row: 0, col: 0 }];
      const result = includeFreeSpace(cells);
      expect(result).toHaveLength(2);
      expect(result.some((c) => c.row === 2 && c.col === 2)).toBe(true);
    });

    it('does not duplicate if already present', () => {
      const cells = [
        { row: 0, col: 0 },
        { row: 2, col: 2 },
      ];
      const result = includeFreeSpace(cells);
      expect(result).toHaveLength(2);
    });
  });

  describe('corners', () => {
    it('returns the four corner cells', () => {
      const cornerCells = corners();
      expect(cornerCells).toHaveLength(4);
      expect(cornerCells).toContainEqual({ row: 0, col: 0 });
      expect(cornerCells).toContainEqual({ row: 0, col: 4 });
      expect(cornerCells).toContainEqual({ row: 4, col: 0 });
      expect(cornerCells).toContainEqual({ row: 4, col: 4 });
    });
  });

  describe('outerFrame', () => {
    it('returns 16 cells (perimeter)', () => {
      const frame = outerFrame();
      expect(frame).toHaveLength(16);
    });

    it('includes all corner cells', () => {
      const frame = outerFrame();
      expect(frame).toContainEqual({ row: 0, col: 0 });
      expect(frame).toContainEqual({ row: 0, col: 4 });
      expect(frame).toContainEqual({ row: 4, col: 0 });
      expect(frame).toContainEqual({ row: 4, col: 4 });
    });

    it('includes top and bottom row cells', () => {
      const frame = outerFrame();
      for (let col = 0; col <= 4; col++) {
        expect(frame).toContainEqual({ row: 0, col });
        expect(frame).toContainEqual({ row: 4, col });
      }
    });

    it('includes left and right column cells', () => {
      const frame = outerFrame();
      for (let r = 1; r <= 3; r++) {
        expect(frame).toContainEqual({ row: r, col: 0 });
        expect(frame).toContainEqual({ row: r, col: 4 });
      }
    });

    it('does not include interior cells', () => {
      const frame = outerFrame();
      expect(frame).not.toContainEqual({ row: 1, col: 1 });
      expect(frame).not.toContainEqual({ row: 2, col: 2 });
    });
  });

  describe('innerFrame', () => {
    it('returns 8 cells', () => {
      const frame = innerFrame();
      expect(frame).toHaveLength(8);
    });

    it('includes inner frame cells', () => {
      const frame = innerFrame();
      // Top of inner frame
      expect(frame).toContainEqual({ row: 1, col: 1 });
      expect(frame).toContainEqual({ row: 1, col: 2 });
      expect(frame).toContainEqual({ row: 1, col: 3 });
      // Bottom of inner frame
      expect(frame).toContainEqual({ row: 3, col: 1 });
      expect(frame).toContainEqual({ row: 3, col: 2 });
      expect(frame).toContainEqual({ row: 3, col: 3 });
      // Sides
      expect(frame).toContainEqual({ row: 2, col: 1 });
      expect(frame).toContainEqual({ row: 2, col: 3 });
    });

    it('does not include free space', () => {
      const frame = innerFrame();
      expect(frame).not.toContainEqual({ row: 2, col: 2 });
    });
  });

  describe('validateCells', () => {
    it('returns true for valid cells', () => {
      const cells = [
        { row: 0, col: 0 },
        { row: 2, col: 2 },
        { row: 4, col: 4 },
      ];
      expect(validateCells(cells)).toBe(true);
    });

    it('returns false for invalid row', () => {
      const cells = [{ row: 5, col: 0 }];
      expect(validateCells(cells)).toBe(false);
    });

    it('returns false for invalid column', () => {
      const cells = [{ row: 0, col: 5 }];
      expect(validateCells(cells)).toBe(false);
    });

    it('returns false for negative values', () => {
      expect(validateCells([{ row: -1, col: 0 }])).toBe(false);
      expect(validateCells([{ row: 0, col: -1 }])).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(validateCells([])).toBe(true);
    });
  });

  describe('allCells', () => {
    it('returns 25 cells', () => {
      const cells = allCells();
      expect(cells).toHaveLength(25);
    });

    it('includes all positions from (0,0) to (4,4)', () => {
      const cells = allCells();
      for (let r = 0; r <= 4; r++) {
        for (let c = 0; c <= 4; c++) {
          expect(cells).toContainEqual({ row: r, col: c });
        }
      }
    });
  });
});
