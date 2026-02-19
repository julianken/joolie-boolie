'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-hover',
  danger:
    'bg-error text-error-foreground hover:bg-error/85 active:bg-error/95',
  ghost:
    'bg-transparent text-foreground hover:bg-surface-hover active:bg-surface-active border border-border',
  link:
    'bg-transparent text-primary underline-offset-4 hover:underline hover:text-primary-hover min-h-0 px-0',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[44px] px-4 py-2 text-sm',
  md: 'min-h-[56px] px-6 py-3 text-base',
  lg: 'min-h-[64px] px-8 py-4 text-lg',
};

// Three-dot loading indicator
function LoadingDots() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80 motion-reduce:animate-none"
        style={{ animation: 'jb-dot-bounce 1.2s ease-in-out 0s infinite' }}
      />
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80 motion-reduce:animate-none"
        style={{ animation: 'jb-dot-bounce 1.2s ease-in-out 0.2s infinite' }}
      />
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80 motion-reduce:animate-none"
        style={{ animation: 'jb-dot-bounce 1.2s ease-in-out 0.4s infinite' }}
      />
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      glow = false,
      disabled,
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const glowStyle =
      glow && variant === 'primary' && !isDisabled
        ? { boxShadow: 'var(--glow-primary)' }
        : undefined;

    return (
      <>
        {/* Keyframes injected inline once — no external CSS file needed */}
        <style>{`
          @keyframes jb-dot-bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}</style>
        <button
          ref={ref}
          disabled={isDisabled}
          aria-busy={loading}
          style={{ ...glowStyle, ...style }}
          className={[
            'inline-flex items-center justify-center gap-2',
            'font-semibold rounded-lg',
            'cursor-pointer select-none',
            'transition-all duration-150',
            // Three-layer interaction: color shift + lift + press
            !isDisabled && variant !== 'link'
              ? 'hover:-translate-y-px active:scale-[0.97]'
              : '',
            // Focus ring using --ring token
            'focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-3',
            // Disabled state: Material Design opacity threshold
            isDisabled ? 'opacity-[0.38] cursor-not-allowed pointer-events-none' : '',
            variantStyles[variant],
            sizeStyles[size],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {loading ? (
            <>
              <LoadingDots />
              <span>Loading...</span>
            </>
          ) : (
            children
          )}
        </button>
      </>
    );
  }
);

Button.displayName = 'Button';
