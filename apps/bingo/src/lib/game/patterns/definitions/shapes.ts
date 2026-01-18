import { BingoPattern } from '@/types';
import { cell, combineCells, diagonalDown, diagonalUp, column, row } from '../validators';
import { createPattern } from '../registry';

/**
 * Shape patterns: 4 patterns (X, diamond, heart, cross)
 */

// X pattern - both diagonals
export const X_PATTERN = createPattern(
  'x-pattern',
  'X Pattern',
  'shapes',
  combineCells(diagonalDown(), diagonalUp()),
  'Complete both diagonals to form an X (includes free space)'
);

// Diamond pattern - rotated square in center
export const DIAMOND = createPattern(
  'diamond',
  'Diamond',
  'shapes',
  [cell(0, 2), cell(1, 1), cell(1, 3), cell(2, 0), cell(2, 4), cell(3, 1), cell(3, 3), cell(4, 2)],
  'Complete the diamond shape'
);

// Heart pattern
export const HEART = createPattern(
  'heart',
  'Heart',
  'shapes',
  [
    // Top bumps
    cell(0, 1),
    cell(0, 3),
    cell(1, 0),
    cell(1, 1),
    cell(1, 2),
    cell(1, 3),
    cell(1, 4),
    // Middle
    cell(2, 0),
    cell(2, 4),
    // Bottom point
    cell(3, 1),
    cell(3, 3),
    cell(4, 2),
  ],
  'Complete the heart shape'
);

// Cross/Plus pattern - middle row and middle column
export const CROSS = createPattern(
  'cross',
  'Cross',
  'shapes',
  combineCells(row(2), column(2)),
  'Complete the cross/plus shape (includes free space)'
);

export const shapePatterns: BingoPattern[] = [X_PATTERN, DIAMOND, HEART, CROSS];
