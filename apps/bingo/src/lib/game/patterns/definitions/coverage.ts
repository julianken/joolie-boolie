import { BingoPattern } from '@/types';
import { cell, allCells } from '../validators';
import { createPattern } from '../registry';

/**
 * Coverage patterns: 5 patterns (4 postage stamps, 1 blackout)
 */

// Postage stamp patterns (2x2 corners)
export const POSTAGE_TOP_LEFT = createPattern(
  'postage-top-left',
  'Postage Stamp (Top Left)',
  'coverage',
  [cell(0, 0), cell(0, 1), cell(1, 0), cell(1, 1)],
  'Complete the 2x2 square in the top-left corner'
);

export const POSTAGE_TOP_RIGHT = createPattern(
  'postage-top-right',
  'Postage Stamp (Top Right)',
  'coverage',
  [cell(0, 3), cell(0, 4), cell(1, 3), cell(1, 4)],
  'Complete the 2x2 square in the top-right corner'
);

export const POSTAGE_BOTTOM_LEFT = createPattern(
  'postage-bottom-left',
  'Postage Stamp (Bottom Left)',
  'coverage',
  [cell(3, 0), cell(3, 1), cell(4, 0), cell(4, 1)],
  'Complete the 2x2 square in the bottom-left corner'
);

export const POSTAGE_BOTTOM_RIGHT = createPattern(
  'postage-bottom-right',
  'Postage Stamp (Bottom Right)',
  'coverage',
  [cell(3, 3), cell(3, 4), cell(4, 3), cell(4, 4)],
  'Complete the 2x2 square in the bottom-right corner'
);

// Blackout - all cells
export const BLACKOUT = createPattern(
  'blackout',
  'Blackout',
  'coverage',
  allCells(),
  'Cover the entire card'
);

export const coveragePatterns: BingoPattern[] = [
  POSTAGE_TOP_LEFT,
  POSTAGE_TOP_RIGHT,
  POSTAGE_BOTTOM_LEFT,
  POSTAGE_BOTTOM_RIGHT,
  BLACKOUT,
];
