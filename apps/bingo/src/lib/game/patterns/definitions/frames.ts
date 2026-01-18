import { BingoPattern } from '@/types';
import { outerFrame, innerFrame } from '../validators';
import { createPattern } from '../registry';

/**
 * Frame patterns: 2 patterns (large and small frame)
 */

export const LARGE_FRAME = createPattern(
  'large-frame',
  'Large Frame',
  'frames',
  outerFrame(),
  'Complete the outer perimeter of the card'
);

export const SMALL_FRAME = createPattern(
  'small-frame',
  'Small Frame',
  'frames',
  innerFrame(),
  'Complete the inner frame (one cell in from the edge)'
);

export const framePatterns: BingoPattern[] = [LARGE_FRAME, SMALL_FRAME];
