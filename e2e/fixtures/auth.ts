import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getE2EPortConfig } from '../utils/port-config';
import { startGameViaWizard } from '../utils/helpers';

// -----------------------------------------------------------------------------
// Dynamic URL Constants for Worktree Isolation
// -----------------------------------------------------------------------------
// URLs are derived from the shared port configuration in e2e/utils/port-config.ts.
// This enables parallel E2E testing across multiple git worktrees.
// See e2e/utils/port-config.ts for the full implementation.
// -----------------------------------------------------------------------------

const portConfig = getE2EPortConfig();

const BINGO_URL = `http://localhost:${portConfig.bingoPort}`;
const TRIVIA_URL = `http://localhost:${portConfig.triviaPort}`;

/**
 * Game app fixtures for standalone E2E tests.
 * No authentication required -- games run in standalone mode.
 */
export interface GameFixtures {
  /**
   * Page navigated to Bingo /play, ready for testing.
   */
  authenticatedBingoPage: Page;

  /**
   * Page navigated to Trivia /play, ready for testing.
   * The setup wizard is automatically dismissed unless skipSetupDismissal is true.
   */
  authenticatedTriviaPage: Page;

  /**
   * Skip automatic setup overlay (SetupGate) dismissal for Trivia.
   * Use this when testing the setup overlay itself.
   * Defaults to false (overlay IS dismissed automatically).
   */
  skipSetupDismissal: boolean;

  /**
   * Navigation timeout for game app pages in milliseconds.
   * Default: 5000ms. Override in project config for mobile: 15000ms.
   */
  navigationTimeout: number;
}

/**
 * Extended test with game fixtures for standalone E2E tests.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/auth';
 *
 * test('shows presenter view', async ({ authenticatedBingoPage: page }) => {
 *   // Page is already on /play
 * });
 * ```
 */
export const test = base.extend<GameFixtures>({
  /**
   * Skip automatic setup overlay (SetupGate) dismissal for Trivia.
   * Defaults to false (overlay IS dismissed automatically).
   * Set to true in tests that need to test the setup overlay itself.
   */
  skipSetupDismissal: [false, { option: true }],

  /**
   * Navigation timeout for game app pages.
   * Default: 5000ms. Override in project config for mobile: 15000ms.
   */
  navigationTimeout: [5000, { option: true }],

  /**
   * Bingo page fixture.
   * Navigates directly to Bingo /play (no auth needed in standalone mode).
   */
  authenticatedBingoPage: async ({ page, navigationTimeout }, use) => {
    await page.goto(`${BINGO_URL}/play`, {
      waitUntil: 'load',
      timeout: navigationTimeout,
    });

    await use(page);
  },

  /**
   * Trivia page fixture.
   * Navigates directly to Trivia /play and dismisses the setup wizard
   * (unless skipSetupDismissal is true).
   */
  authenticatedTriviaPage: async ({ page, skipSetupDismissal, navigationTimeout }, use) => {
    await page.goto(`${TRIVIA_URL}/play`, {
      waitUntil: 'load',
      timeout: navigationTimeout,
    });

    // Start game via setup wizard (unless test opts out)
    if (!skipSetupDismissal) {
      await startGameViaWizard(page);
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
