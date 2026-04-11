# Area 4 — Test & Tooling Drift (non-E2E)

## Scope Note

Per the Phase 0 packet, E2E spec drift identified by BEA-697 (plan on branch `chore/BEA-697-e2e-baseline-plan`) is treated as GIVEN and NOT re-reported here. That covers: `waitForHydration` helper, `e2e/bingo/health.spec.ts` orphaned endpoint, trivia `display.spec.ts` timeouts, and test-copy drift in `e2e/bingo/home.spec.ts`. Area 4 focuses on unit tests, test fixtures, mocks, build tooling, lint/turbo/eslint config, and dev scripts.

## Executive Summary

Unit tests and package-level fixtures are largely clean — the `packages/testing/` mock library never contained auth/database/Supabase mocks, and the app-level `vitest.setup.ts` files have no stale global mocks. The two env-validation unit tests correctly assert the standalone "no-op" contract. There is essentially zero unit-test drift.

The real drift sits in CI/dev tooling that was never trimmed when platform-hub was deleted:

1. The nightly workflow still injects 5 removed env vars into `pnpm build` (critical — masks real failures).
2. The E2E workflow runs a Playwright project (`bingo-mobile`) that no longer exists in `playwright.config.ts` (critical — CI will fail).
3. `start-e2e-servers.sh` (tracked in repo root) tries to start `@joolie-boolie/platform-hub` via pnpm filter (high — broken for any user running it).
4. `scripts/create-test-user.sql` is an orphaned Supabase SQL fixture for user creation (medium — dead file).
5. `scripts/tag-e2e-tests.sh` uses the pre-rebrand "Beak Gaming Platform" footer string to tag tests (low — dead tagging script).
6. `e2e/trivia/health.spec.ts` is a direct twin of the `e2e/bingo/health.spec.ts` that BEA-697 already flagged — same root cause, same fix, but not explicitly listed in the BEA-697 plan.
7. Several tooling details referencing the removed third app remain: `package.json` `vercel:link` output says "Apps: bingo, trivia" (fine), but `playwright.config.ts` JSDoc and `port-config.ts` JSDoc still reference "auth fixtures" and "three dev servers" concepts.

---

## Findings

### F1 — Nightly workflow injects removed env vars into build
**Severity:** critical  
**Confidence:** high  
**Evidence:** `/Users/j/repos/beak-gaming-platform/.github/workflows/nightly.yml` lines 84–89

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
  SESSION_TOKEN_SECRET: "0000000000000000000000000000000000000000000000000000000000000000"
  NEXT_PUBLIC_PLATFORM_HUB_URL: http://localhost:3002
  NEXT_PUBLIC_OAUTH_CLIENT_ID: placeholder-oauth-client-id
```

All five variables correspond to removed subsystems (`SUPABASE_*`, `SESSION_TOKEN_SECRET`, `PLATFORM_HUB_URL`, `OAUTH_CLIENT_ID`). The build comment even says "Stub env vars required at build time (not used at runtime)" — but they're no longer required at build time because there is no code that reads them. These dead injections disguise failures: if some residual consumer of these vars exists, local devs would see a broken build while nightly CI passes silently.

**Recommended action:** Delete the entire `env:` block under "Build all apps" step. Run the build locally without them to confirm nothing still reads them (no consumer should exist per standalone conversion).

---

### F2 — E2E workflow runs a non-existent Playwright project
**Severity:** critical  
**Confidence:** high  
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/.github/workflows/e2e.yml` line 152: `--project=bingo-mobile`
- `/Users/j/repos/beak-gaming-platform/playwright.config.ts` lines 90–110 (only `bingo` and `trivia` projects defined)

The `bingo-mobile` project was intentionally removed during standalone conversion (it depended on mobile auth fixtures). The CI job still invokes it. Playwright CLI will emit "No projects matching filter 'bingo-mobile'" and the shard step will either fail or silently skip. Combined with the E2E gate job that requires `e2e.result == success`, this permanently blocks the E2E gate or produces false greens depending on Playwright version behavior.

**Recommended action:** Remove `--project=bingo-mobile` from the `pnpm playwright test` invocation in `.github/workflows/e2e.yml`. The workflow is disabled per project guidance (E2E runs locally pre-commit), but it should still parse correctly for whoever eventually re-enables it.

---

