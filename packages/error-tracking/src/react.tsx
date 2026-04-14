'use client';

/**
 * @hosted-game-night/error-tracking - React Integration
 *
 * React components and hooks for error tracking.
 * Includes ErrorBoundary, hooks, and context providers.
 */

import {
  Component,
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type ErrorInfo,
} from 'react';

import type {
  TrackedError,
  ErrorContext,
  ErrorBoundaryProps,
  ErrorFallbackProps,
  UseErrorHandlerResult,
  Breadcrumb,
} from './types';

import {
  captureError,
  addBreadcrumb as addGlobalBreadcrumb,
  createScopedLogger,
} from './client';

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: TrackedError | null;
  componentStack?: string;
}

/**
 * React Error Boundary with integrated error tracking
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </ErrorBoundary>
 *
 * // With render function
 * <ErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetError}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private logger = createScopedLogger('ErrorBoundary');

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: undefined,
    };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, context, onError } = this.props;

    const trackedError = captureError(error, {
      component: componentName || 'Unknown',
      ...context,
      metadata: {
        ...context?.metadata,
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({
      error: trackedError,
      componentStack: errorInfo.componentStack ?? undefined,
    });

    if (onError) {
      onError(trackedError);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset if resetKeys changed
    if (this.props.resetKeys && prevProps.resetKeys) {
      const keysChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (keysChanged && this.state.hasError) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null, componentStack: undefined });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { hasError, error, componentStack } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        resetError: this.resetError,
        componentStack,
      };

      if (typeof fallback === 'function') {
        return fallback(fallbackProps);
      }

      if (fallback) {
        return fallback;
      }

      return <DefaultErrorFallback {...fallbackProps} />;
    }

    return children;
  }
}

/**
 * Default error fallback with accessible design
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
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
        onClick={resetError}
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

// ============================================================================
// Error Context
// ============================================================================

interface ErrorContextValue {
  /** Report an error */
  reportError: (error: unknown, context?: Partial<ErrorContext>) => TrackedError;
  /** Add breadcrumb */
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
  /** Last error */
  lastError: TrackedError | null;
  /** Clear last error */
  clearError: () => void;
}

const ErrorTrackingContext = createContext<ErrorContextValue | null>(null);

/**
 * Error tracking provider for React context
 */
export function ErrorTrackingProvider({
  children,
  componentName,
}: {
  children: ReactNode;
  componentName?: string;
}) {
  const [lastError, setLastError] = useState<TrackedError | null>(null);

  const reportError = useCallback(
    (error: unknown, context?: Partial<ErrorContext>) => {
      const tracked = captureError(error, {
        ...context,
        component: context?.component || componentName,
      });
      setLastError(tracked);
      return tracked;
    },
    [componentName]
  );

  const addBreadcrumb = useCallback((breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    addGlobalBreadcrumb(breadcrumb);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return (
    <ErrorTrackingContext.Provider
      value={{ reportError, addBreadcrumb, lastError, clearError }}
    >
      {children}
    </ErrorTrackingContext.Provider>
  );
}

/**
 * Hook to access error tracking context
 */
export function useErrorTracking(): ErrorContextValue {
  const context = useContext(ErrorTrackingContext);

  if (!context) {
    // Return a default implementation if used outside provider
    return {
      reportError: (error, ctx) => captureError(error, ctx),
      addBreadcrumb: addGlobalBreadcrumb,
      lastError: null,
      clearError: () => {},
    };
  }

  return context;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for component-level error handling
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { reportError, throwError, addBreadcrumb } = useErrorHandler('MyComponent');
 *
 *   const handleClick = async () => {
 *     addBreadcrumb({ category: 'ui', message: 'Button clicked' });
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       reportError(error, { userAction: 'button_click' });
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useErrorHandler(componentName?: string): UseErrorHandlerResult {
  const [, setError] = useState<Error | null>(null);

  const reportError = useCallback(
    (error: unknown, context?: Partial<ErrorContext>) => {
      return captureError(error, {
        ...context,
        component: context?.component || componentName,
      });
    },
    [componentName]
  );

  const reportWarning = useCallback(
    (message: string, metadata?: Record<string, unknown>) => {
      captureError(new Error(message), {
        component: componentName,
        metadata: { ...metadata, isWarning: true },
      });
    },
    [componentName]
  );

  const addBreadcrumb = useCallback(
    (breadcrumb: Breadcrumb) => {
      addGlobalBreadcrumb({
        ...breadcrumb,
        category: breadcrumb.category || componentName || 'unknown',
      });
    },
    [componentName]
  );

  const throwError = useCallback((error: unknown): never => {
    // This triggers React error boundary
    setError(() => {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    });
    // TypeScript requires this even though it's unreachable
    throw error;
  }, []);

  return {
    reportError,
    reportWarning,
    addBreadcrumb,
    throwError,
  };
}

/**
 * Hook for async operations with automatic error tracking
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { execute, loading, error } = useAsyncError('fetchData');
 *
 *   useEffect(() => {
 *     execute(async () => {
 *       const data = await fetchData();
 *       return data;
 *     });
 *   }, [execute]);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   return <Data />;
 * }
 * ```
 */
export function useAsyncError(operationName?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TrackedError | null>(null);

  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      context?: Partial<ErrorContext>
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await operation();
        return result;
      } catch (err) {
        const tracked = captureError(err, {
          ...context,
          userAction: operationName,
        });
        setError(tracked);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [operationName]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { execute, loading, error, reset };
}

/**
 * Hook to track user interactions as breadcrumbs
 */
export function useTrackInteraction(componentName?: string) {
  return useCallback(
    (action: string, data?: Record<string, unknown>) => {
      addGlobalBreadcrumb({
        category: componentName || 'interaction',
        message: action,
        level: 'info',
        data,
      });
    },
    [componentName]
  );
}

/**
 * Hook to automatically track component mount/unmount
 */
export function useTrackLifecycle(componentName: string): void {
  useEffect(() => {
    addGlobalBreadcrumb({
      category: 'lifecycle',
      message: `${componentName} mounted`,
      level: 'debug',
    });

    return () => {
      addGlobalBreadcrumb({
        category: 'lifecycle',
        message: `${componentName} unmounted`,
        level: 'debug',
      });
    };
  }, [componentName]);
}

// ============================================================================
// Higher-Order Components
// ============================================================================

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary
      componentName={displayName}
      {...boundaryProps}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

/**
 * HOC to inject error handler props
 */
export function withErrorHandler<P extends object>(
  WrappedComponent: React.ComponentType<P & { errorHandler: UseErrorHandlerResult }>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorHandler = (props: P) => {
    const errorHandler = useErrorHandler(displayName);
    return <WrappedComponent {...props} errorHandler={errorHandler} />;
  };

  WithErrorHandler.displayName = `withErrorHandler(${displayName})`;

  return WithErrorHandler;
}

// ============================================================================
// Exports
// ============================================================================

export {
  ErrorTrackingContext,
  type ErrorContextValue,
  type ErrorBoundaryState,
};

// Re-export types used by components
export type {
  TrackedError,
  ErrorContext,
  ErrorBoundaryProps,
  ErrorFallbackProps,
  UseErrorHandlerResult,
  Breadcrumb,
};
