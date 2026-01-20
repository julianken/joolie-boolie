import { vi, type Mock } from 'vitest';

/**
 * Mock Supabase user
 */
export interface MockUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  aud?: string;
  role?: string;
}

/**
 * Mock Supabase session
 */
export interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: MockUser;
}

/**
 * Creates a mock Supabase user
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {},
    app_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    role: 'authenticated',
    ...overrides,
  };
}

/**
 * Creates a mock Supabase session
 */
export function createMockSession(
  userOverrides: Partial<MockUser> = {},
  sessionOverrides: Partial<MockSession> = {}
): MockSession {
  const user = createMockUser(userOverrides);
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
    ...sessionOverrides,
  };
}

/**
 * Mock Supabase auth state
 */
export interface MockAuthState {
  user: MockUser | null;
  session: MockSession | null;
}

/**
 * Type for mock Supabase client helpers
 */
export interface MockSupabaseClientHelpers {
  simulateAuthChange: (event: string, session: MockSession | null) => void;
  setState: (state: MockAuthState) => void;
  getState: () => MockAuthState;
  getListenerCount: () => number;
}

/**
 * Type for mock Supabase client
 */
export interface MockSupabaseClient {
  auth: {
    getSession: Mock;
    getUser: Mock;
    signInWithPassword: Mock;
    signUp: Mock;
    signOut: Mock;
    resetPasswordForEmail: Mock;
    updateUser: Mock;
    refreshSession: Mock;
    onAuthStateChange: Mock;
  };
  __helpers: MockSupabaseClientHelpers;
}

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient(
  initialState: MockAuthState = { user: null, session: null }
): MockSupabaseClient {
  let currentState = { ...initialState };
  const authChangeListeners: Array<(event: string, session: MockSession | null) => void> = [];

  const mockAuth = {
    getSession: vi.fn().mockImplementation(async () => ({
      data: { session: currentState.session },
      error: null,
    })),

    getUser: vi.fn().mockImplementation(async () => ({
      data: { user: currentState.user },
      error: null,
    })),

    signInWithPassword: vi.fn().mockImplementation(async ({ email, password }: { email: string; password: string }) => {
      if (email === 'test@example.com' && password === 'password') {
        const session = createMockSession({ email });
        currentState = { user: session.user, session };
        authChangeListeners.forEach(listener => listener('SIGNED_IN', session));
        return { data: { user: session.user, session }, error: null };
      }
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      };
    }),

    signUp: vi.fn().mockImplementation(async ({ email }: { email: string }) => {
      const user = createMockUser({ email });
      // Simulate unconfirmed email (no session yet)
      currentState = { user, session: null };
      return { data: { user, session: null }, error: null };
    }),

    signOut: vi.fn().mockImplementation(async () => {
      currentState = { user: null, session: null };
      authChangeListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    }),

    resetPasswordForEmail: vi.fn().mockImplementation(async () => ({
      data: {},
      error: null,
    })),

    updateUser: vi.fn().mockImplementation(async () => ({
      data: { user: currentState.user },
      error: null,
    })),

    refreshSession: vi.fn().mockImplementation(async () => {
      if (currentState.session) {
        const newSession = createMockSession(
          { email: currentState.user?.email },
          { access_token: 'refreshed-access-token' }
        );
        currentState = { user: newSession.user, session: newSession };
        return { data: { session: newSession }, error: null };
      }
      return { data: { session: null }, error: null };
    }),

    onAuthStateChange: vi.fn().mockImplementation((callback: (event: string, session: MockSession | null) => void) => {
      authChangeListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn().mockImplementation(() => {
              const index = authChangeListeners.indexOf(callback);
              if (index > -1) {
                authChangeListeners.splice(index, 1);
              }
            }),
          },
        },
      };
    }),
  };

  // Helper to simulate auth state changes in tests
  const simulateAuthChange = (event: string, session: MockSession | null) => {
    currentState = { user: session?.user ?? null, session };
    authChangeListeners.forEach(listener => listener(event, session));
  };

  // Helper to set state directly
  const setState = (state: MockAuthState) => {
    currentState = state;
  };

  // Helper to get current state
  const getState = () => currentState;

  return {
    auth: mockAuth,
    // Test helpers
    __helpers: {
      simulateAuthChange,
      setState,
      getState,
      getListenerCount: () => authChangeListeners.length,
    },
  };
}

/**
 * Mock createBrowserClient from @supabase/ssr
 */
export function mockSupabaseSsr(): MockSupabaseClient {
  const mockClient = createMockSupabaseClient();

  vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => mockClient),
    createServerClient: vi.fn(() => mockClient),
  }));

  return mockClient;
}
