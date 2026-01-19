import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner, SpinnerOverlay, InlineSpinner } from '../Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-busy="true"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('has aria-label with default "Loading"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('uses custom label for aria-label', () => {
    render(<Spinner label="Processing data" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing data');
  });

  it('has screen reader text', () => {
    render(<Spinner label="Loading content" />);
    expect(screen.getByText('Loading content')).toBeInTheDocument();
    expect(screen.getByText('Loading content')).toHaveClass('sr-only');
  });

  describe('size variants', () => {
    it('applies sm size styles', () => {
      render(<Spinner size="sm" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('applies md size styles by default', () => {
      render(<Spinner />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('h-8', 'w-8');
    });

    it('applies lg size styles', () => {
      render(<Spinner size="lg" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('h-12', 'w-12');
    });

    it('applies xl size styles', () => {
      render(<Spinner size="xl" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('h-16', 'w-16');
    });
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('has animate-spin class on svg', () => {
    render(<Spinner />);
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('svg has aria-hidden="true"', () => {
    render(<Spinner />);
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SpinnerOverlay', () => {
  it('renders with default props', () => {
    render(<SpinnerOverlay />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-busy="true"', () => {
    render(<SpinnerOverlay />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('uses default label', () => {
    render(<SpinnerOverlay />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('uses custom label', () => {
    render(<SpinnerOverlay label="Please wait" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Please wait');
  });

  it('displays message when provided', () => {
    render(<SpinnerOverlay message="Loading your game..." />);
    expect(screen.getByText('Loading your game...')).toBeInTheDocument();
  });

  it('applies fixed positioning classes', () => {
    render(<SpinnerOverlay />);
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('applies backdrop blur', () => {
    render(<SpinnerOverlay />);
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveClass('backdrop-blur-sm');
  });

  it('uses lg size by default', () => {
    render(<SpinnerOverlay />);
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('h-12', 'w-12');
  });

  it('respects custom size', () => {
    render(<SpinnerOverlay size="xl" />);
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('h-16', 'w-16');
  });
});

describe('InlineSpinner', () => {
  it('renders svg element', () => {
    const { container } = render(<InlineSpinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has animate-spin class', () => {
    const { container } = render(<InlineSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('has aria-hidden="true"', () => {
    const { container } = render(<InlineSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<InlineSpinner className="text-white" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-white');
  });

  it('has default size classes', () => {
    const { container } = render(<InlineSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-5', 'w-5');
  });
});
