/**
 * Lighthouse CI Configuration
 *
 * Root configuration for running Lighthouse CI across all apps.
 * For app-specific configurations, see apps/{app}/lighthouserc.js
 *
 * Usage:
 *   pnpm lighthouse          # Run on all apps
 *   pnpm lighthouse:bingo    # Run on bingo only
 *   pnpm lighthouse:trivia   # Run on trivia only
 *   pnpm lighthouse:hub      # Run on platform-hub only
 */

const performanceConfig = require('./performance.config.js');

module.exports = {
  ci: {
    collect: {
      // Number of runs per URL for more reliable results
      numberOfRuns: 3,

      // Start servers before running Lighthouse
      startServerCommand: 'pnpm build && pnpm start',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 60000, // 60 seconds

      // URLs to test (relative to startServerUrl)
      // Each app has its own config for specific pages
      url: [
        'http://localhost:3000/', // Bingo home
        'http://localhost:3001/', // Trivia home
        'http://localhost:3002/', // Platform hub home
      ],

      // Lighthouse settings
      settings: {
        // Test both mobile and desktop
        preset: 'desktop',

        // Chrome flags for consistent results
        chromeFlags: '--no-sandbox --headless --disable-gpu',

        // Categories to audit
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],

        // Skip specific audits that don't apply to PWAs in development
        skipAudits: [
          'is-on-https', // Dev environment uses http
        ],
      },
    },

    assert: {
      // Assertions based on performance budgets
      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': [
          'warn',
          { maxNumericValue: performanceConfig.coreWebVitals.lcp.good },
        ],
        'first-contentful-paint': [
          'warn',
          { maxNumericValue: performanceConfig.coreWebVitals.fcp.good },
        ],
        'cumulative-layout-shift': [
          'warn',
          { maxNumericValue: performanceConfig.coreWebVitals.cls.good },
        ],
        'total-blocking-time': [
          'warn',
          { maxNumericValue: performanceConfig.coreWebVitals.tbt.good },
        ],
        'speed-index': [
          'warn',
          { maxNumericValue: performanceConfig.coreWebVitals.speedIndex.good },
        ],
        interactive: ['warn', { maxNumericValue: 5000 }], // Time to Interactive

        // Lighthouse scores
        'categories:performance': [
          'warn',
          { minScore: performanceConfig.lighthouse.performance / 100 },
        ],
        'categories:accessibility': [
          'error',
          { minScore: performanceConfig.lighthouse.accessibility / 100 },
        ],
        'categories:best-practices': [
          'warn',
          { minScore: performanceConfig.lighthouse.bestPractices / 100 },
        ],
        'categories:seo': [
          'warn',
          { minScore: performanceConfig.lighthouse.seo / 100 },
        ],

        // Bundle size assertions
        'total-byte-weight': [
          'warn',
          { maxNumericValue: 1000000 }, // 1MB total
        ],
        'unminified-javascript': 'warn',
        'unminified-css': 'warn',
        'unused-javascript': 'warn',
        'unused-css-rules': 'warn',

        // Accessibility (important for senior users)
        'color-contrast': 'error',
        'tap-targets': 'error',
        'font-size': 'warn',

        // PWA and performance best practices
        'uses-responsive-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-text-compression': 'warn',
        'uses-rel-preconnect': 'warn',
        'render-blocking-resources': 'warn',
      },
    },

    upload: {
      // Store results locally by default
      target: 'filesystem',
      outputDir: './.lighthouseci',

      // For CI environments, can be changed to 'lhci' server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.example.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};
