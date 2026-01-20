import { describe, it, expect, vi } from 'vitest';
import {
  createInitialState,
  startGame,
  callNextBall,
  undoLastCall,
  pauseGame,
  resumeGame,
  endGame,
  resetGame,
  setPattern,
  setAutoCallEnabled,
  setAutoCallSpeed,
  setAudioEnabled,
  getBallsRemaining,
  getBallsCalled,
  canUndoCall,
  canCallBall,
  canStartGame,
  canPauseGame,
  canResumeGame,
  getRecentBalls,
  isBallCalled,
  DEFAULT_AUTO_CALL_SPEED,
  MIN_AUTO_CALL_SPEED,
  MAX_AUTO_CALL_SPEED,
} from '../engine';
import { BingoPattern, GameState } from '@/types';
import * as ballDeck from '../ball-deck';

describe('engine', () => {
  const mockPattern: BingoPattern = {
    id: 'test-pattern',
    name: 'Test Pattern',
    category: 'lines',
    cells: [{ row: 0, col: 0 }],
  };

  describe('createInitialState', () => {
    it('creates state with idle status', () => {
      const state = createInitialState();
      expect(state.status).toBe('idle');
    });

    it('creates state with empty called balls', () => {
      const state = createInitialState();
      expect(state.calledBalls).toHaveLength(0);
    });

    it('creates state with 75 remaining balls', () => {
      const state = createInitialState();
      expect(state.remainingBalls).toHaveLength(75);
    });

    it('creates state with no current or previous ball', () => {
      const state = createInitialState();
      expect(state.currentBall).toBeNull();
      expect(state.previousBall).toBeNull();
    });

    it('creates state with null pattern', () => {
      const state = createInitialState();
      expect(state.pattern).toBeNull();
    });

    it('creates state with autoCall disabled', () => {
      const state = createInitialState();
      expect(state.autoCallEnabled).toBe(false);
    });

    it('creates state with default auto-call speed', () => {
      const state = createInitialState();
      expect(state.autoCallSpeed).toBe(DEFAULT_AUTO_CALL_SPEED);
    });

    it('creates state with audio enabled', () => {
      const state = createInitialState();
      expect(state.audioEnabled).toBe(true);
    });
  });

  describe('startGame', () => {
    it('transitions status to playing', () => {
      const initial = createInitialState();
      const state = startGame(initial);
      expect(state.status).toBe('playing');
    });

    it('sets pattern when provided', () => {
      const initial = createInitialState();
      const state = startGame(initial, mockPattern);
      expect(state.pattern).toEqual(mockPattern);
    });

    it('preserves existing pattern when none provided', () => {
      const initial = { ...createInitialState(), pattern: mockPattern };
      const state = startGame(initial);
      expect(state.pattern).toEqual(mockPattern);
    });

    it('throws when not in idle state', () => {
      const playing: GameState = { ...createInitialState(), status: 'playing' };
      expect(() => startGame(playing)).toThrow();
    });
  });

  describe('callNextBall', () => {
    it('returns state unchanged if not playing', () => {
      const initial = createInitialState();
      const state = callNextBall(initial);
      expect(state).toEqual(initial);
    });

    it('draws a ball when playing', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const state = callNextBall(playing);

      expect(state.currentBall).not.toBeNull();
      expect(state.calledBalls).toHaveLength(1);
      expect(state.remainingBalls).toHaveLength(74);
    });

    it('sets previous ball correctly', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const state1 = callNextBall(playing);
      const state2 = callNextBall(state1);

      expect(state2.previousBall).toEqual(state1.currentBall);
    });

    it('returns state unchanged when no balls remaining', () => {
      let state: GameState = { ...createInitialState(), status: 'playing' };
      // Draw all 75 balls
      for (let i = 0; i < 75; i++) {
        state = callNextBall(state);
      }
      const finalState = callNextBall(state);
      expect(finalState).toEqual(state);
    });

    it('returns state unchanged when paused', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const paused = pauseGame(playing);
      const result = callNextBall(paused);
      expect(result).toEqual(paused);
    });
  });

  describe('undoLastCall', () => {
    it('returns state unchanged if no balls called', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const state = undoLastCall(playing);
      expect(state).toEqual(playing);
    });

    it('restores the last ball to remaining', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const called = callNextBall(playing);
      const undone = undoLastCall(called);

      expect(undone.calledBalls).toHaveLength(0);
      expect(undone.remainingBalls).toHaveLength(75);
    });

    it('sets current ball to previous called ball', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const state1 = callNextBall(playing);
      const state2 = callNextBall(state1);
      const undone = undoLastCall(state2);

      expect(undone.currentBall).toEqual(state1.currentBall);
    });

    it('sets current and previous to null when undoing first call', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const called = callNextBall(playing);
      const undone = undoLastCall(called);

      expect(undone.currentBall).toBeNull();
      expect(undone.previousBall).toBeNull();
    });

    it('correctly sets previous ball after undo', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const state1 = callNextBall(playing);
      const state2 = callNextBall(state1);
      const state3 = callNextBall(state2);
      const undone = undoLastCall(state3);

      expect(undone.currentBall).toEqual(state2.currentBall);
      expect(undone.previousBall).toEqual(state1.currentBall);
    });
  });

  describe('pauseGame', () => {
    it('transitions status to paused', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const paused = pauseGame(playing);
      expect(paused.status).toBe('paused');
    });

    it('throws when not in playing state', () => {
      const initial = createInitialState();
      expect(() => pauseGame(initial)).toThrow();
    });
  });

  describe('resumeGame', () => {
    it('transitions status to playing', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const paused = pauseGame(playing);
      const resumed = resumeGame(paused);
      expect(resumed.status).toBe('playing');
    });

    it('throws when not in paused state', () => {
      const playing: GameState = { ...createInitialState(), status: 'playing' };
      expect(() => resumeGame(playing)).toThrow();
    });
  });

  describe('endGame', () => {
    it('transitions status to ended', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const ended = endGame(playing);
      expect(ended.status).toBe('ended');
    });

    it('disables auto-call', () => {
      let state = createInitialState();
      state = startGame(state);
      state = setAutoCallEnabled(state, true);
      const ended = endGame(state);
      expect(ended.autoCallEnabled).toBe(false);
    });

    it('can end from paused state', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const paused = pauseGame(playing);
      const ended = endGame(paused);
      expect(ended.status).toBe('ended');
    });
  });

  describe('resetGame', () => {
    it('resets status to idle', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const reset = resetGame(playing);
      expect(reset.status).toBe('idle');
    });

    it('clears called balls', () => {
      const initial = createInitialState();
      let state = startGame(initial);
      state = callNextBall(state);
      state = callNextBall(state);
      const reset = resetGame(state);
      expect(reset.calledBalls).toHaveLength(0);
    });

    it('provides new shuffled deck with 75 balls', () => {
      const initial = createInitialState();
      let state = startGame(initial);
      state = callNextBall(state);
      const reset = resetGame(state);
      expect(reset.remainingBalls).toHaveLength(75);
    });

    it('clears current and previous ball', () => {
      const initial = createInitialState();
      let state = startGame(initial);
      state = callNextBall(state);
      const reset = resetGame(state);
      expect(reset.currentBall).toBeNull();
      expect(reset.previousBall).toBeNull();
    });

    it('disables auto-call', () => {
      let state = createInitialState();
      state = startGame(state);
      state = setAutoCallEnabled(state, true);
      const reset = resetGame(state);
      expect(reset.autoCallEnabled).toBe(false);
    });

    it('preserves pattern', () => {
      let state = createInitialState();
      state = setPattern(state, mockPattern);
      state = startGame(state);
      const reset = resetGame(state);
      expect(reset.pattern).toEqual(mockPattern);
    });
  });

  describe('setPattern', () => {
    it('sets the pattern', () => {
      const initial = createInitialState();
      const state = setPattern(initial, mockPattern);
      expect(state.pattern).toEqual(mockPattern);
    });
  });

  describe('setAutoCallEnabled', () => {
    it('enables auto-call', () => {
      const initial = createInitialState();
      const state = setAutoCallEnabled(initial, true);
      expect(state.autoCallEnabled).toBe(true);
    });

    it('disables auto-call', () => {
      let state = createInitialState();
      state = setAutoCallEnabled(state, true);
      state = setAutoCallEnabled(state, false);
      expect(state.autoCallEnabled).toBe(false);
    });
  });

  describe('setAutoCallSpeed', () => {
    it('sets speed within valid range', () => {
      const initial = createInitialState();
      const state = setAutoCallSpeed(initial, 15);
      expect(state.autoCallSpeed).toBe(15);
    });

    it('clamps speed to minimum', () => {
      const initial = createInitialState();
      const state = setAutoCallSpeed(initial, 1);
      expect(state.autoCallSpeed).toBe(MIN_AUTO_CALL_SPEED);
    });

    it('clamps speed to maximum', () => {
      const initial = createInitialState();
      const state = setAutoCallSpeed(initial, 100);
      expect(state.autoCallSpeed).toBe(MAX_AUTO_CALL_SPEED);
    });
  });

  describe('setAudioEnabled', () => {
    it('enables audio', () => {
      let state = createInitialState();
      state = setAudioEnabled(state, false);
      state = setAudioEnabled(state, true);
      expect(state.audioEnabled).toBe(true);
    });

    it('disables audio', () => {
      const initial = createInitialState();
      const state = setAudioEnabled(initial, false);
      expect(state.audioEnabled).toBe(false);
    });
  });

  describe('selectors', () => {
    describe('getBallsRemaining', () => {
      it('returns count of remaining balls', () => {
        const state = createInitialState();
        expect(getBallsRemaining(state)).toBe(75);
      });
    });

    describe('getBallsCalled', () => {
      it('returns count of called balls', () => {
        let state = startGame(createInitialState());
        state = callNextBall(state);
        state = callNextBall(state);
        expect(getBallsCalled(state)).toBe(2);
      });
    });

    describe('canUndoCall', () => {
      it('returns false when no balls called', () => {
        const state = startGame(createInitialState());
        expect(canUndoCall(state)).toBe(false);
      });

      it('returns true when balls have been called and playing', () => {
        let state = startGame(createInitialState());
        state = callNextBall(state);
        expect(canUndoCall(state)).toBe(true);
      });

      it('returns false when paused', () => {
        let state = startGame(createInitialState());
        state = callNextBall(state);
        state = pauseGame(state);
        expect(canUndoCall(state)).toBe(false);
      });
    });

    describe('canCallBall', () => {
      it('returns false when not playing', () => {
        const state = createInitialState();
        expect(canCallBall(state)).toBe(false);
      });

      it('returns true when playing with balls remaining', () => {
        const state = startGame(createInitialState());
        expect(canCallBall(state)).toBe(true);
      });

      it('returns false when no balls remaining', () => {
        const state: GameState = { ...createInitialState(), status: 'playing', remainingBalls: [] };
        expect(canCallBall(state)).toBe(false);
      });
    });

    describe('canStartGame', () => {
      it('returns true when idle', () => {
        const state = createInitialState();
        expect(canStartGame(state)).toBe(true);
      });

      it('returns false when playing', () => {
        const state = startGame(createInitialState());
        expect(canStartGame(state)).toBe(false);
      });
    });

    describe('canPauseGame', () => {
      it('returns true when playing', () => {
        const state = startGame(createInitialState());
        expect(canPauseGame(state)).toBe(true);
      });

      it('returns false when not playing', () => {
        const state = createInitialState();
        expect(canPauseGame(state)).toBe(false);
      });
    });

    describe('canResumeGame', () => {
      it('returns true when paused', () => {
        const playing = startGame(createInitialState());
        const paused = pauseGame(playing);
        expect(canResumeGame(paused)).toBe(true);
      });

      it('returns false when not paused', () => {
        const state = createInitialState();
        expect(canResumeGame(state)).toBe(false);
      });
    });

    describe('getRecentBalls', () => {
      it('returns most recent balls in reverse order', () => {
        let state = startGame(createInitialState());
        state = callNextBall(state);
        const ball1 = state.currentBall;
        state = callNextBall(state);
        const ball2 = state.currentBall;
        state = callNextBall(state);
        const ball3 = state.currentBall;

        const recent = getRecentBalls(state, 3);
        expect(recent).toEqual([ball3, ball2, ball1]);
      });

      it('returns fewer balls if not enough called', () => {
        let state = startGame(createInitialState());
        state = callNextBall(state);
        const recent = getRecentBalls(state, 5);
        expect(recent).toHaveLength(1);
      });

      it('returns empty array when no balls called', () => {
        const state = startGame(createInitialState());
        expect(getRecentBalls(state, 5)).toEqual([]);
      });
    });

    describe('isBallCalled', () => {
      it('returns false when ball not called', () => {
        const state = createInitialState();
        expect(isBallCalled(state, 1)).toBe(false);
      });

      it('returns true when ball has been called', () => {
        let state = startGame(createInitialState());
        state = callNextBall(state);
        const calledNumber = state.currentBall!.number;
        expect(isBallCalled(state, calledNumber)).toBe(true);
      });
    });
  });

  describe('constants', () => {
    it('has valid DEFAULT_AUTO_CALL_SPEED', () => {
      expect(DEFAULT_AUTO_CALL_SPEED).toBe(10);
    });

    it('has valid MIN_AUTO_CALL_SPEED', () => {
      expect(MIN_AUTO_CALL_SPEED).toBe(5);
    });

    it('has valid MAX_AUTO_CALL_SPEED', () => {
      expect(MAX_AUTO_CALL_SPEED).toBe(30);
    });
  });

  describe('null return handling', () => {
    it('returns state unchanged when drawBall returns null', () => {
      const initial = createInitialState();
      const playing = startGame(initial);

      // Mock drawBall to return null
      const spy = vi.spyOn(ballDeck, 'drawBall').mockReturnValue(null);

      const result = callNextBall(playing);

      // State should be unchanged
      expect(result).toEqual(playing);

      spy.mockRestore();
    });

    it('returns state unchanged when undoDraw returns null', () => {
      const initial = createInitialState();
      const playing = startGame(initial);
      const withBall = callNextBall(playing);

      // Mock undoDraw to return null
      const spy = vi.spyOn(ballDeck, 'undoDraw').mockReturnValue(null);

      const result = undoLastCall(withBall);

      // State should be unchanged
      expect(result).toEqual(withBall);

      spy.mockRestore();
    });
  });
});
