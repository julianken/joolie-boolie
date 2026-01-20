import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { AuthProvider, AuthContext } from '../components/auth-provider';
import { ProtectedRoute, withAuth, GuestOnly } from '../components/protected-route';
import { createMockSupabaseClient, createMockSession } from '@beak-gaming/testing/mocks';

// Create mock client
let mockClient: ReturnType<typeof createMockSupabaseClient>;

vi.mock('../client', () => ({
  getClient: () => mockClient,
  createClient: () => mockClient,
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  pathname: '/',
  search: '',
  origin: 'http://localhost:3000',
};

describe('Auth components', () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    // @ts-expect-error - Mocking window.location
    delete window.location;
    // @ts-expect-error - Mocking window.location
    window.location = { ...mockLocation };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should render children', async () => {
      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <div data-testid="child">Child content</div>
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should initialize with session from Supabase', async () => {
      const session = createMockSession({ email: 'user@test.com' });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      const TestComponent = () => {
        const context = React.useContext(AuthContext);
        if (!context) return null;
        return (
          <div>
            <span data-testid="loading">{context.isLoading.toString()}</span>
            <span data-testid="email">{context.user?.email || 'none'}</span>
          </div>
        );
      };

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <TestComponent />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await waitFor(() => {
        expect(screen.getByTestId('email')).toHaveTextContent('user@test.com');
      });
    });

    it('should call onAuthStateChange callback', async () => {
      const session = createMockSession();
      const onAuthStateChange = vi.fn();

      await act(async () => {
        render(
          <AuthProvider
            supabaseClient={mockClient as unknown as SupabaseClient}
            onAuthStateChange={onAuthStateChange}
          >
            <div>Test</div>
          </AuthProvider>
        );
      });

      // Simulate auth state change
      await act(async () => {
        mockClient.__helpers.simulateAuthChange('SIGNED_IN', session);
      });

      expect(onAuthStateChange).toHaveBeenCalledWith('SIGNED_IN', session);
    });

    it('should use initial session when provided', async () => {
      const initialSession = createMockSession({ email: 'initial@test.com' });

      const TestComponent = () => {
        const context = React.useContext(AuthContext);
        if (!context) return null;
        return <span data-testid="email">{context.user?.email || 'none'}</span>;
      };

      await act(async () => {
        render(
          <AuthProvider
            supabaseClient={mockClient as unknown as SupabaseClient}
            initialSession={initialSession as unknown as Session}
          >
            <TestComponent />
          </AuthProvider>
        );
      });

      // Should immediately have the initial session
      expect(screen.getByTestId('email')).toHaveTextContent('initial@test.com');
    });
  });

  describe('ProtectedRoute', () => {
    it('should show loading while checking auth', async () => {
      // Make getSession never resolve to keep loading state
      mockClient.auth.getSession.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedRoute>
              <div data-testid="protected">Protected content</div>
            </ProtectedRoute>
          </AuthProvider>
        );
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render children when authenticated', async () => {
      const session = createMockSession();
      mockClient.__helpers.setState({ user: session.user, session });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedRoute>
              <div data-testid="protected">Protected content</div>
            </ProtectedRoute>
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('protected')).toBeInTheDocument();
      });
    });

    it('should redirect when not authenticated', async () => {
      mockClient.__helpers.setState({ user: null, session: null });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedRoute loginUrl="/login">
              <div data-testid="protected">Protected content</div>
            </ProtectedRoute>
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(window.location.href).toContain('/login');
      });
    });

    it('should show custom loading component', async () => {
      // Make getSession never resolve to keep loading state
      mockClient.auth.getSession.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedRoute loadingComponent={<div data-testid="custom-loading">Custom loading</div>}>
              <div>Protected</div>
            </ProtectedRoute>
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    it('should show fallback when not authenticated', async () => {
      mockClient.__helpers.setState({ user: null, session: null });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedRoute
              fallback={<div data-testid="fallback">Please log in</div>}
              useClientRedirect={false}
            >
              <div data-testid="protected">Protected content</div>
            </ProtectedRoute>
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });

    it('should call onAuthFail callback', async () => {
      const onAuthFail = vi.fn();
      mockClient.__helpers.setState({ user: null, session: null });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedRoute onAuthFail={onAuthFail} useClientRedirect={false}>
              <div>Protected</div>
            </ProtectedRoute>
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(onAuthFail).toHaveBeenCalled();
      });
    });
  });

  describe('withAuth HOC', () => {
    it('should wrap component with ProtectedRoute', async () => {
      const TestComponent = () => <div data-testid="wrapped">Wrapped content</div>;
      const ProtectedComponent = withAuth(TestComponent);

      const session = createMockSession();
      mockClient.__helpers.setState({ user: session.user, session });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <ProtectedComponent />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('wrapped')).toBeInTheDocument();
      });
    });

    it('should set displayName correctly', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';

      const ProtectedComponent = withAuth(TestComponent);

      expect(ProtectedComponent.displayName).toBe('withAuth(TestComponent)');
    });
  });

  describe('GuestOnly', () => {
    it('should show children when not authenticated', async () => {
      mockClient.__helpers.setState({ user: null, session: null });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <GuestOnly>
              <div data-testid="guest">Guest content</div>
            </GuestOnly>
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest')).toBeInTheDocument();
      });
    });

    it('should redirect when authenticated', async () => {
      const session = createMockSession();
      mockClient.__helpers.setState({ user: session.user, session });
      mockClient.auth.getSession.mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <GuestOnly redirectTo="/dashboard">
              <div data-testid="guest">Guest content</div>
            </GuestOnly>
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });

    it('should show custom loading component', async () => {
      // Make getSession never resolve to keep loading state
      mockClient.auth.getSession.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(
          <AuthProvider supabaseClient={mockClient as unknown as SupabaseClient}>
            <GuestOnly loadingComponent={<div data-testid="loading">Loading...</div>}>
              <div>Guest</div>
            </GuestOnly>
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });
});
