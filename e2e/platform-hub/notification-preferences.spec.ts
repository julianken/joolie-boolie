import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../fixtures/auth';

test.describe('Notification Preferences (BEA-323)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display notification preferences section', async ({ page }) => {
    // Check for section heading
    const heading = page.getByRole('heading', { name: 'Notification Preferences' });
    await expect(heading).toBeVisible();

    // Check for description
    await expect(page.getByText('Control which email notifications you receive')).toBeVisible();

    // Check all toggle labels are present
    await expect(page.getByText('Important Account Updates')).toBeVisible();
    await expect(page.getByText('Game Reminders')).toBeVisible();
    await expect(page.getByText('Weekly Activity Summary')).toBeVisible();
    await expect(page.getByText('Newsletter & Promotions')).toBeVisible();
  });

  test('should have correct default values', async ({ page }) => {
    // Email notifications should be enabled by default
    const emailToggle = page.locator('label:has-text("Important Account Updates") input[type="checkbox"]');
    await expect(emailToggle).toBeChecked();

    // Others should be disabled by default
    const gameRemindersToggle = page.locator('label:has-text("Game Reminders") input[type="checkbox"]');
    await expect(gameRemindersToggle).not.toBeChecked();

    const weeklySummaryToggle = page.locator('label:has-text("Weekly Activity Summary") input[type="checkbox"]');
    await expect(weeklySummaryToggle).not.toBeChecked();

    const marketingToggle = page.locator('label:has-text("Newsletter & Promotions") input[type="checkbox"]');
    await expect(marketingToggle).not.toBeChecked();
  });

  test('should toggle notification preferences', async ({ page }) => {
    // Find toggles by their labels
    const gameRemindersToggle = page.locator('label:has-text("Game Reminders") input[type="checkbox"]');
    const weeklySummaryToggle = page.locator('label:has-text("Weekly Activity Summary") input[type="checkbox"]');

    // Initially off
    await expect(gameRemindersToggle).not.toBeChecked();
    await expect(weeklySummaryToggle).not.toBeChecked();

    // Click to enable
    await gameRemindersToggle.click();
    await expect(gameRemindersToggle).toBeChecked();

    await weeklySummaryToggle.click();
    await expect(weeklySummaryToggle).toBeChecked();

    // Click to disable
    await gameRemindersToggle.click();
    await expect(gameRemindersToggle).not.toBeChecked();
  });

  test('should save notification preferences', async ({ page }) => {
    // Enable game reminders
    const gameRemindersToggle = page.locator('label:has-text("Game Reminders") input[type="checkbox"]');
    await gameRemindersToggle.click();
    await expect(gameRemindersToggle).toBeChecked();

    // Enable weekly summary
    const weeklySummaryToggle = page.locator('label:has-text("Weekly Activity Summary") input[type="checkbox"]');
    await weeklySummaryToggle.click();
    await expect(weeklySummaryToggle).toBeChecked();

    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Wait for success toast
    await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should persist notification preferences after save and reload', async ({ page }) => {
    // Enable marketing emails
    const marketingToggle = page.locator('label:has-text("Newsletter & Promotions") input[type="checkbox"]');
    await marketingToggle.click();
    await expect(marketingToggle).toBeChecked();

    // Save
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Marketing toggle should still be enabled
    const marketingToggleAfter = page.locator('label:has-text("Newsletter & Promotions") input[type="checkbox"]');
    await expect(marketingToggleAfter).toBeChecked();
  });

  test('should display all notification preference descriptions', async ({ page }) => {
    // Check all descriptions are visible
    await expect(page.getByText('Security alerts, password changes, and critical account notifications')).toBeVisible();
    await expect(page.getByText('Reminders about upcoming scheduled games and events')).toBeVisible();
    await expect(page.getByText('Weekly recap of your games, scores, and achievements')).toBeVisible();
    await expect(page.getByText('New features, tips, and special offers from Beak Gaming')).toBeVisible();
  });

  test('should have accessible touch targets (44x44px minimum)', async ({ page }) => {
    // Get all toggle inputs
    const toggles = page.locator('label:has-text("Important Account Updates"), label:has-text("Game Reminders"), label:has-text("Weekly Activity Summary"), label:has-text("Newsletter & Promotions")');

    // Check first toggle has minimum size
    const firstToggle = toggles.first();
    const box = await firstToggle.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should maintain other settings when saving notification preferences', async ({ page }) => {
    // Change facility name
    const facilityInput = page.getByLabel('Facility Name');
    await facilityInput.fill('Updated Test Facility');

    // Change notification preference
    const gameRemindersToggle = page.locator('label:has-text("Game Reminders") input[type="checkbox"]');
    await gameRemindersToggle.click();

    // Save
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 5000 });

    // Reload and verify both saved
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(facilityInput).toHaveValue('Updated Test Facility');
    const gameRemindersToggleAfter = page.locator('label:has-text("Game Reminders") input[type="checkbox"]');
    await expect(gameRemindersToggleAfter).toBeChecked();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to first toggle
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should focus on Important Account Updates toggle
    const emailToggle = page.locator('label:has-text("Important Account Updates") input[type="checkbox"]');
    await expect(emailToggle).toBeFocused();

    // Space to toggle
    await page.keyboard.press('Space');
    await expect(emailToggle).not.toBeChecked();

    // Tab to next toggle
    await page.keyboard.press('Tab');
    const gameRemindersToggle = page.locator('label:has-text("Game Reminders") input[type="checkbox"]');
    await expect(gameRemindersToggle).toBeFocused();

    // Space to toggle
    await page.keyboard.press('Space');
    await expect(gameRemindersToggle).toBeChecked();
  });
});
