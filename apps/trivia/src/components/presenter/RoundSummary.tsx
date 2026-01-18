'use client';

import type { Team } from '@/types';

interface RoundSummaryProps {
  currentRound: number;
  totalRounds: number;
  roundWinners: Team[];
  teamsSortedByScore: Team[];
  isLastRound: boolean;
  onNextRound: () => void;
  onClose: () => void;
}

export function RoundSummary({
  currentRound,
  totalRounds,
  roundWinners,
  teamsSortedByScore,
  isLastRound,
  onNextRound,
  onClose,
}: RoundSummaryProps) {
  const roundNumber = currentRound + 1;

  return (
    <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isLastRound ? 'Final Results' : `Round ${roundNumber} Complete`}
          </h2>
          {!isLastRound && (
            <p className="text-sm text-muted-foreground">
              {totalRounds - roundNumber} round{totalRounds - roundNumber !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
        {/* Round Winner Badge */}
        {roundWinners.length > 0 && (
          <div className="text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {isLastRound ? 'Winner' : 'Round Winner'}
            </span>
            <div className="text-lg font-bold text-green-600">
              {roundWinners.map(t => t.name).join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Compact Standings */}
      <div className="flex flex-wrap gap-2">
        {teamsSortedByScore.slice(0, 5).map((team, index) => (
          <div
            key={team.id}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-muted/50'}
            `}
          >
            <span className="font-medium">{index + 1}.</span>
            <span>{team.name}</span>
            <span className="font-bold">{team.score}</span>
          </div>
        ))}
        {teamsSortedByScore.length > 5 && (
          <span className="text-sm text-muted-foreground self-center">
            +{teamsSortedByScore.length - 5} more
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium
            bg-muted text-foreground hover:bg-muted/80
            transition-colors duration-200"
        >
          {isLastRound ? 'View Questions' : 'Back to Game'}
        </button>
        <button
          onClick={onNextRound}
          className="px-4 py-2 rounded-lg text-sm font-semibold
            bg-green-600 hover:bg-green-700 text-white
            transition-colors duration-200"
        >
          {isLastRound ? 'End Game' : 'Next Round'}
        </button>
      </div>
    </div>
  );
}
