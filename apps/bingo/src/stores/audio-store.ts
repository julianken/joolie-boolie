import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BingoBall } from '@/types';

export interface AudioStore {
  // State
  enabled: boolean;
  volume: number; // 0-1
  isPlaying: boolean;
  currentVoice: string;
  useFallbackTTS: boolean; // Use browser TTS if audio files not available

  // Actions
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: string) => void;
  setUseFallbackTTS: (useFallback: boolean) => void;
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

// Audio file path generator
function getAudioPath(ball: BingoBall, voice: string): string {
  return `/audio/${voice}/${ball.label}.mp3`;
}

// Check if audio file exists by attempting to fetch
async function audioFileExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Use Web Speech API as fallback for TTS
function speakBallCall(ball: BingoBall, volume: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance with ball label (e.g., "B 1" or "O 75")
    const text = `${ball.column} ${ball.number}`;
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure speech
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = volume;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      // Initial state
      enabled: true,
      volume: DEFAULT_VOLUME,
      isPlaying: false,
      currentVoice: DEFAULT_VOICE,
      useFallbackTTS: true, // Default to using TTS fallback

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

      setUseFallbackTTS: (useFallback: boolean) => {
        set({ useFallbackTTS: useFallback });
      },

      playBallCall: async (ball: BingoBall) => {
        const { enabled, volume, currentVoice, isPlaying, useFallbackTTS } =
          get();

        if (!enabled || isPlaying) {
          return;
        }

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return;
        }

        try {
          set({ isPlaying: true });

          const audioPath = getAudioPath(ball, currentVoice);

          // Try to play audio file first
          if (typeof Audio !== 'undefined') {
            const fileExists = await audioFileExists(audioPath);

            if (fileExists) {
              const audio = new Audio(audioPath);
              audio.volume = volume;

              await new Promise<void>((resolve) => {
                audio.onended = () => resolve();
                audio.onerror = () => resolve();
                audio.play().catch(() => resolve());
              });

              return; // Audio file played successfully
            }
          }

          // Fall back to Web Speech API if enabled
          if (useFallbackTTS) {
            await speakBallCall(ball, volume);
          }
        } finally {
          set({ isPlaying: false });
        }
      },

      stopPlayback: () => {
        // Stop any TTS in progress
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        set({ isPlaying: false });
      },
    }),
    {
      name: 'beak-bingo-audio',
      partialize: (state) => ({
        enabled: state.enabled,
        volume: state.volume,
        currentVoice: state.currentVoice,
        useFallbackTTS: state.useFallbackTTS,
      }),
    }
  )
);
