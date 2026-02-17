import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSentry } from '@joolie-boolie/testing';
import type { TrackedError, ErrorUser, Breadcrumb } from '@joolie-boolie/error-tracking/types';

// Mock @sentry/nextjs with our testing mock
vi.mock('@sentry/nextjs', () => mockSentry);

// Import after mocking
import { SentryErrorBackend } from '../sentry-backend';

describe('SentryErrorBackend (trivia)', () => {
  let backend: SentryErrorBackend;

  beforeEach(() => {
    mockSentry._reset();
    backend = new SentryErrorBackend();
  });

  describe('init', () => {
    it('should not throw when called', () => {
      expect(() => backend.init({ appName: 'trivia' })).not.toThrow();
    });
  });

  describe('captureError', () => {
    it('should call Sentry.withScope and captureException', () => {
      const originalError = new Error('test error');
      const trackedError: TrackedError = {
        id: 'err_test_123',
        message: 'test error',
        category: 'game',
        severity: 'high',
        context: { timestamp: Date.now() },
        originalError,
      };

      backend.captureError(trackedError);

      expect(mockSentry.withScope).toHaveBeenCalledTimes(1);
      expect(mockSentry.captureException).toHaveBeenCalledWith(originalError);
    });

    it('should map severity "low" to Sentry level "info"', () => {
      const trackedError: TrackedError = {
        id: 'err_test_1',
        message: 'low severity',
        category: 'unknown',
        severity: 'low',
        context: { timestamp: Date.now() },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setLevel).toHaveBeenCalledWith('info');
    });

    it('should map severity "medium" to Sentry level "warning"', () => {
      const trackedError: TrackedError = {
        id: 'err_test_2',
        message: 'medium severity',
        category: 'unknown',
        severity: 'medium',
        context: { timestamp: Date.now() },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setLevel).toHaveBeenCalledWith('warning');
    });

    it('should map severity "high" to Sentry level "error"', () => {
      const trackedError: TrackedError = {
        id: 'err_test_3',
        message: 'high severity',
        category: 'network',
        severity: 'high',
        context: { timestamp: Date.now() },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setLevel).toHaveBeenCalledWith('error');
    });

    it('should map severity "critical" to Sentry level "fatal"', () => {
      const trackedError: TrackedError = {
        id: 'err_test_4',
        message: 'critical severity',
        category: 'auth',
        severity: 'critical',
        context: { timestamp: Date.now() },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setLevel).toHaveBeenCalledWith('fatal');
    });

    it('should set error category, severity, and id as tags', () => {
      const trackedError: TrackedError = {
        id: 'err_abc_def',
        message: 'tagged error',
        category: 'sync',
        severity: 'medium',
        context: { timestamp: Date.now() },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setTag).toHaveBeenCalledWith('error.category', 'sync');
      expect(scope.setTag).toHaveBeenCalledWith('error.severity', 'medium');
      expect(scope.setTag).toHaveBeenCalledWith('error.id', 'err_abc_def');
    });

    it('should set optional context tags when present', () => {
      const trackedError: TrackedError = {
        id: 'err_ctx_123',
        message: 'context error',
        category: 'game',
        severity: 'high',
        context: {
          timestamp: Date.now(),
          component: 'QuestionDisplay',
          userAction: 'reveal_answer',
          requestId: 'req_abc',
          url: '/play',
        },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setTag).toHaveBeenCalledWith('component', 'QuestionDisplay');
      expect(scope.setTag).toHaveBeenCalledWith('userAction', 'reveal_answer');
      expect(scope.setTag).toHaveBeenCalledWith('requestId', 'req_abc');
      expect(scope.setTag).toHaveBeenCalledWith('url', '/play');
    });

    it('should set metadata as context when present', () => {
      const metadata = { roundId: 'round_1', questionIndex: 3 };
      const trackedError: TrackedError = {
        id: 'err_meta',
        message: 'metadata error',
        category: 'game',
        severity: 'medium',
        context: { timestamp: Date.now(), metadata },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setContext).toHaveBeenCalledWith('metadata', metadata);
    });

    it('should create a new Error when originalError is not present', () => {
      const trackedError: TrackedError = {
        id: 'err_no_orig',
        message: 'no original error',
        category: 'unknown',
        severity: 'medium',
        context: { timestamp: Date.now() },
      };

      backend.captureError(trackedError);

      const capturedArg = mockSentry.captureException.mock.calls[0][0];
      expect(capturedArg).toBeInstanceOf(Error);
      expect(capturedArg.message).toBe('no original error');
    });
  });

  describe('captureMessage', () => {
    it('should call Sentry.captureMessage with mapped severity', () => {
      backend.captureMessage('trivia message', 'high');
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('trivia message', 'error');
    });
  });

  describe('setUser', () => {
    it('should send only { id } to Sentry (privacy requirement)', () => {
      const user: ErrorUser = {
        id: 'user_456',
        email: 'trivia@example.com',
        username: 'triviahost',
      };

      backend.setUser(user);

      expect(mockSentry.setUser).toHaveBeenCalledWith({ id: 'user_456' });
      const sentryCall = mockSentry.setUser.mock.calls[0][0];
      expect(sentryCall).not.toHaveProperty('email');
      expect(sentryCall).not.toHaveProperty('username');
    });

    it('should set user to null when clearing', () => {
      backend.setUser(null);
      expect(mockSentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should forward breadcrumb to Sentry with timestamp conversion', () => {
      const breadcrumb: Breadcrumb = {
        category: 'game',
        message: 'Answer revealed',
        level: 'info',
        timestamp: 1700000000000,
        data: { questionId: 'q1' },
      };

      backend.addBreadcrumb(breadcrumb);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'game',
        message: 'Answer revealed',
        level: 'info',
        timestamp: 1700000000,
        data: { questionId: 'q1' },
      });
    });
  });

  describe('pushScope / popScope', () => {
    it('should not throw (no-op implementations)', () => {
      expect(() => backend.pushScope()).not.toThrow();
      expect(() => backend.popScope()).not.toThrow();
    });
  });
});
