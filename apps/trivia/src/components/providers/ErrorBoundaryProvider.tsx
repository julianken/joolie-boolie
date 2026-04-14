'use client';

import { ReactNode } from 'react';
import { ErrorBoundaryProvider as SharedErrorBoundaryProvider } from '@hosted-game-night/ui';

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

async function loadSentryBackend() {
  const { SentryErrorBackend } = await import('@hosted-game-night/error-tracking/sentry');
  const { setErrorBackend } = await import('@hosted-game-night/error-tracking/client');
  setErrorBackend(new SentryErrorBackend());
}

/**
 * Error boundary provider for the Trivia app.
 * Delegates to the shared ErrorBoundaryProvider from @hosted-game-night/ui
 * with Trivia-specific configuration.
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <SharedErrorBoundaryProvider
      appName="TriviaNight"
      componentName="TriviaApp"
      errorMessageBody="Trivia"
      appMetadata={{ app: 'trivia' }}
      loadSentryBackend={loadSentryBackend}
    >
      {children}
    </SharedErrorBoundaryProvider>
  );
}
