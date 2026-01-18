import { PatternCell } from '@/types';

/**
 * Create a single pattern cell.
 */
export function cell(row: number, col: number): PatternCell {
  if (row < 0 || row > 4 || col < 0 || col > 4) {
    throw new Error(`Invalid cell position: (${row}, ${col})`);
  }
  return { row, col };
}

/**
 * Create cells for an entire row.
 */
export function row(rowIndex: number): PatternCell[] {
  if (rowIndex < 0 || rowIndex > 4) {
    throw new Error(`Invalid row index: ${rowIndex}`);
  }
  return [0, 1, 2, 3, 4].map((col) => cell(rowIndex, col));
}

/**
 * Create cells for an entire column.
 */
export function column(colIndex: number): PatternCell[] {
  if (colIndex < 0 || colIndex > 4) {
    throw new Error(`Invalid column index: ${colIndex}`);
  }
  return [0, 1, 2, 3, 4].map((r) => cell(r, colIndex));
}

/**
 * Create cells for the diagonal from top-left to bottom-right.
 */
export function diagonalDown(): PatternCell[] {
  return [0, 1, 2, 3, 4].map((i) => cell(i, i));
}

/**
 * Create cells for the diagonal from top-right to bottom-left.
 */
export function diagonalUp(): PatternCell[] {
  return [0, 1, 2, 3, 4].map((i) => cell(i, 4 - i));
}

/**
 * Combine multiple cell arrays into one, removing duplicates.
 */
export function combineCells(...arrays: PatternCell[][]): PatternCell[] {
  const seen = new Set<string>();
  const result: PatternCell[] = [];

  for (const arr of arrays) {
    for (const c of arr) {
      const key = `${c.row},${c.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    }
  }

  return result;
}

/**
 * Check if a cell is the free space (center of the board).
 */
export function isFreeSpace(c: PatternCell): boolean {
  return c.row === 2 && c.col === 2;
}

/**
 * Filter out the free space from a cell array.
 */
export function excludeFreeSpace(cells: PatternCell[]): PatternCell[] {
  return cells.filter((c) => !isFreeSpace(c));
}

/**
 * Add the free space to a cell array if not already present.
 */
export function includeFreeSpace(cells: PatternCell[]): PatternCell[] {
  if (cells.some(isFreeSpace)) {
    return cells;
  }
  return [...cells, cell(2, 2)];
}

/**
 * Create the four corner cells.
 */
export function corners(): PatternCell[] {
  return [cell(0, 0), cell(0, 4), cell(4, 0), cell(4, 4)];
}

/**
 * Create the outer frame (perimeter) cells.
 */
export function outerFrame(): PatternCell[] {
  const cells: PatternCell[] = [];
  // Top row
  for (let col = 0; col <= 4; col++) cells.push(cell(0, col));
  // Bottom row
  for (let col = 0; col <= 4; col++) cells.push(cell(4, col));
  // Left column (excluding corners)
  for (let r = 1; r <= 3; r++) cells.push(cell(r, 0));
  // Right column (excluding corners)
  for (let r = 1; r <= 3; r++) cells.push(cell(r, 4));
  return cells;
}

/**
 * Create the inner frame (one cell in from perimeter) cells.
 */
export function innerFrame(): PatternCell[] {
  const cells: PatternCell[] = [];
  // Top of inner frame
  for (let col = 1; col <= 3; col++) cells.push(cell(1, col));
  // Bottom of inner frame
  for (let col = 1; col <= 3; col++) cells.push(cell(3, col));
  // Left of inner frame (excluding corners)
  cells.push(cell(2, 1));
  // Right of inner frame (excluding corners)
  cells.push(cell(2, 3));
  return cells;
}

/**
 * Validate that all cells in a pattern are within bounds.
 */
export function validateCells(cells: PatternCell[]): boolean {
  return cells.every(
    (c) => c.row >= 0 && c.row <= 4 && c.col >= 0 && c.col <= 4
  );
}

/**
 * Get all 25 cells of the bingo board.
 */
export function allCells(): PatternCell[] {
  const cells: PatternCell[] = [];
  for (let r = 0; r <= 4; r++) {
    for (let c = 0; c <= 4; c++) {
      cells.push(cell(r, c));
    }
  }
  return cells;
}