### F3 — `start-e2e-servers.sh` spawns a deleted platform-hub app
**Severity:** high  
**Confidence:** high  
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/start-e2e-servers.sh` lines 31, 43–44, 66
- `/Users/j/repos/beak-gaming-platform/scripts/setup-worktree-e2e.sh` generates a different (correct) version of this file on lines 153–218

```bash
echo "  Hub:    http://localhost:$HUB_PORT"
...
echo "Starting Platform Hub (port $HUB_PORT)..."
PORT=$HUB_PORT pnpm --filter @joolie-boolie/platform-hub dev &
...
check_server "http://localhost:$HUB_PORT" "Hub"
```

The root-level `start-e2e-servers.sh` IS committed to the repo (`git ls-files` returns it) even though `setup-worktree-e2e.sh` lines 238–239 attempt to add it to `.gitignore`. The committed copy is the OLD 3-app version; the regenerated version in `setup-worktree-e2e.sh` (lines 153+) only knows about bingo and trivia. Running the committed version will fail immediately with `pnpm --filter @joolie-boolie/platform-hub dev` returning "No projects matched the filters".

Note that this creates a confusing divergence: the tracked `start-e2e-servers.sh` is 3-app, but `setup-worktree-e2e.sh` generates a 2-app version into the same path. Running the setup script overwrites the committed file.

**Recommended action:** Delete the committed `start-e2e-servers.sh` in repo root (it's meant to be generated, not committed). Add it to `.gitignore` permanently. Alternatively, if it's intentionally tracked as a fallback, rewrite it to match the 2-app version in `setup-worktree-e2e.sh`.

---

### F4 — `scripts/create-test-user.sql` is an orphaned Supabase fixture
**Severity:** medium  
**Confidence:** high  
**Evidence:** `/Users/j/repos/beak-gaming-platform/scripts/create-test-user.sql` (all 20 lines)

```sql
-- Run this in Supabase SQL Editor after creating auth user in dashboard
SELECT id, email FROM auth.users WHERE email = 'test@joolieboolie.com';
INSERT INTO public.profiles (id, facility_name, created_at, updated_at)
...
```

Direct Supabase SQL to create a test user in `auth.users` + `public.profiles`. Neither table exists in the standalone model. This is dead test infrastructure.

**Recommended action:** Delete `scripts/create-test-user.sql`.

---

### F5 — `scripts/tag-e2e-tests.sh` references removed "Beak Gaming Platform" footer
**Severity:** low  
**Confidence:** high  
**Evidence:** `/Users/j/repos/beak-gaming-platform/scripts/tag-e2e-tests.sh` line 35

```bash
add_tag "e2e/bingo/home.spec.ts" "footer mentions Beak Gaming Platform" "@low"
```

The tagger script hard-codes the old pre-rebrand brand string "Beak Gaming Platform" when grepping for tests to tag. The current brand is "Joolie Boolie" (MEMORY.md confirms). Additionally, the test it's looking for in `e2e/bingo/home.spec.ts` line 55 is now `footer mentions Joolie Boolie`, so the sed pattern won't match anything. The script is a one-shot tagger for BEA-313 (already completed) and is likely dead.

**Recommended action:** Either delete `scripts/tag-e2e-tests.sh` (it's a one-shot migration script — BEA-313 is long closed) or update the string to match current test copy. Deletion is preferred.

---

### F6 — `e2e/trivia/health.spec.ts` is BEA-697-equivalent but not in plan
**Severity:** critical  
**Confidence:** high  
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/e2e/trivia/health.spec.ts` lines 4–20 (hits `/api/health` twice)
- BEA-697 plan explicitly covers `e2e/bingo/health.spec.ts` but its scope description in `phase-0-packet.md` line 49 only mentions the bingo file

The trivia health spec calls `/api/health` which was deleted from both apps. Both specs will fail with 404s. BEA-697 likely covers this implicitly (symmetric fix), but the packet lists only the bingo file. Flagging in case it was missed.

**Recommended action:** Confirm BEA-697 plan covers both `e2e/{bingo,trivia}/health.spec.ts`. If only bingo is listed, add trivia to the same fix (delete both, or consolidate).

---

