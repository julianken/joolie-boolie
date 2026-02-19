'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block mb-2 text-base font-semibold text-foreground"
        >
          {label}
          {required && (
            <span className="ml-1 text-error" aria-label="required">
              *
            </span>
          )}
        </label>

        <div className="relative">
          {leadingIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
              aria-hidden="true"
            >
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            className={[
              'w-full',
              'min-h-[56px]',
              leadingIcon ? 'pl-10 pr-4' : 'px-4',
              'py-3',
              'text-base',
              'bg-surface',
              'text-foreground',
              // Placeholder: stone-500 equivalent (#78716C) for 3.52:1 contrast. Issue A-04.
              'placeholder:text-foreground-muted',
              'border border-border rounded-lg',
              'hover:border-border-strong',
              'transition-colors duration-150',
              // Double-ring focus: inner border accent + outer offset ring via shadow
              'focus:outline-none',
              !hasError
                ? 'focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--ring)]'
                : '',
              // Error: left-bar accent + subtle background tint
              hasError
                ? 'border-l-4 border-l-error border-error/50 bg-error/5 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
                : '',
              'disabled:opacity-[0.38] disabled:cursor-not-allowed',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
