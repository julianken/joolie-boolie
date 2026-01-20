'use client';

import { useId } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  unit = '',
  disabled = false,
}: SliderProps) {
  const id = useId();

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className={`text-lg font-medium ${disabled ? 'opacity-50' : ''}`}
        >
          {label}
        </label>
        <span
          className={`
            text-xl font-bold tabular-nums min-w-[4ch] text-right
            ${disabled ? 'opacity-50' : ''}
          `}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`
          w-full h-[44px] cursor-pointer appearance-none
          bg-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          [&::-webkit-slider-runnable-track]:h-3
          [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-runnable-track]:bg-border
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-8
          [&::-webkit-slider-thumb]:w-8
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:mt-[-10px]
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-track]:h-3
          [&::-moz-range-track]:rounded-full
          [&::-moz-range-track]:bg-border
          [&::-moz-range-thumb]:h-8
          [&::-moz-range-thumb]:w-8
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-primary
          [&::-moz-range-thumb]:border-none
          [&::-moz-range-thumb]:shadow-md
          focus:outline-none
          focus-visible:[&::-webkit-slider-thumb]:ring-4
          focus-visible:[&::-webkit-slider-thumb]:ring-primary/50
        `}
        style={{
          background: `linear-gradient(to right, var(--primary) ${percentage}%, var(--border) ${percentage}%)`,
        }}
      />
    </div>
  );
}
