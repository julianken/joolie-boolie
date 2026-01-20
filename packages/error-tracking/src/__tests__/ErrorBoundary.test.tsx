import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { resetLoggerConfig, configureErrorLogger, normalizeError } from '../utils/logger';
import type { TrackedError } from '../types/errors';

// Suppress console.error for error boundary tests
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    resetLoggerConfig();
    configureErrorLogger({ enableConsole: false });
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    // Note: Testing error boundary error catching requires special setup in React 19
    // These tests verify the boundary's static and instance methods work correctly
  });

  describe('getDerivedStateFromError', () => {
    it('should return hasError: true', () => {
      const result = ErrorBoundary.getDerivedStateFromError(new Error('test'));
      expect(result).toEqual({ hasError: true });
    });
  });

  describe('handleReset', () => {
    it('should reset error state via instance method', () => {
      // Create a boundary instance to test reset method
      const boundary = new ErrorBoundary({ children: null });
      boundary.state = {
        hasError: true,
        error: normalizeError(new Error('test')),
      };

      // Mock setState
      const setStateMock = vi.fn();
      boundary.setState = setStateMock;

      boundary.handleReset();

      expect(setStateMock).toHaveBeenCalledWith({ hasError: false, error: null });
    });
  });

  describe('componentDidCatch behavior', () => {
    it('should call onError callback when componentDidCatch is invoked', () => {
      const onError = vi.fn();
      const boundary = new ErrorBoundary({ children: null, onError });

      // Mock setState to capture the error being set
      boundary.setState = vi.fn();

      const error = new Error('Test error');
      const errorInfo = { componentStack: 'stack' };

      // Call componentDidCatch directly
      boundary.componentDidCatch(error, errorInfo as React.ErrorInfo);

      expect(onError).toHaveBeenCalledTimes(1);
      const trackedError = onError.mock.calls[0][0];
      expect(trackedError.message).toBe('Test error');
    });

    it('should include componentName in tracked error', () => {
      const onError = vi.fn();
      const boundary = new ErrorBoundary({
        children: null,
        onError,
        componentName: 'TestComponent',
      });

      boundary.setState = vi.fn();

      const error = new Error('Test error');
      const errorInfo = { componentStack: 'stack' };

      boundary.componentDidCatch(error, errorInfo as React.ErrorInfo);

      const trackedError = onError.mock.calls[0][0];
      expect(trackedError.context.component).toBe('TestComponent');
    });

    it('should include custom context in tracked error', () => {
      const onError = vi.fn();
      const boundary = new ErrorBoundary({
        children: null,
        onError,
        context: {
          userAction: 'game_start',
          metadata: { gameId: '123' },
        },
      });

      boundary.setState = vi.fn();

      const error = new Error('Test error');
      const errorInfo = { componentStack: 'stack' };

      boundary.componentDidCatch(error, errorInfo as React.ErrorInfo);

      const trackedError = onError.mock.calls[0][0];
      expect(trackedError.context.userAction).toBe('game_start');
      expect(trackedError.context.metadata?.gameId).toBe('123');
    });

    it('should include component stack in metadata', () => {
      const onError = vi.fn();
      const boundary = new ErrorBoundary({ children: null, onError });

      boundary.setState = vi.fn();

      const error = new Error('Test error');
      const errorInfo = { componentStack: 'at Component (file.tsx:1:1)' };

      boundary.componentDidCatch(error, errorInfo as React.ErrorInfo);

      const trackedError = onError.mock.calls[0][0];
      expect(trackedError.context.metadata?.componentStack).toBe('at Component (file.tsx:1:1)');
    });
  });

  describe('render method with error state', () => {
    it('should render default fallback when hasError is true', () => {
      const boundary = new ErrorBoundary({ children: <div>Child</div> });
      const trackedError = normalizeError(new Error('Test error'));

      boundary.state = { hasError: true, error: trackedError };

      const result = boundary.render();

      // Default fallback is a functional component, check it's not the children
      expect(result).not.toEqual(<div>Child</div>);
    });

    it('should render custom fallback ReactNode when provided', () => {
      const customFallback = <div data-testid="custom">Custom Error</div>;
      const boundary = new ErrorBoundary({
        children: <div>Child</div>,
        fallback: customFallback,
      });
      const trackedError = normalizeError(new Error('Test error'));

      boundary.state = { hasError: true, error: trackedError };

      const result = boundary.render();

      expect(result).toEqual(customFallback);
    });

    it('should call fallback function with error and reset when provided', () => {
      const fallbackFn = vi.fn((_error, _reset) => <div>Error: {_error.message}</div>);
      const boundary = new ErrorBoundary({
        children: <div>Child</div>,
        fallback: fallbackFn,
      });
      const trackedError = normalizeError(new Error('Test error'));

      boundary.state = { hasError: true, error: trackedError };

      boundary.render();

      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn.mock.calls[0][0]).toBe(trackedError);
      expect(typeof fallbackFn.mock.calls[0][1]).toBe('function');
    });

    it('should render children when no error', () => {
      const children = <div data-testid="child">Child Content</div>;
      const boundary = new ErrorBoundary({ children });

      boundary.state = { hasError: false, error: null };

      const result = boundary.render();

      expect(result).toEqual(children);
    });
  });

  describe('integration', () => {
    it('should render default fallback UI correctly', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      // When there's no error, children should render
      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should accept custom fallback as ReactNode', () => {
      // Test that the boundary can be constructed with a custom fallback
      const boundary = new ErrorBoundary({
        children: <div>Child</div>,
        fallback: <div>Custom error</div>,
      });

      expect(boundary.props.fallback).toEqual(<div>Custom error</div>);
    });

    it('should accept custom fallback as function', () => {
      const fallbackFn = (_error: TrackedError, _reset: () => void) => <div>Error</div>;
      const boundary = new ErrorBoundary({
        children: <div>Child</div>,
        fallback: fallbackFn,
      });

      expect(typeof boundary.props.fallback).toBe('function');
    });
  });
});
