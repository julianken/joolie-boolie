/**
 * Team color palette — 8 teams, violet-first ordering.
 * Matches CSS tokens from packages/theme/src/globals.css section 1.12.
 *
 * IMPORTANT (Issue A-08): Team colors with white foreground must only be used
 * at 20px bold or larger. For smaller text, use the team color as a dot/icon/border
 * accent with --foreground for the text itself.
 */

export interface TeamColor {
  /** Hex background color for the team */
  bg: string;
  /** Hex foreground (text) color for the team */
  fg: string;
  /** Subtle background tint (bg at 15% opacity) — for score bars, row highlights */
  subtle: string;
  /** Border accent color (bg at 60% opacity) */
  border: string;
  /** Glow color (bg at 30% opacity) — for winner card effects */
  glow: string;
  /** CSS variable name for bg */
  cssVar: string;
}

/** 8 team colors in violet-first order (index 0 = team 1). */
export const teamColors: TeamColor[] = [
  {
    // Team 1: Violet (brand primary)
    bg:     '#7E52E4',
    fg:     '#FFFFFF',
    subtle: 'rgba(126, 82, 228, 0.15)',
    border: 'rgba(126, 82, 228, 0.60)',
    glow:   'rgba(126, 82, 228, 0.30)',
    cssVar: 'var(--team-1)',
  },
  {
    // Team 2: Red
    bg:     '#EF4444',
    fg:     '#FFFFFF',
    subtle: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.60)',
    glow:   'rgba(239, 68, 68, 0.30)',
    cssVar: 'var(--team-2)',
  },
  {
    // Team 3: Teal
    bg:     '#14B8A6',
    fg:     '#042F2E',
    subtle: 'rgba(20, 184, 166, 0.15)',
    border: 'rgba(20, 184, 166, 0.60)',
    glow:   'rgba(20, 184, 166, 0.30)',
    cssVar: 'var(--team-3)',
  },
  {
    // Team 4: Amber
    bg:     '#F59E0B',
    fg:     '#422006',
    subtle: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.60)',
    glow:   'rgba(245, 158, 11, 0.30)',
    cssVar: 'var(--team-4)',
  },
  {
    // Team 5: Blue
    bg:     '#3B82F6',
    fg:     '#FFFFFF',
    subtle: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.60)',
    glow:   'rgba(59, 130, 246, 0.30)',
    cssVar: 'var(--team-5)',
  },
  {
    // Team 6: Pink
    bg:     '#EC4899',
    fg:     '#FFFFFF',
    subtle: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.60)',
    glow:   'rgba(236, 72, 153, 0.30)',
    cssVar: 'var(--team-6)',
  },
  {
    // Team 7: Teal Cyan
    bg:     '#06B6D4',
    fg:     '#FFFFFF',
    subtle: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.60)',
    glow:   'rgba(6, 182, 212, 0.30)',
    cssVar: 'var(--team-7)',
  },
  {
    // Team 8: Tangerine
    bg:     '#F97316',
    fg:     '#FFFFFF',
    subtle: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.60)',
    glow:   'rgba(249, 115, 22, 0.30)',
    cssVar: 'var(--team-8)',
  },
];

/**
 * Get the team color for a given team index (0-based).
 * Wraps around if more teams than colors (rare edge case).
 */
export function getTeamColor(teamIndex: number): TeamColor {
  return teamColors[teamIndex % teamColors.length];
}
