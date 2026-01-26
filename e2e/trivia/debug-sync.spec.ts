import { test, expect } from '../fixtures/auth';
import { waitForHydration, waitForDualScreenSync, waitForSyncedContent } from '../utils/helpers';

test.describe('Debug BroadcastChannel Sync', () => {
  test('trace message flow between presenter and display', async ({ authenticatedTriviaPage: page }) => {
    // Collect console logs from presenter
    const presenterLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      presenterLogs.push(`[Presenter] ${text}`);
      console.log(`[Presenter Console] ${text}`);
    });

    await waitForHydration(page);

    // Add team
    await page.getByRole('button', { name: /add team/i }).click();
    await page.waitForTimeout(200);

    // Open display window
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /open display/i }).click();
    const displayPage = await popupPromise;

    // Collect console logs from display
    const displayLogs: string[] = [];
    displayPage.on('console', (msg) => {
      const text = msg.text();
      displayLogs.push(`[Display] ${text}`);
      console.log(`[Display Console] ${text}`);
    });

    await waitForHydration(displayPage);
    await waitForDualScreenSync(displayPage);

    // Wait to let messages settle
    await page.waitForTimeout(1000);

    // Start game
    console.log('\n=== STARTING GAME ===\n');
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForTimeout(500);

    // Toggle display for question
    console.log('\n=== TOGGLING DISPLAY (KeyD) ===\n');
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(2000);

    // Check if content appeared
    console.log('\n=== CHECKING DISPLAY CONTENT ===\n');
    const hasContent = await displayPage.getByText(/round 1/i).first().isVisible().catch(() => false);
    console.log(`Display has "Round 1" content: ${hasContent}`);

    // Print all collected logs
    console.log('\n=== ALL PRESENTER LOGS ===');
    presenterLogs.forEach((log) => console.log(log));

    console.log('\n=== ALL DISPLAY LOGS ===');
    displayLogs.forEach((log) => console.log(log));

    // Verify sync worked
    if (!hasContent) {
      console.error('\n!!! SYNC FAILED - Content not visible on display !!!');
    }

    await expect(displayPage.getByText(/round 1/i).first()).toBeVisible({ timeout: 2000 });
  });
});
