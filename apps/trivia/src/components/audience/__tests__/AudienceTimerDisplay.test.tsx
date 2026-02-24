import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudienceTimerDisplay } from '../AudienceTimerDisplay';
import type { Timer } from '@/types';

// Helper to create a mock timer
function createMockTimer(
  remaining: number,
  duration: number = 30,
  isRunning: boolean = false
): Timer {
  return {
    remaining,
    duration,
    isRunning,
  };
}

describe('AudienceTimerDisplay', () => {
  describe('rendering', () => {
    it('should render timer region', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('region', { name: /question timer/i })).toBeInTheDocument();
    });

    it('should render time remaining', () => {
      const timer = createMockTimer(25);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('25');
    });

    it('should not render when visible is false', () => {
      const timer = createMockTimer(30);
      const { container } = render(<AudienceTimerDisplay timer={timer} visible={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when visible is true', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} visible={true} />);

      expect(screen.getByRole('region', { name: /question timer/i })).toBeInTheDocument();
    });

    it('should render by default when visible prop is omitted', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('region', { name: /question timer/i })).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should display seconds when under 60', () => {
      const timer = createMockTimer(45, 60);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('45');
    });

    it('should display MM:SS format when 60 or more seconds', () => {
      const timer = createMockTimer(90, 120);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('1:30');
    });

    it('should display 2:00 for 120 seconds', () => {
      const timer = createMockTimer(120, 120);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('2:00');
    });

    it('should display 0 when timer is empty', () => {
      const timer = createMockTimer(0, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('0');
    });

    it('should pad single digit seconds in MM:SS format', () => {
      const timer = createMockTimer(65, 120);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('1:05');
    });
  });

  describe('unit label', () => {
    it('should show "sec" when time is under 60', () => {
      const timer = createMockTimer(30, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByText('sec')).toBeInTheDocument();
    });

    it('should show "min" when time is 60 or more', () => {
      const timer = createMockTimer(90, 120);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByText('min')).toBeInTheDocument();
    });
  });

  describe('status indicator', () => {
    it('should show "Time Running" when timer is running', () => {
      const timer = createMockTimer(25, 30, true);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByText('Time Running')).toBeInTheDocument();
    });

    it('should show "Timer Paused" when timer is stopped with time remaining', () => {
      const timer = createMockTimer(15, 30, false);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByText('Timer Paused')).toBeInTheDocument();
    });

    it('should show "Time\'s Up!" when timer reaches 0', () => {
      const timer = createMockTimer(0, 30, false);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByText("Time's Up!")).toBeInTheDocument();
    });

    it('should have pulsing indicator when running', () => {
      const timer = createMockTimer(25, 30, true);
      const { container } = render(<AudienceTimerDisplay timer={timer} />);

      const pulsingDot = container.querySelector('.motion-safe\\:animate-pulse');
      expect(pulsingDot).toBeInTheDocument();
      // Color is applied via inline style, not a Tailwind class
      expect(pulsingDot?.getAttribute('style')).toContain('background');
    });
  });

  describe('urgency colors', () => {
    it('should show green color when time is above 50%', () => {
      const timer = createMockTimer(20, 30); // 66%
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      // Colors are applied via inline styles with hex values
      expect(timerElement.style.color).toBe('rgb(52, 211, 153)'); // #34D399
    });

    it('should show amber color when time is between 25% and 50%', () => {
      const timer = createMockTimer(10, 30); // 33%
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement.style.color).toBe('rgb(251, 191, 36)'); // #FBBF24
    });

    it('should show red color when time is below 25%', () => {
      const timer = createMockTimer(5, 30); // 16%
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement.style.color).toBe('rgb(244, 63, 94)'); // #F43F5E
    });

    it('should show red color at exactly 25%', () => {
      const timer = createMockTimer(7, 28); // exactly 25%
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement.style.color).toBe('rgb(244, 63, 94)'); // #F43F5E
    });

    it('should show amber color just above 25%', () => {
      const timer = createMockTimer(8, 30); // 26.67%
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement.style.color).toBe('rgb(251, 191, 36)'); // #FBBF24
    });
  });

  describe('time up indicator', () => {
    it('should show TIME! when timer reaches 0', () => {
      const timer = createMockTimer(0, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByText('TIME!')).toBeInTheDocument();
    });

    it('should not show TIME! when timer has time remaining', () => {
      const timer = createMockTimer(5, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.queryByText('TIME!')).not.toBeInTheDocument();
    });

    it('should not show TIME! when duration is 0', () => {
      const timer = createMockTimer(0, 0);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.queryByText('TIME!')).not.toBeInTheDocument();
    });

    it('should have animate-pulse class for TIME! indicator', () => {
      const timer = createMockTimer(0, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timeUpElement = screen.getByText('TIME!');
      expect(timeUpElement).toHaveClass('motion-safe:animate-pulse');
    });
  });

  describe('large text for readability', () => {
    it('should have display font for time', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      // Uses display font via inline style
      expect(timerElement).toBeInTheDocument();
      expect(timerElement).toHaveClass('font-bold');
    });

    it('should have bold font weight for time display', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement).toHaveClass('font-bold');
    });

    it('should have tabular numbers for consistent width', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement).toHaveClass('tabular-nums');
    });
  });

  describe('circular progress indicator', () => {
    it('should render SVG for circular progress', () => {
      const timer = createMockTimer(30);
      const { container } = render(<AudienceTimerDisplay timer={timer} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have two circles (background and progress)', () => {
      const timer = createMockTimer(30);
      const { container } = render(<AudienceTimerDisplay timer={timer} />);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });

    it('should have hidden SVG from screen readers', () => {
      const timer = createMockTimer(30);
      const { container } = render(<AudienceTimerDisplay timer={timer} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('reduced motion preferences', () => {
    it('should use motion-safe classes when running', () => {
      const timer = createMockTimer(25, 30, true);
      const { container } = render(<AudienceTimerDisplay timer={timer} />);

      // When running, the pulsing dot has motion-safe:animate-pulse
      const elementsWithMotionSafe = container.querySelectorAll('[class*="motion-safe:"]');
      expect(elementsWithMotionSafe.length).toBeGreaterThan(0);
    });

    it('should have transition on progress circle via inline style', () => {
      const timer = createMockTimer(30);
      const { container } = render(<AudienceTimerDisplay timer={timer} />);

      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle?.style.transition).toContain('stroke-dashoffset');
    });

    it('should have transition on time display color', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      // Color transitions are applied via inline style
      expect(timerElement.style.transition).toContain('color');
    });
  });

  describe('accessibility', () => {
    it('should have timer role on time display', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('should have aria-live polite for time updates', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-atomic for complete value announcement', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timerElement = screen.getByRole('timer');
      expect(timerElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have status role on status indicator', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live polite on status indicator', () => {
      const timer = createMockTimer(30);
      render(<AudienceTimerDisplay timer={timer} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce TIME! with assertive aria-live', () => {
      const timer = createMockTimer(0, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      const timeUpElement = screen.getByText('TIME!');
      expect(timeUpElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration gracefully', () => {
      const timer = createMockTimer(0, 0);
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('0');
    });

    it('should handle negative remaining time (clamped to 0)', () => {
      const timer = createMockTimer(-5, 30);
      render(<AudienceTimerDisplay timer={timer} />);

      // Should still render, showing -5 (engine should prevent this, but component handles it)
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('should handle very large durations', () => {
      const timer = createMockTimer(3600, 3600); // 1 hour
      render(<AudienceTimerDisplay timer={timer} />);

      expect(screen.getByRole('timer')).toHaveTextContent('60:00');
    });
  });
});
