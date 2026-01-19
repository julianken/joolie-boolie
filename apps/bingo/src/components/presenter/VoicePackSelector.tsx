'use client';

import { useCallback } from 'react';
import { VoicePackId } from '@/types';
import { useAudioStore, VOICE_PACK_OPTIONS } from '@/stores/audio-store';
import { VoicePackPreview } from './VoicePackPreview';

export interface VoicePackSelectorProps {
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Senior-friendly voice pack selection component.
 * Displays all available voice packs as large, easy-to-tap cards with:
 * - Clear pack name and description
 * - Visual indication of currently selected pack
 * - Preview button to hear a sample
 * - Remembers selection via audio store (localStorage persisted)
 */
export function VoicePackSelector({ disabled = false }: VoicePackSelectorProps) {
  const voicePack = useAudioStore((state) => state.voicePack);
  const setVoicePack = useAudioStore((state) => state.setVoicePack);

  const handleSelect = useCallback(
    (packId: VoicePackId) => {
      if (!disabled) {
        setVoicePack(packId);
      }
    },
    [disabled, setVoicePack]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Voice Pack</h3>

      <div
        className="grid gap-3"
        role="radiogroup"
        aria-label="Voice pack selection"
      >
        {VOICE_PACK_OPTIONS.map((pack) => {
          const isSelected = voicePack === pack.id;

          return (
            <div
              key={pack.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleSelect(pack.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(pack.id);
                }
              }}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-150
                min-h-[80px]
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'
                }
                focus:outline-none focus:ring-4 focus:ring-primary/50
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {/* Selection indicator */}
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }
                      `}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Pack name */}
                    <span
                      className={`
                        text-lg font-semibold
                        ${isSelected ? 'text-primary' : 'text-foreground'}
                      `}
                    >
                      {pack.name}
                    </span>

                    {/* Selected badge */}
                    {isSelected && (
                      <span className="px-2 py-0.5 text-sm font-medium bg-primary text-primary-foreground rounded">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Pack description */}
                  <p className="mt-1 ml-9 text-base text-muted-foreground">
                    {pack.description}
                  </p>
                </div>

                {/* Preview button */}
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <VoicePackPreview voicePackId={pack.id} disabled={disabled} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-sm text-muted-foreground">
        Select a voice pack to customize how bingo numbers are announced.
        Click &quot;Preview&quot; to hear a sample.
      </p>
    </div>
  );
}
