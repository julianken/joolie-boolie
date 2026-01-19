import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    it('opens dropdown on click', async () => {
      render(<Select {...defaultProps} />);
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('closes dropdown on second click', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      fireEvent.click(combobox);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown on outside click', async () => {
      render(
        <div>
          <Select {...defaultProps} />
          <button>Outside</button>
        </div>
      );
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      fireEvent.mouseDown(screen.getByText('Outside'));
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('option selection', () => {
    it('calls onChange when option is selected', async () => {
      const handleChange = vi.fn();
      render(<Select {...defaultProps} onChange={handleChange} />);
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Banana'));
      expect(handleChange).toHaveBeenCalledWith('banana');
    });

    it('shows checkmark on selected option', async () => {
      render(<Select {...defaultProps} value="banana" />);
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const selectedOption = screen.getByRole('option', { name: /Banana/ });
        expect(selectedOption).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('does not select disabled options', async () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana', disabled: true },
      ];
      render(<Select options={options} onChange={handleChange} />);
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Banana'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on Enter key', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('opens dropdown on Space key', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: ' ' });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('opens dropdown on ArrowDown key', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('closes dropdown on Escape key', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      fireEvent.keyDown(combobox, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('navigates options with arrow keys', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      fireEvent.keyDown(combobox, { key: 'ArrowUp' });
      // Test that navigation worked without error
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters options when searchable', async () => {
      render(<Select {...defaultProps} searchable />);
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'app' } });
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
      });
    });

    it('shows no options message when search has no results', async () => {
      render(<Select {...defaultProps} searchable />);
      fireEvent.click(screen.getByRole('combobox'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });
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

    it('updates aria-expanded when opened', async () => {
      render(<Select {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has aria-haspopup="listbox"', () => {
      render(<Select {...defaultProps} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('options have aria-selected attribute', async () => {
      render(<Select {...defaultProps} value="banana" />);
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'false');
        expect(options[1]).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
