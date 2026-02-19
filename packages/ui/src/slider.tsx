'use client';

import { useState } from 'react';
import {
  Slider as AriaSlider,
  SliderTrack,
  SliderThumb,
  SliderOutput,
  Label,
} from 'react-aria-components';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  disabled?: boolean;
  marks?: number[];
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
  marks,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <AriaSlider
      value={value}
      onChange={onChange}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={disabled}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <Label
          className={`text-base font-medium text-foreground ${disabled ? 'opacity-[0.38]' : ''}`}
        >
          {label}
        </Label>
        <SliderOutput
          className={`text-lg font-bold tabular-nums min-w-[4ch] text-right text-foreground ${disabled ? 'opacity-[0.38]' : ''}`}
        >
          {({ state }) => `${state.values[0]}${unit}`}
        </SliderOutput>
      </div>

      {/* Track: 4px height per spec (section 3.8) */}
      <SliderTrack
        style={{ marginTop: 12, marginBottom: 12, height: 6, backgroundColor: 'color-mix(in srgb, var(--foreground) 20%, transparent)' }}
        className="relative w-full rounded-full"
      >
        {({ state }) => (
          <>
            {/* Filled portion */}
            <div
              className="absolute h-full rounded-full bg-primary"
              style={{ width: `${state.getThumbPercent(0) * 100}%` }}
            />

            {/* Tick marks */}
            {marks &&
              marks.map((markValue) => {
                const pct = ((markValue - min) / (max - min)) * 100;
                return (
                  <div
                    key={markValue}
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-border-strong rounded-full"
                    style={{ left: `${pct}%` }}
                    aria-hidden="true"
                  />
                );
              })}

            {/* Thumb: 20px circle per spec */}
            <SliderThumb
              onFocus={() => setIsDragging(true)}
              onBlur={() => setIsDragging(false)}
              style={{
                width: 20,
                height: 20,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              className={[
                'rounded-full',
                'bg-primary',
                'shadow-md cursor-pointer',
                'focus:outline-none',
                // Glow on hover/drag/focus
                'hover:shadow-[var(--glow-primary)]',
                'focus-visible:shadow-[var(--glow-primary),0_0_0_3px_var(--ring)]',
                'data-[dragging]:shadow-[var(--glow-primary)]',
                'data-[dragging]:scale-110',
                'transition-all duration-150',
                disabled ? 'opacity-[0.38] cursor-not-allowed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />

            {/* Drag tooltip — shows value above thumb during drag/focus */}
            {isDragging && (
              <div
                className="absolute -top-8 text-xs font-semibold text-primary-foreground bg-primary px-1.5 py-0.5 rounded pointer-events-none"
                style={{
                  left: `${state.getThumbPercent(0) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
                aria-hidden="true"
              >
                {state.values[0]}{unit}
              </div>
            )}
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
}
