# Investigation: Area 5 — Documentation & Developer Onboarding

## Summary

The documentation layer has substantial drift from the standalone reality. The highest-priority problem is `docs/MANUAL_TEST_PLAN.md`, which is an entirely Platform Hub-era document — a full Section 1 covering Hub login/OAuth/SSO, a Section 4 covering OAuth SSO cross-app flows, a Section 7.3 covering Hub mobile layout, and a "Automated E2E Coverage Reference" section claiming ~137 Platform Hub E2E tests. A developer following this manual test plan would spend time navigating to `localhost:3002` (which no longer exists) and testing OAuth flows that are entirely gone.

The second major category is structural: `docs/APP_STRUCTURE.md` is entirely the old architecture. It describes a Game App template that includes `app/api/auth/`, `app/auth/callback/`, `lib/auth/`, `middleware.ts` with "OAuth JWT verification", and a full Platform Hub section — none of which exist anymore. `docs/MIDDLEWARE_PATTERNS.md` documents JWKS lazy-initialization patterns and explicitly lists both `apps/bingo/src/middleware.ts` and `apps/trivia/src/middleware.ts` as "files using this pattern" — both of which were deleted in BEA-696.

Three ADRs describe the old auth architecture as if still operative: ADR-001 references port 3002 for Platform Hub, ADR-002 is entirely about synthetic JWT auth via Platform Hub, and ADR-007 references Supabase as a concern. The ADR README lists ADR-002 without any superseded annotation.

The `docs/E2E_TESTING_GUIDE.md` describes `E2E_JWT_SECRET` as a required env var and references `fixtures/auth` as an authentication fixture — but the actual `e2e/fixtures/auth.ts` was already updated and explicitly states "No authentication required -- games run in standalone mode." The guide hasn't caught up.

`packages/testing/README.md` prominently markets Supabase mocks as a feature and exports `createMockSupabaseClient`. `packages/types/README.md` and `packages/types/src/user.ts` contain full auth type definitions (`LoginRequest`, `RegisterRequest`, `AuthResponse`, `Session`) with JSDoc saying "UUID from Supabase Auth". `CONTRIBUTING.md` contains a "BFF Pattern" section that says "Frontend never talks directly to Supabase: Frontend → API Routes → Supabase."

`apps/bingo/CLAUDE.md` has a stale Project Overview that calls the app "cloud-based" and mentions "admin accounts for saved configurations."

---

## Key Findings (grouped by file)

### docs/MANUAL_TEST_PLAN.md — CRITICAL

This document describes a 3-app world throughout. It is not merely stale in places; Section 1 is entirely about the removed Platform Hub and has no current equivalent.

- **Line 15**: Quick Reference table lists "Section 1 = Platform Hub" — a section about an app that no longer exists
- **Line 29**: Prerequisites says `pnpm dev` starts "all 3 apps"
- **Line 38**: Port table lists Platform Hub at `localhost:3002`
- **Lines 52–56**: Authentication prerequisites instruct use of Supabase MCP and Platform Hub login page
- **Lines 104**: Bugs table includes "Platform Hub: Profile API returns 500" as a fixed bug
- **Lines 108–116**: Notes section references E2E fixture data, security headers "on all 3 apps", and template API returning E2E fixture data
- **Lines 119–189**: Entire **Section 1 (7 stories)** covers Platform Hub: home page, login, signup, password reset, OAuth consent, dashboard, API health — all testing `localhost:3002` endpoints that don't exist
- **Line 200**: Story 2.1 test 1 expects "Sign in with Joolie Boolie" button AND "Play as Guest" link on the Bingo home page
- **Line 201**: Story 2.1 test 2 expects OAuth redirect to Hub login
- **Line 332**: Story 2.11 test 9 expects OAuth flow with `NEXT_PUBLIC_OAUTH_AUTHORIZE_URL` env var
- **Lines 340–349**: Story 3.1 has auth-flow tests expecting redirect to `localhost:3002`
- **Lines 352–366**: Story 3.2 describes "Room Setup" with "Create New Game Room" and "Join Existing Game" UI options that no longer exist
- **Lines 604–644**: **Section 4 (Stories 4.1–4.4)** covers OAuth SSO, Hub security headers, fake refresh token rejection, and template aggregation API — all dependent on removed infrastructure
- **Line 706**: Story 7.1 test 3 tests Hub mobile layout at `localhost:3002`
- **Lines 719–752**: "Automated E2E Coverage Reference" section claims ~137 Platform Hub E2E tests, ~88 Bingo E2E tests including "Auth flow (SSO redirect, token handling)", and ~113 Trivia E2E tests including "Auth flow"

