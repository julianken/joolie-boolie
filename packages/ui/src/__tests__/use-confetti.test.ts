import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfetti } from '../hooks/use-confetti';

describe('useConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with isActive as false', () => {
      const { result } = renderHook(() => useConfetti());
      expect(result.current.isActive).toBe(false);
    });

    it('should have default options', () => {
      const { result } = renderHook(() => useConfetti());
      expect(result.current.options.particleCount).toBe(150);
      expect(result.current.options.duration).toBe(4000);
      expect(result.current.options.spread).toBe(70);
      expect(result.current.options.gravity).toBe(1);
    });

    it('should accept initial options', () => {
      const { result } = renderHook(() =>
        useConfetti({
          particleCount: 200,
          duration: 5000,
          colors: ['#FF0000', '#00FF00'],
        })
      );

      expect(result.current.options.particleCount).toBe(200);
      expect(result.current.options.duration).toBe(5000);
      expect(result.current.options.colors).toEqual(['#FF0000', '#00FF00']);
    });
  });

  describe('fire()', () => {
    it('should set isActive to true', () => {
      const { result } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should accept options override', () => {
      const { result } = renderHook(() => useConfetti({ particleCount: 100 }));

      act(() => {
        result.current.fire({ particleCount: 300, spread: 90 });
      });

      expect(result.current.options.particleCount).toBe(300);
      expect(result.current.options.spread).toBe(90);
    });

    it('should auto-stop after duration by default', () => {
      const { result } = renderHook(() => useConfetti({ duration: 3000 }));

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should respect duration override in fire()', () => {
      const { result } = renderHook(() => useConfetti({ duration: 3000 }));

      act(() => {
        result.current.fire({ duration: 5000 });
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Still active after 3s because duration was overridden to 5s
      expect(result.current.isActive).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should clear previous timeout when fired again', () => {
      const { result } = renderHook(() => useConfetti({ duration: 4000 }));

      act(() => {
        result.current.fire();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isActive).toBe(true);

      // Fire again
      act(() => {
        result.current.fire();
      });

      // Wait original remaining time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should still be active because new fire reset the timer
      expect(result.current.isActive).toBe(true);

      // Wait rest of new duration
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('stop()', () => {
    it('should set isActive to false', () => {
      const { result } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should clear any pending timeout', () => {
      const { result } = renderHook(() => useConfetti({ duration: 4000 }));

      act(() => {
        result.current.fire();
      });

      act(() => {
        result.current.stop();
      });

      expect(result.current.isActive).toBe(false);

      // Advance past original duration - should not trigger any changes
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('autoStop option', () => {
    it('should not auto-stop when autoStop is false', () => {
      const { result } = renderHook(() =>
        useConfetti({ duration: 1000, autoStop: false })
      );

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Still active because autoStop is false
      expect(result.current.isActive).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result, unmount } = renderHook(() => useConfetti({ duration: 4000 }));

      act(() => {
        result.current.fire();
      });

      unmount();

      // clearTimeout should have been called during cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('options stability', () => {
    it('should return stable fire function', () => {
      const { result, rerender } = renderHook(() => useConfetti());

      const fire1 = result.current.fire;
      rerender();
      const fire2 = result.current.fire;

      expect(fire1).toBe(fire2);
    });

    it('should return stable stop function', () => {
      const { result, rerender } = renderHook(() => useConfetti());

      const stop1 = result.current.stop;
      rerender();
      const stop2 = result.current.stop;

      expect(stop1).toBe(stop2);
    });
  });
});
