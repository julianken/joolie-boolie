/**
 * @beak-gaming/error-tracking - Server Module
 *
 * Server-side error tracking for Next.js API routes and Server Components.
 * Provides context-aware error capture with request information.
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

// Severity level ordering
const severityLevels: Record<ErrorSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Server configuration (similar to client but optimized for server)
 */
const defaultConfig: ErrorTrackerConfig = {
  enableConsole: process.env.NODE_ENV !== 'production',
  minSeverity: 'low',
  environment: process.env.NODE_ENV ?? 'development',
  appName: 'BeakGaming',
  debug: false,
};

// Server-side state
let config: ErrorTrackerConfig = { ...defaultConfig };
let backend: ErrorBackend | null = null;

/**
 * Initialize server-side error tracking
 */
export function initServerErrorTracking(userConfig: Partial<ErrorTrackerConfig>): void {
  config = { ...defaultConfig, ...userConfig };

  if (backend) {
    backend.init(config);
  }

  if (config.debug) {
    console.log('[ErrorTracking:Server] Initialized with config:', {
      ...config,
      onError: config.onError ? '[function]' : undefined,
    });
  }
}

/**
 * Set the error tracking backend for server
 */
export function setServerErrorBackend(newBackend: ErrorBackend): void {
  backend = newBackend;
  backend.init(config);
}

/**
 * Get current server configuration
 */
export function getServerConfig(): ErrorTrackerConfig {
  return { ...config };
}

/**
 * Reset server configuration
 */
export function resetServerErrorTracking(): void {
  config = { ...defaultConfig };
  backend = null;
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `err_srv_${timestamp}_${random}`;
}

/**
 * Auto-categorize error
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    name.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('enotfound') ||
    message.includes('fetch')
  ) {
    return 'network';
  }

  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication') ||
    message.includes('jwt')
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
    message.includes('database') ||
    message.includes('postgres') ||
    message.includes('supabase') ||
    message.includes('query')
  ) {
    return 'storage';
  }

  return 'unknown';
}

/**
 * Check if error should be captured
 */
function shouldCapture(severity: ErrorSeverity): boolean {
  const minLevel = severityLevels[config.minSeverity ?? 'low'];
  const errorLevel = severityLevels[severity];
  return errorLevel >= minLevel;
}

/**
 * Format error for console
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

  if (error.context.requestId) {
    parts.push(`(request: ${error.context.requestId})`);
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

  console[consoleMethod](`[${config.appName}:Server] ${formatted}`);

  if (error.stack && config.debug) {
    console[consoleMethod]('Stack trace:', error.stack);
  }
}

/**
 * Normalize any value to TrackedError
 */
export function normalizeServerError(
  error: unknown,
  context?: Partial<ErrorContext>
): TrackedError {
  if (error instanceof ServerAppError) {
    return {
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: { ...error.context, ...context },
      stack: error.stack,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    return {
      id: generateErrorId(),
      message: error.message,
      category: categorizeError(error),
      severity: 'medium',
      context: {
        timestamp: Date.now(),
        ...context,
      },
      stack: error.stack,
      originalError: error,
    };
  }

  if (typeof error === 'string') {
    return {
      id: generateErrorId(),
      message: error,
      category: 'unknown',
      severity: 'medium',
      context: {
        timestamp: Date.now(),
        ...context,
      },
    };
  }

  return {
    id: generateErrorId(),
    message: 'An unknown server error occurred',
    category: 'unknown',
    severity: 'medium',
    context: {
      timestamp: Date.now(),
      ...context,
      metadata: { ...context?.metadata, originalValue: String(error) },
    },
  };
}

/**
 * Capture a server-side error
 */
export function captureServerError(
  error: unknown,
  context?: Partial<ErrorContext>
): TrackedError {
  const trackedError = normalizeServerError(error, context);

  // Apply beforeCapture hook
  if (config.beforeCapture) {
    const filtered = config.beforeCapture(trackedError);
    if (!filtered) {
      return trackedError;
    }
  }

  if (shouldCapture(trackedError.severity)) {
    logToConsole(trackedError);

    if (backend) {
      backend.captureError(trackedError);
    }

    if (config.onError) {
      try {
        const result = config.onError(trackedError);
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error('[ErrorTracking:Server] Error in custom handler:', err);
          });
        }
      } catch (handlerError) {
        console.error('[ErrorTracking:Server] Error in custom handler:', handlerError);
      }
    }
  }

  return trackedError;
}