**Severity: critical** — A developer following this plan would spend most of Section 1 and Section 4 (roughly 35% of the document) testing things that no longer exist, and would fail on "Sign in with Joolie Boolie" button in Section 2.1.

### docs/APP_STRUCTURE.md — CRITICAL

The entire document describes the old architecture.

- **Lines 10–31**: Game App Layout tree includes `api/auth/`, `api/templates/`, `api/sessions/`, `auth/callback/`, `lib/auth/`, `lib/session/`, and `middleware.ts` described as "OAuth JWT verification (lazy JWKS init)" — none of these exist in either app
- **Lines 33–56**: Trivia-specific additions include `app/api/presets/`, `app/api/question-sets/` and "15 scenes" (now 16 per the app CLAUDE.md)
- **Lines 49–55**: Bingo-specific additions include `app/api/sessions/[roomCode]/verify-pin/` and `app/api/sessions/room/[roomCode]/` — session management API routes that were removed
- **Lines 58–95**: Full **Platform Hub Layout** section — describes an app that no longer exists, with 60+ lines of directory structure covering `api/auth/`, `api/oauth/`, `lib/supabase/`, OAuth consent pages, auth forms, etc.
- **Lines 97–105**: "Key Differences" comparison table lists Platform Hub as a third column and describes "Auth role: OAuth server (issues tokens)"

**Severity: critical** — A developer using this as a reference for where to find files would look in directories that don't exist (`lib/auth/`, `lib/session/`, `middleware.ts`) and assume the apps have an auth layer.

### docs/MIDDLEWARE_PATTERNS.md — HIGH

- **Lines 10–30**: The "Anti-Pattern" example shows JWKS fetch from Supabase, which is now not just an anti-pattern but completely irrelevant to the current apps
- **Lines 32–50**: The "Correct Pattern" shows OAuth JWT middleware with JWKS — also now irrelevant
- **Lines 60–63**: "Files Using This Pattern" section lists `apps/bingo/src/middleware.ts` and `apps/trivia/src/middleware.ts` — both were **deleted in BEA-696** (`25cdc983`)
- **Line 63**: "Note: Platform Hub uses a different middleware architecture..." — references a removed app

**Severity: high** — Points developers to files that don't exist, in a pattern context that no longer applies to either app.

### docs/E2E_TESTING_GUIDE.md — HIGH

- **Lines 17–36**: `E2E_JWT_SECRET` is described as required "when `E2E_TESTING=true`" with guards that throw at startup if not set. In the standalone world, `E2E_TESTING` mode and `E2E_JWT_SECRET` are no longer needed (no middleware to bypass). The actual `e2e/fixtures/auth.ts` already correctly states "No authentication required -- games run in standalone mode."
- **Lines 157–192**: "Quick Reference for Test Authors" section instructs importing from `fixtures/auth` and says pages are "already authenticated" — the fixture name implies auth but the fixture now just navigates to `/play`. Calling it `authenticatedBingoPage` is a naming drift artifact that this guide compounds.
- **Lines 159–167**: Code samples import from `fixtures/auth` and use `authenticatedBingoPage`/`authenticatedTriviaPage` names — misleading names that the guide reinforces without explaining they no longer involve actual auth
- **Lines 180–192**: "What the Auth Fixture Does" section item 3 says "Retries up to 3x on rate limit errors (exponential backoff)" — this was for Supabase rate limits, no longer applicable
- **Lines 430–444**: Test template still uses `authenticatedBingoPage` fixture with no explanation that "authenticated" is now a misnomer

**Severity: high** — A developer writing a new test would think they need to set up `E2E_JWT_SECRET` and that something like "authentication" is happening before the test.

### docs/adr/ADR-002-synthetic-jwt-auth-e2e.md — HIGH

This entire ADR documents an approach that no longer exists.

- **Line 9**: "E2E tests require authenticated user sessions. The production auth flow requires a real Supabase user account, OAuth 2.1 login via Platform Hub, and HS256 JWTs in cookies."
- **Lines 19–44**: Describes Platform Hub login route, `packages/auth/src/game-middleware.ts`, bingo/trivia middleware production guards — all deleted
- **Line 44**: Lists `e2e/fixtures/auth.ts` as "login via Platform Hub issuing synthetic JWT" — the fixture's own docstring now contradicts this

**Status shows "Accepted"** with no superseded/obsolete marker.

**Severity: high** — A developer reading this ADR as context for E2E infrastructure would conclude auth JWTs and Platform Hub are still operative.

### docs/adr/ADR-001-e2e-hash-port-isolation.md — MEDIUM

