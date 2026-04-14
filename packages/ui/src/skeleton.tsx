'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton. Can be a number (pixels) or string (CSS value).
   * @default '100%'
   */
  width?: number | string;
  /**
   * Height of the skeleton. Can be a number (pixels) or string (CSS value).
   * @default '1rem'
   */
  height?: number | string;
  /**
   * Shape variant of the skeleton.
   * @default 'rectangular'
   */
  variant?: 'rectangular' | 'circular' | 'text';
  /**
   * Animation style of the skeleton.
   * 'wave' is an alias for 'shimmer' (backward compatible).
   * @default 'shimmer'
   */
  animation?: 'shimmer' | 'wave' | 'pulse' | 'none';
}

/**
 * Base skeleton component for loading states.
 * Uses a shimmer sweep animation (left-to-right gradient highlight).
 * Base color: --muted (background surface).
 * Shimmer highlight: --surface-hover.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      width = '100%',
      height = '1rem',
      variant = 'rectangular',
      animation = 'shimmer',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const widthStyle = typeof width === 'number' ? `${width}px` : width;
    const heightStyle = typeof height === 'number' ? `${height}px` : height;

    const variantClasses = {
      rectangular: 'rounded-md',
      circular: 'rounded-full',
      text: 'rounded',
    };

    const animationClasses: Record<string, string> = {
      shimmer: 'hgn-skeleton-shimmer motion-reduce:animate-none',
      // 'wave' is the legacy name — maps to the same shimmer sweep animation
      wave: 'hgn-skeleton-shimmer motion-reduce:animate-none',
      pulse: 'animate-pulse motion-reduce:animate-none',
      none: '',
    };

    return (
      <>
        <style>{`
          @keyframes hgn-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .hgn-skeleton-shimmer {
            background: linear-gradient(
              90deg,
              var(--muted) 0%,
              var(--surface-hover) 50%,
              var(--muted) 100%
            );
            background-size: 200% 100%;
            animation: hgn-shimmer 1.8s ease-in-out infinite;
          }
        `}</style>
        <div
          ref={ref}
          role="status"
          aria-label="Loading..."
          className={[
            // Use --surface-elevated as base background for non-shimmer animations
            // (shimmer applies its own gradient background via the CSS class)
            animation !== 'shimmer' && animation !== 'wave' ? 'bg-surface-elevated' : '',
            variantClasses[variant],
            animationClasses[animation],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            width: widthStyle,
            height: heightStyle,
            ...style,
          }}
          {...props}
        />
      </>
    );
  }
);

Skeleton.displayName = 'Skeleton';
