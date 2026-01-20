import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthProvider } from '../components/auth-provider';
import { useAuth } from '../hooks/use-auth';
import { useSession } from '../hooks/use-session';
import { useUser } from '../hooks/use-user';
import { createMockSupabaseClient, createMockSession } from '@beak-gaming/testing/mocks';

// Create mock client
let mockClient: ReturnType<typeof createMockSupabaseClient>;

vi.mock('../client', () => ({
  getClient: () => mockClient,
  createClient: () => mockClient,
}));

describe('Auth hooks', () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>{children}</AuthProvider>
  );

  describe('useAuth', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return initial loading state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should provide signIn function', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response.error).toBeNull();
      });

      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.session).not.toBeNull();
    });

    it('should return error for invalid credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signIn('wrong@example.com', 'wrong');
        expect(response.error).not.toBeNull();
        expect(response.error?.code).toBe('INVALID_CREDENTIALS');
      });

      expect(result.current.user).toBeNull();
    });

    it('should provide signOut function', async () => {
      // Start with an authenticated session
      const session = createMockSession();
      mockClient.__helpers.setState({ user: session.user, session });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signOut();
        expect(response.error).toBeNull();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should provide signUp function', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signUp('new@example.com', 'password123');
        expect(response.error).toBeNull();
      });

      // User created but no session (email confirmation needed)
      expect(result.current.user?.email).toBe('new@example.com');
    });

    it('should provide resetPassword function', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.resetPassword('test@example.com');
        expect(response.error).toBeNull();
      });

      expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should provide refreshSession function', async () => {
      const session = createMockSession();
      mockClient.__helpers.setState({ user: session.user, session });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockClient.auth.refreshSession).toHaveBeenCalled();
    });
  });

  describe('useSession', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSession());
      }).toThrow('useSession must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return session data', async () => {
      const session = createMockSession({ email: 'user@test.com' });
      mockClient.__helpers.setState({ user: session.user, session });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.accessToken).toBe('mock-access-token');
    });

    it('should return null when not authenticated', async () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.accessToken).toBeNull();
    });

    it('should provide refresh function', async () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('useUser', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useUser());
      }).toThrow('useUser must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return user data', async () => {
      const session = createMockSession({ email: 'user@test.com', id: 'user-123' });
      mockClient.__helpers.setState({ user: session.user, session });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.email).toBe('user@test.com');
      expect(result.current.userId).toBe('user-123');
    });

    it('should return null when not authenticated', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.email).toBeNull();
      expect(result.current.userId).toBeNull();
    });

    it('should return user metadata', async () => {
      const session = createMockSession({
        email: 'user@test.com',
        user_metadata: { name: 'Test User', role: 'admin' },
      });
      mockClient.__helpers.setState({ user: session.user, session });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metadata).toEqual({ name: 'Test User', role: 'admin' });
    });
  });
});
