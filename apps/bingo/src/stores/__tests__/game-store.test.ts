import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, useGameSelectors } from '../game-store';
import { renderHook } from '@testing-library/react';
import { BingoPattern } from '@/types';

describe('game-store', () => {
  const mockPattern: BingoPattern = {
    id: 'test-pattern',
    name: 'Test Pattern',
    category: 'lines',
    cells: [{ row: 0, col: 0 }],
  };

  beforeEach(() => {
    useGameStore.getState().resetGame();
    // Re-set to idle since resetGame sets to idle but preserves pattern
    useGameStore.setState({
      status: 'idle',
      calledBalls: [],
      currentBall: null,
      previousBall: null,
      pattern: null,
      autoCallEnabled: false,
      audioEnabled: true,
    });
  });

  describe('initial state', () => {
    it('has idle status', () => {
      expect(useGameStore.getState().status).toBe('idle');
    });

    it('has 75 remaining balls', () => {
      expect(useGameStore.getState().remainingBalls).toHaveLength(75);
    });

    it('has no called balls', () => {
      expect(useGameStore.getState().calledBalls).toHaveLength(0);
    });

    it('has no current ball', () => {
      expect(useGameStore.getState().currentBall).toBeNull();
    });

    it('has auto-call disabled', () => {
      expect(useGameStore.getState().autoCallEnabled).toBe(false);
    });

    it('has audio enabled', () => {
      expect(useGameStore.getState().audioEnabled).toBe(true);
    });
  });

  describe('startGame', () => {
    it('sets status to playing', () => {
      useGameStore.getState().startGame();
      expect(useGameStore.getState().status).toBe('playing');
    });

    it('accepts optional pattern', () => {
      useGameStore.getState().startGame(mockPattern);
      expect(useGameStore.getState().pattern).toEqual(mockPattern);
    });
  });

  describe('callBall', () => {
    beforeEach(() => {
      useGameStore.getState().startGame();
    });

    it('returns the called ball', () => {
      const ball = useGameStore.getState().callBall();
      expect(ball).not.toBeNull();
      expect(ball?.number).toBeGreaterThanOrEqual(1);
      expect(ball?.number).toBeLessThanOrEqual(75);
    });

    it('updates current ball', () => {
      const ball = useGameStore.getState().callBall();
      expect(useGameStore.getState().currentBall).toEqual(ball);
    });

    it('adds ball to called balls', () => {
      useGameStore.getState().callBall();
      expect(useGameStore.getState().calledBalls).toHaveLength(1);
    });

    it('removes ball from remaining balls', () => {
      useGameStore.getState().callBall();
      expect(useGameStore.getState().remainingBalls).toHaveLength(74);
    });

    it('returns null when not playing', () => {
      useGameStore.getState().pauseGame();
      const ball = useGameStore.getState().callBall();
      expect(ball).toBeNull();
    });
  });

  describe('undoCall', () => {
    beforeEach(() => {
      useGameStore.getState().startGame();
    });

    it('returns null when no balls called', () => {
      const result = useGameStore.getState().undoCall();
      expect(result).toBeNull();
    });

    it('returns the previous current ball', () => {
      const firstBall = useGameStore.getState().callBall();
      const returned = useGameStore.getState().undoCall();
      expect(returned).toEqual(firstBall);
    });

    it('restores ball to remaining', () => {
      useGameStore.getState().callBall();
      useGameStore.getState().undoCall();
      expect(useGameStore.getState().remainingBalls).toHaveLength(75);
    });

    it('returns null when paused', () => {
      useGameStore.getState().callBall();
      useGameStore.getState().pauseGame();
      const result = useGameStore.getState().undoCall();
      expect(result).toBeNull();
    });
  });

  describe('pauseGame', () => {
    it('sets status to paused', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().pauseGame();
      expect(useGameStore.getState().status).toBe('paused');
    });
  });

  describe('resumeGame', () => {
    it('sets status to playing', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().pauseGame();
      useGameStore.getState().resumeGame();
      expect(useGameStore.getState().status).toBe('playing');
    });
  });

  describe('endGame', () => {
    it('sets status to ended', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().endGame();
      expect(useGameStore.getState().status).toBe('ended');
    });
  });

  describe('resetGame', () => {
    it('resets status to idle', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().callBall();
      useGameStore.getState().resetGame();
      expect(useGameStore.getState().status).toBe('idle');
    });

    it('clears called balls', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().callBall();
      useGameStore.getState().resetGame();
      expect(useGameStore.getState().calledBalls).toHaveLength(0);
    });

    it('restores 75 remaining balls', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().callBall();
      useGameStore.getState().resetGame();
      expect(useGameStore.getState().remainingBalls).toHaveLength(75);
    });
  });

  describe('setPattern', () => {
    it('sets the pattern', () => {
      useGameStore.getState().setPattern(mockPattern);
      expect(useGameStore.getState().pattern).toEqual(mockPattern);
    });
  });

  describe('toggleAutoCall', () => {
    it('toggles auto-call on', () => {
      useGameStore.getState().toggleAutoCall();
      expect(useGameStore.getState().autoCallEnabled).toBe(true);
    });

    it('toggles auto-call off', () => {
      useGameStore.getState().toggleAutoCall();
      useGameStore.getState().toggleAutoCall();
      expect(useGameStore.getState().autoCallEnabled).toBe(false);
    });
  });

  describe('setAutoCallSpeed', () => {
    it('sets auto-call speed', () => {
      useGameStore.getState().setAutoCallSpeed(15);
      expect(useGameStore.getState().autoCallSpeed).toBe(15);
    });

    it('clamps to minimum', () => {
      useGameStore.getState().setAutoCallSpeed(1);
      expect(useGameStore.getState().autoCallSpeed).toBe(5);
    });

    it('clamps to maximum', () => {
      useGameStore.getState().setAutoCallSpeed(100);
      expect(useGameStore.getState().autoCallSpeed).toBe(30);
    });
  });

  describe('toggleAudio', () => {
    it('toggles audio off', () => {
      useGameStore.getState().toggleAudio();
      expect(useGameStore.getState().audioEnabled).toBe(false);
    });

    it('toggles audio on', () => {
      useGameStore.getState().toggleAudio();
      useGameStore.getState().toggleAudio();
      expect(useGameStore.getState().audioEnabled).toBe(true);
    });
  });

  describe('_hydrate', () => {
    it('merges partial state', () => {
      useGameStore.getState()._hydrate({ status: 'playing' });
      expect(useGameStore.getState().status).toBe('playing');
    });

    it('preserves unaffected state', () => {
      const originalSpeed = useGameStore.getState().autoCallSpeed;
      useGameStore.getState()._hydrate({ status: 'playing' });
      expect(useGameStore.getState().autoCallSpeed).toBe(originalSpeed);
    });
  });

  describe('useGameSelectors', () => {
    it('returns computed values', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().callBall();

      const { result } = renderHook(() => useGameSelectors());

      expect(result.current.ballsRemaining).toBe(74);
      expect(result.current.ballsCalled).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canCall).toBe(true);
      expect(result.current.canStart).toBe(false);
      expect(result.current.canPause).toBe(true);
      expect(result.current.canResume).toBe(false);
    });
  });
});
