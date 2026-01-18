// Pattern registry
export { patternRegistry, createPattern } from './registry';

// Pattern validators/utilities
export {
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
} from './validators';

// Pattern definitions
export { linePatterns } from './definitions/lines';
export { cornerPatterns } from './definitions/corners';
export { framePatterns } from './definitions/frames';
export { shapePatterns } from './definitions/shapes';
export { letterPatterns } from './definitions/letters';
export { coveragePatterns } from './definitions/coverage';
export { comboPatterns } from './definitions/combo';

// Individual pattern exports for direct access
export * from './definitions/lines';
export * from './definitions/corners';
export * from './definitions/frames';
export * from './definitions/shapes';
export * from './definitions/letters';
export * from './definitions/coverage';
export * from './definitions/combo';

// Import and register all patterns
import { patternRegistry } from './registry';
import { linePatterns } from './definitions/lines';
import { cornerPatterns } from './definitions/corners';
import { framePatterns } from './definitions/frames';
import { shapePatterns } from './definitions/shapes';
import { letterPatterns } from './definitions/letters';
import { coveragePatterns } from './definitions/coverage';
import { comboPatterns } from './definitions/combo';

/**
 * All MVP patterns combined.
 * Total: 29 patterns
 * - Lines: 12 (5 rows + 5 columns + 2 diagonals)
 * - Corners: 1
 * - Frames: 2
 * - Shapes: 4
 * - Letters: 2
 * - Coverage: 5
 * - Combo: 3
 */
export const allPatterns = [
  ...linePatterns,
  ...cornerPatterns,
  ...framePatterns,
  ...shapePatterns,
  ...letterPatterns,
  ...coveragePatterns,
  ...comboPatterns,
];

/**
 * Initialize the pattern registry with all MVP patterns.
 * Call this once at app startup.
 */
export function initializePatterns(): void {
  if (patternRegistry.count === 0) {
    patternRegistry.registerAll(allPatterns);
  }
}

// Auto-initialize patterns on module load
initializePatterns();
