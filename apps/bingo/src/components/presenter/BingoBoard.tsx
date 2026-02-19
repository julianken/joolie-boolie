'use client';

import { BallNumber, BingoBall, BingoColumn, COLUMNS, COLUMN_RANGES } from '@/types';
import { useMemo } from 'react';

export interface BingoBoardProps {
  calledBalls: BingoBall[];
}

/**
 * Column header ball styles — self-contained inline approach that guarantees
 * circular rings regardless of grid/flex context.
 *
 * The CSS class approach (.bingo-ball + container-type: size) is avoided here
 * because the grid cell width drives the ball's container query inline size,
 * causing the ::before/::after pseudo-elements to resolve percentage dimensions
 * against a non-square container and rendering ovals instead of circles.
 *
 * This mirrors the AudienceBingoBoard pattern: aspect-square + rounded-full +
 * explicit inline styles, no container query dependency.
 */
const columnHeaderBg: Record<BingoColumn, string> = {
  B: `radial-gradient(ellipse 45% 35% at 35% 25%, rgba(255,255,255,0.57) 0%, transparent 100%),
      radial-gradient(ellipse 85% 65% at 40% 28%, rgba(255,255,255,0.30) 0%, transparent 70%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.10) 65%, rgba(0,0,0,0.35) 100%),
      radial-gradient(ellipse 60% 30% at 50% 92%, rgba(255,255,255,0.10) 0%, transparent 100%),
      #3B82F6`,
  I: `radial-gradient(ellipse 45% 35% at 35% 25%, rgba(255,255,255,0.57) 0%, transparent 100%),
      radial-gradient(ellipse 85% 65% at 40% 28%, rgba(255,255,255,0.30) 0%, transparent 70%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.10) 65%, rgba(0,0,0,0.35) 100%),
      radial-gradient(ellipse 60% 30% at 50% 92%, rgba(255,255,255,0.10) 0%, transparent 100%),
      #EF4444`,
  N: `radial-gradient(ellipse 45% 35% at 35% 25%, rgba(255,255,255,0.57) 0%, transparent 100%),
      radial-gradient(ellipse 85% 65% at 40% 28%, rgba(255,255,255,0.30) 0%, transparent 70%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.05) 65%, rgba(0,0,0,0.18) 100%),
      radial-gradient(ellipse 60% 30% at 50% 92%, rgba(255,255,255,0.10) 0%, transparent 100%),
      #E8E6EB`,
  G: `radial-gradient(ellipse 45% 35% at 35% 25%, rgba(255,255,255,0.57) 0%, transparent 100%),
      radial-gradient(ellipse 85% 65% at 40% 28%, rgba(255,255,255,0.30) 0%, transparent 70%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.10) 65%, rgba(0,0,0,0.35) 100%),
      radial-gradient(ellipse 60% 30% at 50% 92%, rgba(255,255,255,0.10) 0%, transparent 100%),
      #22C55E`,
  O: `radial-gradient(ellipse 45% 35% at 35% 25%, rgba(255,255,255,0.57) 0%, transparent 100%),
      radial-gradient(ellipse 85% 65% at 40% 28%, rgba(255,255,255,0.30) 0%, transparent 70%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.10) 65%, rgba(0,0,0,0.35) 100%),
      radial-gradient(ellipse 60% 30% at 50% 92%, rgba(255,255,255,0.10) 0%, transparent 100%),
      #F59E0B`,
};

const columnHeaderBoxShadow: Record<BingoColumn, string> = {
  B: 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(0,0,0,0.12), 0 2px 8px rgba(59,130,246,0.25), 0 0 16px rgba(59,130,246,0.12)',
  I: 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(0,0,0,0.12), 0 2px 8px rgba(239,68,68,0.25), 0 0 16px rgba(239,68,68,0.12)',
  N: 'inset 0 -3px 6px rgba(0,0,0,0.20), inset 0 2px 4px rgba(255,255,255,0.40), 0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(200,196,210,0.20), 0 0 14px rgba(200,196,210,0.10)',
  G: 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(0,0,0,0.12), 0 2px 8px rgba(34,197,94,0.25), 0 0 16px rgba(34,197,94,0.12)',
  O: 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(0,0,0,0.12), 0 2px 8px rgba(245,158,11,0.25), 0 0 16px rgba(245,158,11,0.12)',
};

