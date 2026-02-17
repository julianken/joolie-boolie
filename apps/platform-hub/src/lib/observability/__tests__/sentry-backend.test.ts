import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSentry } from '@joolie-boolie/testing';
import type { TrackedError, ErrorUser, Breadcrumb } from '@joolie-boolie/error-tracking/types';

// Mock @sentry/nextjs with our testing mock
vi.mock('@sentry/nextjs', () => mockSentry);

// Import after mocking
import { SentryErrorBackend } from '../sentry-backend';

describe('SentryErrorBackend (platform-hub)', () => {
  let backend: SentryErrorBackend;

  beforeEach(() => {
    mockSentry._reset();
    backend = new SentryErrorBackend();
  });

  describe('init', () => {
    it('should not throw when called', () => {
      expect(() => backend.init({ appName: 'platform-hub' })).not.toThrow();
    });
  });

  describe('captureError', () => {
    it('should call Sentry.withScope and captureException', () => {
      const originalError = new Error('hub error');
      const trackedError: TrackedError = {
        id: 'err_hub_123',
        message: 'hub error',
        category: 'auth',
        severity: 'high',
        context: { timestamp: Date.now() },
        originalError,
      };

      backend.captureError(trackedError);

      expect(mockSentry.withScope).toHaveBeenCalledTimes(1);
      expect(mockSentry.captureException).toHaveBeenCalledWith(originalError);
    });

    it('should map all severity levels correctly', () => {
      const severityMap: Array<{ input: 'low' | 'medium' | 'high' | 'critical'; expected: string }> = [
        { input: 'low', expected: 'info' },
        { input: 'medium', expected: 'warning' },
        { input: 'high', expected: 'error' },
        { input: 'critical', expected: 'fatal' },
      ];

      for (const { input, expected } of severityMap) {
        mockSentry._reset();
        const trackedError: TrackedError = {
          id: `err_${input}`,
          message: `${input} severity`,
          category: 'unknown',
          severity: input,
          context: { timestamp: Date.now() },
        };

        backend.captureError(trackedError);

        const scope = mockSentry._getLastScope();
        expect(scope.setLevel).toHaveBeenCalledWith(expected);
      }
    });

    it('should set error tags on scope', () => {
      const trackedError: TrackedError = {
        id: 'err_tags_test',
        message: 'tagged error',
        category: 'auth',
        severity: 'critical',
        context: {
          timestamp: Date.now(),
          component: 'OAuthHandler',
          userAction: 'login',
          requestId: 'req_xyz',
          url: '/api/oauth/token',
        },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setTag).toHaveBeenCalledWith('error.category', 'auth');
      expect(scope.setTag).toHaveBeenCalledWith('error.severity', 'critical');
      expect(scope.setTag).toHaveBeenCalledWith('error.id', 'err_tags_test');
      expect(scope.setTag).toHaveBeenCalledWith('component', 'OAuthHandler');
      expect(scope.setTag).toHaveBeenCalledWith('userAction', 'login');
      expect(scope.setTag).toHaveBeenCalledWith('requestId', 'req_xyz');
      expect(scope.setTag).toHaveBeenCalledWith('url', '/api/oauth/token');
    });

    it('should set metadata context when present', () => {
      const metadata = { clientId: 'oauth_client_1', grantType: 'authorization_code' };
      const trackedError: TrackedError = {
        id: 'err_meta',
        message: 'OAuth error',
        category: 'auth',
        severity: 'high',
        context: { timestamp: Date.now(), metadata },
      };

      backend.captureError(trackedError);

      const scope = mockSentry._getLastScope();
      expect(scope.setContext).toHaveBeenCalledWith('metadata', metadata);
    });
  });

  describe('captureMessage', () => {
    it('should call Sentry.captureMessage with mapped severity', () => {
      backend.captureMessage('session expired', 'medium');
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('session expired', 'warning');
    });
  });

  describe('setUser', () => {
    it('should send only { id } to Sentry (privacy requirement)', () => {
      const user: ErrorUser = {
        id: 'user_789',
        email: 'admin@joolie-boolie.com',
        username: 'admin',
      };

      backend.setUser(user);

      expect(mockSentry.setUser).toHaveBeenCalledWith({ id: 'user_789' });
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
    it('should forward breadcrumb to Sentry with correct timestamp conversion', () => {
      const breadcrumb: Breadcrumb = {
        category: 'auth',
        message: 'OAuth token refreshed',
        level: 'info',
        timestamp: 1700000000000,
        data: { tokenFamily: 'fam_abc' },
      };

      backend.addBreadcrumb(breadcrumb);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'auth',
        message: 'OAuth token refreshed',
        level: 'info',
        timestamp: 1700000000,
        data: { tokenFamily: 'fam_abc' },
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
