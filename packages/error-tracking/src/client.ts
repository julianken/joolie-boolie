/**
 * @joolie-boolie/error-tracking - Browser Client
 *
 * Browser-side error tracking with support for multiple backends.
 * Lightweight by default (console only), with optional integration points for services like Sentry.
 */

import type {
  TrackedError,
  ErrorContext,
  ErrorCategory,
  ErrorSeverity,
  ErrorTrackerConfig,
  ErrorBackend,
  ErrorUser,
  Breadcrumb,
  AppErrorOptions,
} from './types';

// Severity level ordering for filtering
const severityLevels: Record<ErrorSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Default configuration
 */
const defaultConfig: ErrorTrackerConfig = {
  enableConsole: typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production',
  minSeverity: 'low',
  environment: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'development',
  appName: 'JoolieBoolie',
  debug: false,
};

// Global state
let config: ErrorTrackerConfig = { ...defaultConfig };
let backend: ErrorBackend | null = null;
let breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 100;

/**
 * Initialize the error tracking client
 */
export function initErrorTracking(userConfig: Partial<ErrorTrackerConfig>): void {
  config = { ...defaultConfig, ...userConfig };

  if (backend) {
    backend.init(config);
  }

  if (config.debug) {
    console.log('[ErrorTracking] Initialized with config:', config);
  }

  // Set up global error handlers in browser
  if (typeof window !== 'undefined') {
    setupGlobalHandlers();
  }
}

/**
 * Set the error tracking backend (e.g., Sentry adapter)
 */
export function setErrorBackend(newBackend: ErrorBackend): void {
  backend = newBackend;
  backend.init(config);

  if (config.debug) {
    console.log('[ErrorTracking] Backend set');
  }
}

/**
 * Get current configuration
 */
export function getErrorTrackingConfig(): ErrorTrackerConfig {
  return { ...config };
}

/**
 * Reset configuration to defaults
 */
export function resetErrorTracking(): void {
  config = { ...defaultConfig };
  backend = null;
  breadcrumbs = [];
}

/**
 * Set user information for error context
 */
export function setErrorUser(user: ErrorUser | null): void {
  config.user = user ?? undefined;

  if (backend) {
    backend.setUser(user);
  }
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const fullBreadcrumb: Breadcrumb = {
    ...breadcrumb,
    timestamp: Date.now(),
  };

  breadcrumbs.push(fullBreadcrumb);

  // Keep breadcrumbs under limit
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
  }

  if (backend) {
    backend.addBreadcrumb(fullBreadcrumb);
  }
}

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `err_${timestamp}_${random}`;
}

/**
 * Get default user-friendly message based on error category
 */
function getDefaultUserMessage(category: ErrorCategory): string {
  const messages: Record<ErrorCategory, string> = {
    network:
      'We are having trouble connecting to our servers. Please check your internet connection and try again.',
    auth: 'There was a problem with your login. Please sign in again.',
    game: 'Something went wrong with the game. Please try refreshing the page.',
    sync: 'The display screens are having trouble syncing. Please refresh both windows.',
    storage:
      'We could not save your data. Please make sure you have enough storage space.',
    validation: 'Please check your input and try again.',
    unknown:
      'Something unexpected happened. Please try again or contact support if the problem continues.',
  };

  return messages[category];
}

/**
 * Auto-categorize an error based on its properties
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    name.includes('network') ||
    name.includes('fetch') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  ) {
    return 'network';
  }

  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication') ||
    message.includes('auth') ||
    message.includes('401') ||
    message.includes('403')
  ) {
    return 'auth';
  }

  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return 'validation';
  }

  if (
    message.includes('storage') ||
    message.includes('quota') ||
    message.includes('database') ||
    message.includes('indexeddb')
  ) {
    return 'storage';
  }

  if (
    message.includes('sync') ||
    message.includes('broadcast') ||
    message.includes('channel')
  ) {
    return 'sync';
  }

  return 'unknown';
}

/**
 * Normalize any value to a TrackedError
 */
export function normalizeError(
  error: unknown,
  context?: Partial<ErrorContext>
): TrackedError {
  // If it's already a tracked error, merge context and return
  if (isTrackedError(error)) {
    if (context) {
      error.context = { ...error.context, ...context };
    }
    return error;
  }

  // Handle AppError instances
  if (isAppError(error)) {
    const appError = error as AppError;
    return {
      id: appError.id,
      message: appError.message,
      category: appError.category,
      severity: appError.severity,
      context: {
        ...appError.context,
        ...context,
      },
      stack: appError.stack,
      originalError: appError,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      id: generateErrorId(),
      message: error.message,
      category: categorizeError(error),
      severity: 'medium',
      context: {
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userId: config.user?.id,
        ...context,
      },
      stack: error.stack,
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      id: generateErrorId(),
      message: error,
      category: 'unknown',
      severity: 'medium',
      context: {
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userId: config.user?.id,
        ...context,
      },
    };
  }

  // Handle unknown values
  return {
    id: generateErrorId(),
    message: 'An unknown error occurred',
    category: 'unknown',
    severity: 'medium',
    context: {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: config.user?.id,
      ...context,
      metadata: { ...context?.metadata, originalValue: String(error) },
    },
  };
}

/**
 * Check if a value is a TrackedError
 */
function isTrackedError(value: unknown): value is TrackedError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'message' in value &&
    'category' in value &&
    'severity' in value &&
    'context' in value
  );
}

