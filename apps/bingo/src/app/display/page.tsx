'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameStore, useGameSelectors } from '@/stores/game-store';
import { useSyncStore } from '@joolie-boolie/sync';
import { useSync } from '@/hooks/use-sync';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { isValidSessionId } from '@/lib/sync/session';
import { isValidRoomCode } from '@joolie-boolie/sync';
import { RoomCodeDisplay } from '@joolie-boolie/ui';
import {
  BallReveal,
  GlowBackdrop,
  AudienceBingoBoard,
  PatternDisplay,
  BallsCalledCounter,
} from '@/components/audience';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { useApplyTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/stores/theme-store';

/**
 * Display-specific keyboard shortcuts (view-only mode)
 */
const displayShortcuts = [
  { key: 'F', label: 'F', description: 'Toggle fullscreen' },
  { key: '?', label: '?', description: 'Show this help' },
];

/**
 * Invalid Session Error Component
 */
function InvalidSessionError() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8" role="main">
      <div className="max-w-lg text-center space-y-6" role="alert">
        <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }} aria-hidden="true">
          <svg
            className="w-12 h-12 text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        <p className="text-xl text-foreground-secondary">
          This display link is invalid or has expired.
        </p>
        <p className="text-lg text-foreground-secondary">
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
    <main
      className="min-h-screen bg-background flex flex-col items-center justify-center"
      role="main"
      aria-busy="true"
      aria-label="Loading audience display"
    >
      <div
        className="w-32 h-32 rounded-full border-8 border-t-primary animate-spin motion-reduce:animate-none"
        style={{ borderColor: 'rgba(59, 130, 246, 0.20)', borderTopColor: 'var(--primary)' }}
        aria-hidden="true"
      />
      <p className="mt-6 text-2xl text-foreground-secondary" role="status" aria-live="polite">
        Loading display...
      </p>
    </main>
  );
}

/**
 * Audience Display Content
 * Inner component that uses useSearchParams (requires Suspense boundary).
 */
function DisplayContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  const offlineSessionId = searchParams.get('offline');
  const sessionId = searchParams.get('session');

  if (roomCode) {
    if (!isValidRoomCode(roomCode)) return <InvalidSessionError />;
    return <AudienceDisplay roomCode={roomCode} />;
  }

  if (offlineSessionId) {
    if (!isValidSessionId(offlineSessionId)) return <InvalidSessionError />;
    return <AudienceDisplay sessionId={offlineSessionId} />;
  }

  if (sessionId) {
    if (!isValidSessionId(sessionId)) return <InvalidSessionError />;
    return <AudienceDisplay sessionId={sessionId} />;
  }

  return <InvalidSessionError />;
}

/**
 * Audience Display Component
 * Center-dominant layout: 60% ball theater, 25% board, 15% pattern/counter.
 * Optimized for projector/large TV, readable from 10-30 feet.
 */
