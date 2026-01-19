'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from 'web-vitals';

/**
 * Web Vitals metric with additional metadata
 */
export interface WebVitalsMetric {
  /** Metric name (CLS, FCP, INP, LCP, TTFB) */
  name: string;
  /** Metric value */
  value: number;
  /** Rating based on thresholds (good, needs-improvement, poor) */
  rating: 'good' | 'needs-improvement' | 'poor';
  /** Delta since last report */
  delta: number;
  /** Unique ID for this metric instance */
  id: string;
  /** Navigation type */
  navigationType: string;
  /** Entries that contributed to this metric */
  entries: PerformanceEntry[];
  /** Timestamp when metric was recorded */
  timestamp: number;
  /** Route/path where metric was recorded */
  path: string;
}

/**
 * Configuration options for WebVitals component
 */
export interface WebVitalsConfig {
  /**
   * Callback function called for each metric
   * Use this to send metrics to your analytics service
   */
  onMetric?: (metric: WebVitalsMetric) => void;

  /**
   * Whether to log metrics to console in development
   * @default true in development, false in production
   */
  debug?: boolean;

  /**
   * Report all changes, not just final values
   * @default false
   */
  reportAllChanges?: boolean;

  /**
   * Disable metric collection entirely
   * @default false
   */
  disabled?: boolean;
}

/**
 * Default thresholds for Core Web Vitals (in milliseconds where applicable)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating for a metric value
 */
function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Console logger for development
 */
function logMetric(metric: WebVitalsMetric): void {
  const formattedValue = formatMetricValue(metric.name, metric.value);
  const ratingColors = {
    good: '\x1b[32m', // green
    'needs-improvement': '\x1b[33m', // yellow
    poor: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';

  // Use console.info for better filtering in dev tools
  console.info(
    `[WebVitals] ${metric.name}: ${formattedValue} (${ratingColors[metric.rating]}${metric.rating}${reset})`,
    {
      path: metric.path,
      delta: metric.delta,
      entries: metric.entries.length,
    }
  );
}

/**
 * Default analytics reporter that can be extended
 * This is a no-op by default, ready for integration with analytics services
 */
export function sendToAnalytics(metric: WebVitalsMetric): void {
  // Example implementation for common analytics services:
  //
  // Google Analytics 4:
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   non_interaction: true,
  // });
  //
  // Custom endpoint:
  // navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(metric));
  //
  // Vercel Analytics:
  // if (window.va) {
  //   window.va('track', 'web-vital', metric);
  // }

  // Default: no-op (metrics are logged in dev mode via debug option)
}

/**
 * Hook to collect and report Core Web Vitals metrics
 *
 * @example
 * ```tsx
 * // Basic usage - logs to console in development
 * function App() {
 *   useWebVitals();
 *   return <div>...</div>;
 * }
 *
 * // With custom analytics
 * function App() {
 *   useWebVitals({
 *     onMetric: (metric) => {
 *       sendToAnalytics(metric);
 *     }
 *   });
 *   return <div>...</div>;
 * }
 * ```
 */
// Detect development mode safely for both Node.js and browser environments
const isDevelopment = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).process?.env?.NODE_ENV === 'development';
  } catch {
    return false;
  }
};

export function useWebVitals(config: WebVitalsConfig = {}): void {
  const {
    onMetric,
    debug = isDevelopment(),
    reportAllChanges = false,
    disabled = false,
  } = config;

  // Use ref to avoid re-subscribing on config changes
  const configRef = useRef({ onMetric, debug });
  configRef.current = { onMetric, debug };

  const handleMetric = useCallback((metric: Metric) => {
    const webVitalMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      entries: metric.entries,
      timestamp: Date.now(),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    // Log to console in debug mode
    if (configRef.current.debug) {
      logMetric(webVitalMetric);
    }

    // Call custom metric handler
    if (configRef.current.onMetric) {
      configRef.current.onMetric(webVitalMetric);
    }
  }, []);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') {
      return;
    }

    const options = { reportAllChanges };

    // Subscribe to all Core Web Vitals
    onCLS(handleMetric, options);
    onFCP(handleMetric, options);
    onINP(handleMetric, options);
    onLCP(handleMetric, options);
    onTTFB(handleMetric, options);

    // Note: web-vitals doesn't provide an unsubscribe mechanism
    // This is intentional as metrics should be collected for the entire page lifecycle
  }, [disabled, handleMetric, reportAllChanges]);
}

/**
 * WebVitals component for collecting Core Web Vitals metrics
 *
 * This component renders nothing and simply sets up metric collection.
 * Add it to your root layout to collect metrics across all pages.
 *
 * @example
 * ```tsx
 * // In your root layout.tsx
 * import { WebVitals } from '@beak-gaming/ui';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <WebVitals />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 *
 * // With custom analytics
 * <WebVitals
 *   onMetric={(metric) => {
 *     // Send to your analytics service
 *     sendToAnalytics(metric);
 *   }}
 * />
 * ```
 */
export function WebVitals(props: WebVitalsConfig): null {
  useWebVitals(props);
  return null;
}

// Re-export types and utilities
export { sendToAnalytics as defaultSendToAnalytics };
export type { Metric as RawWebVitalMetric } from 'web-vitals';