- **Line 11**: "The original E2E configuration hardcoded ports 3000 (Bingo), 3001 (Trivia), and **3002 (Platform Hub)**." The port isolation formula itself (line 24–26) still uses `portOffset * 3` and "3002 + portOffset" — the third port slot is vestigial.

**Severity: medium** — Mostly historical context, but port formula documents a 3-app design that now has 2 apps.

### docs/adr/ADR-007-docker-isolation-rejected.md — LOW

- **Line 9**: References "per-worktree containers for all three Next.js apps"
- **Line 21**: "three Next.js dev servers plus ~2GB for a local Supabase stack"
- **Line 25**: "E2E tests use `E2E_TESTING=true` to bypass Supabase for auth (ADR-002)"

**Severity: low** — This is a rejected ADR (historical), but the Supabase/ADR-002 cross-references could mislead.

### docs/adr/README.md — MEDIUM

- **Line 8**: Lists ADR-002 "Synthetic JWT Auth for E2E" with status "Accepted" — should be "Superseded" or "Obsolete"

**Severity: medium** — The ADR index is the first thing a developer would check; showing ADR-002 as "Accepted" implies the pattern is still in use.

### CONTRIBUTING.md — HIGH

- **Lines 243–248**: "BFF Pattern" section says "Apps use the Backend-for-Frontend pattern. Frontend never talks directly to Supabase: `Frontend → API Routes → Supabase`" — the current architecture has no Supabase at all; API routes are only for CSP reports, monitoring tunnels, and trivia-api proxy.

**Severity: high** — This is in the primary contribution guide. Any developer reading the architecture guidelines would think there's a Supabase backend.

### apps/bingo/CLAUDE.md — MEDIUM

- **Lines 7–8**: Project Overview says "A **cloud-based**, web-accessible Bingo system... provides **admin accounts for saved configurations**." Both claims are wrong: the app is explicitly not cloud-based (localStorage only), and there are no admin accounts (no auth at all).

**Severity: medium** — Description in the AI-assistant context file directly contradicts the architecture. An agent given this context would be confused about whether auth/accounts exist.

### packages/testing/README.md — MEDIUM

- **Lines 3**: Status line says the package "Provides mock implementations for BroadcastChannel, Audio, and **Supabase**"
- **Lines 43–44**: Features list includes "Supabase Mock — Client and auth mocking utilities"
- **Lines 110–146**: Full "Supabase Mock" usage section with `createMockSupabaseClient`, `createMockUser`, `createMockSession`, and `mockClient.__helpers.simulateAuthChange('SIGNED_IN', ...)` — documenting a mock that still exists in the package's source but has zero active consumers
- **Line 279**: Future Additions list "Supabase mock helpers"

