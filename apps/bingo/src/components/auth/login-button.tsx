'use client';

/**
 * Login Button Component
 *
 * Triggers OAuth 2.1 authorization flow with Platform Hub
 */

import { initiateLogin } from '@/lib/auth/oauth-client';

interface LoginButtonProps {
  returnTo?: string; // Optional path to return to after login
  className?: string;
}

export function LoginButton({ returnTo, className }: LoginButtonProps) {
  const handleLogin = () => {
    // Store return path for after authentication
    if (returnTo) {
      sessionStorage.setItem('bingo_oauth_return_to', returnTo);
    }

    // Initiate OAuth flow (redirects to Platform Hub)
    initiateLogin();
  };

  return (
    <button
      onClick={handleLogin}
      className={
        className ||
        'rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      }
    >
      Sign in with Beak Gaming
    </button>
  );
}
