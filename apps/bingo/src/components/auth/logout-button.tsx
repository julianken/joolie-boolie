'use client';

/**
 * Logout Button Component
 *
 * Clears OAuth tokens and redirects to home page
 */

import { logout } from '@/lib/auth/oauth-client';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = () => {
    logout(); // Clears tokens and redirects to /
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        'rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
      }
    >
      Sign Out
    </button>
  );
}
