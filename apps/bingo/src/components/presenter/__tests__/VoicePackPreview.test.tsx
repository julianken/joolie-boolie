import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { VoicePackPreview } from '../VoicePackPreview';
import { useAudioStore } from '@/stores/audio-store';

describe('VoicePackPreview', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset audio store to initial state with manifest
    useAudioStore.setState({
      voiceVolume: 0.7,
      manifest: {
        voicePacks: {
          standard: {
            id: 'standard',
            name: 'Standard',
            description: 'Clear, professional calls',
            basePath: '/audio/voices/standard',
            filePattern: '{letter}{number}.mp3',
          },
          'standard-hall': {
            id: 'standard-hall',
            name: 'Standard (Hall)',
            description: 'With hall reverb effect',
            basePath: '/audio/voices/standard-hall',
            filePattern: '{letter}{number}.mp3',
          },
          british: {
            id: 'british',
            name: 'British Slang',
            description: 'Traditional UK bingo calls',
            basePath: '/audio/voices/british',
            filePattern: '{slang}.mp3',
            slangMappings: {
              '7': 'lucky-seven',
              '11': 'legs-eleven',
            },
          },
          'british-hall': {
            id: 'british-hall',
            name: 'British Slang (Hall)',
            description: 'UK calls with hall reverb',
            basePath: '/audio/voices/british-hall',
            filePattern: '{slang}.mp3',
            slangMappings: {
              '7': 'lucky-seven',
              '11': 'legs-eleven',
            },
          },
        },
        defaultPack: 'standard',
      },
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  describe('rendering', () => {
    it('renders preview button', () => {
      render(<VoicePackPreview voicePackId="standard" />);
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    });

    it('has accessible label with pack name', () => {
      render(<VoicePackPreview voicePackId="standard" />);
      expect(
        screen.getByRole('button', { name: /preview standard voice pack/i })
      ).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      render(<VoicePackPreview voicePackId="standard" disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('preview playback', () => {
    it('plays audio when preview button is clicked', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);

      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = mockPlay;

        constructor(src: string) {
          this.src = src;
          // Simulate immediate completion
          setTimeout(() => {
            this.onended?.();
          }, 0);
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it('shows loading state while playing', async () => {
      let resolveAudio: () => void;
      const audioPromise = new Promise<void>((resolve) => {
        resolveAudio = resolve;
      });

      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => {
          // Don't resolve immediately - keep in loading state
          return audioPromise;
        });

        constructor(src: string) {
          this.src = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      // Start playback
      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Button should be loading and disabled (shows "Loading..." from Button component)
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      // Cleanup - resolve the promise to end the test cleanly
      await act(async () => {
        resolveAudio!();
      });
    });

    it('uses correct audio path for standard pack', async () => {
      let capturedSrc = '';

      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => {
          setTimeout(() => {
            this.onended?.();
          }, 0);
          return Promise.resolve();
        });

        constructor(src: string) {
          this.src = src;
          capturedSrc = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      await waitFor(() => {
        expect(capturedSrc).toBe('/audio/voices/standard/B7.mp3');
      });
    });

    it('uses correct audio path for british pack', async () => {
      let capturedSrc = '';

      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => {
          setTimeout(() => {
            this.onended?.();
          }, 0);
          return Promise.resolve();
        });

        constructor(src: string) {
          this.src = src;
          capturedSrc = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="british" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      await waitFor(() => {
        // Should use the slang term for the first available mapped number
        expect(capturedSrc).toContain('/audio/voices/british/');
        expect(capturedSrc).toMatch(/lucky-seven|legs-eleven/);
      });
    });

    it('sets correct volume from store', async () => {
      useAudioStore.setState({ voiceVolume: 0.5 });

      let capturedVolume = 0;

      class MockAudio {
        private _volume = 1;
        get volume() {
          return this._volume;
        }
        set volume(value: number) {
          this._volume = value;
          capturedVolume = value;
        }
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => {
          setTimeout(() => {
            this.onended?.();
          }, 0);
          return Promise.resolve();
        });

        constructor(src: string) {
          this.src = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      await waitFor(() => {
        expect(capturedVolume).toBe(0.5);
      });
    });
  });

  describe('error handling', () => {
    it('handles audio error gracefully', async () => {
      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => {
          setTimeout(() => {
            this.onerror?.();
          }, 0);
          return Promise.resolve();
        });

        constructor(src: string) {
          this.src = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      // Should recover from error and re-enable button
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });

    it('handles play rejection gracefully', async () => {
      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => Promise.reject(new Error('Autoplay blocked')));

        constructor(src: string) {
          this.src = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      // Should recover from rejection and re-enable button
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });

    it('handles missing manifest gracefully', async () => {
      useAudioStore.setState({ manifest: null });

      // Mock loadManifest to set the manifest
      const originalLoadManifest = useAudioStore.getState().loadManifest;
      useAudioStore.setState({
        loadManifest: vi.fn(async () => {
          useAudioStore.setState({
            manifest: {
              voicePacks: {
                standard: {
                  id: 'standard',
                  name: 'Standard',
                  description: 'Test',
                  basePath: '/audio/voices/standard',
                  filePattern: '{letter}{number}.mp3',
                },
                'standard-hall': {
                  id: 'standard-hall',
                  name: 'Standard Hall',
                  description: 'Test',
                  basePath: '/audio/voices/standard-hall',
                  filePattern: '{letter}{number}.mp3',
                },
                british: {
                  id: 'british',
                  name: 'British',
                  description: 'Test',
                  basePath: '/audio/voices/british',
                  filePattern: '{slang}.mp3',
                  slangMappings: { '7': 'lucky-seven' },
                },
                'british-hall': {
                  id: 'british-hall',
                  name: 'British Hall',
                  description: 'Test',
                  basePath: '/audio/voices/british-hall',
                  filePattern: '{slang}.mp3',
                  slangMappings: { '7': 'lucky-seven' },
                },
              },
              defaultPack: 'standard',
            },
          });
        }),
      });

      const mockPlay = vi.fn(() => Promise.resolve());
      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = mockPlay;

        constructor(src: string) {
          this.src = src;
          setTimeout(() => {
            this.onended?.();
          }, 0);
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });

      // Restore original loadManifest
      useAudioStore.setState({ loadManifest: originalLoadManifest });
    });
  });

  describe('concurrent playback prevention', () => {
    it('disables button while playing to prevent concurrent playback', async () => {
      let resolvePlay: () => void;
      const playPromise = new Promise<void>((resolve) => {
        resolvePlay = resolve;
      });

      class MockAudio {
        volume = 1;
        src = '';
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        play = vi.fn(() => playPromise);

        constructor(src: string) {
          this.src = src;
        }
      }
      vi.stubGlobal('Audio', MockAudio);

      render(<VoicePackPreview voicePackId="standard" />);

      const button = screen.getByRole('button');

      // First click - starts playback
      await act(async () => {
        fireEvent.click(button);
        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Button should now be disabled during playback
      expect(button).toBeDisabled();

      // Cleanup
      await act(async () => {
        resolvePlay!();
      });
    });
  });
});
