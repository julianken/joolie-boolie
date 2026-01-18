import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getNextStatus,
  transition,
  getValidActions,
  canCallBall,
  canPause,
  canResume,
  canStart,
  isGameActive,
} from '../state-machine';

describe('state-machine', () => {
  describe('canTransition', () => {
    describe('from idle status', () => {
      it('allows START_GAME', () => {
        expect(canTransition('idle', 'START_GAME')).toBe(true);
      });

      it('rejects CALL_BALL', () => {
        expect(canTransition('idle', 'CALL_BALL')).toBe(false);
      });

      it('rejects UNDO_CALL', () => {
        expect(canTransition('idle', 'UNDO_CALL')).toBe(false);
      });

      it('rejects PAUSE_GAME', () => {
        expect(canTransition('idle', 'PAUSE_GAME')).toBe(false);
      });

      it('rejects RESUME_GAME', () => {
        expect(canTransition('idle', 'RESUME_GAME')).toBe(false);
      });

      it('rejects END_GAME', () => {
        expect(canTransition('idle', 'END_GAME')).toBe(false);
      });

      it('rejects RESET_GAME', () => {
        expect(canTransition('idle', 'RESET_GAME')).toBe(false);
      });
    });

    describe('from playing status', () => {
      it('allows CALL_BALL', () => {
        expect(canTransition('playing', 'CALL_BALL')).toBe(true);
      });

      it('allows UNDO_CALL', () => {
        expect(canTransition('playing', 'UNDO_CALL')).toBe(true);
      });

      it('allows PAUSE_GAME', () => {
        expect(canTransition('playing', 'PAUSE_GAME')).toBe(true);
      });

      it('allows END_GAME', () => {
        expect(canTransition('playing', 'END_GAME')).toBe(true);
      });

      it('allows RESET_GAME', () => {
        expect(canTransition('playing', 'RESET_GAME')).toBe(true);
      });

      it('rejects START_GAME', () => {
        expect(canTransition('playing', 'START_GAME')).toBe(false);
      });

      it('rejects RESUME_GAME', () => {
        expect(canTransition('playing', 'RESUME_GAME')).toBe(false);
      });
    });

    describe('from paused status', () => {
      it('allows RESUME_GAME', () => {
        expect(canTransition('paused', 'RESUME_GAME')).toBe(true);
      });

      it('allows END_GAME', () => {
        expect(canTransition('paused', 'END_GAME')).toBe(true);
      });

      it('allows RESET_GAME', () => {
        expect(canTransition('paused', 'RESET_GAME')).toBe(true);
      });

      it('rejects START_GAME', () => {
        expect(canTransition('paused', 'START_GAME')).toBe(false);
      });

      it('rejects CALL_BALL', () => {
        expect(canTransition('paused', 'CALL_BALL')).toBe(false);
      });

      it('rejects PAUSE_GAME', () => {
        expect(canTransition('paused', 'PAUSE_GAME')).toBe(false);
      });
    });

    describe('from ended status', () => {
      it('allows RESET_GAME', () => {
        expect(canTransition('ended', 'RESET_GAME')).toBe(true);
      });

      it('rejects START_GAME', () => {
        expect(canTransition('ended', 'START_GAME')).toBe(false);
      });

      it('rejects CALL_BALL', () => {
        expect(canTransition('ended', 'CALL_BALL')).toBe(false);
      });

      it('rejects RESUME_GAME', () => {
        expect(canTransition('ended', 'RESUME_GAME')).toBe(false);
      });
    });
  });

  describe('getNextStatus', () => {
    it('returns playing for START_GAME from idle', () => {
      expect(getNextStatus('idle', 'START_GAME')).toBe('playing');
    });

    it('returns playing for CALL_BALL from playing', () => {
      expect(getNextStatus('playing', 'CALL_BALL')).toBe('playing');
    });

    it('returns playing for UNDO_CALL from playing', () => {
      expect(getNextStatus('playing', 'UNDO_CALL')).toBe('playing');
    });

    it('returns paused for PAUSE_GAME from playing', () => {
      expect(getNextStatus('playing', 'PAUSE_GAME')).toBe('paused');
    });

    it('returns playing for RESUME_GAME from paused', () => {
      expect(getNextStatus('paused', 'RESUME_GAME')).toBe('playing');
    });

    it('returns ended for END_GAME from playing', () => {
      expect(getNextStatus('playing', 'END_GAME')).toBe('ended');
    });

    it('returns ended for END_GAME from paused', () => {
      expect(getNextStatus('paused', 'END_GAME')).toBe('ended');
    });

    it('returns idle for RESET_GAME from any status', () => {
      expect(getNextStatus('playing', 'RESET_GAME')).toBe('idle');
      expect(getNextStatus('paused', 'RESET_GAME')).toBe('idle');
      expect(getNextStatus('ended', 'RESET_GAME')).toBe('idle');
    });

    it('returns null for invalid transitions', () => {
      expect(getNextStatus('idle', 'CALL_BALL')).toBe(null);
      expect(getNextStatus('paused', 'CALL_BALL')).toBe(null);
      expect(getNextStatus('ended', 'START_GAME')).toBe(null);
    });
  });

  describe('transition', () => {
    it('returns next status for valid transitions', () => {
      expect(transition('idle', 'START_GAME')).toBe('playing');
      expect(transition('playing', 'PAUSE_GAME')).toBe('paused');
      expect(transition('paused', 'RESUME_GAME')).toBe('playing');
    });

    it('throws error for invalid transitions', () => {
      expect(() => transition('idle', 'CALL_BALL')).toThrow(
        'Invalid transition: cannot CALL_BALL when game is idle'
      );
      expect(() => transition('paused', 'CALL_BALL')).toThrow(
        'Invalid transition: cannot CALL_BALL when game is paused'
      );
      expect(() => transition('ended', 'START_GAME')).toThrow(
        'Invalid transition: cannot START_GAME when game is ended'
      );
    });
  });

  describe('getValidActions', () => {
    it('returns [START_GAME] for idle status', () => {
      expect(getValidActions('idle')).toEqual(['START_GAME']);
    });

    it('returns correct actions for playing status', () => {
      const actions = getValidActions('playing');
      expect(actions).toContain('CALL_BALL');
      expect(actions).toContain('UNDO_CALL');
      expect(actions).toContain('PAUSE_GAME');
      expect(actions).toContain('END_GAME');
      expect(actions).toContain('RESET_GAME');
      expect(actions).toHaveLength(5);
    });

    it('returns correct actions for paused status', () => {
      const actions = getValidActions('paused');
      expect(actions).toContain('RESUME_GAME');
      expect(actions).toContain('END_GAME');
      expect(actions).toContain('RESET_GAME');
      expect(actions).toHaveLength(3);
    });

    it('returns [RESET_GAME] for ended status', () => {
      expect(getValidActions('ended')).toEqual(['RESET_GAME']);
    });

    it('returns a copy, not the original array', () => {
      const actions1 = getValidActions('playing');
      const actions2 = getValidActions('playing');
      expect(actions1).not.toBe(actions2);
      expect(actions1).toEqual(actions2);
    });
  });

  describe('canCallBall', () => {
    it('returns true for playing status', () => {
      expect(canCallBall('playing')).toBe(true);
    });

    it('returns false for idle status', () => {
      expect(canCallBall('idle')).toBe(false);
    });

    it('returns false for paused status', () => {
      expect(canCallBall('paused')).toBe(false);
    });

    it('returns false for ended status', () => {
      expect(canCallBall('ended')).toBe(false);
    });
  });

  describe('canPause', () => {
    it('returns true for playing status', () => {
      expect(canPause('playing')).toBe(true);
    });

    it('returns false for idle status', () => {
      expect(canPause('idle')).toBe(false);
    });

    it('returns false for paused status', () => {
      expect(canPause('paused')).toBe(false);
    });

    it('returns false for ended status', () => {
      expect(canPause('ended')).toBe(false);
    });
  });

  describe('canResume', () => {
    it('returns true for paused status', () => {
      expect(canResume('paused')).toBe(true);
    });

    it('returns false for idle status', () => {
      expect(canResume('idle')).toBe(false);
    });

    it('returns false for playing status', () => {
      expect(canResume('playing')).toBe(false);
    });

    it('returns false for ended status', () => {
      expect(canResume('ended')).toBe(false);
    });
  });

  describe('canStart', () => {
    it('returns true for idle status', () => {
      expect(canStart('idle')).toBe(true);
    });

    it('returns false for playing status', () => {
      expect(canStart('playing')).toBe(false);
    });

    it('returns false for paused status', () => {
      expect(canStart('paused')).toBe(false);
    });

    it('returns false for ended status', () => {
      expect(canStart('ended')).toBe(false);
    });
  });

  describe('isGameActive', () => {
    it('returns true for playing status', () => {
      expect(isGameActive('playing')).toBe(true);
    });

    it('returns true for paused status', () => {
      expect(isGameActive('paused')).toBe(true);
    });

    it('returns false for idle status', () => {
      expect(isGameActive('idle')).toBe(false);
    });

    it('returns false for ended status', () => {
      expect(isGameActive('ended')).toBe(false);
    });
  });
});