### F7 — `packages/testing` has no `test:run` script but lint-staged maps it
**Severity:** low  
**Confidence:** high  
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/packages/testing/package.json` lines 16–19: only `lint` and `typecheck`
- `/Users/j/repos/beak-gaming-platform/.lintstagedrc.js` lines 13 and 31: maps `packages/testing/` and calls `turbo run test:run --filter=@joolie-boolie/testing...`

When a file under `packages/testing/` is staged, lint-staged runs `turbo run test:run --filter=@joolie-boolie/testing...`. The filter resolves, but the package has no `test:run` task, so turbo silently no-ops. Not broken, but the command does nothing — a developer editing testing mocks gets false confidence ("tests ran") when in reality nothing was verified.

**Recommended action:** Either add a no-op `test:run` alias (e.g. `"test:run": "echo 'no tests'"`) to `packages/testing/package.json`, or remove the `packages/testing/` line from `.lintstagedrc.js` since it has no test suite of its own.

---

### F8 — Stale JSDoc in port-config.ts references removed auth fixtures
**Severity:** low  
**Confidence:** high  
**Evidence:** `/Users/j/repos/beak-gaming-platform/e2e/utils/port-config.ts` lines 7–9

```
 * - playwright.config.ts (project baseURLs, webServer config)
 * - e2e/global-setup.ts (server health checks)
 * - e2e/fixtures/auth.ts (authentication URLs)
```

The comment lists `e2e/fixtures/auth.ts` as a consumer for "authentication URLs", but `e2e/fixtures/auth.ts` no longer does auth (verified — the file exports standalone game fixtures only; see lines 19–21 of that file which explicitly say "No authentication required -- games run in standalone mode"). The JSDoc is misleading for anyone reading the file fresh.

**Recommended action:** Update the JSDoc to just say "e2e/fixtures/auth.ts (game page URLs)" — or rename `e2e/fixtures/auth.ts` to something like `e2e/fixtures/pages.ts` since it no longer has anything to do with authentication. Either fix would remove confusion.

---

### F9 — `packages/types/src/user.ts` orphaned but referenced only by its own barrel
**Severity:** medium (belongs to Area 2, but noted here because it appears in any grep for "User", "Session", "Login")  
**Confidence:** high  
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/packages/types/src/user.ts` lines 14–92 (defines `User`, `UserProfile`, `LoginRequest`, `RegisterRequest`, `AuthResponse`, `UpdateProfileRequest`, `Session`)
- `/Users/j/repos/beak-gaming-platform/packages/types/src/index.ts` lines 41–47 (re-exports them)
- Grep for `(User|Session|LoginRequest|AuthResponse).*from.*@joolie-boolie/types` returns zero consumer hits

Seven auth-specific interfaces are still exported from `@joolie-boolie/types` with zero consumers. Affects test suites because tests might be tempted to import from the barrel. Flagged for Area 2 to fix — listed here for completeness since it was in my grep sweep.

**Recommended action:** Delete `packages/types/src/user.ts` and the corresponding re-exports in `packages/types/src/index.ts`. Defer to Area 2.

---

### F10 — `playwright.config.ts` still sets `E2E_TESTING=true` with Supabase-bypass comment
**Severity:** low  
**Confidence:** medium  
**Evidence:** `/Users/j/repos/beak-gaming-platform/playwright.config.ts` lines 4–6

```ts
// Set E2E testing flag.
// This signals to apps to use E2E bypass mode (local JWT generation, no Supabase).
process.env.E2E_TESTING ??= 'true';
```

The comment describes the purpose as "local JWT generation, no Supabase", which is moot in standalone mode. `E2E_TESTING` is still passed through `turbo.json` globalPassThroughEnv and used in `sentry.server.config.ts` to skip Sentry during tests, so the env var itself is not dead — but the comment is misleading. The flag has shifted purpose from "skip Supabase auth" to "skip Sentry instrumentation".

**Recommended action:** Update the comment to describe current purpose (disable Sentry during E2E runs). Alternatively, evaluate whether the flag is still needed at all now that auth is gone and the only remaining consumer is Sentry config — a dedicated `SENTRY_ENABLED=false` flag would be more honest.

---

## Not Investigated (per scope)

- E2E test spec drift (`home.spec.ts`, `display.spec.ts`, `presenter.spec.ts`, `health.spec.ts`, `waitForHydration` helper) — BEA-697 territory
- Security headers / CSP / cookies — Area 3
- `.github/PULL_REQUEST_TEMPLATE.md` — Area 5
- Non-test application code (stores, hooks, routes) — Area 2
- `apps/bingo-voice-pack-temp/` — not git-tracked, appears to be a local working directory (`BINGO CALLER VOICE PACK`)

## Clean Areas Confirmed

