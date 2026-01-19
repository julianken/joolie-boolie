'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from './skeleton';

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of text lines to render.
   * @default 1
   */
  lines?: number;
  /**
   * Text size variant affecting line height.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Width of the last line (as percentage or CSS value).
   * Creates more natural-looking text blocks.
   * @default '75%'
   */
  lastLineWidth?: number | string;
  /**
   * Gap between lines in pixels.
   * @default 8
   */
  lineGap?: number;
  /**
   * Animation style passed to child skeletons.
   * @default 'pulse'
   */
  animation?: 'pulse' | 'wave' | 'none';
}

const sizeHeights = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
};

/**
 * Text line skeleton placeholder for loading states.
 * Renders one or more lines to mimic text content.
 */
export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      lines = 1,
      size = 'md',
      lastLineWidth = '75%',
      lineGap = 8,
      animation = 'pulse',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const lineHeight = sizeHeights[size];

    if (lines === 1) {
      return (
        <Skeleton
          ref={ref}
          width={lastLineWidth}
          height={lineHeight}
          variant="text"
          animation={animation}
          className={className}
          style={style}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading text..."
        className={className}
        style={{ display: 'flex', flexDirection: 'column', gap: `${lineGap}px`, ...style }}
        {...props}
      >
        {Array.from({ length: lines }).map((_, index) => {
          const isLastLine = index === lines - 1;
          const width = isLastLine ? lastLineWidth : '100%';

          return (
            <Skeleton
              key={index}
              width={width}
              height={lineHeight}
              variant="text"
              animation={animation}
            />
          );
        })}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';
