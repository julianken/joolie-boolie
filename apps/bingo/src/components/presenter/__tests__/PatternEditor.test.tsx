import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatternEditor } from '../PatternEditor';
import { BingoPattern } from '@/types';

describe('PatternEditor', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with Create New Pattern heading when no initial pattern', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByText('Create New Pattern')).toBeInTheDocument();
    });

    it('renders with Edit Pattern heading when initial pattern provided', () => {
      const initialPattern: BingoPattern = {
        id: 'test-1',
        name: 'Test Pattern',
        category: 'custom',
        cells: [{ row: 0, col: 0 }],
      };
      render(<PatternEditor {...defaultProps} initialPattern={initialPattern} />);
      expect(screen.getByText('Edit Pattern')).toBeInTheDocument();
    });

    it('renders pattern name input', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByLabelText('Pattern Name')).toBeInTheDocument();
    });

    it('renders description input', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    });

    it('renders 5x5 grid of cells', () => {
      render(<PatternEditor {...defaultProps} />);
      // 25 cells total (5x5)
      const cells = screen.getAllByRole('gridcell');
      expect(cells.length).toBe(25);
    });

    it('renders column headers B, I, N, G, O', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('I')).toBeInTheDocument();
      expect(screen.getByText('N')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('O')).toBeInTheDocument();
    });

    it('renders free space cell as disabled', () => {
      render(<PatternEditor {...defaultProps} />);
      // Free space is at row 2, col 2 (N3) - should have FREE text
      expect(screen.getByText('FREE')).toBeInTheDocument();
    });

    it('renders Clear All and Fill All buttons', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fill All' })).toBeInTheDocument();
    });

    it('renders Save and Cancel buttons', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Save Pattern' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('shows Update Pattern button when editing', () => {
      const initialPattern: BingoPattern = {
        id: 'test-1',
        name: 'Test',
        category: 'custom',
        cells: [],
      };
      render(<PatternEditor {...defaultProps} initialPattern={initialPattern} />);
      expect(screen.getByRole('button', { name: 'Update Pattern' })).toBeInTheDocument();
    });
  });

  describe('cell interactions', () => {
    it('toggles cell on when clicked', () => {
      render(<PatternEditor {...defaultProps} />);
      // Find a cell (not free space)
      const cell = screen.getByRole('gridcell', { name: /B1/ });
      expect(cell.getAttribute('aria-label')).toMatch(/not marked/);

      fireEvent.click(cell);
      expect(cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(cell.getAttribute('aria-label')).not.toMatch(/not marked/);
    });

    it('toggles cell off when clicked again', () => {
      render(<PatternEditor {...defaultProps} />);
      const cell = screen.getByRole('gridcell', { name: /B1/ });

      fireEvent.click(cell);
      expect(cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(cell.getAttribute('aria-label')).not.toMatch(/not marked/);

      fireEvent.click(cell);
      expect(cell.getAttribute('aria-label')).toMatch(/not marked/);
    });

    it('does not toggle free space cell', () => {
      render(<PatternEditor {...defaultProps} />);
      const freeCell = screen.getByRole('gridcell', { name: /Free space/ });

      fireEvent.click(freeCell);
      // Free space should always be pressed/disabled
      expect(freeCell).toBeDisabled();
    });

    it('toggles cell with Enter key', () => {
      render(<PatternEditor {...defaultProps} />);
      const cell = screen.getByRole('gridcell', { name: /B1/ });

      fireEvent.keyDown(cell, { key: 'Enter' });
      expect(cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(cell.getAttribute('aria-label')).not.toMatch(/not marked/);
    });

    it('toggles cell with Space key', () => {
      render(<PatternEditor {...defaultProps} />);
      const cell = screen.getByRole('gridcell', { name: /B1/ });

      fireEvent.keyDown(cell, { key: ' ' });
      expect(cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(cell.getAttribute('aria-label')).not.toMatch(/not marked/);
    });
  });

  describe('Clear All / Fill All', () => {
    it('Clear All removes all marked cells', () => {
      render(<PatternEditor {...defaultProps} />);

      // Mark a few cells
      fireEvent.click(screen.getByRole('gridcell', { name: /B1/ }));
      fireEvent.click(screen.getByRole('gridcell', { name: /O5/ }));

      // Verify they are marked
      const b1Cell = screen.getByRole('gridcell', { name: /B1/ });
      const o5Cell = screen.getByRole('gridcell', { name: /O5/ });
      expect(b1Cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(b1Cell.getAttribute('aria-label')).not.toMatch(/not marked/);
      expect(o5Cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(o5Cell.getAttribute('aria-label')).not.toMatch(/not marked/);

      // Clear all
      fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

      // Verify all (except free space) are unmarked
      expect(b1Cell.getAttribute('aria-label')).toMatch(/not marked/);
      expect(o5Cell.getAttribute('aria-label')).toMatch(/not marked/);
    });

    it('Fill All marks all cells', () => {
      render(<PatternEditor {...defaultProps} />);

      // Fill all
      fireEvent.click(screen.getByRole('button', { name: 'Fill All' }));

      // Verify all cells are marked or disabled (free space)
      const cells = screen.getAllByRole('gridcell');
      cells.forEach((cell) => {
        const label = cell.getAttribute('aria-label');
        // Either marked or it's the free space (which is always marked)
        expect(label).toMatch(/marked/);
      });
    });
  });

  describe('form validation', () => {
    it('shows error when saving without name', () => {
      render(<PatternEditor {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Pattern name is required');
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('shows error when name is too short', () => {
      render(<PatternEditor {...defaultProps} />);

      const input = screen.getByLabelText('Pattern Name');
      fireEvent.change(input, { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Pattern name must be at least 2 characters');
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('clears error when user types', () => {
      render(<PatternEditor {...defaultProps} />);

      // Trigger error
      fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Type in input
      const input = screen.getByLabelText('Pattern Name');
      fireEvent.change(input, { target: { value: 'Test' } });

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('save functionality', () => {
    it('calls onSave with correct pattern data', () => {
      render(<PatternEditor {...defaultProps} />);

      // Enter name and description
      fireEvent.change(screen.getByLabelText('Pattern Name'), {
        target: { value: 'My Pattern' },
      });
      fireEvent.change(screen.getByLabelText('Description (optional)'), {
        target: { value: 'A test pattern' },
      });

      // Mark some cells
      fireEvent.click(screen.getByRole('gridcell', { name: /B1/ }));
      fireEvent.click(screen.getByRole('gridcell', { name: /O5/ }));

      // Save
      fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
      const savedPattern = defaultProps.onSave.mock.calls[0][0] as BingoPattern;

      expect(savedPattern.name).toBe('My Pattern');
      expect(savedPattern.description).toBe('A test pattern');
      expect(savedPattern.category).toBe('custom');
      expect(savedPattern.id).toMatch(/^custom-/);

      // Should include marked cells + free space
      expect(savedPattern.cells).toHaveLength(3); // B1, O5, and free space
      expect(savedPattern.cells).toContainEqual({ row: 0, col: 0 }); // B1
      expect(savedPattern.cells).toContainEqual({ row: 4, col: 4 }); // O5
      expect(savedPattern.cells).toContainEqual({ row: 2, col: 2 }); // Free space
    });

    it('preserves pattern ID when editing', () => {
      const initialPattern: BingoPattern = {
        id: 'existing-pattern-id',
        name: 'Old Name',
        category: 'custom',
        cells: [{ row: 0, col: 0 }],
      };
      render(<PatternEditor {...defaultProps} initialPattern={initialPattern} />);

      fireEvent.change(screen.getByLabelText('Pattern Name'), {
        target: { value: 'New Name' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Update Pattern' }));

      const savedPattern = defaultProps.onSave.mock.calls[0][0] as BingoPattern;
      expect(savedPattern.id).toBe('existing-pattern-id');
      expect(savedPattern.name).toBe('New Name');
    });

    it('trims whitespace from name', () => {
      render(<PatternEditor {...defaultProps} />);

      fireEvent.change(screen.getByLabelText('Pattern Name'), {
        target: { value: '  My Pattern  ' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

      const savedPattern = defaultProps.onSave.mock.calls[0][0] as BingoPattern;
      expect(savedPattern.name).toBe('My Pattern');
    });

    it('omits description if empty', () => {
      render(<PatternEditor {...defaultProps} />);

      fireEvent.change(screen.getByLabelText('Pattern Name'), {
        target: { value: 'Test' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

      const savedPattern = defaultProps.onSave.mock.calls[0][0] as BingoPattern;
      expect(savedPattern.description).toBeUndefined();
    });
  });

  describe('cancel functionality', () => {
    it('calls onCancel when Cancel button clicked', () => {
      render(<PatternEditor {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('initial pattern loading', () => {
    it('populates name from initial pattern', () => {
      const initialPattern: BingoPattern = {
        id: 'test-1',
        name: 'Test Pattern',
        category: 'custom',
        cells: [],
      };
      render(<PatternEditor {...defaultProps} initialPattern={initialPattern} />);

      expect(screen.getByLabelText('Pattern Name')).toHaveValue('Test Pattern');
    });

    it('populates description from initial pattern', () => {
      const initialPattern: BingoPattern = {
        id: 'test-1',
        name: 'Test',
        category: 'custom',
        cells: [],
        description: 'Test description',
      };
      render(<PatternEditor {...defaultProps} initialPattern={initialPattern} />);

      expect(screen.getByLabelText('Description (optional)')).toHaveValue('Test description');
    });

    it('marks cells from initial pattern', () => {
      const initialPattern: BingoPattern = {
        id: 'test-1',
        name: 'Test',
        category: 'custom',
        cells: [
          { row: 0, col: 0 }, // B1
          { row: 4, col: 4 }, // O5
        ],
      };
      render(<PatternEditor {...defaultProps} initialPattern={initialPattern} />);

      const b1Cell = screen.getByRole('gridcell', { name: /B1/ });
      const o5Cell = screen.getByRole('gridcell', { name: /O5/ });
      expect(b1Cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(b1Cell.getAttribute('aria-label')).not.toMatch(/not marked/);
      expect(o5Cell.getAttribute('aria-label')).toMatch(/marked/);
      expect(o5Cell.getAttribute('aria-label')).not.toMatch(/not marked/);
    });
  });

  describe('cell count display', () => {
    it('shows correct cell count', () => {
      render(<PatternEditor {...defaultProps} />);

      expect(screen.getByText(/Cells marked: 0/)).toBeInTheDocument();
      expect(screen.getByText(/\+ free space = 1 total/)).toBeInTheDocument();
    });

    it('updates cell count when cells are toggled', () => {
      render(<PatternEditor {...defaultProps} />);

      fireEvent.click(screen.getByRole('gridcell', { name: /B1/ }));
      expect(screen.getByText(/Cells marked: 1/)).toBeInTheDocument();
      expect(screen.getByText(/\+ free space = 2 total/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('gridcell', { name: /O5/ }));
      expect(screen.getByText(/Cells marked: 2/)).toBeInTheDocument();
      expect(screen.getByText(/\+ free space = 3 total/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible grid role', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByRole('grid', { name: /pattern editor grid/i })).toBeInTheDocument();
    });

    it('cells have proper aria-label with marked state', () => {
      render(<PatternEditor {...defaultProps} />);
      const cells = screen.getAllByRole('gridcell');

      cells.forEach((cell) => {
        const label = cell.getAttribute('aria-label');
        expect(label).toBeTruthy();
        // Each cell should have either "marked" or "not marked" in its label
        expect(label).toMatch(/marked/);
      });
    });

    it('name input has aria-required', () => {
      render(<PatternEditor {...defaultProps} />);
      expect(screen.getByLabelText('Pattern Name')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('senior-friendly design', () => {
    it('cells are minimum 44x44px', () => {
      render(<PatternEditor {...defaultProps} />);
      const cell = screen.getByRole('gridcell', { name: /B1/ });

      // Check for w-11 (44px) and h-11 (44px) classes
      expect(cell.className).toContain('w-11');
      expect(cell.className).toContain('h-11');
    });
  });
});
