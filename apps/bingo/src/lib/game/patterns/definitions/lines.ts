import { BingoPattern } from '@/types';
import { row, column, diagonalDown, diagonalUp } from '../validators';
import { createPattern } from '../registry';

/**
 * Line patterns: 5 rows, 5 columns, 2 diagonals = 12 patterns
 */

// Row patterns (horizontal lines)
export const ROW_TOP = createPattern(
  'row-top',
  'Top Row',
  'lines',
  row(0),
  'Complete the top row'
);

export const ROW_2 = createPattern(
  'row-2',
  'Second Row',
  'lines',
  row(1),
  'Complete the second row'
);

export const ROW_MIDDLE = createPattern(
  'row-middle',
  'Middle Row',
  'lines',
  row(2),
  'Complete the middle row (includes free space)'
);

export const ROW_4 = createPattern(
  'row-4',
  'Fourth Row',
  'lines',
  row(3),
  'Complete the fourth row'
);

export const ROW_BOTTOM = createPattern(
  'row-bottom',
  'Bottom Row',
  'lines',
  row(4),
  'Complete the bottom row'
);

// Column patterns (vertical lines)
export const COLUMN_B = createPattern(
  'column-b',
  'B Column',
  'lines',
  column(0),
  'Complete the B column'
);

export const COLUMN_I = createPattern(
  'column-i',
  'I Column',
  'lines',
  column(1),
  'Complete the I column'
);

export const COLUMN_N = createPattern(
  'column-n',
  'N Column',
  'lines',
  column(2),
  'Complete the N column (includes free space)'
);

export const COLUMN_G = createPattern(
  'column-g',
  'G Column',
  'lines',
  column(3),
  'Complete the G column'
);

export const COLUMN_O = createPattern(
  'column-o',
  'O Column',
  'lines',
  column(4),
  'Complete the O column'
);

// Diagonal patterns
export const DIAGONAL_DOWN = createPattern(
  'diagonal-down',
  'Diagonal Down',
  'lines',
  diagonalDown(),
  'Complete the diagonal from top-left to bottom-right (includes free space)'
);

export const DIAGONAL_UP = createPattern(
  'diagonal-up',
  'Diagonal Up',
  'lines',
  diagonalUp(),
  'Complete the diagonal from top-right to bottom-left (includes free space)'
);

// Export all line patterns
export const linePatterns: BingoPattern[] = [
  ROW_TOP,
  ROW_2,
  ROW_MIDDLE,
  ROW_4,
  ROW_BOTTOM,
  COLUMN_B,
  COLUMN_I,
  COLUMN_N,
  COLUMN_G,
  COLUMN_O,
  DIAGONAL_DOWN,
  DIAGONAL_UP,
];
