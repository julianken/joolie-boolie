'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameStore, useGameSelectors } from '@/stores/game-store';
import { useSyncStore } from '@/stores/sync-store';
import { useSync } from '@/hooks/use-sync';
import { isValidSessionId } from '@/lib/sync/session';
import {
  WaitingDisplay,
  AudienceQuestionDisplay,
  AudienceScoreboard,
  GameEndDisplay,
} from '@/components/audience';

/**
 * Invalid Session Error Component
 * Displayed when the session ID is missing or invalid.
 */
function InvalidSessionError() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-error/20 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Invalid Session
        </h1>
        <p className="text-xl text-muted-foreground">
          This display link is invalid or has expired.
        </p>
        <p className="text-lg text-muted">
          Please use the &quot;Open Display&quot; button from the presenter window to open a valid display.
        </p>
      </div>
    </main>
  );
}

/**
 * Loading fallback while session params are being parsed.
 */
function DisplayLoading() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-32 h-32 rounded-full border-8 border-muted/30 border-t-primary animate-spin" />
      <p className="mt-6 text-2xl text-muted-foreground">Loading display...</p>
    </main>
  );
}

/**
 * Audience Display Content
 * Inner component that uses useSearchParams (requires Suspense boundary).
 */
function DisplayContent() {
  // Parse session ID from URL
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  // Validate session ID
  if (!sessionId || !isValidSessionId(sessionId)) {
    return <InvalidSessionError />;
  }

  return <AudienceDisplay sessionId={sessionId} />;
}

/**
 * Audience Display Component
 * Renders the game display once we have a valid session.
 */
function AudienceDisplay({ sessionId }: { sessionId: string }) {
  // Initialize sync as audience role with session-scoped channel
  const { isConnected, connectionError, requestSync } = useSync({
    role: 'audience',
    sessionId,
  });

  // Get game state from store (hydrated by sync) - use individual selectors to minimize re-renders
  const status = useGameStore((state) => state.status);
  const displayQuestionIndex = useGameStore((state) => state.displayQuestionIndex);
  const questions = useGameStore((state) => state.questions);
  const teams = useGameStore((state) => state.teams);
  const currentRound = useGameStore((state) => state.currentRound);
  const totalRounds = useGameStore((state) => state.totalRounds);

  // Get computed selectors
  const { teamsSortedByScore, displayQuestion } = useGameSelectors();

  // Get sync status
  const lastSyncTimestamp = useSyncStore((state) => state.lastSyncTimestamp);

  // Request sync on visibility change (when user switches back to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [requestSync]);

  // Format last sync time
  const lastSyncFormatted = lastSyncTimestamp
    ? new Date(lastSyncTimestamp).toLocaleTimeString()
    : 'Never';

  // Calculate question position in round for display
  const questionsPerRound = Math.ceil(questions.length / totalRounds) || 5;
  const questionInRound = displayQuestionIndex !== null
    ? (displayQuestionIndex % questionsPerRound) + 1
    : null;

  // Render content based on game state
  const renderContent = () => {
    // 1. Not connected - waiting for presenter
    if (!isConnected && !displayQuestionIndex && teams.length === 0) {
      return <WaitingDisplay message="Waiting for presenter..." />;
    }

    // 2. Game ended - show final results
    if (status === 'ended') {
      return <GameEndDisplay teams={teamsSortedByScore} />;
    }

    // 3. Between rounds - show scoreboard
    if (status === 'between_rounds') {
      return (
        <AudienceScoreboard
          teams={teamsSortedByScore}
          currentRound={currentRound}
          totalRounds={totalRounds}
        />
      );
    }

    // 4. Question being displayed
    if (displayQuestionIndex !== null && displayQuestion) {
      return (
        <AudienceQuestionDisplay
          question={displayQuestion}
          questionNumber={questionInRound ?? 1}
          totalQuestions={questionsPerRound}
          roundNumber={currentRound + 1}
        />
      );
    }

    // 5. Playing but no question shown yet
    return <WaitingDisplay message="Get ready..." />;
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header with sync status */}
      <header className="bg-muted/10 border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Trivia Night
            </h1>
            <p className="text-lg text-muted-foreground">Audience Display</p>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-3">
            <div
              className={`
                w-4 h-4 rounded-full
                ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}
              `}
              title={isConnected ? 'Connected to presenter' : 'Disconnected'}
            />
            <span className="text-base text-muted-foreground hidden md:block">
              {isConnected ? `Synced at ${lastSyncFormatted}` : 'Waiting for presenter...'}
            </span>
          </div>
        </div>
      </header>

      {/* Error display */}
      {connectionError && (
        <div className="bg-error/10 border-b border-error px-4 py-3">
          <p className="text-center text-error font-medium">
            Connection Error: {connectionError}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/10 border-t border-border px-4 py-2">
        <p className="text-center text-base text-muted-foreground">
          Keep this window visible on the projector or large display
        </p>
      </footer>
    </main>
  );
}

/**
 * Audience Display Page
 *
 * Optimized for projector/large TV display.
 * Syncs state from presenter window via BroadcastChannel.
 * Designed to be readable from the back of the room (30+ feet).
 *
 * Requires a valid session ID in the URL query parameter.
 * Navigate via the "Open Display" button in the presenter view.
 */
export default function DisplayPage() {
  return (
    <Suspense fallback={<DisplayLoading />}>
      <DisplayContent />
    </Suspense>
  );
}
