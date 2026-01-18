'use client';

import type { Team } from '@/types';

export interface AudienceScoreboardProps {
  teams: Team[];
  currentRound: number;
  totalRounds: number;
}

// Medal colors for top 3
const medalColors: Record<number, string> = {
  0: 'bg-yellow-500 text-black', // Gold
  1: 'bg-gray-400 text-black', // Silver
  2: 'bg-amber-700 text-white', // Bronze
};

const medalLabels: Record<number, string> = {
  0: '1st',
  1: '2nd',
  2: '3rd',
};

/**
 * Scoreboard display for between rounds.
 * Shows team rankings with medals for top 3.
 */
export function AudienceScoreboard({
  teams,
  currentRound,
  totalRounds,
}: AudienceScoreboardProps) {
  const isLastRound = currentRound >= totalRounds - 1;

  return (
    <div className="flex flex-col items-center h-full min-h-[60vh] gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
          {isLastRound ? 'Final Round Complete!' : `Round ${currentRound + 1} Complete!`}
        </h2>
        <p className="mt-2 text-2xl text-muted-foreground">
          {isLastRound ? 'Final Standings' : `${totalRounds - currentRound - 1} round${totalRounds - currentRound - 1 > 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Scoreboard */}
      <div className="w-full max-w-4xl px-4">
        <div className="bg-muted/10 rounded-2xl border border-border overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/20 border-b border-border text-xl font-semibold text-muted-foreground">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-7">Team</div>
            <div className="col-span-3 text-right">Score</div>
          </div>

          {/* Team rows */}
          <div className="divide-y divide-border">
            {teams.length === 0 ? (
              <div className="px-6 py-8 text-center text-2xl text-muted-foreground">
                No teams yet
              </div>
            ) : (
              teams.map((team, index) => (
                <div
                  key={team.id}
                  className={`
                    grid grid-cols-12 gap-4 px-6 py-4 items-center
                    ${index < 3 ? 'bg-muted/5' : ''}
                  `}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex justify-center">
                    {index < 3 ? (
                      <span
                        className={`
                          ${medalColors[index]}
                          w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center
                          rounded-full text-xl lg:text-2xl font-bold
                        `}
                      >
                        {medalLabels[index]}
                      </span>
                    ) : (
                      <span className="text-2xl lg:text-3xl font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Team name */}
                  <div className="col-span-7">
                    <span
                      className={`
                        text-2xl lg:text-3xl font-medium
                        ${index < 3 ? 'text-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      {team.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-3 text-right">
                    <span
                      className={`
                        text-3xl lg:text-4xl font-bold
                        ${index < 3 ? 'text-primary' : 'text-foreground'}
                      `}
                    >
                      {team.score}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Next round indicator */}
      {!isLastRound && (
        <div className="text-center mt-4">
          <p className="text-xl text-muted animate-pulse">
            Next round starting soon...
          </p>
        </div>
      )}
    </div>
  );
}
