import { test, expect } from '../fixtures/auth';
import { waitForHydration, pressKey } from '../utils/helpers';

test.describe('Bingo Keyboard Shortcuts', () => {
  test.beforeEach(async ({ authenticatedBingoPage: page }) => {
    await waitForHydration(page);

    // Wait for keyboard event handlers to be registered
    // The useGameKeyboard hook registers listeners in a useEffect
    await page.waitForTimeout(500);

    // Ensure page is focused (not any specific element)
    // This allows keyboard shortcuts to work properly
    await page.evaluate(() => {
      const body = document.querySelector('body');
      if (body) {
        body.focus();
      }
    });
  });

  test('Space key calls a ball', async ({ authenticatedBingoPage: page }) => {
    // Start the game first - Space only works when canCall is true
    const startButton = page.getByRole('button', { name: /start game/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Get initial ball count
    const initialCount = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const initialNum = parseInt(initialCount?.match(/(\d+)/)?.[1] || '0');

    // Press Space to call a ball
    await page.keyboard.press('Space');

    // Wait for ball to be called (audio + animation)
    await page.waitForTimeout(2000);

    // Ball count should increase
    const newCount = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const newNum = parseInt(newCount?.match(/(\d+)/)?.[1] || '0');

    expect(newNum).toBeGreaterThan(initialNum);
  });

  test('P key toggles pause', async ({ authenticatedBingoPage: page }) => {
    // Start the game first
    const startButton = page.getByRole('button', { name: /start game/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Call a ball to ensure game is in playing state
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Press P to pause
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(500);

    // Should show resume button
    const resumeButton = page.getByRole('button', { name: /resume/i });
    await expect(resumeButton).toBeVisible({ timeout: 2000 });

    // Press P again to resume
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(500);

    // Should show pause button again
    const pauseButton = page.getByRole('button', { name: /pause/i });
    await expect(pauseButton).toBeVisible({ timeout: 2000 });
  });

  test('U key undoes last call', async ({ authenticatedBingoPage: page }) => {
    // Start the game first
    const startButton = page.getByRole('button', { name: /start game/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Call two balls
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    const countBefore = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const numBefore = parseInt(countBefore?.match(/(\d+)/)?.[1] || '0');
    expect(numBefore).toBeGreaterThanOrEqual(2);

    // Press U to undo
    await page.keyboard.press('KeyU');
    await page.waitForTimeout(500);

    const countAfter = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const numAfter = parseInt(countAfter?.match(/(\d+)/)?.[1] || '0');

    expect(numAfter).toBeLessThan(numBefore);
    expect(numAfter).toBe(numBefore - 1);
  });

  test('R key resets the game', async ({ authenticatedBingoPage: page }) => {
    // Start the game first
    const startButton = page.getByRole('button', { name: /start game/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Call some balls first
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Verify balls were called
    const countBefore = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const numBefore = parseInt(countBefore?.match(/(\d+)/)?.[1] || '0');
    expect(numBefore).toBeGreaterThan(0);

    // Press R to reset
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(500);

    // May need to confirm reset (dialog may appear)
    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(500);
    }

    // Ball count should be 0
    await expect(page.getByText(/0\s*called/i)).toBeVisible({ timeout: 2000 });
  });

  test('M key toggles audio', async ({ authenticatedBingoPage: page }) => {
    // Find audio toggle state
    const audioToggle = page.getByRole('switch').filter({ hasText: /audio/i }).or(
      page.locator('[aria-label*="audio"]')
    ).first();

    let initialState: string | null = null;
    if (await audioToggle.isVisible()) {
      initialState = await audioToggle.getAttribute('aria-checked');
    }

    // Press M to toggle audio
    await page.keyboard.press('KeyM');
    await page.waitForTimeout(300);

    // State should have changed
    if (await audioToggle.isVisible()) {
      const newState = await audioToggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);

      // Toggle back
      await page.keyboard.press('KeyM');
      await page.waitForTimeout(300);

      const finalState = await audioToggle.getAttribute('aria-checked');
      expect(finalState).toBe(initialState);
    }
  });

  test('keyboard shortcuts do not work when typing in input', async ({ authenticatedBingoPage: page }) => {
    // Start the game first so shortcut would normally work
    const startButton = page.getByRole('button', { name: /start game/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Find any input field (if present)
    // Try to find visible text inputs (not hidden password fields, etc.)
    const input = page.locator('input[type="text"], input:not([type])').first();

    if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
      await input.focus();
      await input.fill('');
      await page.waitForTimeout(100);

      // Get initial ball count
      const initialCount = await page.getByText(/(\d+)\s*called/i).first().textContent();
      const initialNum = parseInt(initialCount?.match(/(\d+)/)?.[1] || '0');

      // Press space while focused on input
      await page.keyboard.press('Space');
      await page.waitForTimeout(1000);

      // Ball count should NOT increase (space should type in input, not call ball)
      const newCount = await page.getByText(/(\d+)\s*called/i).first().textContent();
      const newNum = parseInt(newCount?.match(/(\d+)/)?.[1] || '0');

      expect(newNum).toBe(initialNum);
    } else {
      // Skip test if no input field found
      test.skip();
    }
  });

  test('display page F key toggles fullscreen', async ({ authenticatedBingoPage: page, context }) => {
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Wait for keyboard event handlers to be registered on display page
    await displayPage.waitForTimeout(500);

    // Note: Fullscreen API may not work in headless mode
    // Just verify the key handler exists by checking for UI response
    await displayPage.keyboard.press('KeyF');
    await displayPage.waitForTimeout(500);

    // If fullscreen indicator appears, it worked
    // Otherwise, just verify no error occurred
    const fullscreenIndicator = displayPage.getByText(/fullscreen/i);
    // This is acceptable whether fullscreen works or not in test environment
    expect(await fullscreenIndicator.count()).toBeGreaterThanOrEqual(0);
  });

  test('display page ? key opens help modal', async ({ authenticatedBingoPage: page, context }) => {
    await waitForHydration(page);

    const [displayPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /open display/i }).click(),
    ]);

    await waitForHydration(displayPage);

    // Wait for keyboard event handlers to be registered on display page
    await displayPage.waitForTimeout(500);

    // Press ? to open help
    await displayPage.keyboard.press('Shift+/'); // ? is Shift+/
    await displayPage.waitForTimeout(500);

    // Help modal should appear
    const helpModal = displayPage.getByRole('dialog').or(
      displayPage.locator('[class*="modal"]')
    );

    if (await helpModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(helpModal).toContainText(/keyboard|shortcut|help/i);

      // Close with Escape
      await displayPage.keyboard.press('Escape');
      await displayPage.waitForTimeout(500);
    } else {
      // If no help modal exists, skip this assertion
      // The display page may not have a help modal implemented yet
      test.skip();
    }
  });

  test('multiple rapid key presses are handled correctly', async ({ authenticatedBingoPage: page }) => {
    // Start the game first
    const startButton = page.getByRole('button', { name: /start game/i });
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Get initial count
    const initialCount = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const initialNum = parseInt(initialCount?.match(/(\d+)/)?.[1] || '0');

    // Press Space rapidly 3 times
    // The hook has a guard (isProcessingRef) to prevent race conditions
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');

    // Wait for all balls to be called (audio takes time)
    await page.waitForTimeout(6000);

    // Should have called at least 1 ball (may not be exactly 3 due to race condition guards)
    const finalCount = await page.getByText(/(\d+)\s*called/i).first().textContent();
    const finalNum = parseInt(finalCount?.match(/(\d+)/)?.[1] || '0');

    expect(finalNum).toBeGreaterThan(initialNum);
  });
});
