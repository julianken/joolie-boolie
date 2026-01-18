'use client';

import { useState } from 'react';
import { useGameKeyboard } from '@/hooks/use-game-keyboard';
import { useSync } from '@/hooks/use-sync';
import { generateSessionId } from '@/lib/sync/session';
import { QuestionList } from '@/components/presenter/QuestionList';
import { QuestionDisplay } from '@/components/presenter/QuestionDisplay';
import { TeamScoreInput } from '@/components/presenter/TeamScoreInput';
import { TeamManager } from '@/components/presenter/TeamManager';
import { OpenDisplayButton } from '@/components/presenter/OpenDisplayButton';
import { RoundSummary } from '@/components/presenter/RoundSummary';

export default function PlayPage() {
  const game = useGameKeyboard();

  // Generate a unique session ID for this presenter window
  const [sessionId] = useState(() => generateSessionId());

  // Round summary overlay control
  const [showRoundSummary, setShowRoundSummary] = useState(false);

  // Initialize sync as presenter role with session-scoped channel
  const { isConnected } = useSync({ role: 'presenter', sessionId });

  // Helper to get status display
  const getStatusDisplay = () => {
    switch (game.status) {
      case 'setup':
        return { text: 'Setup', className: 'bg-blue-500/20 text-blue-600' };
      case 'playing':
        return {
          text: `Playing - ${game.roundProgress}`,
          className: 'bg-green-500/20 text-green-600',
        };
      case 'between_rounds':
        return {
          text: `Round ${game.currentRound + 1} Complete`,
          className: 'bg-yellow-500/20 text-yellow-600',
        };
      case 'ended':
        return { text: 'Ended', className: 'bg-gray-500/20 text-gray-600' };
      default:
        return { text: 'Unknown', className: 'bg-gray-500/20 text-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Handle next round action
  const handleNextRound = () => {
    game.nextRound();
    setShowRoundSummary(false);
  };

  // Handle complete round
  const handleCompleteRound = () => {
    game.completeRound();
    setShowRoundSummary(true);
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Trivia Night
            </h1>
            <p className="text-lg text-muted-foreground">Presenter View</p>
          </div>

          {/* Display controls */}
          <div className="flex items-center gap-4">
            {/* Game status */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.className}`}>
              {statusDisplay.text}
            </span>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-3 h-3 rounded-full
                  ${isConnected ? 'bg-green-500' : 'bg-gray-400'}
                `}
                title={isConnected ? 'Sync active' : 'Sync not active'}
              />
              <span className="text-base text-muted-foreground hidden sm:block">
                {isConnected ? 'Sync Active' : 'Sync Ready'}
              </span>
            </div>

            {/* Open Display button */}
            <OpenDisplayButton sessionId={sessionId} />
          </div>
        </header>

        {/* Main content grid - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Question List */}
          <section className="lg:col-span-3">
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <QuestionList
                questions={game.questions}
                selectedIndex={game.selectedQuestionIndex}
                displayIndex={game.displayQuestionIndex}
                currentRound={game.currentRound}
                totalRounds={game.totalRounds}
                onSelect={game.selectQuestion}
                onSetDisplay={game.setDisplayQuestion}
              />
            </div>
          </section>

          {/* Center column: Question Display */}
          <section className="lg:col-span-5">
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <QuestionDisplay
                question={game.selectedQuestion}
                peekAnswer={game.peekAnswer}
                onTogglePeek={() => game.setPeekAnswer(!game.peekAnswer)}
                progress={game.questionInRoundProgress}
                roundProgress={game.roundProgress}
                isOnDisplay={game.displayQuestionIndex === game.selectedQuestionIndex}
              />
            </div>
          </section>

          {/* Right column: Team Management & Scores */}
          <section className="lg:col-span-4 space-y-6">
            {/* Team Manager */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <TeamManager
                teams={game.teams}
                status={game.status}
                onAddTeam={game.addTeam}
                onRemoveTeam={game.removeTeam}
                onRenameTeam={game.renameTeam}
              />
            </div>

            {/* Team Score Input - during playing or between_rounds */}
            {(game.status === 'playing' || game.status === 'between_rounds') && (
              <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                <TeamScoreInput
                  teams={game.teams}
                  currentRound={game.currentRound}
                  onAdjustScore={game.adjustTeamScore}
                  onSetScore={game.setTeamScore}
                />
              </div>
            )}

            {/* Keyboard shortcuts reference */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Keyboard Shortcuts</h2>
              <ul className="space-y-2 text-base">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Navigate questions</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-muted/30 rounded font-mono text-sm">
                      ↑
                    </kbd>
                    <kbd className="px-2 py-1 bg-muted/30 rounded font-mono text-sm">
                      ↓
                    </kbd>
                  </div>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Peek answer</span>
                  <kbd className="px-2 py-1 bg-muted/30 rounded font-mono text-sm">
                    P
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Toggle display</span>
                  <kbd className="px-2 py-1 bg-muted/30 rounded font-mono text-sm">
                    D
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Reset game</span>
                  <kbd className="px-2 py-1 bg-muted/30 rounded font-mono text-sm">
                    R
                  </kbd>
                </li>
              </ul>
            </div>

            {/* Game ended state */}
            {game.status === 'ended' && (
              <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                <h2 className="text-xl font-semibold mb-3 text-center">
                  Game Over!
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowRoundSummary(true)}
                    className="w-full px-4 py-3 rounded-xl text-base font-medium
                      bg-muted hover:bg-muted/80 text-foreground
                      transition-colors duration-200"
                  >
                    View Final Results
                  </button>
                  <button
                    onClick={game.resetGame}
                    className="w-full px-4 py-3 rounded-xl text-base font-medium
                      bg-blue-600 hover:bg-blue-700 text-white
                      transition-colors duration-200"
                  >
                    Start New Game
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Setup mode - shown below main content */}
        {game.status === 'setup' && (
          <div className="mt-6 bg-background border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Ready to Start?
                </h2>
                <p className="text-sm text-muted-foreground">
                  {game.teams.length === 0
                    ? 'Add at least one team to begin'
                    : `${game.teams.length} team${game.teams.length === 1 ? '' : 's'} ready`}
                </p>
              </div>
              <button
                onClick={game.startGame}
                disabled={!game.canStart}
                className={`
                  px-6 py-3 rounded-xl text-lg font-semibold
                  transition-colors duration-200
                  ${
                    game.canStart
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Last question of round prompt - shown below main content */}
        {game.status === 'playing' && game.isLastQuestionOfRound && (
          <div className="mt-6 bg-background border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Last Question of Round {game.currentRound + 1}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Complete the round when ready to show round summary
                </p>
              </div>
              <button
                onClick={handleCompleteRound}
                className="px-4 py-2 rounded-xl text-base font-semibold
                  bg-orange-600 hover:bg-orange-700 text-white
                  transition-colors duration-200"
              >
                Complete Round
              </button>
            </div>
          </div>
        )}

        {/* Between rounds controls - shown below main content */}
        {game.status === 'between_rounds' && (
          <div className="mt-6 bg-background border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Round {game.currentRound + 1} Complete
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review scores and proceed when ready
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoundSummary(true)}
                  className="px-4 py-2 rounded-xl text-base font-medium
                    bg-muted hover:bg-muted/80 text-foreground
                    transition-colors duration-200"
                >
                  Show Summary
                </button>
                <button
                  onClick={handleNextRound}
                  className="px-4 py-2 rounded-xl text-base font-semibold
                    bg-green-600 hover:bg-green-700 text-white
                    transition-colors duration-200"
                >
                  {game.isLastRound ? 'End Game' : 'Next Round'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Round Summary - shown below main content */}
        {showRoundSummary && (
          <div className="mt-6">
            <RoundSummary
              currentRound={game.currentRound}
              totalRounds={game.totalRounds}
              roundWinners={game.roundWinners}
              teamsSortedByScore={game.teamsSortedByScore}
              isLastRound={game.isLastRound || game.status === 'ended'}
              onNextRound={handleNextRound}
              onClose={() => setShowRoundSummary(false)}
            />
          </div>
        )}
      </div>
    </main>
  );
}
