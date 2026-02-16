'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logError, createScopedLogger } from '../utils/logger';
import { TrackedError, ErrorContext } from '../types/errors';

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback UI when error occurs */
  fallback?: ReactNode | ((error: TrackedError, reset: () => void) => ReactNode);
  /** Callback when error is caught */
  onError?: (error: TrackedError) => void;
  /** Component name for error context */
  componentName?: string;
  /** Additional context for error tracking */
  context?: Partial<ErrorContext>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: TrackedError | null;
}

/**
 * Error Boundary component for catching and handling React errors
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorDisplay />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback function:
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <ErrorDisplay error={error} onRetry={reset} />
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private logger = createScopedLogger('ErrorBoundary');

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, context, onError } = this.props;

    const trackedError = logError(error, {
      component: componentName || 'Unknown',
      ...context,
      metadata: {
        ...context?.metadata,
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ error: trackedError });

    if (onError) {
      onError(trackedError);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset);
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}

/**
 * Default fallback component with accessible design
 */
function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: TrackedError;
  onReset: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        minHeight: '200px',
        backgroundColor: '#fef2f2',
        borderRadius: '0.5rem',
        border: '2px solid #fecaca',
      }}
    >
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#991b1b',
          marginBottom: '1rem',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: '1.125rem',
          color: '#7f1d1d',
          marginBottom: '1.5rem',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        We encountered an unexpected error. Please try again.
      </p>
      <button
        onClick={onReset}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'white',
          backgroundColor: '#dc2626',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          minHeight: '44px',
          minWidth: '120px',
        }}
      >
        Try Again
      </button>
      {process.env.NODE_ENV !== 'production' && (
        <pre
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            overflow: 'auto',
            maxWidth: '100%',
            maxHeight: '200px',
          }}
        >
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}
    </div>
  );
}

export default ErrorBoundary;
