'use client';

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
          className={`text-lg font-medium ${disabled ? 'opacity-50' : ''}`}
        >
          {label}
        </Label>
        <SliderOutput
          className={`text-xl font-bold tabular-nums min-w-[4ch] text-right ${disabled ? 'opacity-50' : ''}`}
        >
          {({ state }) => `${state.values[0]}${unit}`}
        </SliderOutput>
      </div>
      <SliderTrack style={{ marginTop: 16, marginBottom: 16 }} className="relative h-3 w-full rounded-full bg-muted/30 shadow-inner">
        {({ state }) => (
          <>
            {/* Filled portion */}
            <div
              className="absolute h-full rounded-full bg-primary"
              style={{ width: `${state.getThumbPercent(0) * 100}%` }}
            />
            <SliderThumb
              style={{ width: 32, height: 32, top: '50%', transform: 'translateY(-50%)' }}
              className={`
                rounded-full
                bg-primary border-4 border-primary-foreground
                shadow-lg cursor-pointer
                focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50
                data-[dragging]:scale-110 data-[dragging]:shadow-xl
                transition-transform
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
}
