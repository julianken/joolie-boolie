'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from './skeleton';

export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show a header skeleton (icon + title area).
   * @default true
   */
  showHeader?: boolean;
  /**
   * Whether to show body content lines.
   * @default true
   */
  showBody?: boolean;
  /**
   * Number of body text lines to show.
   * @default 3
   */
  bodyLines?: number;
  /**
   * Whether to show a footer with action buttons.
   * @default false
   */
  showFooter?: boolean;
  /**
   * Height of the card. Defaults to auto based on content.
   */
  height?: number | string;
  /**
   * Animation style passed to child skeletons.
   * @default 'pulse'
   */
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Card-shaped skeleton placeholder for loading states.
 * Mimics common card layouts with header, body, and footer sections.
 */
export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      showHeader = true,
      showBody = true,
      bodyLines = 3,
      showFooter = false,
      height,
      animation = 'pulse',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const heightStyle = height
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : undefined;

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading card..."
        className={`
          bg-background border border-border rounded-xl p-4 shadow-sm
          ${className}
        `.trim()}
        style={{
          height: heightStyle,
          ...style,
        }}
        {...props}
      >
        {/* Header: Icon + Title */}
        {showHeader && (
          <div className="flex items-center gap-4 mb-4">
            <Skeleton
              variant="circular"
              width={48}
              height={48}
              animation={animation}
            />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={24} animation={animation} />
              <Skeleton width="40%" height={16} animation={animation} />
            </div>
          </div>
        )}

        {/* Body: Text lines */}
        {showBody && (
          <div className="space-y-3">
            {Array.from({ length: bodyLines }).map((_, index) => (
              <Skeleton
                key={index}
                width={index === bodyLines - 1 ? '75%' : '100%'}
                height={18}
                variant="text"
                animation={animation}
              />
            ))}
          </div>
        )}

        {/* Footer: Action buttons */}
        {showFooter && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            <Skeleton width={100} height={44} animation={animation} />
            <Skeleton width={100} height={44} animation={animation} />
          </div>
        )}
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';