/**
 * Capture a server message
 */
export function captureServerMessage(
  message: string,
  severity: ErrorSeverity = 'low',
  context?: Partial<ErrorContext>
): void {
  if (!shouldCapture(severity)) return;

  if (config.enableConsole) {
    const consoleMethod = severity === 'critical' || severity === 'high' ? 'error' : 'log';
    console[consoleMethod](`[${config.appName}:Server] ${message}`);
  }

  if (backend) {
    backend.captureMessage(message, severity, context);
  }
}

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId: string, route?: string) {
  return {
    captureError: (error: unknown, context?: Partial<ErrorContext>) =>
      captureServerError(error, { ...context, requestId, component: route }),

    error: (message: string, metadata?: Record<string, unknown>) =>
      captureServerError(new Error(message), { requestId, component: route, metadata }),

    warn: (message: string, metadata?: Record<string, unknown>) =>
      captureServerMessage(message, 'medium', { requestId, component: route, metadata }),

    info: (message: string, metadata?: Record<string, unknown>) =>
      captureServerMessage(message, 'low', { requestId, component: route, metadata }),
  };
}

/**
 * Server-side application error
 */
export class ServerAppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly id: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    options: AppErrorOptions & { statusCode?: number } = {}
  ) {
    super(message);
    this.name = 'ServerAppError';

    this.id = generateErrorId();
    this.category = options.category ?? 'unknown';
    this.severity = options.severity ?? 'medium';
    this.recoverable = options.recoverable ?? false;
    this.userMessage = options.userMessage ?? this.getDefaultMessage();
    this.statusCode = options.statusCode ?? this.getDefaultStatusCode();

    this.context = {
      timestamp: Date.now(),
      userAction: options.userAction,
      component: options.component,
      requestId: options.requestId,
      metadata: options.metadata,
    };

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServerAppError);
    }
  }

  private getDefaultMessage(): string {
    const messages: Record<ErrorCategory, string> = {
      network: 'Unable to connect to external service',
      auth: 'Authentication required',
      game: 'Game operation failed',
      sync: 'Synchronization failed',
      storage: 'Database operation failed',
      validation: 'Invalid request data',
      unknown: 'An unexpected error occurred',
    };
    return messages[this.category];
  }

  private getDefaultStatusCode(): number {
    const codes: Record<ErrorCategory, number> = {
      network: 502,
      auth: 401,
      game: 500,
      sync: 500,
      storage: 500,
      validation: 400,
      unknown: 500,
    };
    return codes[this.category];
  }

  /**
   * Convert to API-safe error response
   */
  toResponse(): { error: string; code: string; id: string } {
    return {
      error: this.userMessage,
      code: this.category.toUpperCase(),
      id: this.id,
    };
  }

  /**
   * Convert to TrackedError
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
 * API route error handler wrapper
 */
export function withServerErrorHandling<T>(
  handler: () => Promise<T>,
  context?: Partial<ErrorContext>
): Promise<T> {
  return handler().catch((error) => {
    captureServerError(error, context);
    throw error;
  });
}

/**
 * Create an API error response
 */
export function createErrorResponse(
  error: unknown,
  context?: Partial<ErrorContext>
): { status: number; body: { error: string; code: string; id: string } } {
  const tracked = captureServerError(error, context);

  if (error instanceof ServerAppError) {
    return {
      status: error.statusCode,
      body: error.toResponse(),
    };
  }

  return {
    status: 500,
    body: {
      error: 'An unexpected error occurred',
      code: tracked.category.toUpperCase(),
      id: tracked.id,
    },
  };
}

/**
 * Next.js API route handler with error tracking
 */
export function createApiHandler<T>(
  handler: (requestId: string) => Promise<T>,
  options?: { route?: string }
) {
  return async (): Promise<T> => {
    const requestId = generateErrorId().replace('err_srv_', 'req_');

    try {
      return await handler(requestId);
    } catch (error) {
      captureServerError(error, {
        requestId,
        component: options?.route,
      });
      throw error;
    }
  };
}

// Re-export types
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
