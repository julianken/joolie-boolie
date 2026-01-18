import { BingoPattern } from '@/types';
import { corners, row, column, diagonalDown, combineCells } from '../validators';
import { createPattern } from '../registry';

/**
 * Combo patterns: 3 patterns (corners + row/column/diagonal)
 */

// Four corners plus middle row
export const CORNERS_PLUS_ROW = createPattern(
  'corners-plus-row',
  'Corners + Middle Row',
  'combo',
  combineCells(corners(), row(2)),
  'Complete four corners and the middle row'
);

// Four corners plus N column
export const CORNERS_PLUS_COLUMN = createPattern(
  'corners-plus-column',
  'Corners + N Column',
  'combo',
  combineCells(corners(), column(2)),
  'Complete four corners and the N column'
);

// Four corners plus diagonal
export const CORNERS_PLUS_DIAGONAL = createPattern(
  'corners-plus-diagonal',
  'Corners + Diagonal',
  'combo',
  combineCells(corners(), diagonalDown()),
  'Complete four corners and the diagonal'
);

export const comboPatterns: BingoPattern[] = [
  CORNERS_PLUS_ROW,
  CORNERS_PLUS_COLUMN,
  CORNERS_PLUS_DIAGONAL,
];
