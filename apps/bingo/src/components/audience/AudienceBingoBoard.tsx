'use client';

import { useMemo } from 'react';
import { BallNumber, BingoBall, BingoColumn, COLUMNS, COLUMN_RANGES } from '@/types';

export interface AudienceBingoBoardProps {
  calledBalls: BingoBall[];
}

/**
 * Column header styles — 3D gradient ball appearance matching the design system.
 */
const columnHeaderBg: Record<BingoColumn, string> = {
  B: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.40) 0%, transparent 55%), #3B82F6',
  I: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.40) 0%, transparent 55%), #EF4444',
  N: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, transparent 55%), #E8E6EB',
  G: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.40) 0%, transparent 55%), #22C55E',
  O: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.40) 0%, transparent 55%), #F59E0B',
};

const columnHeaderText: Record<BingoColumn, string> = {
  B: '#FFFFFF',
  I: '#FFFFFF',
  N: '#1A1720',  /* CORRECTED per Part 1 §1.11 */
  G: '#052E16',
  O: '#422006',
};

/**
 * Called cell styles using per-column bingo token colors.
 * Uses pre-computed values (not OKLCH) for projector/TV compatibility. Issue 3.6.
 */
function getCalledCellStyle(column: BingoColumn): React.CSSProperties {
  const styles: Record<BingoColumn, { bg: string; color: string; boxShadow: string }> = {
    B: {
      bg: 'rgba(59, 130, 246, 0.22)',
      color: '#60a5fa',
      boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.40)',
    },
    I: {
      bg: 'rgba(239, 68, 68, 0.22)',
      color: '#f87171',
      boxShadow: 'inset 0 0 0 1px rgba(239, 68, 68, 0.40)',
    },
    N: {
      bg: 'rgba(232, 230, 235, 0.15)',
      color: '#e8e6eb',
      boxShadow: 'inset 0 0 0 1px rgba(232, 230, 235, 0.30)',
    },
    G: {
      bg: 'rgba(34, 197, 94, 0.22)',
      color: '#34d399',
      boxShadow: 'inset 0 0 0 1px rgba(34, 197, 94, 0.40)',
    },
    O: {
      bg: 'rgba(245, 158, 11, 0.22)',
      color: '#fbbf24',
      boxShadow: 'inset 0 0 0 1px rgba(245, 158, 11, 0.40)',
    },
  };
  const s = styles[column];
  return { backgroundColor: s.bg, color: s.color, boxShadow: s.boxShadow };
}

/**
 * AudienceBingoBoard — Large-cell board optimized for projector/TV display.
 *
 * Larger cells than the presenter board for visibility from 10-30 feet.
 * Called numbers have column-colored backgrounds and dramatic flash animation.
 *
 * Uncalled numbers: --bingo-text-muted at 40% opacity — deliberately near-invisible
 * for audience display. Design intent: audience focuses on the hero ball.
 * See accessibility audit A-24: audience board is a supporting reference,
 * not the primary information source.
 *
 * Reduced motion: cell-flash-audience-animation is suppressed by global CSS rule.
 */
export function AudienceBingoBoard({ calledBalls }: AudienceBingoBoardProps) {
  const calledNumbers = useMemo(() => {
    return new Set(calledBalls.map((ball) => ball.number));
  }, [calledBalls]);

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
    <div className="flex flex-col gap-px" data-testid="called-numbers-board">
      {/* Column headers — using gradient ball styling */}
      <div className="grid grid-cols-5 gap-px">
        {COLUMNS.map((column) => (
          <div
            key={column}
            className="h-14 md:h-16 lg:h-20 flex items-center justify-center font-bold rounded-t-lg"
            style={{
              background: columnHeaderBg[column],
              color: columnHeaderText[column],
              fontSize: 'clamp(1.25rem, 3vw, 2rem)',
              boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 1px 4px rgba(255,255,255,0.20)',
            }}
          >
            {column}
          </div>
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-5 gap-px">
        {boardData.map(({ column, numbers }) => (
          <div key={column} className="flex flex-col gap-px">
            {numbers.map((num) => {
              const isCalled = calledNumbers.has(num);
              return (
                <div
                  key={num}
                  className={`
                    h-12 md:h-14 lg:h-16 flex items-center justify-center
                    text-xl md:text-2xl lg:text-3xl font-bold
                    rounded transition-all duration-300
                    ${isCalled ? 'cell-flash-audience-animation' : ''}
                  `}
                  style={{
                    ...(isCalled
                      ? getCalledCellStyle(column)
                      : {
                          /* Uncalled: deliberately near-invisible for audience.
                             Audience focus is the hero ball, not the full number list.
                             See accessibility note A-24. */
                          backgroundColor: 'transparent',
                          color: 'var(--bingo-text-muted)',
                          opacity: 0.4,
                        }
                    ),
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
