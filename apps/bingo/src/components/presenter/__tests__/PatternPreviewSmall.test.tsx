import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatternPreviewSmall } from '../PatternPreviewSmall';
import { BingoPattern } from '@/types';

describe('PatternPreviewSmall', () => {
  const mockPattern: BingoPattern = {
    id: 'test-pattern',
    name: 'Test Pattern',
    category: 'custom',
    cells: [
      { row: 0, col: 0 }, // B1
      { row: 0, col: 4 }, // O1
      { row: 4, col: 0 }, // B5
      { row: 4, col: 4 }, // O5
    ],
    description: 'A four corners pattern',
  };

  describe('rendering', () => {
    it('renders a 5x5 grid of cells', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      // Should have 25 cells in the grid
      const cells = document.querySelectorAll('[class*="rounded-sm"]');
      expect(cells.length).toBe(25);
    });

    it('marks pattern cells as filled', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      // Pattern has 4 cells + free space = 5 marked cells
      const markedCells = document.querySelectorAll('.bg-primary');
      expect(markedCells.length).toBe(5); // 4 corners + free space
    });

    it('always marks free space as filled', () => {
      const patternWithoutFreeSpace: BingoPattern = {
        id: 'no-free-space',
        name: 'No Free Space',
        category: 'custom',
        cells: [{ row: 0, col: 0 }], // Only B1, not free space
      };

      render(<PatternPreviewSmall pattern={patternWithoutFreeSpace} />);

      // Should have 2 marked cells: B1 + auto-included free space
      const markedCells = document.querySelectorAll('.bg-primary');
      expect(markedCells.length).toBe(2);
    });

    it('has accessible role and label', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      // The component should have an aria-label
      const container = screen.getByLabelText(`Pattern preview: ${mockPattern.name}`);
      expect(container).toBeInTheDocument();

      // The grid should have img role
      const grid = screen.getByRole('img', { name: /Test Pattern pattern grid/i });
      expect(grid).toBeInTheDocument();
    });
  });

  describe('name display', () => {
    it('does not show name by default', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      // Name should not be directly visible
      expect(screen.queryByText('Test Pattern')).not.toBeInTheDocument();
    });

    it('shows name when showName is true', () => {
      render(<PatternPreviewSmall pattern={mockPattern} showName />);

      expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    });
  });

  describe('cell size', () => {
    it('uses default cell size of 16px', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      const grid = screen.getByRole('img');
      // 16px * 5 cells + 4 gaps * 2px = 88px (approx)
      expect(grid.style.gridTemplateColumns).toContain('16px');
    });

    it('uses custom cell size when provided', () => {
      render(<PatternPreviewSmall pattern={mockPattern} cellSize={24} />);

      const grid = screen.getByRole('img');
      expect(grid.style.gridTemplateColumns).toContain('24px');
    });
  });

  describe('custom className', () => {
    it('applies custom className to container', () => {
      render(<PatternPreviewSmall pattern={mockPattern} className="my-custom-class" />);

      const container = screen.getByLabelText(`Pattern preview: ${mockPattern.name}`);
      expect(container.className).toContain('my-custom-class');
    });
  });

  describe('pattern variations', () => {
    it('renders empty pattern correctly', () => {
      const emptyPattern: BingoPattern = {
        id: 'empty',
        name: 'Empty',
        category: 'custom',
        cells: [],
      };

      render(<PatternPreviewSmall pattern={emptyPattern} />);

      // Only free space should be marked
      const markedCells = document.querySelectorAll('.bg-primary');
      expect(markedCells.length).toBe(1);
    });

    it('renders full blackout pattern correctly', () => {
      const cells = [];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          cells.push({ row, col });
        }
      }

      const blackoutPattern: BingoPattern = {
        id: 'blackout',
        name: 'Blackout',
        category: 'custom',
        cells,
      };

      render(<PatternPreviewSmall pattern={blackoutPattern} />);

      // All 25 cells should be marked
      const markedCells = document.querySelectorAll('.bg-primary');
      expect(markedCells.length).toBe(25);
    });

    it('renders diagonal pattern correctly', () => {
      const diagonalPattern: BingoPattern = {
        id: 'diagonal',
        name: 'Diagonal',
        category: 'custom',
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
          { row: 2, col: 2 }, // free space
          { row: 3, col: 3 },
          { row: 4, col: 4 },
        ],
      };

      render(<PatternPreviewSmall pattern={diagonalPattern} />);

      // 5 diagonal cells should be marked
      const markedCells = document.querySelectorAll('.bg-primary');
      expect(markedCells.length).toBe(5);
    });
  });

  describe('styling', () => {
    it('applies correct styles to marked cells', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      const markedCells = document.querySelectorAll('.bg-primary');
      markedCells.forEach((cell) => {
        expect(cell.className).toContain('rounded-sm');
      });
    });

    it('applies correct styles to unmarked cells', () => {
      render(<PatternPreviewSmall pattern={mockPattern} />);

      const unmarkedCells = document.querySelectorAll('.bg-muted\\/30');
      unmarkedCells.forEach((cell) => {
        expect(cell.className).toContain('border');
        expect(cell.className).toContain('rounded-sm');
      });
    });
  });
});