**Severity: medium** — `createMockSupabaseClient` is still exported from the package (the code itself is Area 2's problem), but the README actively markets it as a feature and provides usage examples. This misleads developers into thinking Supabase is testable/mockable in the current test suite.

### packages/types/README.md — MEDIUM

- **Lines 117–138**: "User and Session Types" quick-start example shows `User`, `UserProfile`, `Session`, `LoginRequest`, `RegisterRequest` — auth primitives with no consumers
- **Line 254**: API Reference says `id: string; // UUID from Supabase Auth`
- **Line 589**: Design Philosophy section says "ISO 8601 timestamps... for consistency with **Supabase** and JavaScript Date APIs"
- **Line 613**: Related Documentation links use a stale absolute path (`/Users/j/repos/joolie-boolie-platform/packages/sync/README.md`) — wrong repo path

**Severity: medium** — The README documents and promotes auth types as part of the package's value proposition; the word "Supabase" appears in the API reference for `User.id`.

### packages/types/src/user.ts — MEDIUM (code docstring)

- **Line 15**: `/** Unique identifier (UUID) from Supabase Auth */` on the `id` field of `User`

**Severity: medium** — JSDoc comment is misleading about the source of the ID. No Supabase Auth exists.

### docs/MANUAL_TEST_PLAN.md — MANUAL TEST PREREQS (Critical sub-finding)

- **Line 32**: "pnpm dev — Starts all 3 apps with real auth" — `pnpm dev` only starts 2 apps now, and there is no "real auth"

---

## Root Docs Audit

| File | Status | Issues |
|------|--------|--------|
| `README.md` | Clean | No stale auth/platform-hub references. Accurately describes 2-app standalone architecture. |
| `CLAUDE.md` | Clean | Correctly describes env vars, commands, standalone architecture. No auth drift. |
| `CONTRIBUTING.md` | **Stale** | Line 244–248: "BFF Pattern" section describes Supabase backend. **Severity: high** |
| `.github/PULL_REQUEST_TEMPLATE.md` | Clean | No stale references. |
| `.github/ISSUE_TEMPLATE/*` | N/A | Does not exist. |
| `.github/CODEOWNERS` | N/A | Does not exist. |

## App Docs Audit

| File | Status | Issues |
|------|--------|--------|
| `apps/bingo/CLAUDE.md` | **Stale** | Lines 7–8: "cloud-based", "admin accounts for saved configurations". **Severity: medium** |
| `apps/trivia/CLAUDE.md` | Clean | No stale references found. Correctly says "Standalone: No backend or auth." |
| `apps/bingo/README.md` | Clean | Explicitly states "No auth or database env vars are needed." |
| `apps/trivia/README.md` | Clean | Explicitly states "No auth or database env vars are needed." |

## Package Docs Audit

| File | Status | Issues |
|------|--------|--------|
| `packages/sync/README.md` | Clean | No auth/platform-hub references. |
| `packages/testing/README.md` | **Stale** | Supabase mock prominently marketed; full usage examples. **Severity: medium** |
| `packages/game-stats/README.md` | Clean | No stale references. |
| `packages/error-tracking/README.md` | Clean | No stale references. |
| `packages/types/README.md` | **Stale** | Supabase in API reference, auth types marketed as features, stale file path. **Severity: medium** |
| `packages/ui/README.md` | Clean (not fully read) | First 50 lines show no stale references. |
| `packages/theme/README.md` | Not read | Likely clean (pure design token package). |

## /docs/ Directory Audit (non-archive)

| File | Status | Issues |
|------|--------|--------|
| `docs/ARCHITECTURE.md` | Clean | Correctly describes 2-app standalone architecture throughout. |
| `docs/APP_STRUCTURE.md` | **Critical** | Entire document describes old architecture with auth dirs, middleware, Platform Hub section. |
| `docs/E2E_TESTING_GUIDE.md` | **Stale** | E2E_JWT_SECRET still described as required; `fixtures/auth` still described as auth flow. **Severity: high** |
| `docs/MANUAL_TEST_PLAN.md` | **Critical** | Section 1 (Platform Hub), Section 4 (OAuth SSO), auth prerequisites, Hub E2E counts. |
| `docs/MIDDLEWARE_PATTERNS.md` | **High** | Entire doc describes OAuth JWT middleware; lists deleted middleware.ts files as using the pattern. |
| `docs/adr/ADR-001-e2e-hash-port-isolation.md` | **Low** | Mentions 3 apps/port 3002. |
| `docs/adr/ADR-002-synthetic-jwt-auth-e2e.md` | **High** | Entire document describes removed Platform Hub + auth JWT infrastructure. Status is "Accepted". |
| `docs/adr/ADR-007-docker-isolation-rejected.md` | **Low** | Historical, but references Supabase/ADR-002. |
| `docs/adr/README.md` | **Medium** | ADR-002 listed as "Accepted" with no obsolete marker. |

## Code Docstring/Comment Drift

- `packages/types/src/user.ts:15`: `/** Unique identifier (UUID) from Supabase Auth */` — **medium**
- `packages/types/src/user.ts` (whole file): Entire file contains `LoginRequest`, `RegisterRequest`, `AuthResponse`, `Session` interfaces — these are types for an auth system that no longer exists. The JSDoc comments describe them in terms of an auth system ("Request payload for user login," "Response from authentication endpoints"). **medium**
- No stale auth docstrings found in `apps/bingo/src/**` or `apps/trivia/src/**` source files.
- No stale auth docstrings found in `packages/sync`, `packages/game-stats`, or `packages/error-tracking` source files.

## Surprises

1. **`docs/ARCHITECTURE.md` is actually clean** — it was apparently rewritten as part of the standalone conversion and accurately describes the 2-app architecture. No drift.
2. **`CLAUDE.md` (root) is clean** — the root AI assistant context file was updated and correctly describes the standalone world. The drift is mostly in docs that human developers would read, not the AI context files.
3. **`e2e/fixtures/auth.ts` is already correct** — the fixture file itself was already updated (it even has a JSDoc saying "No authentication required -- games run in standalone mode"), but `docs/E2E_TESTING_GUIDE.md` still describes it as an auth fixture. The code has diverged from its own documentation.
4. **`apps/bingo/README.md` and `apps/trivia/README.md` are clean** — these were likely rewritten and are in better shape than their corresponding CLAUDE.md files.
5. **`packages/testing/README.md` still actively markets Supabase mocks** — the code that implements the mock likely still exists in the package (Area 2's concern), but the documentation is promoting it as a live feature.
6. **The MANUAL_TEST_PLAN is effectively unusable** — it is not merely stale in places; its fundamental structure (7 sections, 203 test cases, result annotations) assumes 3 apps. Updating it means rebuilding it, not patching a few lines.

## Unknowns & Gaps

- `packages/theme/README.md` and `packages/audio/README.md` were not fully read. Low probability of auth drift given what these packages do, but unconfirmed.
- `docs/adr/ADR-003` through `ADR-006` were not seen in the glob (only 001, 002, 007 appear). It's unclear if ADRs 003–006 exist or were deleted.
- Whether `E2E_JWT_SECRET` is still read at runtime anywhere (in `playwright.config.ts`, `scripts/e2e-with-build.sh`, etc.) — if the env var was removed from the build/test pipeline, the E2E_TESTING_GUIDE becomes more misleading; if it's still present in config files, there's config drift too (Area 3/4's concern).
- `docs/ALERTING_SETUP.md` mentioned in the investigation brief was not found via glob. Either it doesn't exist or was not returned (possibly because it's in an excluded directory).

## Cross-Area Observations

- **Area 2 (Code Dead Weight)** should look at `packages/types/src/user.ts` which contains an entire auth type module (`User`, `UserProfile`, `Session`, `LoginRequest`, etc.) with no consumers in the current 2-app codebase.
- **Area 2** should also verify whether `packages/testing`'s Supabase mock implementation (not just the README) still exists and is exported — if so, it's both a code and doc problem.
- **Area 4 (Test & Tooling)** should look at the `E2E_JWT_SECRET` requirement in `docs/E2E_TESTING_GUIDE.md` and trace whether `playwright.config.ts` still sets `E2E_TESTING=true` or requires `E2E_JWT_SECRET` in global setup.
- **Area 3 (Security/Infra)** should check whether `E2E_TESTING=true` env var and `E2E_JWT_SECRET` are still defined in Vercel project settings for deployed apps.

---

## Raw Evidence Index

| Finding | File | Lines | Severity |
|---------|------|-------|----------|
| Platform Hub section (Section 1, 7 stories) | `docs/MANUAL_TEST_PLAN.md` | 119–189 | critical |
| OAuth SSO cross-app section (Section 4) | `docs/MANUAL_TEST_PLAN.md` | 604–644 | critical |
| "pnpm dev — Starts all 3 apps with real auth" | `docs/MANUAL_TEST_PLAN.md` | 29–32 | critical |
| Platform Hub login as auth prerequisite | `docs/MANUAL_TEST_PLAN.md` | 52–55 | critical |
| Platform Hub E2E ~137 tests count | `docs/MANUAL_TEST_PLAN.md` | 737–743 | high |
| Sign in button expected on Bingo home | `docs/MANUAL_TEST_PLAN.md` | 200–201 | high |
| Game App layout with auth dirs + middleware.ts | `docs/APP_STRUCTURE.md` | 10–31 | critical |
| Platform Hub Layout section | `docs/APP_STRUCTURE.md` | 58–95 | critical |
| Key Differences table with Platform Hub column | `docs/APP_STRUCTURE.md` | 97–105 | high |
| Files listing deleted middleware.ts files | `docs/MIDDLEWARE_PATTERNS.md` | 60–63 | high |
| JWKS/OAuth middleware pattern docs | `docs/MIDDLEWARE_PATTERNS.md` | 1–55 | medium |
| E2E_JWT_SECRET described as required | `docs/E2E_TESTING_GUIDE.md` | 22–36 | high |
| Auth fixture described as auth flow | `docs/E2E_TESTING_GUIDE.md` | 155–192 | high |
| ADR-002 describes Platform Hub JWT auth | `docs/adr/ADR-002-synthetic-jwt-auth-e2e.md` | entire | high |
| ADR-002 marked "Accepted" in index | `docs/adr/README.md` | 8 | medium |
| ADR-001 references port 3002 | `docs/adr/ADR-001-e2e-hash-port-isolation.md` | 11, 24 | low |
| BFF Pattern says "Frontend → API Routes → Supabase" | `CONTRIBUTING.md` | 244–248 | high |
| "cloud-based" + "admin accounts" description | `apps/bingo/CLAUDE.md` | 7–8 | medium |
| Supabase mock marketed as feature | `packages/testing/README.md` | 3, 43, 110–146 | medium |
| Auth types documented as package value | `packages/types/README.md` | 117–138, 254, 589 | medium |
| Stale file path in related docs | `packages/types/README.md` | 613 | low |
| Supabase Auth JSDoc on User.id | `packages/types/src/user.ts` | 15 | medium |
