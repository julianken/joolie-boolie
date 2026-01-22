'use client';

/**
 * Auth Status Component
 *
 * Shows current authentication status and provides login/logout actions
 */

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth/oauth-client';
import { LoginButton } from './login-button';
import { LogoutButton } from './logout-button';

export function AuthStatus() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status on mount
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setAuthenticated(authStatus);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Signed in
        </span>
        <LogoutButton />
      </div>
    );
  }

  return <LoginButton />;
}
