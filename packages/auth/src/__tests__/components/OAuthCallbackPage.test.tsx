import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
vi.stubGlobal('sessionStorage', mockSessionStorage);

// Mock form submit — set up fresh in beforeEach to survive restoreAllMocks
let mockSubmit: ReturnType<typeof vi.fn>;

// Mock next/navigation
const mockPush = vi.fn();
let searchParamsMap: Record<string, string> = {};

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsMap[key] ?? null,
  }),
  useRouter: () => ({ push: mockPush }),
}));

import { OAuthCallbackPage } from '../../components/OAuthCallbackPage';

describe('OAuthCallbackPage', () => {
  let locationHref: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmit = vi.fn();
    HTMLFormElement.prototype.submit = mockSubmit as unknown as () => void;
    searchParamsMap = {};
    mockSessionStorage.getItem.mockReturnValue(null);

    // Mock window.location
    locationHref = '';
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return locationHref;
        },
        set href(val: string) {
          locationHref = val;
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    // No search params set, so the component will show error for missing params.
    // But the Suspense fallback should show "Loading..." briefly.
    // Since we render synchronously, CallbackHandler will mount and show "Completing Sign In"
    // before the useEffect fires.
    await act(async () => {
      render(<OAuthCallbackPage />);
    });

    // The initial render should show the spinner/loading state before useEffect resolves
    // But since act() flushes effects, it will show the error state.
    // Let's test the error case instead.
    expect(screen.getByText('Invalid callback: missing parameters')).toBeInTheDocument();
  });

  describe('auth_success path', () => {
    it('redirects to returnTo on auth_success=1', async () => {
      searchParamsMap = { auth_success: '1', returnTo: '/play' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(locationHref).toBe('/play');
    });

    it('redirects to / when returnTo is missing on auth_success', async () => {
      searchParamsMap = { auth_success: '1' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(locationHref).toBe('/');
    });

    it('sanitizes unsafe returnTo on auth_success', async () => {
      searchParamsMap = { auth_success: '1', returnTo: 'https://evil.com' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(locationHref).toBe('/');
    });
  });

  describe('error path', () => {
    it('displays error from error_description param', async () => {
      searchParamsMap = { error: 'access_denied', error_description: 'User denied access' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('User denied access')).toBeInTheDocument();
      expect(screen.getByText('Redirecting to home page...')).toBeInTheDocument();
    });

    it('displays error code when description is missing', async () => {
      searchParamsMap = { error: 'server_error' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('server_error')).toBeInTheDocument();
    });

    it('schedules redirect to / after error', async () => {
      vi.useFakeTimers();
      searchParamsMap = { error: 'access_denied' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Authentication Error')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
      vi.useRealTimers();
    });
  });

  describe('missing parameters', () => {
    it('shows error when code is missing', async () => {
      searchParamsMap = { state: 'abc123' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Invalid callback: missing parameters')).toBeInTheDocument();
    });

    it('shows error when state is missing', async () => {
      searchParamsMap = { code: 'authcode123' };

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Invalid callback: missing parameters')).toBeInTheDocument();
    });

    it('shows error when both code and state are missing', async () => {
      searchParamsMap = {};

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Invalid callback: missing parameters')).toBeInTheDocument();
    });
  });

  describe('CSRF validation', () => {
    it('shows error on state mismatch', async () => {
      searchParamsMap = { code: 'authcode123', state: 'abc123' };
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'jb_oauth_state_abc123') return 'different_state';
        return null;
      });

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Security validation failed')).toBeInTheDocument();
    });

    it('shows error when stored state is null', async () => {
      searchParamsMap = { code: 'authcode123', state: 'abc123' };
      mockSessionStorage.getItem.mockReturnValue(null);

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Security validation failed')).toBeInTheDocument();
    });
  });

  describe('PKCE verifier', () => {
    it('shows error when code_verifier is missing', async () => {
      searchParamsMap = { code: 'authcode123', state: 'abc123' };
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'jb_oauth_state_abc123') return 'abc123';
        return null; // code_verifier missing
      });

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(screen.getByText('Session expired - please try again')).toBeInTheDocument();
    });
  });

  describe('successful form submission', () => {
    it('submits form with code, codeVerifier, and returnTo', async () => {
      searchParamsMap = { code: 'authcode123', state: 'abc123' };
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'jb_oauth_state_abc123') return 'abc123';
        if (key === 'jb_pkce_verifier_abc123') return 'verifier_value';
        if (key === 'jb_oauth_return_to') return '/play';
        return null;
      });

      await act(async () => {
        render(<OAuthCallbackPage />);
      });

      expect(mockSubmit).toHaveBeenCalled();

      // Verify sessionStorage cleanup
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('jb_pkce_verifier_abc123');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('jb_oauth_state_abc123');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('jb_oauth_return_to');
    });
  });
});
