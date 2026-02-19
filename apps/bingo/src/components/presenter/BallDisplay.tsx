'use client';

import { BingoBall, BingoColumn } from '@/types';

export interface BallDisplayProps {
  ball: BingoBall | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'bingo-ball-sm',
  md: 'bingo-ball-md',
  lg: 'bingo-ball-lg',
  xl: 'bingo-ball-xl',
} as const;

const columnFontSizes: Record<BingoColumn, string> = {
  B: 'text-[0.35em]',
  I: 'text-[0.35em]',
  N: 'text-[0.35em]',
  G: 'text-[0.35em]',
  O: 'text-[0.35em]',
};

export function BallDisplay({ ball, size = 'lg' }: BallDisplayProps) {
  if (!ball) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          bingo-ball
          bg-surface-elevated border-4 border-dashed border-border
          flex items-center justify-center
        `}
        aria-label="No ball called yet"
      >
        <span className="text-foreground-muted font-bold relative z-10">?</span>
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bingo-ball
        ball-enter-animation
      `}
      data-column={ball.column}
      role="status"
      aria-label={`Ball ${ball.label}`}
      data-testid={`ball-display-${ball.label}`}
    >
      {/* White ring — explicit div instead of ::before pseudo-element.
          Pseudo-elements break when container-type: size interacts with
          flex/grid layouts. Real divs are immune. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '74%',
          height: '74%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '9999px',
          zIndex: 1,
          pointerEvents: 'none',
          background: 'transparent',
          border: '4.5cqi solid rgba(255,255,255,0.85)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.10)',
        }}
      />

      {/* Inner white face — explicit div instead of ::after pseudo-element. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '9999px',
          zIndex: 1,
          pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
            'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.88) 100%)',
          ].join(', '),
          boxShadow: '0 -0.5cqi 1cqi rgba(255,255,255,0.60), 0 1cqi 2cqi rgba(0,0,0,0.15)',
        }}
      />

      <span className="ball-content">
        {/* Column letter hidden on sm (A-02: decorative at small sizes) */}
        <span
          className={`ball-column-letter ${columnFontSizes[ball.column]} font-semibold`}
          aria-hidden="true"
        >
          {ball.column}
        </span>
        <span>{ball.number}</span>
      </span>
    </div>
  );
}

export interface RecentBallsProps {
  balls: BingoBall[];
  maxDisplay?: number;
}

export function RecentBalls({ balls, maxDisplay = 5 }: RecentBallsProps) {
  const displayBalls = balls.slice(0, maxDisplay);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-foreground-secondary">Recent Calls</h3>
      <div className="flex gap-2 flex-wrap">
        {displayBalls.length === 0 ? (
          <p className="text-muted-foreground text-base">No balls called yet</p>
        ) : (
          displayBalls.map((ball, index) => (
            <BallDisplay
              key={`${ball.label}-${index}`}
              ball={ball}
              size="sm"
            />
          ))
        )}
      </div>
    </div>
  );
}

export interface BallCounterProps {
  called: number;
  remaining: number;
}

export function BallCounter({ called, remaining }: BallCounterProps) {
  return (
    <div className="flex gap-6 text-center">
      <div className="flex flex-col">
        <span className="text-3xl font-bold tabular-nums text-foreground" data-testid="balls-called-count">{called}</span>
        <span className="text-base text-foreground-secondary">Called</span>
      </div>
      <div className="w-px bg-border" />
      <div className="flex flex-col">
        <span className="text-3xl font-bold tabular-nums text-foreground" data-testid="balls-remaining-count">{remaining}</span>
        <span className="text-base text-foreground-secondary">Remaining</span>
      </div>
    </div>
  );
}
