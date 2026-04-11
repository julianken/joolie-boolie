import { test, expect } from '@playwright/test';
import { waitForHydration } from '../utils/helpers';

test.describe('Trivia Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
  });

  test('displays the main title @medium', async ({ page }) => {
    // Use role + level to avoid brittle text matching (BEA-701 may rewrite copy).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/trivia/i);
  });

  test('shows description text @medium', async ({ page }) => {
    // Resilient to copy rewrites: accept either the current description or
    // any BEA-701 variant that mentions "trivia" + "groups/communities".
    await expect(
      page.getByText(/trivia system|groups and communities|a modern trivia/i)
    ).toBeVisible();
  });

  test('has a play link that points at the presenter view @high', async ({ page }) => {
    // Home page renders a single primary CTA that links to /play. Match any
    // accessible name ("Play", "Start Trivia", "Play Now", etc.) rather than
    // hard-coding the current label.
    const playLink = page.locator('main a[href="/play"]').first();
    await expect(playLink).toBeVisible();
    await expect(playLink).toHaveAttribute('href', '/play');
  });

  test('navigates to presenter view when play link is clicked @critical', async ({ page }) => {
    await page.locator('main a[href="/play"]').first().click();
    // Standalone mode: /play is public (no middleware redirect).
    await expect(page).toHaveURL(/\/play$/);
  });

  test('has accessible structure @low', async ({ page }) => {
    // Check for main heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);

    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('play link has accessible touch target size @low', async ({ page }) => {
    const playLink = page.locator('main a[href="/play"]').first();
    const box = await playLink.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
