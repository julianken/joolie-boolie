/**
 * Integration tests: error-tracking client wiring with ErrorBackend.
 *
 * Tests that captureError / setErrorUser / captureMessage correctly delegate
 * to the registered backend, simulating what happens at runtime when
 * SentryErrorBackend (or any other backend) is plugged in.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ErrorBackend, TrackedError, ErrorUser, Breadcrumb } from '../types';
import {
  initErrorTracking,
  setErrorBackend,
  captureError,
  captureMessage,
  setErrorUser,
  addBreadcrumb,
  resetErrorTracking,
} from '../client';

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

describe('error-tracking client <-> backend integration', () => {
  let mockBackend: ReturnType<typeof createMockBackend>;

  beforeEach(() => {
    resetErrorTracking();
    mockBackend = createMockBackend();
    initErrorTracking({ enableConsole: false, minSeverity: 'low' });
    setErrorBackend(mockBackend as unknown as ErrorBackend);
  });

  describe('captureError -> backend.captureError', () => {
    it('should forward a plain Error to the backend as TrackedError', () => {
      const error = new Error('Something broke');

      captureError(error);

      expect(mockBackend.captureError).toHaveBeenCalledTimes(1);
      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.message).toBe('Something broke');
      expect(trackedError.id).toMatch(/^err_/);
      expect(trackedError.originalError).toBe(error);
    });

    it('should include context when provided', () => {
      captureError(new Error('Contextual error'), {
        component: 'TestComponent',
        userAction: 'click_button',
        metadata: { key: 'value' },
      });

      const trackedError: TrackedError = mockBackend.captureError.mock.calls[0][0];
      expect(trackedError.context.component).toBe('TestComponent');
      expect(trackedError.context.userAction).toBe('click_button');
      expect(trackedError.context.metadata).toEqual({ key: 'value' });
    });

    it('should respect minSeverity filtering', () => {
      resetErrorTracking();
      mockBackend = createMockBackend();
      initErrorTracking({ enableConsole: false, minSeverity: 'high' });
      setErrorBackend(mockBackend as unknown as ErrorBackend);

      // Low severity - should be filtered
      captureError(new Error('low error'));

      expect(mockBackend.captureError).not.toHaveBeenCalled();
    });
  });

  describe('captureMessage -> backend.captureMessage', () => {
    it('should forward message to backend with severity', () => {
      captureMessage('Hello from test', 'medium');

      expect(mockBackend.captureMessage).toHaveBeenCalledTimes(1);
      expect(mockBackend.captureMessage).toHaveBeenCalledWith(
        'Hello from test',
        'medium',
        undefined
      );
    });

    it('should pass context through to backend', () => {
      captureMessage('Context message', 'high', { component: 'TestComp' });

      expect(mockBackend.captureMessage).toHaveBeenCalledWith(
        'Context message',
        'high',
        { component: 'TestComp' }
      );
    });
  });

  describe('setErrorUser -> backend.setUser', () => {
    it('should forward user to backend', () => {
      const user: ErrorUser = { id: 'user_123', email: 'test@test.com' };

      setErrorUser(user);

      expect(mockBackend.setUser).toHaveBeenCalledWith(user);
    });

    it('should forward null to clear user', () => {
      setErrorUser(null);

      expect(mockBackend.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb -> backend.addBreadcrumb', () => {
    it('should forward breadcrumb to backend with auto-generated timestamp', () => {
      addBreadcrumb({ category: 'test', message: 'Test breadcrumb' });

      expect(mockBackend.addBreadcrumb).toHaveBeenCalledTimes(1);
      const breadcrumb: Breadcrumb = mockBackend.addBreadcrumb.mock.calls[0][0];
      expect(breadcrumb.category).toBe('test');
      expect(breadcrumb.message).toBe('Test breadcrumb');
      expect(breadcrumb.timestamp).toBeGreaterThan(0);
    });
  });

  describe('init -> backend.init', () => {
    it('should call backend.init when backend is registered', () => {
      expect(mockBackend.init).toHaveBeenCalledTimes(1);
      const config = mockBackend.init.mock.calls[0][0];
      expect(config.enableConsole).toBe(false);
      expect(config.minSeverity).toBe('low');
    });
  });

  describe('without backend', () => {
    it('should not throw when no backend is registered', () => {
      resetErrorTracking();
      initErrorTracking({ enableConsole: false });
      // No backend set

      expect(() => captureError(new Error('no backend'))).not.toThrow();
      expect(() => captureMessage('no backend message', 'low')).not.toThrow();
      expect(() => setErrorUser({ id: '123' })).not.toThrow();
      expect(() => addBreadcrumb({ category: 'test', message: 'test' })).not.toThrow();
    });
  });
});