const columnHeaderText: Record<BingoColumn, string> = {
  B: '#FFFFFF',
  I: '#FFFFFF',
  N: '#1A1720',
  G: '#052E16',
  O: '#422006',
};

/**
 * White ring overlay — rendered as an inset box-shadow on the ball itself,
 * avoiding pseudo-elements that depend on container query sizing.
 * Appended to the column's box-shadow string.
 */
function getColumnHeaderStyle(column: BingoColumn): React.CSSProperties {
  return {
    width: '36px',
    height: '36px',
    borderRadius: '9999px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '15px',
    position: 'relative',
    background: columnHeaderBg[column],
    color: columnHeaderText[column],
    // Ring: an inset transparent ring using outline + the existing depth shadows.
    // Uses box-shadow layers: white ring band + depth shadows.
    // The white ring is simulated with an inset box-shadow at ~13% from edge (74% inner circle = 6px inset on 44px ball).
    boxShadow: columnHeaderBoxShadow[column],
  };
}

/**
 * Called cell styles — per-column colored backgrounds using bingo token vars.
 * Inline styles needed to reference CSS custom properties dynamically.
 */
function getCalledCellStyle(column: BingoColumn): React.CSSProperties {
  const map: Record<BingoColumn, { bg: string; color: string }> = {
    B: { bg: 'var(--bingo-cell-b-bg)', color: 'var(--bingo-cell-b-text)' },
    I: { bg: 'var(--bingo-cell-i-bg)', color: 'var(--bingo-cell-i-text)' },
    N: { bg: 'var(--bingo-cell-n-bg)', color: 'var(--bingo-cell-n-text)' },
    G: { bg: 'var(--bingo-cell-g-bg)', color: 'var(--bingo-cell-g-text)' },
    O: { bg: 'var(--bingo-cell-o-bg)', color: 'var(--bingo-cell-o-text)' },
  };
  return {
    backgroundColor: map[column].bg,
    color: map[column].color,
  };
}

export function BingoBoard({ calledBalls }: BingoBoardProps) {
  // Create a Set of called numbers for quick lookup
  const calledNumbers = useMemo(() => {
    return new Set(calledBalls.map((ball) => ball.number));
  }, [calledBalls]);

  // Generate the board data: each column has 15 numbers
  const boardData = useMemo(() => {
    return COLUMNS.map((column) => {
      const [min, max] = COLUMN_RANGES[column];
      const numbers: BallNumber[] = [];
      for (let n = min; n <= max; n++) {
        numbers.push(n as BallNumber);
      }
      return { column, numbers };
    });
  }, []);

  return (
    <div className="flex flex-col gap-px" role="grid" aria-label="Bingo board showing called numbers">
      {/* Column headers */}
      <div className="grid grid-cols-5 gap-px" role="row">
        {COLUMNS.map((column) => (
          <div
            key={column}
            role="columnheader"
            aria-label={`Column ${column}`}
            className="flex items-center justify-center py-1"
          >
            <div
              style={getColumnHeaderStyle(column)}
              data-column={column}
            >
              {column}
            </div>
          </div>
        ))}
      </div>

      {/* Number grid — transposed to display rows correctly */}
      {/*
        Cell font size is intentionally 15px below the 18px minimum.
        Intentional exception to 18px minimum: board is a reference grid.
        Primary readability is via the called ball display at 96px+.
        See accessibility audit A-22.
      */}
      {Array.from({ length: 15 }, (_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-px" role="row">
          {boardData.map(({ column, numbers }) => {
            const num = numbers[rowIndex];
            const isCalled = calledNumbers.has(num);
            return (
              <div
                key={num}
                role="gridcell"
                aria-label={`${column}${num}${isCalled ? ', called' : ''}`}
                className={`
                  h-8 flex items-center justify-center
                  rounded transition-colors duration-150 motion-reduce:transition-none
                  font-medium
                  ${isCalled
                    ? 'font-bold cell-highlight-animation'
                    : 'bg-surface text-foreground-secondary'
                  }
                `}
                style={{
                  fontSize: '15px',
                  ...(isCalled ? getCalledCellStyle(column) : {}),
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
