import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebVitals, WebVitals, type WebVitalsMetric } from '../web-vitals';
import { render } from '@testing-library/react';

// Mock web-vitals library
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('WebVitals', () => {
  describe('useWebVitals hook', () => {
    it('should not throw when called', () => {
      expect(() => {
        renderHook(() => useWebVitals());
      }).not.toThrow();
    });

    it('should accept custom onMetric callback', () => {
      const onMetric = vi.fn();
      expect(() => {
        renderHook(() => useWebVitals({ onMetric }));
      }).not.toThrow();
    });

    it('should accept debug option', () => {
      expect(() => {
        renderHook(() => useWebVitals({ debug: true }));
      }).not.toThrow();
    });

    it('should accept disabled option', () => {
      expect(() => {
        renderHook(() => useWebVitals({ disabled: true }));
      }).not.toThrow();
    });

    it('should accept reportAllChanges option', () => {
      expect(() => {
        renderHook(() => useWebVitals({ reportAllChanges: true }));
      }).not.toThrow();
    });
  });

  describe('WebVitals component', () => {
    it('should render nothing (returns null)', () => {
      const { container } = render(<WebVitals />);
      expect(container.innerHTML).toBe('');
    });

    it('should accept onMetric prop', () => {
      const onMetric = vi.fn();
      const { container } = render(<WebVitals onMetric={onMetric} />);
      expect(container.innerHTML).toBe('');
    });

    it('should accept debug prop', () => {
      const { container } = render(<WebVitals debug={true} />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('WebVitalsMetric type', () => {
    it('should have correct structure', () => {
      const metric: WebVitalsMetric = {
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 100,
        id: 'test-id',
        navigationType: 'navigate',
        entries: [],
        timestamp: Date.now(),
        path: '/test',
      };

      expect(metric.name).toBe('LCP');
      expect(metric.rating).toBe('good');
    });

    it('should support all rating values', () => {
      const ratings: Array<WebVitalsMetric['rating']> = [
        'good',
        'needs-improvement',
        'poor',
      ];

      ratings.forEach((rating) => {
        const metric: WebVitalsMetric = {
          name: 'CLS',
          value: 0.1,
          rating,
          delta: 0.01,
          id: 'test',
          navigationType: 'navigate',
          entries: [],
          timestamp: Date.now(),
          path: '/',
        };
        expect(metric.rating).toBe(rating);
      });
    });
  });
});
