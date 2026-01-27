import { test, expect } from '../fixtures/auth';

const mockBingoTemplates = [
  {
    id: 'bingo-template-1',
    name: 'Friday Night Bingo',
    game_type: 'bingo',
    settings: { pattern: 'X', speed: 'medium' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'bingo-template-2',
    name: 'Sunday Social Bingo',
    game_type: 'bingo',
    settings: { pattern: 'blackout', speed: 'slow' },
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const mockTriviaTemplates = [
  {
    id: 'trivia-template-1',
    name: 'Movie Trivia Night',
    game_type: 'trivia',
    settings: { category: 'movies', difficulty: 'medium' },
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

async function setupTemplateMocks(
  page: import('@playwright/test').Page,
  options: {
    bingoTemplates?: typeof mockBingoTemplates;
    triviaTemplates?: typeof mockTriviaTemplates;
    bingoError?: boolean;
    triviaError?: boolean;
  } = {}
) {
  const {
    bingoTemplates = mockBingoTemplates,
    triviaTemplates = mockTriviaTemplates,
    bingoError = false,
    triviaError = false,
  } = options;

  await page.route('**/api/templates**', async (route) => {
    const allTemplates = [
      ...(bingoError ? [] : bingoTemplates),
      ...(triviaError ? [] : triviaTemplates),
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        templates: allTemplates,
        errors: [
          ...(bingoError ? ['Failed to fetch Bingo templates'] : []),
          ...(triviaError ? ['Failed to fetch Trivia templates'] : []),
        ],
      }),
    });
  });
}

test.describe('@critical Platform Hub Templates', () => {
  test.describe('Template List Display', () => {

    test('templates page renders @critical', async ({ authenticatedPage }) => {
      await setupTemplateMocks(authenticatedPage);
      await authenticatedPage.goto('/dashboard/templates');
      await expect(authenticatedPage.locator('h1').first()).toContainText('Templates');
      await expect(authenticatedPage.getByText('Friday Night Bingo')).toBeVisible();
      await expect(authenticatedPage.getByText('Movie Trivia Night')).toBeVisible();
    });

    test('filter tabs show counts @high', async ({ authenticatedPage }) => {
      await setupTemplateMocks(authenticatedPage);
      await authenticatedPage.goto('/dashboard/templates');
      await expect(authenticatedPage.getByText('Friday Night Bingo')).toBeVisible();
      await expect(authenticatedPage.getByRole('tab', { name: /all/i })).toContainText('3');
      await expect(authenticatedPage.getByRole('tab', { name: /bingo/i })).toContainText('2');
    });

    test('Bingo filter works @high', async ({ authenticatedPage }) => {
      await setupTemplateMocks(authenticatedPage);
      await authenticatedPage.goto('/dashboard/templates');
      await expect(authenticatedPage.getByText('Friday Night Bingo')).toBeVisible();
      await authenticatedPage.getByRole('tab', { name: /bingo/i }).click();
      await expect(authenticatedPage.getByText('Friday Night Bingo')).toBeVisible();
      await expect(authenticatedPage.getByText('Movie Trivia Night')).not.toBeVisible();
    });

    test('empty state shows @medium', async ({ authenticatedPage }) => {
      await setupTemplateMocks(authenticatedPage, { bingoTemplates: [], triviaTemplates: [] });
      await authenticatedPage.goto('/dashboard/templates');
      await expect(authenticatedPage.getByText(/no templates/i)).toBeVisible();
    });
  });

  test.describe('Template Card', () => {
    test('Delete shows dialog @critical', async ({ authenticatedPage }) => {
      await setupTemplateMocks(authenticatedPage);
      await authenticatedPage.goto('/dashboard/templates');
      await expect(authenticatedPage.getByText('Friday Night Bingo')).toBeVisible();
      const card = authenticatedPage.locator('[data-testid="template-card"]').filter({ hasText: 'Friday Night Bingo' });
      await card.getByRole('button', { name: /delete/i }).click();
      await expect(authenticatedPage.getByRole('dialog')).toBeVisible();
    });

    test('Cancel dismisses dialog @high', async ({ authenticatedPage }) => {
      await setupTemplateMocks(authenticatedPage);
      await authenticatedPage.goto('/dashboard/templates');
      await expect(authenticatedPage.getByText('Friday Night Bingo')).toBeVisible();
      const card = authenticatedPage.locator('[data-testid="template-card"]').filter({ hasText: 'Friday Night Bingo' });
      await card.getByRole('button', { name: /delete/i }).click();
      await authenticatedPage.getByRole('button', { name: /cancel/i }).click();
      await expect(authenticatedPage.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Auth', () => {
    test('unauthenticated redirects @critical', async ({ page }) => {
      await page.goto('/dashboard/templates');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });
});
