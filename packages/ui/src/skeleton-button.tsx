'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from './skeleton';

export interface SkeletonButtonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size variant matching the Button component sizes.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Width of the button skeleton.
   * @default 'auto' (based on size)
   */
  width?: number | string;
  /**
   * Animation style passed to child skeleton.
   * @default 'pulse'
   */
  animation?: 'pulse' | 'wave' | 'none';
}

const sizeStyles = {
  sm: { height: 44, minWidth: 80 },
  md: { height: 56, minWidth: 100 },
  lg: { height: 64, minWidth: 120 },
};

/**
 * Button-shaped skeleton placeholder for loading states.
 * Matches the sizing of the Button component.
 */
export const SkeletonButton = forwardRef<HTMLDivElement, SkeletonButtonProps>(
  (
    {
      size = 'md',
      width,
      animation = 'pulse',
      className = '',
      ...props
    },
    ref
  ) => {
    const { height, minWidth } = sizeStyles[size];
    const buttonWidth = width ?? minWidth;

    return (
      <Skeleton
        ref={ref}
        width={buttonWidth}
        height={height}
        variant="rectangular"
        animation={animation}
        className={`rounded-lg ${className}`.trim()}
        aria-label="Loading button..."
        {...props}
      />
    );
  }
);

SkeletonButton.displayName = 'SkeletonButton';
