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
 * Error boundary provider for the Bingo app.
 * Delegates to the shared ErrorBoundaryProvider from @hosted-game-night/ui
 * with Bingo-specific configuration.
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <SharedErrorBoundaryProvider
      appName="BeakBingo"
      componentName="BingoApp"
      errorMessageBody="the bingo game"
      appMetadata={{ app: 'bingo' }}
      loadSentryBackend={loadSentryBackend}
    >
      {children}
    </SharedErrorBoundaryProvider>
  );
}
