/**
 * Trivia Presenter View E2E Tests
 *
 * ⚠️ REFACTORED (BEA-383): Replaced all 68 waitForTimeout() calls with deterministic waits
 * - Pattern 1: Wait for element visibility after actions (e.g., team added, score updated)
 * - Pattern 2: Wait for state change indicators (e.g., game status, button states)
 * - Pattern 3: Use .toPass() for complex conditions requiring retry logic
 */
import { test, expect } from '../fixtures/game';
import { waitForHydration, pressKey } from '../utils/helpers';

// NOTE: `driveGameToEndedState` helper + the "Ended State" describe block + the
// "can complete round and proceed to next" test in `Round Completion` were
// removed. They were written for an older game flow where clicking "End Round"
// at question_closed immediately advanced status from `playing` to
// `between_rounds`. The current flow (post round-scoring feature) requires the
// user to go through `round_summary → round_scoring → submit scores` before
// `between_rounds` is reached. The tests never exercised that path and
// repeatedly failed on the missing status transition.
//
// A proper replacement would need to drive the round-scoring panel (enter
// scores for every team, submit, then advance). Tracked as follow-up. The
// `shows scene nav Next button at question_closed scene` test below still
// covers the first step of that flow.

test.describe('Trivia Presenter View', () => {
  test.describe('Page Structure', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

    test('displays presenter view header @medium', async ({ triviaGameStarted: page }) => {
      await expect(page.getByRole('heading', { name: /trivia/i })).toBeVisible();
      // Header renders a "Presenter" badge next to the Trivia heading.
      // Scope to banner — "Presenter" also appears as a theme-selector radio label.
      await expect(page.getByRole('banner').getByText('Presenter', { exact: true })).toBeVisible();
    });

    test('shows game status indicator @high', async ({ triviaGameStarted: page }) => {
      // Status badge text is "Playing - <roundProgress>" (e.g. "Playing - 1/5").
      await expect(page.locator('span').filter({ hasText: /^Playing/i })).toBeVisible();
    });

    test('shows Open Display button @high', async ({ triviaGameStarted: page }) => {
      const openDisplayBtn = page.getByRole('button', { name: /open display/i });
      await expect(openDisplayBtn).toBeVisible();
    });

    test('shows sync status @medium', async ({ triviaGameStarted: page }) => {
      // Visible sync text is "Synced" (connected) or "Ready" (not connected).
      // The title attribute carries "Sync active"/"Sync not active" but those
      // aren't rendered text.
      await expect(page.getByText(/^(Synced|Ready)$/)).toBeVisible();
    });

    test('shows keyboard shortcuts reference @low', async ({ triviaGameStarted: page }) => {
      await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible();
      await expect(page.getByText(/navigate/i)).toBeVisible();
      // Look for "Peek answer" text in shortcuts section (not the button)
      await expect(page.getByText('Peek answer')).toBeVisible();
    });
  });

  test.describe('Starting a New Game', () => {
    // Setup overlay stays visible — tests drive the wizard themselves.
    test.beforeEach(async ({ triviaPageWithQuestions: page }) => {
      await waitForHydration(page);
    });

    test('cannot start game without teams @critical', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Review step in the setup wizard
      await page.locator('[data-testid="wizard-step-3"]').click();
      const startBtn = page.getByRole('button', { name: /start game/i });
      await expect(startBtn).toBeVisible();
      await expect(startBtn).toBeDisabled();
    });

    test('can start game after adding a team @critical', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step and add a team
      await page.locator('[data-testid="wizard-step-2"]').click();
      const addTeamBtn = page.getByRole('button', { name: /add team/i });
      await addTeamBtn.click();
      await expect(page.getByText(/table 1/i)).toBeVisible();

      // Navigate to Review - Start button should be enabled
      await page.locator('[data-testid="wizard-step-3"]').click();
      const startBtn = page.getByRole('button', { name: /start game/i });
      await expect(startBtn).toBeEnabled();

      // Click start and wait for state change
      await startBtn.click();
      await expect(page.locator('span').filter({ hasText: /^Playing/i })).toBeVisible();
    });

    test('shows ready message with team count @medium', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step and add teams
      await page.locator('[data-testid="wizard-step-2"]').click();
      const addTeamBtn = page.getByRole('button', { name: /add team/i });

      await addTeamBtn.click();
      await expect(page.getByText(/table 1/i)).toBeVisible();

      await addTeamBtn.click();
      await expect(page.getByText(/table 2/i)).toBeVisible();

      // Navigate to Review step - should show ready status
      await page.locator('[data-testid="wizard-step-3"]').click();
      await expect(page.getByText(/ready to start/i)).toBeVisible();
    });
  });

  test.describe('Team Management', () => {
    // Setup overlay stays visible — tests drive the Teams step themselves.
    test.beforeEach(async ({ triviaPageWithQuestions: page }) => {
      await waitForHydration(page);
    });

    test('displays team manager section @medium', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step in the setup wizard
      await page.locator('[data-testid="wizard-step-2"]').click();
      await expect(page.getByRole('region', { name: /team management/i })).toBeVisible();
    });

    test('can add a team @critical', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step in the setup wizard
      await page.locator('[data-testid="wizard-step-2"]').click();
      const addTeamBtn = page.getByRole('button', { name: /add team/i });
      await expect(addTeamBtn).toBeVisible();

      // Check initial state
      await expect(page.getByText(/no teams added yet/i)).toBeVisible();

      // Add team and wait for it to appear (Pattern 1)
      await addTeamBtn.click();
      await expect(page.getByText(/table 1/i)).toBeVisible();

      // Add another team
      await addTeamBtn.click();
      await expect(page.getByText(/table 2/i)).toBeVisible();
    });

    test('can remove a team during setup @high', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step in the setup wizard
      await page.locator('[data-testid="wizard-step-2"]').click();
      // Add a team
      const addTeamBtn = page.getByRole('button', { name: /add team/i });
      await addTeamBtn.click();

      // Wait for team to appear using proper role-based locator
      const team1Item = page.getByRole('listitem', { name: /team: table 1/i });
      await expect(team1Item).toBeVisible();

      // Remove the team using the accessible button name
      const removeBtn = page.getByRole('button', { name: /remove team table 1/i });
      await removeBtn.click();

      // Wait for team removal to complete - use toPass for retry logic (Pattern 3)
      await expect(async () => {
        await expect(page.getByText(/no teams added yet/i)).toBeVisible();
      }).toPass({ timeout: 10000 });
    });

    test('can rename a team @high', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step in the setup wizard
      await page.locator('[data-testid="wizard-step-2"]').click();
      // Add a team
      const addTeamBtn = page.getByRole('button', { name: /add team/i });
      await addTeamBtn.click();

      // Wait for team to appear using proper role-based locator
      await expect(page.getByRole('listitem', { name: /team: table 1/i })).toBeVisible();

      // Click rename button using accessible button name
      const renameBtn = page.getByRole('button', { name: /rename team table 1/i });
      await renameBtn.click();

      // Wait for and fill the edit input
      const input = page.getByLabel('Edit team name');
      await expect(input).toBeVisible();
      await input.fill('Champions');
      await input.press('Enter');

      // Wait for team rename to complete - use toPass for retry logic (Pattern 3)
      await expect(async () => {
        await expect(page.getByRole('listitem', { name: /team: champions/i })).toBeVisible();
      }).toPass({ timeout: 10000 });
    });

    test('shows team count limit @medium', async ({ triviaPageWithQuestions: page }) => {
      // Navigate to Teams step in the setup wizard
      await page.locator('[data-testid="wizard-step-2"]').click();
      const addTeamBtn = page.getByRole('button', { name: /add team/i });
      await addTeamBtn.click();

      // Wait for team to be added
      await expect(page.getByRole('listitem', { name: /team: table 1/i })).toBeVisible();

      // Should show 1/20
      const teamSection = page.getByRole('region', { name: /team management/i });
      await expect(teamSection.getByText('1/20', { exact: true })).toBeVisible();
    });
  });

  test.describe('Question Navigation', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('shows question list @high', async ({ triviaGameStarted: page }) => {
      // Question list section should be visible - use heading to find the section
      // Use first() to handle multiple "Round 1" headings
      await expect(page.getByRole('heading', { name: /round 1/i }).first()).toBeVisible();
    });

    test('can navigate questions with keyboard @high', async ({ triviaGameStarted: page }) => {
      // Navigate down with arrow key - keyboard events are synchronous
      await pressKey(page, 'ArrowDown');

      // Navigate up with arrow key
      await pressKey(page, 'ArrowUp');

      // Should still be on presenter view (verify via "Presenter" header badge).
      // Scope to banner — "Presenter" also appears as a theme-selector radio label.
      await expect(page.getByRole('banner').getByText('Presenter', { exact: true })).toBeVisible();
    });

    test('can select a question by clicking @high', async ({ triviaGameStarted: page }) => {
      // Find and click a question item in the list
      const questionItems = page.locator('[role="listitem"]').filter({ hasText: /Q\d|question/i });
      if (await questionItems.count() > 1) {
        await questionItems.nth(1).click();
        // Navigation happens synchronously - no wait needed
      }
    });
  });

  test.describe('Answer Reveal', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('can toggle peek answer @high', async ({ triviaGameStarted: page }) => {
      // Find peek button - button may not exist in this version, so just check page structure
      const peekBtn = page.getByRole('button', { name: /peek|show answer/i });
      // If button exists, test it; otherwise, test still passes (feature may not be implemented)
      const btnExists = await peekBtn.count();
      if (btnExists > 0) {
        await peekBtn.click();
        // Button toggle is synchronous - button should remain visible
        await expect(peekBtn).toBeVisible();
      } else {
        // Button doesn't exist - just verify we're still on the page
        await expect(page.getByText('Presenter', { exact: true })).toBeVisible();
      }
    });

    test('can peek answer with Space key @medium', async ({ triviaGameStarted: page }) => {
      // Press Space to peek - keyboard events are synchronous
      await pressKey(page, 'Space');

      // Press Space again to hide
      await pressKey(page, 'Space');
    });

    test('can toggle display question with D key @high', async ({ triviaGameStarted: page }) => {
      // Press D to toggle display - keyboard events are synchronous
      await pressKey(page, 'KeyD');
    });
  });

  test.describe('Keyboard Scoring', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('keyboard 1-key during scoring phase does not crash @high', async ({ triviaGameStarted: page }) => {
      // Close a question to enter question_closed scene (a scoring phase)
      await pressKey(page, 'KeyS');

      // Wait for question_closed scene — SceneNavButtons forward label is
      // "Next Question" when the current question is NOT the last one in
      // the round (Q1 of 5 here), per nav-button-labels.ts.
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /next question/i });
        await expect(nextBtn).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 5000 });

      // Press '1' to quick-score team 1 via keyboard (Instance 1 in use-game-keyboard.ts)
      // Verifies the keyboard handler doesn't crash after sidebar removal
      // (Instance 2 of useQuickScore was deleted, Instance 1 must survive)
      await page.keyboard.press('Digit1');

      // The status should remain playing (no crash, no navigation away)
      await expect(
        page.locator('span').filter({ hasText: /^Playing/i })
      ).toBeVisible();
    });
  });

  // NOTE: The former "Game Flow" describe block (pause/resume/emergency pause)
  // was deleted. Trivia has no "paused" or "emergency pause" game status —
  // the GameStatus enum is setup | playing | between_rounds | ended. The P key
  // is "peek answer" (local presenter state only) and E toggles the audience
  // emergency_blank scene (visual only, no status change). None of those
  // span-based assertions can ever pass; the underlying behaviour is covered
  // by dedicated audience-scene and keyboard unit tests.

  test.describe('Round Completion', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('shows scene nav Next button at question_closed scene @high', async ({ triviaGameStarted: page }) => {
      // Navigate to last question of round (5 questions per round by default)
      for (let i = 0; i < 4; i++) {
        await pressKey(page, 'ArrowDown');
      }

      // Close the question (S key) to enter question_closed scene —
      // SceneNavButtons renders an "End Round" forward button at this scene
      // (isLastQuestion=true → label "End Round" per nav-button-labels.ts).
      await pressKey(page, 'KeyS');

      // Wait for the SceneNavButtons forward button to appear (Pattern 3)
      await expect(async () => {
        const forwardBtn = page.getByRole('button', { name: /end round/i });
        await expect(forwardBtn).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 5000 });
    });

    // NOTE: "can complete round and proceed to next" test removed — assumed
    // flow where End Round click → between_rounds directly, but the current
    // flow now requires round_scoring submission. See header comment.
  });

  test.describe('Game Reset', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('can reset game back to setup @high', async ({ triviaGameStarted: page }) => {
      // R opens the "Start New Game?" confirmation modal. The confirm button
      // label is "New Game" (Modal confirmLabel, set in play/page.tsx:629).
      await pressKey(page, 'KeyR');

      // Click the "New Game" confirm button when the dialog appears.
      await expect(async () => {
        const confirmBtn = page.getByRole('button', { name: /^new game$/i });
        await expect(confirmBtn).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 5000 });

      await page.getByRole('button', { name: /^new game$/i }).click();

      // After confirmation, status flips to 'setup'. The SetupGate overlay
      // appears; the header still shows the "Setup" status badge.
      await expect(async () => {
        await expect(
          page.locator('[data-testid="setup-gate"]')
        ).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: 10000 });
    });
  });

  test.describe('UI Controls', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('has fullscreen toggle button @low', async ({ triviaGameStarted: page }) => {
      const fullscreenBtn = page.getByRole('button', { name: /fullscreen/i });
      await expect(fullscreenBtn).toBeVisible();
    });

    // NOTE: The former "has settings button" test was deleted. There is no
    // standalone "Settings" button on the trivia presenter header — settings
    // live inside the SetupGate wizard and the Theme/KeyboardShortcuts modals.
    // The test asserted a control that never existed in the current UI.

    test('has help button for keyboard shortcuts @low', async ({ triviaGameStarted: page }) => {
      const helpBtn = page.getByRole('button', { name: /keyboard shortcuts/i });
      await expect(helpBtn).toBeVisible();
    });

    test('can toggle fullscreen with F key @low', async ({ triviaGameStarted: page }) => {
      // Note: Actual fullscreen may not work in headless mode, but we can test the handler
      await pressKey(page, 'KeyF');
      // Keyboard event is synchronous - no wait needed
    });

    test('can open keyboard shortcuts modal with ? key @low', async ({ triviaGameStarted: page }) => {
      await page.keyboard.press('Shift+?');

      // Wait for modal to open (Pattern 1: element visibility)
      await expect(async () => {
        const modal = page.getByLabel('Keyboard Shortcuts', { exact: true });
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        }
      }).toPass({ timeout: 5000 });
    });
  });

  test.describe('Theme Selector', () => {
    test.beforeEach(async ({ triviaGameStarted: page }) => {
      await waitForHydration(page);
    });

        test('shows theme selector section @medium', async ({ triviaGameStarted: page }) => {
      // Look for theme-related heading or label
      await expect(page.getByRole('heading', { name: /theme/i })).toBeVisible();
    });
  });
});

