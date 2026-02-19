'use client';

import { BingoColumn } from '@/types';

/**
 * Column-to-glow-color mapping using pre-computed hex values.
 * Audience display must NOT use oklch() — older smart TV/projector hardware
 * may run Chrome 80-90 equivalents without OKLCH support. Issue 3.6.
 */
const columnGlowColors: Record<BingoColumn, string> = {
  B: 'rgba(59, 130, 246, 0.40)',
  I: 'rgba(239, 68, 68, 0.40)',
  N: 'rgba(232, 230, 235, 0.25)',
  G: 'rgba(34, 197, 94, 0.40)',
  O: 'rgba(245, 158, 11, 0.40)',
};

const columnGlowIntense: Record<BingoColumn, string> = {
  B: 'rgba(59, 130, 246, 0.20)',
  I: 'rgba(239, 68, 68, 0.20)',
  N: 'rgba(232, 230, 235, 0.12)',
  G: 'rgba(34, 197, 94, 0.20)',
  O: 'rgba(245, 158, 11, 0.20)',
};

export interface GlowBackdropProps {
  /** Column of the current ball, or null when no ball has been called. */
  column: BingoColumn | null;
  /** Whether the glow should be visible. */
  visible?: boolean;
}

/**
 * GlowBackdrop — ambient colored glow behind the ball display.
 *
 * Implementation uses radial-gradient instead of filter:blur() for
 * performance on older projector hardware (Issue 3.2).
 *
 * The color transitions between column colors via CSS transition on
 * the background property. CSS transitions on gradients are not
 * universally smooth, so we use opacity transition as the main
 * animation with a fixed large gradient.
 *
 * The glow is purely decorative and aria-hidden.
 */
export function GlowBackdrop({ column, visible = true }: GlowBackdropProps) {
  if (!column || !visible) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0 }}
      />
    );
  }

  const innerColor = columnGlowColors[column];
  const outerColor = columnGlowIntense[column];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none transition-opacity duration-700"
      style={{
        background: `radial-gradient(circle 300px at 50% 50%, ${innerColor} 0%, ${outerColor} 50%, transparent 75%)`,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
