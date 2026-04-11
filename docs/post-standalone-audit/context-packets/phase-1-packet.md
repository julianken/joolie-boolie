# Context Packet: Phase 1 → Phase 2

## Top-Line Reframe
The app **source code is remarkably clean**. The drift is concentrated in **4 layers**: (1) committed/local env files carrying real Supabase credentials, (2) Vercel production env vars pointing at the old `beak-gaming.com` domain with data-corruption bugs, (3) docs that describe the pre-standalone world (MANUAL_TEST_PLAN, APP_STRUCTURE, MIDDLEWARE_PATTERNS, ADR-002, CONTRIBUTING.md), (4) CI workflows and dev scripts that reference removed apps/vars.

## Key Findings (max 7)

1. **Committed Supabase/OAuth credentials in git.** Root `.env.example` contains real-looking `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_TOKEN_SECRET`, OAuth client ID (Area 3 3-1 confirmed tracked via `git ls-files`). Root `.env` may also be tracked (Area 2 F1). Both app-local `.env.local` files have full auth-era credentials. **Rotation required regardless of Supabase project status.**

2. **Vercel production deployments still have the old auth env surface.** Both bingo and trivia prod have `NEXT_PUBLIC_COOKIE_DOMAIN=".beak-gaming.com"`, `SUPABASE_*`, `NEXT_PUBLIC_OAUTH_*`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `SESSION_TOKEN_SECRET` — pointing at the pre-rebrand domain, with literal `\n` substrings embedded in URL values (Area 3 3-2). No runtime code reads them, but they're a cleanup and data-integrity target.

3. **Two CI workflows are broken post-standalone.** `.github/workflows/nightly.yml:81-89` injects 5 defunct env vars into `pnpm build` (Areas 2/3/4 all flagged). `.github/workflows/e2e.yml:152` invokes `--project=bingo-mobile` which no longer exists in `playwright.config.ts` (Area 4 F2). `start-e2e-servers.sh` at repo root (tracked) still runs `pnpm --filter @joolie-boolie/platform-hub dev` (Areas 2 F3 + 4 F3).

4. **Five docs are entirely stale at a structural level, not just line-patches.** `docs/MANUAL_TEST_PLAN.md` is ~35% Platform Hub content (Section 1 + Section 4 + "3 apps" framing throughout). `docs/APP_STRUCTURE.md` describes the old Game App layout with `api/auth/`, `lib/auth/`, middleware, and a full Platform Hub section. `docs/MIDDLEWARE_PATTERNS.md` points at the deleted `middleware.ts` files. `docs/adr/ADR-002-synthetic-jwt-auth-e2e.md` is "Accepted" but describes removed infra. `CONTRIBUTING.md:243-248` "BFF Pattern" says `Frontend → API Routes → Supabase`. (Area 5.)

5. **`packages/types` exports ~15 dead auth/API types with zero consumers.** `User`, `UserProfile`, `LoginRequest`, `RegisterRequest`, `AuthResponse`, `UpdateProfileRequest`, `Session`, plus `GameSession`, `GameType`, `GAME_TYPE_NAMES`, plus the entire `api.ts` surface (`ApiResponse`, `PaginatedResponse`, etc.). `User.id` JSDoc still says "UUID from Supabase Auth". The only live import surface of `@joolie-boolie/types` is `ThemeMode` + branded types. Cross-flagged by Areas 2, 3, 4, 5.

6. **`docs/E2E_TESTING_GUIDE.md` documents an `E2E_JWT_SECRET` startup guard that no longer exists.** No source reads `E2E_JWT_SECRET` (middleware deleted in BEA-696). `e2e/fixtures/auth.ts` is already clean internally but keeps the misleading filename. Guide says "app will throw at startup" — the guard is gone. (Areas 2 F12, 3 3-8, 5.)

7. **User-facing drift is minor but real.** Bingo markets itself as "cloud-based" with "admin accounts" in landing copy, meta description, PWA manifest, AND `apps/bingo/CLAUDE.md` (Areas 1 + 5). Error pages tell users to "contact support" / "let a staff member know" — there is no support channel (Area 1). Bingo footer reads "Part of Joolie Boolie — games for groups and communities" implying a multi-app family (Area 1). Trivia has asymmetric PWA install prompt and title metadata.

## Confidence Levels

**High confidence (verified across multiple areas or by multiple tools):**
- Committed credentials (Finding 1) — verified by `git ls-files`, file content inspection
- Vercel prod env drift (Finding 2) — verified by `.vercel/.env.production.local` dump
- CI workflow breakage (Finding 3) — verified by file read + absence grep
- Structural doc drift (Finding 4) — verified by file read with exact line refs
- Dead types in `packages/types` (Finding 5) — verified by grep for consumers, returned zero
- Unused `E2E_JWT_SECRET` (Finding 6) — grep returned zero source refs

**Medium confidence:**
- CSP could be tightened safely (Area 3 3-6) — advisory, not verified by actual enforcing test
- Some serena memory files describe old architecture (Areas 2 F10/F11) — gitignored, affects only AI context not CI

**Low confidence:**
- Supabase project status (alive/paused/revoked) — mentioned but not verified
- Whether `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is a future feature flag or dead (Area 2 surprise finding)
- Service worker runtime behavior with generic `/api/*` matcher (Area 3 3-15) — source-reviewed only, not runtime-tested

## Contradictions & Open Questions

1. **Root `.env` tracking status.** Area 2 F1 flagged as critical "credentials in git history" but left "whether tracked" as an unknown. Area 3 confirmed via `git ls-files` that `.env.example` is tracked. Need one definitive verification of the bare `.env` file's tracking status before giving a final rotation plan.

2. **E2E workflow "disabled but should still parse" — what does "CI disabled" actually mean for the workflow files?** CLAUDE.md says GitHub Actions are disabled. But nightly.yml and e2e.yml still exist in the repo. Are they scheduled-only? Workflow-dispatch-only? Commented-out trigger blocks? Needs trace of the actual workflow triggers to decide if fixing them matters or if they should be deleted wholesale.

3. **"Cloud-based" copy — is this a product decision or legacy drift?** Area 1 recommends changing it; but the product IS deployed to Vercel, so "cloud-based" is technically accurate in the infra sense even if "no cloud accounts" is the user-facing reality. Needs a product-intent clarification before rewording.

## Artifacts (read only if needed)
- `phase-1/area-1-user-facing-drift.md`: 8 findings, 0 critical — mostly medium copy drift, error states, brand framing
- `phase-1/area-2-code-dead-weight.md`: 13 findings, 2 critical (credentials) — dead types, stale scripts, serena memories, Supabase mock README lie
- `phase-1/area-3-security-infra-drift.md`: 16 findings, 2 critical — env credentials, Vercel prod, CSP, CI, observability
- `phase-1/area-4-test-tooling-drift.md`: 10 findings, 3 critical — nightly CI env, bingo-mobile Playwright project, trivia health.spec.ts not in BEA-697
- `phase-1/area-5-docs-onboarding.md`: ~20 findings, 4 critical — MANUAL_TEST_PLAN, APP_STRUCTURE, MIDDLEWARE_PATTERNS, CONTRIBUTING.md, ADR-002
