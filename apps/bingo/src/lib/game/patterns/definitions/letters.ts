import { BingoPattern } from '@/types';
import { cell } from '../validators';
import { createPattern } from '../registry';

/**
 * Letter patterns: 2 patterns (T, L)
 */

// T pattern - top row + middle column
export const LETTER_T = createPattern(
  'letter-t',
  'Letter T',
  'letters',
  [
    // Top row
    cell(0, 0),
    cell(0, 1),
    cell(0, 2),
    cell(0, 3),
    cell(0, 4),
    // Middle column (excluding top)
    cell(1, 2),
    cell(2, 2),
    cell(3, 2),
    cell(4, 2),
  ],
  'Complete the letter T shape'
);

// L pattern - left column + bottom row
export const LETTER_L = createPattern(
  'letter-l',
  'Letter L',
  'letters',
  [
    // Left column
    cell(0, 0),
    cell(1, 0),
    cell(2, 0),
    cell(3, 0),
    cell(4, 0),
    // Bottom row (excluding left corner)
    cell(4, 1),
    cell(4, 2),
    cell(4, 3),
    cell(4, 4),
  ],
  'Complete the letter L shape'
);

export const letterPatterns: BingoPattern[] = [LETTER_T, LETTER_L];