function AudienceDisplay({
  roomCode,
  sessionId,
}: {
  roomCode?: string;
  sessionId?: string;
}) {
  const [dbSessionId, setDbSessionId] = useState<string | null>(sessionId || null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isResolvingRoomCode, setIsResolvingRoomCode] = useState(false);

  // Poll database for session ID when using room code
  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let isFirstFetch = true;

    const fetchSessionId = async () => {
      try {
        if (isFirstFetch) {
          setIsResolvingRoomCode(true);
          isFirstFetch = false;
        }
        const response = await fetch(`/api/sessions/room/${roomCode}`);

        if (!response.ok) {
          if (response.status !== 404) {
            console.warn(`Failed to fetch session for room ${roomCode}:`, response.statusText);
          }
          return;
        }

        const data = await response.json();
        if (isMounted && data.sessionId) {
          setDbSessionId(data.sessionId);
          setDbError(null);
          setIsResolvingRoomCode(false);
        }
      } catch (error) {
        console.warn('Error fetching session ID:', error);
        setIsResolvingRoomCode(false);
      } finally {
        if (isMounted && !dbSessionId) {
          timeoutId = setTimeout(fetchSessionId, 5000);
        }
      }
    };

    fetchSessionId();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [roomCode, dbSessionId]);

  // CRITICAL: Match presenter's sessionId calculation
  const effectiveSessionId = roomCode || sessionId || '';

  const { isConnected, connectionError, requestSync } = useSync({
    role: 'audience',
    sessionId: effectiveSessionId,
  });

  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [showHelp, setShowHelp] = useState(false);
  const toggleHelp = useCallback(() => setShowHelp((prev) => !prev), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  const displayTheme = useThemeStore((state) => state.displayTheme);
  useApplyTheme(displayTheme);

  const currentBall = useGameStore((state) => state.currentBall);
  const calledBalls = useGameStore((state) => state.calledBalls);
  const pattern = useGameStore((state) => state.pattern);
  const status = useGameStore((state) => state.status);
  const autoCallEnabled = useGameStore((state) => state.autoCallEnabled);
  const autoCallSpeed = useGameStore((state) => state.autoCallSpeed);
  const { ballsCalled, ballsRemaining } = useGameSelectors();

  const lastSyncTimestamp = useSyncStore((state) => state.lastSyncTimestamp);

  // Request sync on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [requestSync]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        toggleHelp();
        return;
      }

      if (showHelp) return;

      switch (event.code) {
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, showHelp, toggleHelp]);

  const lastSyncFormatted = lastSyncTimestamp
    ? new Date(lastSyncTimestamp).toLocaleTimeString()
    : 'Never';

  const hasContent = isConnected || (currentBall !== null) || calledBalls.length > 0;

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-display"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        Skip to main display
      </a>

      <main className="min-h-screen bg-background flex flex-col" role="main">

        {/* Minimal status bar header */}
        <header
          className="px-4 py-2 flex items-center justify-between"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
            background: 'rgba(10, 14, 26, 0.85)',
          }}
        >
          {/* Left: title + room code */}
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Bingo
            </h1>
            {roomCode && (
              <span className="text-sm font-mono text-foreground-secondary">
                Room: <span className="text-foreground font-semibold">{roomCode}</span>
              </span>
            )}
          </div>

          {/* Right: controls + status */}
          <div className="flex items-center gap-3">
            {/* Game status */}
            {status !== 'idle' && (
              <span
                className="text-sm font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: status === 'playing' ? 'rgba(34, 197, 94, 0.15)' : status === 'paused' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: status === 'playing' ? 'var(--success)' : status === 'paused' ? 'var(--warning)' : 'var(--error)',
                }}
              >
                {status === 'playing' && 'Live'}
                {status === 'paused' && 'Paused'}
                {status === 'ended' && 'Ended'}
              </span>
            )}

            {/* Fullscreen button — 44px minimum (A-11) */}
            <button
              onClick={toggleFullscreen}
              className="rounded-lg hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ minWidth: '44px', minHeight: '44px', padding: '10px' }}
              title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
              aria-label={isFullscreen ? 'Exit fullscreen (press F)' : 'Enter fullscreen (press F)'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>

            {/* Help button */}
            <button
              onClick={toggleHelp}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ minWidth: '44px', minHeight: '44px' }}
              title="Keyboard shortcuts (?)"
              aria-label="Show keyboard shortcuts"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Connection status */}
            <div
              className="flex items-center gap-2"
              role="status"
              aria-live="polite"
              aria-label={isConnected ? `Connected to presenter, synced at ${lastSyncFormatted}` : 'Waiting for presenter'}
            >
              <div
                className={`w-3 h-3 rounded-full motion-reduce:animate-none ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}
                aria-hidden="true"
              />
              <span className="text-sm text-foreground-secondary hidden md:block">
                {isConnected ? `Synced ${lastSyncFormatted}` : 'Waiting...'}
              </span>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {(connectionError || dbError) && (
          <div
            className="px-4 py-3 text-center font-medium"
            role="alert"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.10)', borderBottom: '1px solid var(--error)', color: 'var(--error)' }}
          >
            {connectionError ? `Connection Error: ${connectionError}` : `Database Error: ${dbError}`}
          </div>
        )}

        {/* Main display content */}
        <div id="main-display" className="flex-1 flex flex-col" aria-label="Audience display">

          {/* Room Code Display - only shown when using room code */}
          {roomCode && !hasContent && (
            <div className="p-4">
              <RoomCodeDisplay
                roomCode={roomCode}
                showSyncStatus={false}
                className="max-w-md mx-auto"
              />
            </div>
          )}

          {/* Waiting state */}
          {!hasContent && (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-8 text-center p-8"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-32 h-32 rounded-full border-8 animate-spin motion-reduce:animate-none"
                style={{ borderColor: 'rgba(59, 130, 246, 0.20)', borderTopColor: 'var(--primary)' }}
                aria-hidden="true"
              />
              <p className="text-4xl md:text-5xl text-foreground-secondary font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {isResolvingRoomCode ? 'Connecting...' : 'Waiting for presenter'}
              </p>
              <p className="text-2xl text-foreground-muted">
                {isResolvingRoomCode
                  ? 'Establishing connection with the game session.'
                  : 'Open the presenter view to start the game.'}
              </p>
            </div>
          )}

          {/* Center-dominant 3-column layout: 60% ball / 25% board / 15% pattern */}
          {hasContent && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6">

              {/* Center: Hero ball theater — 60% width on desktop */}
              <section
                className="lg:col-span-7 lg:order-2 flex flex-col items-center justify-center relative"
                aria-label="Current ball"
              >
                {/* Game status */}
                {status !== 'idle' && (
                  <div
                    className="mb-6 px-6 py-2 rounded-full text-2xl font-semibold"
                    role="status"
                    aria-live="polite"
                    style={{
                      backgroundColor: status === 'playing' ? 'rgba(34, 197, 94, 0.15)' : status === 'paused' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(107, 113, 137, 0.15)',
                      color: status === 'playing' ? 'var(--success)' : status === 'paused' ? 'var(--warning)' : 'var(--foreground-muted)',
                    }}
                  >
                    {status === 'playing' && 'Game in Progress'}
                    {status === 'paused' && 'Game Paused'}
                    {status === 'ended' && 'Game Ended'}
                  </div>
                )}

                {/* Ball display with ambient glow */}
                <div className="relative flex items-center justify-center">
                  {/* GlowBackdrop behind ball */}
                  <div
                    aria-hidden="true"
                    className="absolute pointer-events-none"
                    style={{
                      width: '500px',
                      height: '500px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <GlowBackdrop
                      column={currentBall?.column ?? null}
                      visible={!!currentBall}
                    />
                  </div>

                  {/* Spring-animated ball */}
                  <div className="relative z-10">
                    <BallReveal
                      ball={currentBall}
                      autoCallInterval={autoCallSpeed}
                      isAutoCall={autoCallEnabled}
                    />
                  </div>
                </div>

                {/* Balls called counter below ball */}
                <div className="mt-8">
                  <BallsCalledCounter called={ballsCalled} remaining={ballsRemaining} />
                </div>
              </section>

              {/* Left: Bingo Board — 25% width on desktop */}
              <section className="lg:col-span-3 lg:order-1" aria-label="Bingo board">
                <div
                  className="rounded-xl p-3 h-full"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <h2
                    className="text-xl font-semibold mb-3 text-center text-foreground-secondary"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Called
                  </h2>
                  <AudienceBingoBoard calledBalls={calledBalls} />
                </div>
              </section>

              {/* Right: Pattern display — 15% width on desktop */}
              <section className="lg:col-span-2 lg:order-3" aria-label="Winning pattern">
                <div
                  className="rounded-xl p-3 h-full"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <PatternDisplay pattern={pattern} />
                </div>
              </section>
            </div>
          )}
        </div>
        {/* Footer removed per design plan Part 5 */}
      </main>

      <KeyboardShortcutsModal
        isOpen={showHelp}
        onClose={closeHelp}
        shortcuts={displayShortcuts}
      />
    </>
  );
}

/**
 * Audience Display Page
 * Optimized for projector/large TV display.
 * Center-dominant layout (60% ball, 25% board, 15% pattern).
 * Syncs state from presenter window via BroadcastChannel.
 * Readable from 10-30 feet (Issue A-23: projector readability).
 */
export default function DisplayPage() {
  return (
    <Suspense fallback={<DisplayLoading />}>
      <DisplayContent />
    </Suspense>
  );
}
