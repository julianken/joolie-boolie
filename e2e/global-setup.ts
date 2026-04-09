/**
 * Playwright Global Setup
 * Runs once before all tests to validate test environment.
 *
 * Checks that Bingo and Trivia servers are ready before running tests.
 */

import { waitForServers } from './helpers/wait-for-server';
import { getE2EPortConfig } from './utils/port-config';

async function globalSetup() {
  console.log('[E2E Setup] Initializing test environment...');

  // Health check servers before running tests
  // Port config is shared with playwright.config.ts via e2e/utils/port-config.ts
  const portConfig = getE2EPortConfig();

  console.log('[E2E Setup] Checking server health...');
  console.log(`[E2E Setup]   Source: ${portConfig.source}`);
  console.log(`[E2E Setup]   Bingo:  http://localhost:${portConfig.bingoPort}`);
  console.log(`[E2E Setup]   Trivia: http://localhost:${portConfig.triviaPort}`);

  await waitForServers([
    `http://localhost:${portConfig.bingoPort}`,
    `http://localhost:${portConfig.triviaPort}`,
  ]);

  console.log('[E2E Setup] ✓ All servers ready');
  console.log('[E2E Setup] ✓ Ready to run tests');
}

export default globalSetup;
