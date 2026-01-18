import { BingoPattern } from '@/types';
import { corners } from '../validators';
import { createPattern } from '../registry';

/**
 * Corner patterns: 1 pattern
 */

export const FOUR_CORNERS = createPattern(
  'four-corners',
  'Four Corners',
  'corners',
  corners(),
  'Mark all four corner squares'
);

export const cornerPatterns: BingoPattern[] = [FOUR_CORNERS];
