'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VoicePackId } from '@/types';
import { useAudioStore, VOICE_PACK_OPTIONS } from '@/stores/audio-store';

export interface VoicePackPreviewProps {
  /** Voice pack ID to preview */
  voicePackId: VoicePackId;
  /** Whether preview is disabled */
  disabled?: boolean;
}

/**
 * Preview a voice pack by playing a sample ball call.
 * Uses a random ball number to demonstrate the voice pack's style.
 */
export function VoicePackPreview({
  voicePackId,
  disabled = false,
}: VoicePackPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const voiceVolume = useAudioStore((state) => state.voiceVolume);
  const manifest = useAudioStore((state) => state.manifest);
  const loadManifest = useAudioStore((state) => state.loadManifest);

  const playPreview = useCallback(async () => {
    if (isPlaying || typeof Audio === 'undefined') return;

    setIsPlaying(true);

    try {
      // Load manifest if not available
      let currentManifest = manifest;
      if (!currentManifest) {
        await loadManifest();
        currentManifest = useAudioStore.getState().manifest;
      }

      const packMetadata = currentManifest?.voicePacks[voicePackId];
      if (!packMetadata) {
        console.warn(`Voice pack ${voicePackId} not found in manifest`);
        return;
      }

      // Use a sample ball for preview - B7 for standard packs
      // For British packs, we'll use a number with a slang term
      let audioPath: string;
      if (packMetadata.slangMappings) {
        // British pack - find a number with a slang mapping
        const sampleNumber = Object.keys(packMetadata.slangMappings).find(
          (num) => packMetadata.slangMappings?.[num]
        );
        if (sampleNumber) {
          const slangTerm = packMetadata.slangMappings[sampleNumber];
          audioPath = `${packMetadata.basePath}/${slangTerm}.mp3`;
        } else {
          console.warn('No slang mappings found for British pack preview');
          return;
        }
      } else {
        // Standard pack - use B7
        audioPath = `${packMetadata.basePath}/B7.mp3`;
      }

      const audio = new Audio(audioPath);
      audio.volume = voiceVolume;

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
          audio.src = '';
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };
        audio.onerror = () => {
          cleanup();
          console.warn('Failed to play voice pack preview');
          resolve();
        };
        audio.play().catch(() => {
          cleanup();
          resolve();
        });
      });
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, voicePackId, voiceVolume, manifest, loadManifest]);

  const packInfo = VOICE_PACK_OPTIONS.find((opt) => opt.id === voicePackId);

  return (
    <Button
      onClick={playPreview}
      disabled={disabled || isPlaying}
      variant="secondary"
      size="sm"
      loading={isPlaying}
      aria-label={`Preview ${packInfo?.name || voicePackId} voice pack`}
    >
      {isPlaying ? 'Playing...' : 'Preview'}
    </Button>
  );
}
