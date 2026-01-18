import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
    label: 'Test Toggle',
  };

  it('renders with label', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
  });

  it('shows unchecked state', () => {
    render(<Toggle {...defaultProps} checked={false} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('shows checked state', () => {
    render(<Toggle {...defaultProps} checked={true} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value when clicked', () => {
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked and clicked', () => {
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} checked={true} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('handles disabled state', () => {
    render(<Toggle {...defaultProps} disabled />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Toggle {...defaultProps} onChange={handleChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has accessible role="switch"', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('has aria-checked attribute', () => {
    render(<Toggle {...defaultProps} checked={true} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('associates label with toggle via htmlFor', () => {
    render(<Toggle {...defaultProps} />);
    const label = screen.getByText('Test Toggle');
    const toggle = screen.getByRole('switch');
    expect(label).toHaveAttribute('for', toggle.id);
  });
});
