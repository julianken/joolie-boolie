/**
 * Unit tests for OAuth audit logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logAuditEvent,
  logAuthorizationSuccess,
  logAuthorizationDenial,
  logAuthorizationError,
  logTokenExchange,
  logTokenRefresh,
  logTokenRevoke,
  type AuditLogEntry,
} from '../audit-log';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
    })),
  })),
}));

// Mock environment variables
beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

describe('Audit Logging', () => {
  describe('logAuditEvent', () => {
    it('should log authorization success event', async () => {
      const entry: AuditLogEntry = {
        user_id: 'user-123',
        client_id: 'client-abc',
        action: 'authorize_success',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        metadata: {
          authorization_id: 'auth-xyz',
          scopes: ['openid', 'email'],
        },
      };

      await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    });

    it('should log authorization denial event', async () => {
      const entry: AuditLogEntry = {
        user_id: 'user-123',
        client_id: 'client-abc',
        action: 'authorize_deny',
        ip_address: '192.168.1.1',
        metadata: {
          authorization_id: 'auth-xyz',
          reason: 'user_denied',
        },
      };

      await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    });

    it('should log authorization error event', async () => {
      const entry: AuditLogEntry = {
        user_id: null,
        client_id: 'client-abc',
        action: 'authorize_error',
        ip_address: '192.168.1.1',
        metadata: {
          error: 'Invalid authorization request',
        },
      };

      await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    });

    it('should handle missing IP address and user agent', async () => {
      const entry: AuditLogEntry = {
        user_id: 'user-123',
        client_id: 'client-abc',
        action: 'authorize_success',
      };

      await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    });
  });

  describe('Helper functions', () => {
    it('should log authorization success with helper', async () => {
      await expect(
        logAuthorizationSuccess(
          'user-123',
          'client-abc',
          'auth-xyz',
          ['openid', 'email'],
          '192.168.1.1',
          'Mozilla/5.0'
        )
      ).resolves.toBeUndefined();
    });

    it('should log authorization denial with helper', async () => {
      await expect(
        logAuthorizationDenial(
          'user-123',
          'client-abc',
          'auth-xyz',
          'user_denied',
          '192.168.1.1',
          'Mozilla/5.0'
        )
      ).resolves.toBeUndefined();
    });

    it('should log authorization error with helper', async () => {
      await expect(
        logAuthorizationError(
          'user-123',
          'client-abc',
          'auth-xyz',
          'Invalid request',
          '192.168.1.1',
          'Mozilla/5.0'
        )
      ).resolves.toBeUndefined();
    });

    it('should log token exchange with helper', async () => {
      await expect(
        logTokenExchange(
          'user-123',
          'client-abc',
          'auth-xyz',
          '192.168.1.1',
          'Mozilla/5.0'
        )
      ).resolves.toBeUndefined();
    });

    it('should log token refresh with helper', async () => {
      await expect(
        logTokenRefresh('user-123', 'client-abc', '192.168.1.1', 'Mozilla/5.0')
      ).resolves.toBeUndefined();
    });

    it('should log token revoke with helper', async () => {
      await expect(
        logTokenRevoke(
          'user-123',
          'client-abc',
          'User logged out',
          '192.168.1.1',
          'Mozilla/5.0'
        )
      ).resolves.toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw error when SUPABASE_URL is not configured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const entry: AuditLogEntry = {
        user_id: 'user-123',
        client_id: 'client-abc',
        action: 'authorize_success',
      };

      await expect(logAuditEvent(entry)).rejects.toThrow(
        'NEXT_PUBLIC_SUPABASE_URL is not configured'
      );

      // Restore for other tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    it('should throw error when SERVICE_ROLE_KEY is not configured', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const entry: AuditLogEntry = {
        user_id: 'user-123',
        client_id: 'client-abc',
        action: 'authorize_success',
      };

      await expect(logAuditEvent(entry)).rejects.toThrow(
        'SUPABASE_SERVICE_ROLE_KEY is not configured'
      );

      // Restore for other tests
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    });
  });
});
