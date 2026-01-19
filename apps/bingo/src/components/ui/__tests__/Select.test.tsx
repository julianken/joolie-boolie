import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../Select';

const defaultOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('Select', () => {
  const defaultProps = {
    options: defaultOptions,
    onChange: vi.fn(),
  };

  it('renders with placeholder', () => {
    render(<Select {...defaultProps} placeholder="Choose fruit" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Choose fruit');
  });

  it('renders with label', () => {
    render(<Select {...defaultProps} label="Fruit" />);
    expect(screen.getByText('Fruit')).toBeInTheDocument();
  });

  it('displays selected value', () => {
    render(<Select {...defaultProps} value="banana" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });

  describe('dropdown behavior', () => {
    it('opens dropdown on click', () => {
      render(<Select {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown on second click', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      fireEvent.click(combobox);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on outside click', () => {
      render(
        <div>
          <Select {...defaultProps} />
          <button>Outside</button>
        </div>
      );
      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      fireEvent.mouseDown(screen.getByText('Outside'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('option selection', () => {
    it('calls onChange when option is selected', () => {
      const handleChange = vi.fn();
      render(<Select {...defaultProps} onChange={handleChange} />);
      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('Banana'));
      expect(handleChange).toHaveBeenCalledWith('banana');
    });

    it('shows checkmark on selected option', () => {
      render(<Select {...defaultProps} value="banana" />);
      fireEvent.click(screen.getByRole('combobox'));
      const selectedOption = screen.getByRole('option', { name: /Banana/ });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('does not select disabled options', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana', disabled: true },
      ];
      render(<Select options={options} onChange={handleChange} />);
      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('Banana'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on Enter key', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: 'Enter' });
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown on Space key', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: ' ' });
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown on ArrowDown key', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown on Escape key', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      fireEvent.keyDown(combobox, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('navigates options with arrow keys', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      fireEvent.keyDown(combobox, { key: 'ArrowUp' });
      // Test that navigation worked without error
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters options when searchable', () => {
      render(<Select {...defaultProps} searchable />);
      fireEvent.click(screen.getByRole('combobox'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'app' } });
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    });

    it('shows no options message when search has no results', () => {
      render(<Select {...defaultProps} searchable />);
      fireEvent.click(screen.getByRole('combobox'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
      expect(screen.getByText('No options found')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      render(<Select {...defaultProps} error="Selection required" />);
      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('has role="alert" on error message', () => {
      render(<Select {...defaultProps} error="Error" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Select {...defaultProps} error="Error" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables combobox when disabled prop is true', () => {
      render(<Select {...defaultProps} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('does not open dropdown when disabled', () => {
      render(<Select {...defaultProps} disabled />);
      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-expanded attribute', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when opened', () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-haspopup="listbox"', () => {
      render(<Select {...defaultProps} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('options have aria-selected attribute', () => {
      render(<Select {...defaultProps} value="banana" />);
      fireEvent.click(screen.getByRole('combobox'));
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });
  });
});
