'use client';

import { useId, useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useAudioStore } from '@/stores/audio-store';
import { useToast } from "@beak-gaming/ui";
import { patternRegistry } from '@/lib/game/patterns';
import type { BingoPreset } from '@beak-gaming/database/types';
import type { VoicePackId } from '@/types';

export interface PresetSelectorProps {
  disabled?: boolean;
}

export function PresetSelector({ disabled = false }: PresetSelectorProps) {
  const id = useId();
  const { success, error: errorToast } = useToast();

  // Store actions
  const setPattern = useGameStore((state) => state.setPattern);
  const setAutoCallEnabled = useGameStore((state) => state.toggleAutoCall);
  const setAutoCallSpeed = useGameStore((state) => state.setAutoCallSpeed);
  const gameStore = useGameStore();
  const setVoicePack = useAudioStore((state) => state.setVoicePack);

  // Component state
  const [presets, setPresets] = useState<BingoPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch presets on mount
  useEffect(() => {
    const fetchPresets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/presets');

        if (!response || !response.ok) {
          console.warn('Presets unavailable:', response?.status);
          setPresets([]);
          return;
        }

        const data = await response.json();
        setPresets(data.presets || []);
      } catch (err) {
        console.error('Error fetching presets:', err);
        setError('Failed to load presets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresets();
  }, [errorToast]);

  // Load preset into stores
  const loadPreset = useCallback(async (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);

    if (!preset) {
      errorToast('Preset not found');
      return;
    }

    try {
      // 1. Load pattern
      const pattern = patternRegistry.get(preset.pattern_id);
      if (!pattern) {
        throw new Error(`Pattern "${preset.pattern_id}" not found`);
      }
      setPattern(pattern);

      // 2. Load auto-call settings
      const currentAutoCall = gameStore.autoCallEnabled;
      if (preset.auto_call_enabled !== currentAutoCall) {
        setAutoCallEnabled();
      }
      setAutoCallSpeed(preset.auto_call_interval / 1000); // Convert milliseconds to seconds

      // 3. Load voice pack
      setVoicePack(preset.voice_pack as VoicePackId);

      success(`Loaded preset "${preset.name}"`);
    } catch (err) {
      console.error('Error loading preset:', err);
      errorToast('Failed to apply preset settings');
    }
  }, [presets, setPattern, setAutoCallEnabled, setAutoCallSpeed, setVoicePack, gameStore.autoCallEnabled, success, errorToast]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    setSelectedPresetId(presetId);

    if (presetId) {
      await loadPreset(presetId);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={`text-lg font-medium ${disabled ? 'opacity-50' : ''}`}
      >
        Load Preset
      </label>
      <select
        id={id}
        value={selectedPresetId}
        onChange={handleChange}
        disabled={disabled || isLoading}
        tabIndex={-1}
        className={`
          min-h-[56px] px-4 py-3
          text-lg rounded-lg
          bg-background border-2 border-border
          focus:outline-none focus:ring-4 focus:ring-primary/50 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        `}
      >
        <option value="">
          {isLoading ? 'Loading presets...' : 'Select a preset...'}
        </option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}{preset.is_default ? ' (Default)' : ''}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-base text-destructive" role="alert">
          {error}
        </p>
      )}
      {presets.length === 0 && !isLoading && !error && (
        <p className="text-base text-muted-foreground">
          No saved presets. Save your first preset below.
        </p>
      )}
    </div>
  );
}
