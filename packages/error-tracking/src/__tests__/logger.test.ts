import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  configureErrorLogger,
  getLoggerConfig,
  resetLoggerConfig,
  logError,
  normalizeError,
  createScopedLogger,
} from '../utils/logger';
import { AppError } from '../types/errors';

describe('logger', () => {
  beforeEach(() => {
    resetLoggerConfig();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configureErrorLogger', () => {
    it('should update logger configuration', () => {
      configureErrorLogger({
        appName: 'TestApp',
        enableConsole: false,
        minSeverity: 'high',
      });

      const config = getLoggerConfig();

      expect(config.appName).toBe('TestApp');
      expect(config.enableConsole).toBe(false);
      expect(config.minSeverity).toBe('high');
    });

    it('should merge with existing configuration', () => {
      configureErrorLogger({ appName: 'App1' });
      configureErrorLogger({ enableConsole: true });

      const config = getLoggerConfig();

      expect(config.appName).toBe('App1');
      expect(config.enableConsole).toBe(true);
    });
  });

  describe('resetLoggerConfig', () => {
    it('should reset to default configuration', () => {
      configureErrorLogger({
        appName: 'CustomApp',
        enableConsole: false,
        minSeverity: 'critical',
      });

      resetLoggerConfig();

      const config = getLoggerConfig();

      expect(config.appName).toBeUndefined();
      expect(config.minSeverity).toBe('low');
    });
  });

  describe('normalizeError', () => {
    it('should normalize AppError', () => {
      const appError = new AppError('Test', { category: 'network' });
      const tracked = normalizeError(appError);

      expect(tracked.message).toBe('Test');
      expect(tracked.category).toBe('network');
      expect(tracked.originalError).toBe(appError);
    });

    it('should normalize standard Error', () => {
      const error = new Error('Standard error');
      const tracked = normalizeError(error);

      expect(tracked.message).toBe('Standard error');
      expect(tracked.category).toBe('unknown');
      expect(tracked.severity).toBe('medium');
      expect(tracked.originalError).toBe(error);
    });

    it('should normalize string errors', () => {
      const tracked = normalizeError('String error message');

      expect(tracked.message).toBe('String error message');
      expect(tracked.category).toBe('unknown');
    });

    it('should normalize unknown values', () => {
      const tracked = normalizeError({ random: 'object' });

      expect(tracked.message).toBe('An unknown error occurred');
      expect(tracked.context.metadata?.originalValue).toEqual({ random: 'object' });
    });

    it('should add context to normalized error', () => {
      const error = new Error('Test');
      const tracked = normalizeError(error, {
        component: 'TestComponent',
        userAction: 'test_action',
      });

      expect(tracked.context.component).toBe('TestComponent');
      expect(tracked.context.userAction).toBe('test_action');
    });

    it('should categorize network errors', () => {
      const error = new Error('Failed to fetch data');
      const tracked = normalizeError(error);

      expect(tracked.category).toBe('network');
    });

    it('should categorize auth errors', () => {
      const error = new Error('Unauthorized access');
      const tracked = normalizeError(error);

      expect(tracked.category).toBe('auth');
    });

    it('should categorize validation errors', () => {
      const error = new Error('Invalid input provided');
      const tracked = normalizeError(error);

      expect(tracked.category).toBe('validation');
    });
  });

  describe('logError', () => {
    it('should log error to console when enabled', () => {
      configureErrorLogger({ enableConsole: true });

      const error = new Error('Test error');
      logError(error);

      expect(console.warn).toHaveBeenCalled();
    });

    it('should not log to console when disabled', () => {
      configureErrorLogger({ enableConsole: false });

      const error = new Error('Test error');
      logError(error);

      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should use console.error for high severity', () => {
      configureErrorLogger({ enableConsole: true });

      const error = new AppError('Critical error', { severity: 'high' });
      logError(error);

      expect(console.error).toHaveBeenCalled();
    });

    it('should use console.error for critical severity', () => {
      configureErrorLogger({ enableConsole: true });

      const error = new AppError('Critical error', { severity: 'critical' });
      logError(error);

      expect(console.error).toHaveBeenCalled();
    });

    it('should respect minSeverity filter', () => {
      configureErrorLogger({ enableConsole: true, minSeverity: 'high' });

      const lowError = new AppError('Low error', { severity: 'low' });
      const highError = new AppError('High error', { severity: 'high' });

      logError(lowError);
      expect(console.log).not.toHaveBeenCalled();

      logError(highError);
      expect(console.error).toHaveBeenCalled();
    });

    it('should call custom onError handler', () => {
      const onError = vi.fn();
      configureErrorLogger({ onError, enableConsole: false });

      const error = new Error('Test');
      const tracked = logError(error);

      expect(onError).toHaveBeenCalledWith(tracked);
    });

    it('should handle errors in custom error handler', () => {
      const onError = vi.fn().mockImplementation(() => {
        throw new Error('Handler failed');
      });
      configureErrorLogger({ onError, enableConsole: true });

      // Should not throw
      expect(() => logError(new Error('Test'))).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('should return tracked error', () => {
      configureErrorLogger({ enableConsole: false });

      const error = new AppError('Test', { category: 'game' });
      const tracked = logError(error);

      expect(tracked.message).toBe('Test');
      expect(tracked.category).toBe('game');
    });
  });

  describe('createScopedLogger', () => {
    it('should create logger with component scope', () => {
      configureErrorLogger({ enableConsole: false });

      const logger = createScopedLogger('GameBoard');
      const tracked = logger.log(new Error('Test'));

      expect(tracked.context.component).toBe('GameBoard');
    });

    it('should log errors with scope via log method', () => {
      configureErrorLogger({ enableConsole: false });
      const onError = vi.fn();
      configureErrorLogger({ onError });

      const logger = createScopedLogger('TestComponent');
      logger.log(new Error('Test error'));

      expect(onError).toHaveBeenCalled();
      const trackedError = onError.mock.calls[0][0];
      expect(trackedError.context.component).toBe('TestComponent');
    });

    it('should create errors via error method', () => {
      configureErrorLogger({ enableConsole: false });

      const logger = createScopedLogger('TestComponent');
      const tracked = logger.error('Something failed', { userAction: 'click' });

      expect(tracked.message).toBe('Something failed');
      expect(tracked.context.component).toBe('TestComponent');
      expect(tracked.context.userAction).toBe('click');
    });

    it('should create warnings via warn method', () => {
      configureErrorLogger({ enableConsole: false });

      const logger = createScopedLogger('TestComponent');
      const tracked = logger.warn('Warning message', { extra: 'data' });

      expect(tracked.message).toBe('Warning message');
      expect(tracked.context.component).toBe('TestComponent');
      expect(tracked.context.metadata?.extra).toBe('data');
    });
  });
});
