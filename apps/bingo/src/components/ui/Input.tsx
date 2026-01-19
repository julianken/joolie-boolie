'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'min-h-[44px] px-3 py-2 text-base',
  md: 'min-h-[52px] px-4 py-3 text-lg',
  lg: 'min-h-[60px] px-5 py-4 text-xl',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      disabled,
      className = '',
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const hasError = !!error;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={id}
            className={`
              text-lg font-medium
              ${disabled ? 'opacity-50' : ''}
            `}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            [
              hasError ? errorId : null,
              helperText ? helperId : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={`
            w-full rounded-lg
            border-2 bg-background text-foreground
            transition-colors duration-150
            placeholder:text-muted
            focus:outline-none focus:ring-4
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              hasError
                ? 'border-error focus:border-error focus:ring-error/50'
                : 'border-border focus:border-primary focus:ring-primary/50'
            }
            ${sizeStyles[size]}
            ${className}
          `.trim()}
          {...props}
        />
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-error text-base font-medium"
          >
            {error}
          </p>
        )}
        {helperText && !hasError && (
          <p id={helperId} className="text-muted-foreground text-base">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
