import { test, expect } from '@playwright/test';
import { getTestAuthenticatedPage } from './fixtures/auth';
import { waitForHydration, waitForDualScreenSync, waitForSyncedContent } from './utils/helpers';

test.describe('Debug Dual-Screen Sync', () => {
  test('capture console logs during sync', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await getTestAuthenticatedPage(context, 'trivia');

    // Capture console logs from presenter
    const presenterLogs: string[] = [];
    page.on('console', (msg) => {
      presenterLogs.push(`[Presenter Console] ${msg.type()}: ${msg.text()}`);
    });

    await waitForHydration(page);

    // Add team
    await page.getByRole('button', { name: /add team/i }).click();
    await page.waitForTimeout(200);

    // Open display
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /open display/i }).click();
    const displayPage = await popupPromise;

    // Capture console logs from display
    const displayLogs: string[] = [];
    displayPage.on('console', (msg) => {
      displayLogs.push(`[Display Console] ${msg.type()}: ${msg.text()}`);
    });

    await waitForHydration(displayPage);
    await waitForDualScreenSync(displayPage);

    // Start game
    await page.getByRole('button', { name: /start game/i }).click();

    // Toggle display for question
    await page.keyboard.press('KeyD');

    // Wait a bit to see if sync happens
    await page.waitForTimeout(3000);

    // Print all captured logs
    console.log('\n\n=== PRESENTER CONSOLE LOGS ===');
    presenterLogs.forEach((log) => console.log(log));

    console.log('\n\n=== DISPLAY CONSOLE LOGS ===');
    displayLogs.forEach((log) => console.log(log));

    // Check if display shows content
    const hasContent = await displayPage.getByText(/round 1/i).isVisible().catch(() => false);
    console.log(`\n\n=== DISPLAY HAS CONTENT: ${hasContent} ===\n\n`);

    await context.close();
  });
});
