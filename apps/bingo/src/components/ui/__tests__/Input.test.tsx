import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  describe('size styles', () => {
    it('applies md size styles by default', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('min-h-[52px]');
    });

    it('applies sm size styles', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('min-h-[44px]');
    });

    it('applies lg size styles', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('min-h-[60px]');
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('has role="alert" on error message', () => {
      render(<Input error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Input error="Error" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies error border styles', () => {
      render(<Input error="Error" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-error');
    });
  });

  describe('helper text', () => {
    it('displays helper text when no error', () => {
      render(<Input helperText="Enter your username" />);
      expect(screen.getByText('Enter your username')).toBeInTheDocument();
    });

    it('hides helper text when error is present', () => {
      render(<Input helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables input when disabled prop is true', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('applies disabled opacity to label', () => {
      render(<Input label="Test Label" disabled />);
      const label = screen.getByText('Test Label');
      expect(label.className).toContain('opacity-50');
    });
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} data-testid="input" />);
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through additional props', () => {
    render(<Input type="email" data-testid="input" autoComplete="email" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('uses provided id over generated id', () => {
    render(<Input id="custom-id" label="Test" />);
    expect(screen.getByLabelText('Test')).toHaveAttribute('id', 'custom-id');
  });

  it('sets aria-describedby for error', () => {
    render(<Input id="test" error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-error');
  });
});
