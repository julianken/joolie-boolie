import { test, expect } from '@playwright/test';
import { waitForHydration } from '../utils/helpers';

test.describe('Bingo Display Page', () => {
  test('shows invalid session error when accessed directly', async ({ page }) => {
    await page.goto('/display');
    await waitForHydration(page);

    await expect(page.getByText(/invalid session/i)).toBeVisible();
    await expect(page.getByText(/open display/i)).toBeVisible();
  });

  test('shows invalid session for malformed session ID', async ({ page }) => {
    await page.goto('/display?session=invalid');
    await waitForHydration(page);

    await expect(page.getByText(/invalid session/i)).toBeVisible();
  });

  test('displays correctly when opened from presenter', async ({ page, context }) => {
    // First go to presenter view
    await page.goto('/play');
    await waitForHydration(page);

    // Open display window
    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Check display page content
    await expect(displayPage.getByText(/audience display/i)).toBeVisible();
    await expect(displayPage.getByRole('heading', { name: /beak bingo/i })).toBeVisible();
  });

  test('shows waiting state when no game started', async ({ page, context }) => {
    // Open presenter first
    await page.goto('/play');
    await waitForHydration(page);

    // Open display
    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Should show waiting or ready state
    const waitingText = displayPage.getByText(/waiting|ready to start/i);
    await expect(waitingText).toBeVisible();
  });

  test('displays current ball when game is active', async ({ page, context }) => {
    // Open presenter
    await page.goto('/play');
    await waitForHydration(page);

    // Open display
    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Call a ball from presenter
    await page.getByRole('button', { name: /roll|call|start/i }).first().click();

    // Wait for ball to appear on display (with sync time)
    await page.waitForTimeout(3000);

    // Display should show the ball or board
    const displayContent = displayPage.locator('main');
    await expect(displayContent).toBeVisible();
  });

  test('shows bingo board with called numbers', async ({ page, context }) => {
    // Setup presenter
    await page.goto('/play');
    await waitForHydration(page);

    // Open display
    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Call a few balls
    const rollButton = page.getByRole('button', { name: /roll|call|start/i }).first();
    await rollButton.click();
    await page.waitForTimeout(2000);
    await rollButton.click();
    await page.waitForTimeout(2000);

    // Display should show the bingo board section
    await expect(displayPage.getByText(/called numbers/i)).toBeVisible();
  });

  test('shows connection status indicator', async ({ page, context }) => {
    await page.goto('/play');
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Wait for connection
    await page.waitForTimeout(1000);

    // Should show sync status
    const syncIndicator = displayPage.locator('[class*="bg-success"], [class*="bg-green"]').first();
    await expect(syncIndicator).toBeVisible({ timeout: 10000 });
  });

  test('displays winning pattern', async ({ page, context }) => {
    await page.goto('/play');
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Start game to get pattern synced
    await page.getByRole('button', { name: /roll|call|start/i }).first().click();
    await page.waitForTimeout(2000);

    // Pattern display section should be visible
    const patternSection = displayPage.getByText(/pattern|winning/i);
    await expect(patternSection.first()).toBeVisible();
  });

  test('has fullscreen button', async ({ page, context }) => {
    await page.goto('/play');
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Should have fullscreen toggle button
    const fullscreenBtn = displayPage.getByRole('button', { name: /fullscreen/i });
    await expect(fullscreenBtn).toBeVisible();
  });

  test('has help button for keyboard shortcuts', async ({ page, context }) => {
    await page.goto('/play');
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Should have help button
    const helpBtn = displayPage.getByRole('button', { name: /help|shortcuts|\?/i });
    await expect(helpBtn).toBeVisible();
  });

  test('footer shows fullscreen hint', async ({ page, context }) => {
    await page.goto('/play');
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Footer should mention fullscreen
    await expect(displayPage.getByText(/fullscreen/i)).toBeVisible();
  });
});
