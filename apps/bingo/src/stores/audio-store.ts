import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BingoBall } from '@/types';

export interface AudioStore {
  // State
  enabled: boolean;
  volume: number; // 0-1
  isPlaying: boolean;
  currentVoice: string;

  // Actions
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: string) => void;
  playBallCall: (ball: BingoBall) => Promise<void>;
  stopPlayback: () => void;
}

// Available voice options (can be extended later)
export const VOICE_OPTIONS = [
  { id: 'default', name: 'Default' },
  { id: 'classic', name: 'Classic Bingo' },
  { id: 'modern', name: 'Modern' },
] as const;

export const DEFAULT_VOICE = 'default';
export const DEFAULT_VOLUME = 0.8;

// Audio file path generator (placeholder for now)
function getAudioPath(ball: BingoBall, voice: string): string {
  // Future: return actual audio file path
  // e.g., `/audio/${voice}/${ball.column}/${ball.number}.mp3`
  return `/audio/${voice}/${ball.label}.mp3`;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      // Initial state
      enabled: true,
      volume: DEFAULT_VOLUME,
      isPlaying: false,
      currentVoice: DEFAULT_VOICE,

      // Actions
      setEnabled: (enabled: boolean) => {
        set({ enabled });
      },

      toggleEnabled: () => {
        set((state) => ({ enabled: !state.enabled }));
      },

      setVolume: (volume: number) => {
        // Clamp volume between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
      },

      setVoice: (voice: string) => {
        set({ currentVoice: voice });
      },

      playBallCall: async (ball: BingoBall) => {
        const { enabled, volume, currentVoice, isPlaying } = get();

        if (!enabled || isPlaying) {
          return;
        }

        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof Audio === 'undefined') {
          return;
        }

        try {
          set({ isPlaying: true });

          const audioPath = getAudioPath(ball, currentVoice);
          const audio = new Audio(audioPath);
          audio.volume = volume;

          // Wait for audio to finish or error
          await new Promise<void>((resolve) => {
            audio.onended = () => resolve();
            audio.onerror = () => {
              // Silently fail if audio file doesn't exist
              // This is expected during development
              resolve();
            };
            audio.play().catch(() => {
              // Handle autoplay restrictions
              resolve();
            });
          });
        } finally {
          set({ isPlaying: false });
        }
      },

      stopPlayback: () => {
        set({ isPlaying: false });
      },
    }),
    {
      name: 'beak-bingo-audio',
      partialize: (state) => ({
        enabled: state.enabled,
        volume: state.volume,
        currentVoice: state.currentVoice,
      }),
    }
  )
);
