import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useGameStore } from '@/stores/game-store';
import { resetGameStore } from '@/test/helpers/store';
import { SceneNavButtons } from '../SceneNavButtons';

beforeEach(() => {
  resetGameStore();
  vi.restoreAllMocks();
});

describe('SceneNavButtons', () => {
  it('always renders both back and forward buttons', () => {
    useGameStore.setState({ audienceScene: 'waiting', revealPhase: null });
    render(<SceneNavButtons />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
  });

  it('renders on every scene including question_display', () => {
    useGameStore.setState({ audienceScene: 'question_display', revealPhase: null });
    render(<SceneNavButtons />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
  });

  it('renders on emergency_blank', () => {
    useGameStore.setState({ audienceScene: 'emergency_blank', revealPhase: null });
    render(<SceneNavButtons />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
  });

  describe('forward button', () => {
    it('calls advanceScene with "advance" trigger', () => {
      useGameStore.setState({ audienceScene: 'round_summary', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      fireEvent.click(screen.getByRole('button', { name: 'Forward' }));

      expect(advanceSceneMock).toHaveBeenCalledWith('advance');
    });

    it('is disabled during reveal lock on answer_reveal', () => {
      useGameStore.setState({ audienceScene: 'answer_reveal', revealPhase: 'freeze' });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Forward' })).toBeDisabled();
    });

    it('is enabled when revealPhase is null on answer_reveal', () => {
      useGameStore.setState({ audienceScene: 'answer_reveal', revealPhase: null });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Forward' })).not.toBeDisabled();
    });

    it('is not disabled on other scenes even when revealPhase is set', () => {
      useGameStore.setState({ audienceScene: 'round_summary', revealPhase: 'freeze' });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Forward' })).not.toBeDisabled();
    });
  });

  describe('back button', () => {
    it('calls advanceScene with "back" trigger', () => {
      useGameStore.setState({ audienceScene: 'recap_title', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(advanceSceneMock).toHaveBeenCalledWith('back');
    });
  });
});
