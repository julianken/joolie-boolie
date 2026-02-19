'use client';

import { HTMLAttributes, forwardRef } from 'react';

// ============================================================
// Badge -- shared component per FINAL-DESIGN-PLAN.md section 3.10
// Styles: filled | outline | dot
// Colors: primary | secondary | success | warning | error | info
// Sizes: sm (20px height) | md (24px height)
// Border radius: --radius-sm (6px)
// ============================================================

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeStyle = 'filled' | 'outline' | 'dot';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  badgeStyle?: BadgeStyle;
  size?: BadgeSize;
}

// Color mappings for each variant style
const filledColorClasses: Record<BadgeColor, string> = {
  primary:   'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success:   'bg-success text-success-foreground',
  warning:   'bg-warning text-warning-foreground',
  error:     'bg-error text-error-foreground',
  info:      'bg-info text-info-foreground',
};

const outlineColorClasses: Record<BadgeColor, string> = {
  primary:   'border-primary text-primary',
  secondary: 'border-border text-foreground-secondary',
  success:   'border-success text-success',
  warning:   'border-warning text-warning',
  error:     'border-error text-error',
  info:      'border-info text-info',
};

const dotColorClasses: Record<BadgeColor, string> = {
  primary:   'bg-primary',
  secondary: 'bg-foreground-secondary',
  success:   'bg-success',
  warning:   'bg-warning',
  error:     'bg-error',
  info:      'bg-info',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      color = 'primary',
      badgeStyle = 'filled',
      size = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isSm = size === 'sm';

    return (
      <span
        ref={ref}
        className={[
          'inline-flex items-center gap-1.5',
          // Size: sm = 20px height, md = 24px height
          isSm
            ? 'min-h-[20px] px-1.5 text-xs font-medium'
            : 'min-h-[24px] px-2 text-xs font-semibold',
          // Border radius: --radius-sm (6px)
          'rounded-[var(--radius-sm)]',
          // Style variants
          badgeStyle === 'filled'
            ? filledColorClasses[color]
            : '',
          badgeStyle === 'outline'
            ? `border ${outlineColorClasses[color]} bg-transparent`
            : '',
          badgeStyle === 'dot'
            ? 'text-foreground-secondary bg-transparent'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {badgeStyle === 'dot' && (
          <span
            className={[
              'inline-block rounded-full shrink-0',
              isSm ? 'w-1.5 h-1.5' : 'w-2 h-2',
              dotColorClasses[color],
            ].join(' ')}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
