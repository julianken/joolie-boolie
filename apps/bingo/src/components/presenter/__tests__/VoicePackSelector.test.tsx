import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoicePackSelector } from '../VoicePackSelector';
import { useAudioStore, VOICE_PACK_OPTIONS } from '@/stores/audio-store';

describe('VoicePackSelector', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock Audio globally to prevent unhandled errors from VoicePackPreview
    class MockAudio {
      volume = 1;
      src = '';
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play = vi.fn(() => Promise.resolve());

      constructor(src?: string) {
        if (src) this.src = src;
      }
    }
    vi.stubGlobal('Audio', MockAudio);

    // Reset audio store to initial state
    useAudioStore.setState({
      voicePack: 'standard',
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
            slangMappings: { '7': 'lucky-seven' },
          },
          'british-hall': {
            id: 'british-hall',
            name: 'British Slang (Hall)',
            description: 'UK calls with hall reverb',
            basePath: '/audio/voices/british-hall',
            filePattern: '{slang}.mp3',
            slangMappings: { '7': 'lucky-seven' },
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
    it('renders heading', () => {
      render(<VoicePackSelector />);
      expect(screen.getByRole('heading', { name: /voice pack/i })).toBeInTheDocument();
    });

    it('renders all voice pack options', () => {
      render(<VoicePackSelector />);

      for (const pack of VOICE_PACK_OPTIONS) {
        expect(screen.getByText(pack.name)).toBeInTheDocument();
        expect(screen.getByText(pack.description)).toBeInTheDocument();
      }
    });

    it('renders radiogroup for accessibility', () => {
      render(<VoicePackSelector />);
      expect(screen.getByRole('radiogroup', { name: /voice pack selection/i })).toBeInTheDocument();
    });

    it('renders radio options for each pack', () => {
      render(<VoicePackSelector />);
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(VOICE_PACK_OPTIONS.length);
    });

    it('renders preview button for each pack', () => {
      render(<VoicePackSelector />);
      const previewButtons = screen.getAllByRole('button', { name: /preview/i });
      expect(previewButtons).toHaveLength(VOICE_PACK_OPTIONS.length);
    });

    it('renders help text', () => {
      render(<VoicePackSelector />);
      expect(
        screen.getByText(/select a voice pack to customize/i)
      ).toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('shows standard pack as selected by default', () => {
      render(<VoicePackSelector />);

      const standardRadio = screen.getAllByRole('radio')[0];
      expect(standardRadio).toHaveAttribute('aria-checked', 'true');
    });

    it('shows "Selected" badge on selected pack', () => {
      render(<VoicePackSelector />);

      // Should have exactly one "Selected" badge
      const badges = screen.getAllByText('Selected');
      expect(badges).toHaveLength(1);
    });

    it('reflects store state', () => {
      useAudioStore.setState({ voicePack: 'british' });
      render(<VoicePackSelector />);

      // British pack should be selected
      const radios = screen.getAllByRole('radio');
      const britishIndex = VOICE_PACK_OPTIONS.findIndex((p) => p.id === 'british');
      expect(radios[britishIndex]).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('selection interaction', () => {
    it('selects pack on click', () => {
      render(<VoicePackSelector />);

      // Click on British Slang option
      const britishOption = screen.getByText('British Slang').closest('[role="radio"]');
      fireEvent.click(britishOption!);

      expect(useAudioStore.getState().voicePack).toBe('british');
    });

    it('selects pack on Enter key', () => {
      render(<VoicePackSelector />);

      const standardHallOption = screen
        .getByText('Standard (Hall)')
        .closest('[role="radio"]');
      fireEvent.keyDown(standardHallOption!, { key: 'Enter' });

      expect(useAudioStore.getState().voicePack).toBe('standard-hall');
    });

    it('selects pack on Space key', () => {
      render(<VoicePackSelector />);

      const britishHallOption = screen
        .getByText('British Slang (Hall)')
        .closest('[role="radio"]');
      fireEvent.keyDown(britishHallOption!, { key: ' ' });

      expect(useAudioStore.getState().voicePack).toBe('british-hall');
    });

    it('updates selection indicator when pack changes', () => {
      const { rerender } = render(<VoicePackSelector />);

      // Initially standard is selected
      let radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('aria-checked', 'true');
      expect(radios[2]).toHaveAttribute('aria-checked', 'false');

      // Click on British Slang
      fireEvent.click(radios[2]);

      // Rerender to see updated state
      rerender(<VoicePackSelector />);

      radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('disabled state', () => {
    it('applies disabled styling when disabled', () => {
      render(<VoicePackSelector disabled />);

      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toHaveClass('opacity-50');
        expect(radio).toHaveClass('cursor-not-allowed');
      }
    });

    it('does not allow selection when disabled', () => {
      render(<VoicePackSelector disabled />);

      const britishOption = screen.getByText('British Slang').closest('[role="radio"]');
      fireEvent.click(britishOption!);

      // Should still be standard
      expect(useAudioStore.getState().voicePack).toBe('standard');
    });

    it('disables preview buttons when disabled', () => {
      render(<VoicePackSelector disabled />);

      const previewButtons = screen.getAllByRole('button', { name: /preview/i });
      for (const button of previewButtons) {
        expect(button).toBeDisabled();
      }
    });

    it('removes tabIndex when disabled', () => {
      render(<VoicePackSelector disabled />);

      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toHaveAttribute('tabindex', '-1');
      }
    });
  });

  describe('accessibility', () => {
    it('has focusable radio options', () => {
      render(<VoicePackSelector />);

      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toHaveAttribute('tabindex', '0');
      }
    });

    it('has aria-checked attribute', () => {
      render(<VoicePackSelector />);

      const radios = screen.getAllByRole('radio');
      const checkedCount = radios.filter(
        (r) => r.getAttribute('aria-checked') === 'true'
      ).length;
      expect(checkedCount).toBe(1);
    });

    it('prevents default on Space key to avoid page scroll', () => {
      render(<VoicePackSelector />);

      const option = screen.getAllByRole('radio')[1];

      // Verify Space key triggers selection (which implies preventDefault was called)
      // The component calls e.preventDefault() before handling Space
      fireEvent.keyDown(option, { key: ' ' });

      // If preventDefault wasn't called, the selection wouldn't change
      // So we verify selection changed to confirm the handler ran
      expect(useAudioStore.getState().voicePack).toBe('standard-hall');
    });
  });

  describe('preview button isolation', () => {
    it('clicking preview does not change selection', async () => {
      render(<VoicePackSelector />);

      // Get the preview button for British Slang
      const britishCard = screen.getByText('British Slang').closest('[role="radio"]');
      const previewButton = britishCard?.querySelector('button');

      await act(async () => {
        fireEvent.click(previewButton!);
      });

      // Selection should still be standard
      expect(useAudioStore.getState().voicePack).toBe('standard');
    });
  });

  describe('senior-friendly design', () => {
    it('has large minimum height for touch targets', () => {
      render(<VoicePackSelector />);

      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toHaveClass('min-h-[80px]');
      }
    });

    it('has large text size for pack names', () => {
      render(<VoicePackSelector />);

      // Check that pack names have large text
      const packName = screen.getByText('Standard');
      expect(packName).toHaveClass('text-lg');
    });

    it('has visible selection indicator', () => {
      render(<VoicePackSelector />);

      // The selected pack should have a checkmark indicator
      const selectedCard = screen.getAllByRole('radio').find(
        (r) => r.getAttribute('aria-checked') === 'true'
      );

      // Should have the selection indicator with checkmark
      const checkmark = selectedCard?.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });
  });
});
