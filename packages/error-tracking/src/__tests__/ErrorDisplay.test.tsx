import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, RetryButton } from '../components/ErrorDisplay';
import type { TrackedError } from '../types/errors';

const mockTrackedError: TrackedError = {
  id: 'err_test_123',
  message: 'Test error message',
  category: 'unknown',
  severity: 'medium',
  context: {
    timestamp: Date.now(),
    component: 'TestComponent',
  },
};

describe('ErrorDisplay', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<ErrorDisplay />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/Something unexpected happened/)).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<ErrorDisplay title="Custom Error Title" />);

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('should render custom description', () => {
      render(<ErrorDisplay description="Custom error description" />);

      expect(screen.getByText('Custom error description')).toBeInTheDocument();
    });

    it('should render help text', () => {
      render(<ErrorDisplay helpText="Contact support at help@example.com" />);

      expect(screen.getByText('Contact support at help@example.com')).toBeInTheDocument();
    });

    it('should not render help text when not provided', () => {
      render(<ErrorDisplay helpText="" />);

      // Default help text should not appear
      expect(screen.queryByText(/staff member/)).not.toBeInTheDocument();
    });

    it('should render error ID when TrackedError is provided', () => {
      render(<ErrorDisplay error={mockTrackedError} />);

      expect(screen.getByText(`Error ID: ${mockTrackedError.id}`)).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('should render retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} />);

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('should not render retry button when showRetry is false', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} showRetry={false} />);

      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    });

    it('should render home button when onGoHome is provided', () => {
      const onGoHome = vi.fn();
      render(<ErrorDisplay onGoHome={onGoHome} />);

      expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
    });

    it('should not render home button when showHome is false', () => {
      const onGoHome = vi.fn();
      render(<ErrorDisplay onGoHome={onGoHome} showHome={false} />);

      expect(screen.queryByRole('button', { name: 'Go Home' })).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} />);

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onGoHome when home button is clicked', () => {
      const onGoHome = vi.fn();
      render(<ErrorDisplay onGoHome={onGoHome} />);

      fireEvent.click(screen.getByRole('button', { name: 'Go Home' }));

      expect(onGoHome).toHaveBeenCalledTimes(1);
    });

    it('should render custom button text', () => {
      const onRetry = vi.fn();
      const onGoHome = vi.fn();

      render(
        <ErrorDisplay
          onRetry={onRetry}
          onGoHome={onGoHome}
          retryText="Retry Now"
          homeText="Back to Start"
        />
      );

      expect(screen.getByRole('button', { name: 'Retry Now' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back to Start' })).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display Error message', () => {
      const error = new Error('Standard error message');
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('Standard error message')).toBeInTheDocument();
    });

    it('should display string error', () => {
      render(<ErrorDisplay error="String error message" />);

      expect(screen.getByText('String error message')).toBeInTheDocument();
    });

    it('should prefer description over error message', () => {
      const error = new Error('Error message');
      render(<ErrorDisplay error={error} description="Custom description" />);

      expect(screen.getByText('Custom description')).toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should render full-page variant by default', () => {
      const { container } = render(<ErrorDisplay />);
      const alert = container.querySelector('[role="alert"]');

      expect(alert).toHaveStyle({ minHeight: '100vh' });
    });

    it('should render inline variant', () => {
      const { container } = render(<ErrorDisplay variant="inline" />);
      const alert = container.querySelector('[role="alert"]');

      expect(alert).not.toHaveStyle({ minHeight: '100vh' });
    });

    it('should render compact variant', () => {
      const { container } = render(<ErrorDisplay variant="compact" />);
      const alert = container.querySelector('[role="alert"]');

      expect(alert).toHaveStyle({ padding: '1rem' });
    });
  });

  describe('custom children', () => {
    it('should render custom children', () => {
      render(
        <ErrorDisplay>
          <div data-testid="custom-content">Custom additional content</div>
        </ErrorDisplay>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      render(<ErrorDisplay />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="assertive"', () => {
      render(<ErrorDisplay />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-label on buttons', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} retryText="Try Again" />);

      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveAttribute('aria-label', 'Try Again');
    });
  });
});

describe('RetryButton', () => {
  it('should render with default text', () => {
    render(<RetryButton onClick={() => {}} />);

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<RetryButton onClick={() => {}}>Retry Now</RetryButton>);

    expect(screen.getByRole('button', { name: 'Retry Now' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<RetryButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<RetryButton onClick={() => {}} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when loading', () => {
    render(<RetryButton onClick={() => {}} loading />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<RetryButton onClick={() => {}} loading />);

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<RetryButton onClick={onClick} disabled />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    const onClick = vi.fn();
    render(<RetryButton onClick={onClick} loading />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
