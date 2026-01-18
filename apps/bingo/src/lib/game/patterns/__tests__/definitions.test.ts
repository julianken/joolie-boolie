import { describe, it, expect } from 'vitest';
import { linePatterns } from '../definitions/lines';
import { cornerPatterns } from '../definitions/corners';
import { framePatterns } from '../definitions/frames';
import { shapePatterns } from '../definitions/shapes';
import { letterPatterns } from '../definitions/letters';
import { coveragePatterns } from '../definitions/coverage';
import { comboPatterns } from '../definitions/combo';
import { validateCells } from '../validators';
import { BingoPattern } from '@/types';

describe('pattern definitions', () => {
  const allPatterns: BingoPattern[] = [
    ...linePatterns,
    ...cornerPatterns,
    ...framePatterns,
    ...shapePatterns,
    ...letterPatterns,
    ...coveragePatterns,
    ...comboPatterns,
  ];

  describe('linePatterns', () => {
    it('exports 12 line patterns', () => {
      expect(linePatterns).toHaveLength(12);
    });

    it('all patterns have lines category', () => {
      expect(linePatterns.every((p) => p.category === 'lines')).toBe(true);
    });

    it('all patterns have valid cells', () => {
      expect(linePatterns.every((p) => validateCells(p.cells))).toBe(true);
    });

    it('row patterns have 5 cells each', () => {
      const rowPatterns = linePatterns.filter((p) => p.id.startsWith('row'));
      expect(rowPatterns).toHaveLength(5);
      expect(rowPatterns.every((p) => p.cells.length === 5)).toBe(true);
    });

    it('column patterns have 5 cells each', () => {
      const columnPatterns = linePatterns.filter((p) => p.id.startsWith('column'));
      expect(columnPatterns).toHaveLength(5);
      expect(columnPatterns.every((p) => p.cells.length === 5)).toBe(true);
    });

    it('diagonal patterns have 5 cells each', () => {
      const diagonalPatterns = linePatterns.filter((p) => p.id.startsWith('diagonal'));
      expect(diagonalPatterns).toHaveLength(2);
      expect(diagonalPatterns.every((p) => p.cells.length === 5)).toBe(true);
    });
  });

  describe('cornerPatterns', () => {
    it('exports 1 corner pattern', () => {
      expect(cornerPatterns).toHaveLength(1);
    });

    it('four corners has 4 cells', () => {
      const fourCorners = cornerPatterns.find((p) => p.id === 'four-corners');
      expect(fourCorners).toBeDefined();
      expect(fourCorners!.cells).toHaveLength(4);
    });

    it('has corners category', () => {
      expect(cornerPatterns.every((p) => p.category === 'corners')).toBe(true);
    });
  });

  describe('framePatterns', () => {
    it('exports 2 frame patterns', () => {
      expect(framePatterns).toHaveLength(2);
    });

    it('large frame has 16 cells (perimeter)', () => {
      const largeFrame = framePatterns.find((p) => p.id === 'large-frame');
      expect(largeFrame).toBeDefined();
      expect(largeFrame!.cells).toHaveLength(16);
    });

    it('small frame has 8 cells (inner frame)', () => {
      const smallFrame = framePatterns.find((p) => p.id === 'small-frame');
      expect(smallFrame).toBeDefined();
      expect(smallFrame!.cells).toHaveLength(8);
    });

    it('all have frames category', () => {
      expect(framePatterns.every((p) => p.category === 'frames')).toBe(true);
    });
  });

  describe('shapePatterns', () => {
    it('exports 4 shape patterns', () => {
      expect(shapePatterns).toHaveLength(4);
    });

    it('X pattern has 9 cells (both diagonals)', () => {
      const xPattern = shapePatterns.find((p) => p.id === 'x-pattern');
      expect(xPattern).toBeDefined();
      expect(xPattern!.cells).toHaveLength(9); // 5 + 5 - 1 (center overlap)
    });

    it('diamond pattern has 8 cells', () => {
      const diamond = shapePatterns.find((p) => p.id === 'diamond');
      expect(diamond).toBeDefined();
      expect(diamond!.cells).toHaveLength(8);
    });

    it('heart pattern has 12 cells', () => {
      const heart = shapePatterns.find((p) => p.id === 'heart');
      expect(heart).toBeDefined();
      expect(heart!.cells).toHaveLength(12);
    });

    it('cross pattern has 9 cells', () => {
      const cross = shapePatterns.find((p) => p.id === 'cross');
      expect(cross).toBeDefined();
      expect(cross!.cells).toHaveLength(9); // 5 + 5 - 1 (center overlap)
    });

    it('all have shapes category', () => {
      expect(shapePatterns.every((p) => p.category === 'shapes')).toBe(true);
    });
  });

  describe('letterPatterns', () => {
    it('exports 2 letter patterns', () => {
      expect(letterPatterns).toHaveLength(2);
    });

    it('letter T has 9 cells', () => {
      const letterT = letterPatterns.find((p) => p.id === 'letter-t');
      expect(letterT).toBeDefined();
      expect(letterT!.cells).toHaveLength(9);
    });

    it('letter L has 9 cells', () => {
      const letterL = letterPatterns.find((p) => p.id === 'letter-l');
      expect(letterL).toBeDefined();
      expect(letterL!.cells).toHaveLength(9);
    });

    it('all have letters category', () => {
      expect(letterPatterns.every((p) => p.category === 'letters')).toBe(true);
    });
  });

  describe('coveragePatterns', () => {
    it('exports 5 coverage patterns', () => {
      expect(coveragePatterns).toHaveLength(5);
    });

    it('postage stamp patterns have 4 cells each', () => {
      const postagePatterns = coveragePatterns.filter((p) => p.id.startsWith('postage'));
      expect(postagePatterns).toHaveLength(4);
      expect(postagePatterns.every((p) => p.cells.length === 4)).toBe(true);
    });

    it('blackout has 25 cells', () => {
      const blackout = coveragePatterns.find((p) => p.id === 'blackout');
      expect(blackout).toBeDefined();
      expect(blackout!.cells).toHaveLength(25);
    });

    it('all have coverage category', () => {
      expect(coveragePatterns.every((p) => p.category === 'coverage')).toBe(true);
    });
  });

  describe('comboPatterns', () => {
    it('exports 3 combo patterns', () => {
      expect(comboPatterns).toHaveLength(3);
    });

    it('all combo patterns include 4 corners', () => {
      for (const pattern of comboPatterns) {
        // Check that all 4 corners are present
        expect(pattern.cells).toContainEqual({ row: 0, col: 0 });
        expect(pattern.cells).toContainEqual({ row: 0, col: 4 });
        expect(pattern.cells).toContainEqual({ row: 4, col: 0 });
        expect(pattern.cells).toContainEqual({ row: 4, col: 4 });
      }
    });

    it('all have combo category', () => {
      expect(comboPatterns.every((p) => p.category === 'combo')).toBe(true);
    });
  });

  describe('all patterns', () => {
    it('total pattern count is 29', () => {
      expect(allPatterns).toHaveLength(29);
    });

    it('all patterns have unique ids', () => {
      const ids = allPatterns.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allPatterns.length);
    });

    it('all patterns have valid cells', () => {
      for (const pattern of allPatterns) {
        expect(validateCells(pattern.cells)).toBe(true);
      }
    });

    it('all patterns have non-empty names', () => {
      for (const pattern of allPatterns) {
        expect(pattern.name.length).toBeGreaterThan(0);
      }
    });

    it('all patterns have at least one cell', () => {
      for (const pattern of allPatterns) {
        expect(pattern.cells.length).toBeGreaterThan(0);
      }
    });
  });
});
