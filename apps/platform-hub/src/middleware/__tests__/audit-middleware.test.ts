/**
 * Unit tests for audit middleware utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  extractIpAddress,
  extractUserAgent,
  extractRequestMetadata,
  auditAuthorizationSuccess,
  auditAuthorizationDenial,
  auditAuthorizationError,
} from '../audit-middleware';

// Mock audit log functions
vi.mock('@/lib/audit-log', () => ({
  logAuthorizationSuccess: vi.fn(),
  logAuthorizationDenial: vi.fn(),
  logAuthorizationError: vi.fn(),
}));

describe('Audit Middleware', () => {
  describe('extractIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      expect(extractIpAddress(request)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      expect(extractIpAddress(request)).toBe('192.168.1.2');
    });

    it('should extract IP from x-vercel-forwarded-for header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-vercel-forwarded-for': '192.168.1.3',
        },
      });

      expect(extractIpAddress(request)).toBe('192.168.1.3');
    });

    it('should return undefined when no IP headers present', () => {
      const request = new NextRequest('https://example.com');
      expect(extractIpAddress(request)).toBeUndefined();
    });

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
          'x-vercel-forwarded-for': '192.168.1.3',
        },
      });

      expect(extractIpAddress(request)).toBe('192.168.1.1');
    });

    it('should handle multiple IPs in x-forwarded-for and take first', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        },
      });

      expect(extractIpAddress(request)).toBe('192.168.1.1');
    });
  });

  describe('extractUserAgent', () => {
    it('should extract user agent from header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      expect(extractUserAgent(request)).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      );
    });

    it('should return undefined when user agent not present', () => {
      const request = new NextRequest('https://example.com');
      expect(extractUserAgent(request)).toBeUndefined();
    });
  });

  describe('extractRequestMetadata', () => {
    it('should extract both IP and user agent', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      const metadata = extractRequestMetadata(request);

      expect(metadata).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should handle missing metadata gracefully', () => {
      const request = new NextRequest('https://example.com');
      const metadata = extractRequestMetadata(request);

      expect(metadata).toEqual({
        ipAddress: undefined,
        userAgent: undefined,
      });
    });
  });

  describe('Audit wrapper functions', () => {
    let mockRequest: NextRequest;

    beforeEach(() => {
      mockRequest = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });
    });

    it('should call auditAuthorizationSuccess with metadata', async () => {
      await auditAuthorizationSuccess(
        mockRequest,
        'user-123',
        'client-abc',
        'auth-xyz',
        ['openid', 'email']
      );

      const { logAuthorizationSuccess } = await import('@/lib/audit-log');
      expect(logAuthorizationSuccess).toHaveBeenCalledWith(
        'user-123',
        'client-abc',
        'auth-xyz',
        ['openid', 'email'],
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should call auditAuthorizationDenial with metadata', async () => {
      await auditAuthorizationDenial(
        mockRequest,
        'user-123',
        'client-abc',
        'auth-xyz',
        'user_denied'
      );

      const { logAuthorizationDenial } = await import('@/lib/audit-log');
      expect(logAuthorizationDenial).toHaveBeenCalledWith(
        'user-123',
        'client-abc',
        'auth-xyz',
        'user_denied',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should call auditAuthorizationError with metadata', async () => {
      await auditAuthorizationError(
        mockRequest,
        'user-123',
        'client-abc',
        'auth-xyz',
        'Invalid request'
      );

      const { logAuthorizationError } = await import('@/lib/audit-log');
      expect(logAuthorizationError).toHaveBeenCalledWith(
        'user-123',
        'client-abc',
        'auth-xyz',
        'Invalid request',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });
  });
});
