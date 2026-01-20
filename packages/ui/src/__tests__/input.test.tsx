import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Input } from '../input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('should render error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(
        <Input error="Error message" helperText="Helper text" />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('input types', () => {
    it('should render as text input by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render as password input', () => {
      render(<Input type="password" label="Password" />);
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render as email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('value handling', () => {
    it('should handle controlled input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalled();
    });

    it('should display value', () => {
      render(<Input value="Hello" readOnly />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Hello');
    });
  });

  describe('disabled state', () => {
    it('should be enabled by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('disabled:opacity-50');
      expect(input.className).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('error state', () => {
    it('should apply error styles when error prop is provided', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-error');
    });

    it('should mark input as invalid', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not mark input as invalid without error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate error message with input', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();

      const errorElement = screen.getByText('Invalid email');
      expect(errorElement).toHaveAttribute('id', errorId);
      expect(errorElement).toHaveAttribute('role', 'alert');
    });
  });

  describe('accessibility', () => {
    it('should generate unique ID if not provided', () => {
      const { container } = render(<Input label="Test" />);
      const input = container.querySelector('input');
      const id = input?.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^input-/);
    });

    it('should use provided ID', () => {
      render(<Input id="custom-id" label="Test" />);
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('should associate label with input', () => {
      render(<Input id="test-input" label="Username" />);
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('should associate helper text with input', () => {
      render(<Input label="Email" helperText="Enter your email" />);
      const input = screen.getByLabelText('Email');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).toBeTruthy();

      const helperElement = screen.getByText('Enter your email');
      expect(helperElement).toHaveAttribute('id', helperId);
    });

    it('should have minimum height for senior-friendly design', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('min-h-[56px]');
    });

    it('should have large text size for readability', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('text-lg');
    });

    it('should have clear focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('focus:ring-4');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow focusing via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-class');
    });

    it('should merge custom className with default styles', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-class');
      expect(input.className).toContain('w-full');
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML attributes', () => {
      render(<Input placeholder="Enter text" maxLength={10} />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should support autoFocus', () => {
      render(<Input autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('should support required attribute', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should support readOnly attribute', () => {
      render(<Input readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('event handlers', () => {
    it('should call onChange handler', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onFocus handler', async () => {
      const onFocus = vi.fn();
      render(<Input onFocus={onFocus} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur handler', async () => {
      const onBlur = vi.fn();
      render(<Input onBlur={onBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown handler', async () => {
      const onKeyDown = vi.fn();
      render(<Input onKeyDown={onKeyDown} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });
});
