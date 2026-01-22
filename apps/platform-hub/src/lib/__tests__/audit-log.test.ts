/**
 * Tests for OAuth Audit Logging Library
 *
 * @vitest-environment node
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
} from '../audit-log';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'mock-audit-log-id' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  };
});

describe('Audit Log Library', () => {
  describe('logAuditEvent', () => {
    it('should log a basic audit event', async () => {
      const result = await logAuditEvent({
        user_id: 'user-123',
        client_id: 'client-456',
        action: 'authorize_success',
      });

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });

    it('should log an audit event with all metadata', async () => {
      const result = await logAuditEvent({
        user_id: 'user-123',
        client_id: 'client-456',
        action: 'authorize_success',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        metadata: { scopes: ['openid', 'email'] },
      });

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });

    it('should handle missing user_id', async () => {
      const result = await logAuditEvent({
        client_id: 'client-456',
        action: 'authorize_error',
      });

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });

  describe('logAuthorizationSuccess', () => {
    it('should log successful authorization', async () => {
      const result = await logAuthorizationSuccess(
        'user-123',
        'client-456',
        'auth-789',
        ['openid', 'email'],
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });

    it('should work without IP and user agent', async () => {
      const result = await logAuthorizationSuccess(
        'user-123',
        'client-456',
        'auth-789',
        ['openid']
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });

  describe('logAuthorizationDenial', () => {
    it('should log authorization denial', async () => {
      const result = await logAuthorizationDenial(
        'user-123',
        'client-456',
        'auth-789',
        'user_cancelled',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });

    it('should work without reason', async () => {
      const result = await logAuthorizationDenial(
        'user-123',
        'client-456',
        'auth-789'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });

  describe('logAuthorizationError', () => {
    it('should log authorization error', async () => {
      const result = await logAuthorizationError(
        'client-456',
        'auth-789',
        'invalid_request',
        'Missing required parameter',
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });

    it('should work without user_id for unauthenticated errors', async () => {
      const result = await logAuthorizationError(
        'client-456',
        undefined,
        'invalid_client',
        'Client not found'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });

  describe('logTokenExchange', () => {
    it('should log token exchange', async () => {
      const result = await logTokenExchange(
        'user-123',
        'client-456',
        'auth-789',
        'bearer',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });

  describe('logTokenRefresh', () => {
    it('should log token refresh', async () => {
      const result = await logTokenRefresh(
        'user-123',
        'client-456',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });

  describe('logTokenRevoke', () => {
    it('should log access token revocation', async () => {
      const result = await logTokenRevoke(
        'user-123',
        'client-456',
        'access',
        'user_logout',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });

    it('should log refresh token revocation', async () => {
      const result = await logTokenRevoke(
        'user-123',
        'client-456',
        'refresh'
      );

      expect(result).toEqual({ id: 'mock-audit-log-id' });
    });
  });
});
