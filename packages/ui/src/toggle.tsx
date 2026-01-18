'use client';

import { useId } from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-[44px] w-[80px] shrink-0
          cursor-pointer items-center rounded-full
          transition-colors duration-200
          focus:outline-none focus:ring-4 focus:ring-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-accent' : 'bg-muted'}
        `}
      >
        <span
          className={`
            inline-block h-[36px] w-[36px] rounded-full bg-white
            shadow-md transition-transform duration-200
            ${checked ? 'translate-x-[40px]' : 'translate-x-[4px]'}
          `}
        />
      </button>
      <label
        htmlFor={id}
        className={`
          text-lg font-medium cursor-pointer select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {label}
      </label>
    </div>
  );
}
