/**
 * Integration tests: error-tracking server wiring with ErrorBackend.
 *
 * Tests that captureServerError / captureServerMessage correctly delegate
 * to the registered backend on the server side.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ErrorBackend, TrackedError } from '../types';
import {
  initServerErrorTracking,
  setServerErrorBackend,
  captureServerError,
  captureServerMessage,
  resetServerErrorTracking,
  createRequestLogger,
} from '../server';

interface MockErrorBackend {
  init: Mock;
  captureError: Mock;
  captureMessage: Mock;
  setUser: Mock;
  addBreadcrumb: Mock;
  pushScope: Mock;
  popScope: Mock;
}

/** Creates a fresh mock backend implementing the ErrorBackend interface. */
function createMockBackend(): MockErrorBackend {
  return {
    init: vi.fn(),
    captureError: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
    pushScope: vi.fn(),
    popScope: vi.fn(),
  };
}

describe('error-tracking server <-> backend integration', () => {
  let mockBackend: ReturnType<typeof createMockBackend>;

  beforeEach(() => {
    resetServerErrorTracking();
    mockBackend = createMockBackend();
    initServerErrorTracking({ enableConsole: false, minSeverity: 'low' });
    setServerErrorBackend(mockBackend as unknown as ErrorBackend);
  });

  describe('captureServerError -> backend.captureError', () => {
    it('should forward a plain Error to the backend as TrackedError', () => {
      const error = new Error('Server error');

      captureServerError(error);

      expect(mockBackend.captureError).toHaveBeenCalledTimes(1);
      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.message).toBe('Server error');
      expect(trackedError.id).toMatch(/^err_srv_/);
      expect(trackedError.originalError).toBe(error);
    });

    it('should include context when provided', () => {
      captureServerError(new Error('Context error'), {
        requestId: 'req_abc',
        component: '/api/health',
        metadata: { statusCode: 500 },
      });

      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.context.requestId).toBe('req_abc');
      expect(trackedError.context.component).toBe('/api/health');
      expect(trackedError.context.metadata).toEqual({ statusCode: 500 });
    });

    it('should auto-categorize network errors', () => {
      captureServerError(new Error('ECONNREFUSED'));

      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.category).toBe('network');
    });

    it('should auto-categorize auth errors', () => {
      captureServerError(new Error('jwt expired'));

      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.category).toBe('auth');
    });

    it('should auto-categorize storage errors', () => {
      captureServerError(new Error('postgres connection failed'));

      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.category).toBe('storage');
    });

    it('should respect minSeverity filtering', () => {
      resetServerErrorTracking();
      mockBackend = createMockBackend();
      initServerErrorTracking({ enableConsole: false, minSeverity: 'critical' });
      setServerErrorBackend(mockBackend as unknown as ErrorBackend);

      captureServerError(new Error('medium error'));

      expect(mockBackend.captureError).not.toHaveBeenCalled();
    });
  });

  describe('captureServerMessage -> backend.captureMessage', () => {
    it('should forward message to backend', () => {
      captureServerMessage('Server info', 'low');

      expect(mockBackend.captureMessage).toHaveBeenCalledWith(
        'Server info',
        'low',
        undefined
      );
    });

    it('should forward context to backend', () => {
      captureServerMessage('Request warning', 'medium', {
        requestId: 'req_123',
      });

      expect(mockBackend.captureMessage).toHaveBeenCalledWith(
        'Request warning',
        'medium',
        { requestId: 'req_123' }
      );
    });
  });

  describe('createRequestLogger', () => {
    it('should create a scoped logger that includes requestId', () => {
      const logger = createRequestLogger('req_test_1', '/api/health');

      logger.captureError(new Error('Route error'));

      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.context.requestId).toBe('req_test_1');
      expect(trackedError.context.component).toBe('/api/health');
    });

    it('should forward info messages via captureMessage', () => {
      const logger = createRequestLogger('req_test_2', '/api/templates');

      logger.info('Processing templates');

      expect(mockBackend.captureMessage).toHaveBeenCalledWith(
        'Processing templates',
        'low',
        expect.objectContaining({
          requestId: 'req_test_2',
          component: '/api/templates',
        })
      );
    });

    it('should forward warnings via captureMessage', () => {
      const logger = createRequestLogger('req_test_3');

      logger.warn('Slow query', { duration: 5000 });

      expect(mockBackend.captureMessage).toHaveBeenCalledWith(
        'Slow query',
        'medium',
        expect.objectContaining({
          requestId: 'req_test_3',
          metadata: { duration: 5000 },
        })
      );
    });
  });

  describe('without backend', () => {
    it('should not throw when no backend is registered', () => {
      resetServerErrorTracking();
      initServerErrorTracking({ enableConsole: false });

      expect(() => captureServerError(new Error('no backend'))).not.toThrow();
      expect(() => captureServerMessage('no backend', 'low')).not.toThrow();
    });
  });
});
