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
  describe('renders nothing when both actions are none', () => {
    it('returns null on final_podium', () => {
      useGameStore.setState({ audienceScene: 'final_podium', revealPhase: null });
      const { container } = render(<SceneNavButtons />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on question_display', () => {
      useGameStore.setState({ audienceScene: 'question_display', revealPhase: null });
      const { container } = render(<SceneNavButtons />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on paused', () => {
      useGameStore.setState({ audienceScene: 'paused', revealPhase: null });
      const { container } = render(<SceneNavButtons />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on emergency_blank', () => {
      useGameStore.setState({ audienceScene: 'emergency_blank', revealPhase: null });
      const { container } = render(<SceneNavButtons />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('forward button actions', () => {
    it('calls startGame on waiting scene', () => {
      useGameStore.setState({ audienceScene: 'waiting', revealPhase: null });
      const startGame = vi.spyOn(useGameStore.getState(), 'startGame');
      // Re-bind spy via getState mock approach
      const startGameMock = vi.fn();
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        startGame: startGameMock,
        advanceScene: vi.fn().mockReturnValue(true),
      });

      render(<SceneNavButtons />);
      const forwardBtn = screen.getByRole('button', { name: 'Start Game' });
      fireEvent.click(forwardBtn);

      expect(startGameMock).toHaveBeenCalledTimes(1);
      startGame.mockRestore();
    });

    it('calls advanceScene with "skip" on game_intro scene', () => {
      useGameStore.setState({ audienceScene: 'game_intro', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        startGame: vi.fn(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      const forwardBtn = screen.getByRole('button', { name: 'Skip Intro' });
      fireEvent.click(forwardBtn);

      expect(advanceSceneMock).toHaveBeenCalledWith('skip');
    });

    it('calls advanceScene with "advance" on round_summary scene', () => {
      useGameStore.setState({ audienceScene: 'round_summary', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        startGame: vi.fn(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      const forwardBtn = screen.getByRole('button', { name: 'Review Answers' });
      fireEvent.click(forwardBtn);

      expect(advanceSceneMock).toHaveBeenCalledWith('advance');
    });
  });

  describe('forward button disabled during reveal lock', () => {
    it('is disabled when revealPhase is non-null on answer_reveal', () => {
      useGameStore.setState({ audienceScene: 'answer_reveal', revealPhase: 'freeze' });

      render(<SceneNavButtons />);
      const forwardBtn = screen.getByRole('button', { name: 'Next Answer' });

      expect(forwardBtn).toBeDisabled();
    });

    it('is enabled when revealPhase is null on answer_reveal', () => {
      useGameStore.setState({ audienceScene: 'answer_reveal', revealPhase: null });

      render(<SceneNavButtons />);
      const forwardBtn = screen.getByRole('button', { name: 'Next Answer' });

      expect(forwardBtn).not.toBeDisabled();
    });

    it('is not disabled on other scenes even when revealPhase is set', () => {
      useGameStore.setState({ audienceScene: 'round_summary', revealPhase: 'freeze' });

      render(<SceneNavButtons />);
      const forwardBtn = screen.getByRole('button', { name: 'Review Answers' });

      expect(forwardBtn).not.toBeDisabled();
    });
  });

  describe('back button actions', () => {
    it('calls advanceScene with "back" on recap_title scene', () => {
      useGameStore.setState({ audienceScene: 'recap_title', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        startGame: vi.fn(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      const backBtn = screen.getByRole('button', { name: 'Back to Summary' });
      fireEvent.click(backBtn);

      expect(advanceSceneMock).toHaveBeenCalledWith('back');
    });

    it('calls advanceScene with "back" on recap_qa scene', () => {
      useGameStore.setState({ audienceScene: 'recap_qa', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        startGame: vi.fn(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      const backBtn = screen.getByRole('button', { name: 'Previous' });
      fireEvent.click(backBtn);

      expect(advanceSceneMock).toHaveBeenCalledWith('back');
    });

    it('calls advanceScene with "back" on recap_scores scene', () => {
      useGameStore.setState({ audienceScene: 'recap_scores', revealPhase: null });
      const advanceSceneMock = vi.fn().mockReturnValue(true);
      vi.spyOn(useGameStore, 'getState').mockReturnValue({
        ...useGameStore.getState(),
        startGame: vi.fn(),
        advanceScene: advanceSceneMock,
      });

      render(<SceneNavButtons />);
      const backBtn = screen.getByRole('button', { name: 'Back to Q&A' });
      fireEvent.click(backBtn);

      expect(advanceSceneMock).toHaveBeenCalledWith('back');
    });
  });

  describe('recap scenes render both forward and back buttons', () => {
    it('recap_title renders back and forward buttons', () => {
      useGameStore.setState({ audienceScene: 'recap_title', revealPhase: null });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Back to Summary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Q&A Review' })).toBeInTheDocument();
    });

    it('recap_qa renders back and forward buttons', () => {
      useGameStore.setState({ audienceScene: 'recap_qa', revealPhase: null });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('recap_scores renders back and forward buttons', () => {
      useGameStore.setState({ audienceScene: 'recap_scores', revealPhase: null });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Back to Q&A' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });
  });

  describe('scenes with only forward button', () => {
    it('waiting only shows Start Game forward button', () => {
      useGameStore.setState({ audienceScene: 'waiting', revealPhase: null });
      render(<SceneNavButtons />);

      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      // No back button
      expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
    });
  });
});