- `packages/testing/src/**` — no auth/database/Supabase mocks, only BroadcastChannel, Audio, Sentry, and OTel mocks. Nothing stale.
- `apps/{bingo,trivia}/src/test/setup.ts` — no global auth mocks. Trivia mocks `next/font/google`; Bingo is minimal.
- Unit test files under `apps/{bingo,trivia}/src/**/__tests__/**` and `packages/*/src/__tests__/**` — grepped for `supabase`, `@joolie-boolie/auth`, `@joolie-boolie/database`, `mockUser`, `fakeUser`, `vi.mock.*auth`, `vi.mock.*database`, `SupabaseClient`, `jose`, `jsonwebtoken`. Zero hits across all unit tests.
- `apps/bingo/src/lib/__tests__/env-validation.test.ts` and `apps/trivia/src/lib/__tests__/env-validation.test.ts` — both correctly assert the standalone no-op contract (bingo is a single no-throw test; trivia warns only on `THE_TRIVIA_API_KEY`).
- `apps/bingo/src/app/__tests__/page.test.tsx` — actively asserts the ABSENCE of login UI (lines 25–35 use `queryByTestId('login-button')` and `queryByRole('link', { name: /play as guest/i })` to confirm they're gone). Good standalone-state assertions.
- `.lintstagedrc.js` — no references to `@joolie-boolie/auth` or `@joolie-boolie/database`; only lists the 10 active packages. Per PR #522 cleanup this is already correct.
- `eslint.config.mjs` (root + `apps/bingo/eslint.config.mjs`) — no ignore patterns referencing removed paths.
- `turbo.json` — tasks reference only generic `^build`/`^build` dependencies; no hard-coded platform-hub filters. `globalPassThroughEnv` and `globalEnv` only list current env vars.
- `pnpm-workspace.yaml` — uses glob `apps/*` and `packages/*`, so removed dirs are auto-ignored.
- Root `package.json` scripts — no `dev:hub`, `build:hub`, `test:hub`, `lighthouse:hub`, `build-for-e2e`, `build:platform-hub`, `test:auth`, or `test:database`. Only `dev:bingo`, `dev:trivia`, `build:bingo`, `build:trivia`, `analyze:bingo`, `analyze:trivia`, `lighthouse:bingo`, `lighthouse:trivia`, and `test:e2e:bingo` / `test:e2e:trivia`. Clean.
- `.husky/pre-commit` — single line invoking lint-staged. Nothing auth-specific.
- Both app-level vitest configs — identical shape, no stale setup, no stale coverage thresholds referencing removed files.
- `scripts/e2e-with-build.sh` — only knows about bingo (port 3000) and trivia (port 3001). No platform-hub.
- `scripts/setup-worktree-e2e.sh` — only generates bingo + trivia port config. No platform-hub. This script is the canonical 2-app generator; the tracked `start-e2e-servers.sh` diverges from it (F3).

## Grep Coverage Summary

| Pattern | Files scanned | Hits in test/tooling |
|---|---|---|
| `@joolie-boolie/auth\|@joolie-boolie/database\|@beak-gaming/` | all .ts/.tsx | 0 |
| `supabase\|Supabase` | all .ts/.tsx/.js/.mjs/.json/.yaml/.yml/.sh | 1 real (nightly.yml F1) + 1 false-positive (error-tracking auto-categorization) |
| `platform-hub` | all .ts/.tsx/.js/.mjs/.json/.yaml/.yml/.sh | 1 real (start-e2e-servers.sh F3) + 1 dead (nightly.yml F1) |
| `jose\|jsonwebtoken\|SupabaseClient\|createClient.*supabase` | all .ts/.tsx/.js/.mjs/.json | 0 |
| `vi\.mock.*auth\|vi\.mock.*database\|vi\.mock.*supabase\|mockSupabase\|mockUser\|fakeUser` | all .ts/.tsx | 0 |
| `SUPABASE\|OAUTH_\|SESSION_TOKEN_SECRET\|PLATFORM_HUB\|COOKIE_DOMAIN\|JWT_SECRET` | all .ts/.tsx/.js/.mjs/.yml/.yaml/.sh/.json | 1 real (nightly.yml F1) + 1 legitimate (E2E_JWT_SECRET in setup-worktree-e2e.sh, documented but unused) |
| `bingo-mobile` | all source | 1 real (e2e.yml F2) + historical docs |

## Severity Distribution

- **critical:** 3 (F1 CI-silent build, F2 CI-broken E2E gate, F6 missing BEA-697 coverage for trivia health spec)
- **high:** 1 (F3 broken root-level start script)
- **medium:** 2 (F4 dead SQL fixture, F9 orphaned auth types — defers to Area 2)
- **low:** 4 (F5 dead tag script, F7 lint-staged no-op, F8 misleading JSDoc, F10 misleading E2E_TESTING comment)

Total: 10 findings across test and tooling surfaces.
