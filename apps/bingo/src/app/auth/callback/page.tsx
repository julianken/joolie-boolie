'use client';

/**
 * OAuth Callback Handler
 *
 * This page handles the redirect from Platform Hub after user authorization.
 * It exchanges the authorization code for access/refresh tokens and redirects
 * the user to the appropriate page.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleCallback } from '@/lib/auth/oauth-client';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      // Extract query parameters
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors from Platform Hub
      if (error) {
        setStatus('error');
        setErrorMessage(
          errorDescription || `OAuth error: ${error}`
        );
        return;
      }

      // Validate required parameters
      if (!code) {
        setStatus('error');
        setErrorMessage('Missing authorization code');
        return;
      }

      if (!state) {
        setStatus('error');
        setErrorMessage('Missing state parameter');
        return;
      }

      // Exchange code for tokens
      try {
        const result = await handleCallback(code, state);

        if (result.success) {
          setStatus('success');

          // Redirect to the page user was trying to access
          // or default to /play
          const returnTo = sessionStorage.getItem('bingo_oauth_return_to') || '/play';
          sessionStorage.removeItem('bingo_oauth_return_to');

          // Small delay to show success message
          setTimeout(() => {
            router.push(returnTo);
          }, 1000);
        } else {
          setStatus('error');
          setErrorMessage(
            result.error.error_description ||
            `OAuth error: ${result.error.error}`
          );
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to process authentication'
        );
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {status === 'processing' && (
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Completing sign in...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your authentication.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Successfully signed in!
            </h2>
            <p className="text-gray-600">
              Redirecting you to Beak Bingo...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Authentication failed
            </h2>
            <p className="mb-6 text-gray-600">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
