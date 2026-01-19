// Types
export {
  type ErrorCategory,
  type ErrorSeverity,
  type ErrorContext,
  type TrackedError,
  type AppErrorOptions,
  AppError,
} from './types/errors';

// Logger utilities
export {
  type LoggerConfig,
  configureErrorLogger,
  getLoggerConfig,
  resetLoggerConfig,
  normalizeError,
  logError,
  createScopedLogger,
  setupSentryIntegration,
} from './utils/logger';

// Components
export {
  ErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
} from './components/ErrorBoundary';

export {
  ErrorDisplay,
  RetryButton,
  type ErrorDisplayProps,
} from './components/ErrorDisplay';