/**
 * Check if a value is an AppError
 */
function isAppError(value: unknown): boolean {
  return (
    value instanceof Error &&
    'category' in value &&
    'severity' in value &&
    'context' in value
  );
}

/**
 * Check if an error should be logged based on severity
 */
function shouldCapture(severity: ErrorSeverity): boolean {
  const minLevel = severityLevels[config.minSeverity ?? 'low'];
  const errorLevel = severityLevels[severity];
  return errorLevel >= minLevel;
}

/**
 * Format error for console output
 */
function formatForConsole(error: TrackedError): string {
  const parts = [
    `[${error.severity.toUpperCase()}]`,
    `[${error.category}]`,
    error.message,
  ];

  if (error.context.component) {
    parts.push(`in ${error.context.component}`);
  }

  if (error.context.userAction) {
    parts.push(`(action: ${error.context.userAction})`);
  }

  return parts.join(' ');
}

/**
 * Log error to console
 */
function logToConsole(error: TrackedError): void {
  if (!config.enableConsole) return;

  const formatted = formatForConsole(error);
  const consoleMethod =
    error.severity === 'critical' || error.severity === 'high'
      ? 'error'
      : error.severity === 'medium'
        ? 'warn'
        : 'log';

  console[consoleMethod](`[${config.appName}] ${formatted}`);

  if (error.stack && config.debug) {
    console[consoleMethod]('Stack trace:', error.stack);
  }

  if (error.context.metadata && Object.keys(error.context.metadata).length > 0) {
    console[consoleMethod]('Metadata:', error.context.metadata);
  }
}

/**
 * Capture an error for tracking
 */
export function captureError(
  error: unknown,
  context?: Partial<ErrorContext>
): TrackedError {
  const trackedError = normalizeError(error, context);

  // Apply beforeCapture hook
  if (config.beforeCapture) {
    const filtered = config.beforeCapture(trackedError);
    if (!filtered) {
      return trackedError; // Error was filtered out
    }
  }

  if (shouldCapture(trackedError.severity)) {
    // Log to console in development
    logToConsole(trackedError);

    // Send to backend
    if (backend) {
      backend.captureError(trackedError);
    }

    // Call custom error handler
    if (config.onError) {
      try {
        const result = config.onError(trackedError);
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error('[ErrorTracking] Error in custom handler:', err);
          });
        }
      } catch (handlerError) {
        console.error('[ErrorTracking] Error in custom handler:', handlerError);
      }
    }
  }

  return trackedError;
}

/**
 * Capture a message (non-error log)
 */
export function captureMessage(
  message: string,
  severity: ErrorSeverity = 'low',
  context?: Partial<ErrorContext>
): void {
  if (!shouldCapture(severity)) return;

  if (config.enableConsole) {
    const consoleMethod = severity === 'critical' || severity === 'high' ? 'error' : 'log';
    console[consoleMethod](`[${config.appName}] ${message}`);
  }

  if (backend) {
    backend.captureMessage(message, severity, context);
  }
}

/**
 * Create a scoped error logger for a specific component
 */
export function createScopedLogger(component: string) {
  return {
    /**
     * Capture an error with component context
     */
    captureError: (error: unknown, context?: Partial<ErrorContext>) =>
      captureError(error, { ...context, component }),

    /**
     * Log an error message
     */
    error: (message: string, metadata?: Record<string, unknown>) =>
      captureError(new Error(message), { component, metadata }),

    /**
     * Log a warning message
     */
    warn: (message: string, metadata?: Record<string, unknown>) =>
      captureMessage(message, 'medium', { component, metadata }),

    /**
     * Log an info message
     */
    info: (message: string, metadata?: Record<string, unknown>) =>
      captureMessage(message, 'low', { component, metadata }),

    /**
     * Add a breadcrumb
     */
    breadcrumb: (message: string, data?: Record<string, unknown>) =>
      addBreadcrumb({ category: component, message, data }),
  };
}

/**
 * Set up global error handlers for uncaught errors
 */
function setupGlobalHandlers(): void {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    captureError(event.error || event.message, {
      component: 'global',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'uncaught',
      },
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason || 'Unhandled Promise Rejection', {
      component: 'global',
      metadata: {
        type: 'unhandledrejection',
      },
    });
  });
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly id: string;
  public readonly statusCode?: number;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';

    this.id = generateErrorId();
    this.category = options.category ?? 'unknown';
    this.severity = options.severity ?? 'medium';
    this.recoverable = options.recoverable ?? false;
    this.userMessage =
      options.userMessage ?? getDefaultUserMessage(this.category);
    this.statusCode = options.statusCode;

    this.context = {
      timestamp: Date.now(),
      userAction: options.userAction,
      component: options.component,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      requestId: options.requestId,
      userId: config.user?.id,
      metadata: options.metadata,
    };

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert to TrackedError format
   */
  toTrackedError(): TrackedError {
    return {
      id: this.id,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
      originalError: this,
    };
  }
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Partial<ErrorContext>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Execute a function with error capturing
 */
export async function captureAsync<T>(
  fn: () => Promise<T>,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error, context);
    throw error;
  }
}

// Re-export types for convenience
export type {
  TrackedError,
  ErrorContext,
  ErrorCategory,
  ErrorSeverity,
  ErrorTrackerConfig,
  ErrorBackend,
  ErrorUser,
  Breadcrumb,
  AppErrorOptions,
};
