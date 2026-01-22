/**
 * OAuth 2.1 Callback Handler for Trivia Night
 *
 * Handles the redirect from Platform Hub after user authorization.
 *
 * Flow:
 * 1. Extract 'code' and 'state' from URL parameters
 * 2. Validate state parameter (CSRF protection)
 * 3. Retrieve code_verifier from sessionStorage
 * 4. Exchange authorization code for tokens
 * 5. Store tokens in httpOnly cookies
 * 6. Redirect to /play
 *
 * Error handling:
 * - Missing/invalid code → redirect to /
 * - Missing/invalid state → redirect to /
 * - Missing code_verifier → redirect to /
 * - Token exchange failure → redirect to /
 * - OAuth error response → redirect to /
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForTokens } from '@/lib/auth/oauth-client';
import {
  getCodeVerifier,
  clearCodeVerifier,
  getState,
  clearState,
  storeTokens,
} from '@/lib/auth/token-storage';
import { constantTimeCompare } from '@/lib/auth/crypto-utils';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for OAuth error response
        const errorParam = searchParams.get('error');
        if (errorParam) {
          const errorDescription =
            searchParams.get('error_description') || 'Authorization failed';
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription);

          // Redirect to home after showing error
          setTimeout(() => {
            router.push('/?error=' + encodeURIComponent(errorParam));
          }, 2000);
          return;
        }

        // Extract authorization code
        const code = searchParams.get('code');
        if (!code) {
          console.error('Missing authorization code');
          setError('Missing authorization code');

          setTimeout(() => {
            router.push('/?error=missing_code');
          }, 2000);
          return;
        }

        // Extract and validate state parameter (CSRF protection)
        const returnedState = searchParams.get('state');
        const storedState = getState();

        if (
          !returnedState ||
          !storedState ||
          !constantTimeCompare(returnedState, storedState)
        ) {
          console.error('Invalid state parameter');
          setError('Invalid state parameter');

          // Clean up sensitive data
          clearState();
          clearCodeVerifier();

          setTimeout(() => {
            router.push('/?error=invalid_state');
          }, 2000);
          return;
        }

        // State is valid, clear it
        clearState();

        // Retrieve PKCE code_verifier
        const codeVerifier = getCodeVerifier();
        if (!codeVerifier) {
          console.error('Missing PKCE code verifier');
          setError('Missing PKCE code verifier');

          setTimeout(() => {
            router.push('/?error=missing_verifier');
          }, 2000);
          return;
        }

        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(code, codeVerifier);

        // Store tokens in httpOnly cookies
        const stored = await storeTokens(tokens);
        if (!stored) {
          console.error('Failed to store tokens');
          setError('Failed to store tokens');

          // Clear sensitive data on error
          clearCodeVerifier();

          setTimeout(() => {
            router.push('/?error=storage_failed');
          }, 2000);
          return;
        }

        // Clean up PKCE code_verifier (success path)
        clearCodeVerifier();

        // Redirect to /play
        router.push('/play');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(
          err instanceof Error ? err.message : 'Authentication failed'
        );

        // CRITICAL: Always clear sensitive data on ANY error
        // Prevents PKCE replay attacks and state reuse
        clearCodeVerifier();
        clearState();

        // Redirect to home after showing error
        setTimeout(() => {
          router.push('/?error=callback_failed');
        }, 2000);
      } finally {
        // DEFENSIVE: Ensure sensitive data is cleared even if we forgot above
        // This is a safety net for any edge cases
        clearCodeVerifier();
        clearState();
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-red-600">
            Authentication Failed
          </h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Completing Sign In
        </h1>
        <p className="text-gray-600">
          Please wait while we verify your credentials...
        </p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Loading...</h1>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
