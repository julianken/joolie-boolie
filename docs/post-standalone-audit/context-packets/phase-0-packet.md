# Context Packet: Phase 0 → Phase 1

## Analysis Question
Audit the Joolie Boolie monorepo for drift remaining after the standalone conversion (platform-hub + auth + database + Supabase/OAuth removed, BEA-682–695 Wave 1). The repo now runs as two apps (bingo + trivia) with localStorage-only persistence. Find everything that still assumes the old multi-app logged-in platform.

## Repo State
- **Main head:** `25cdc983`
- **Active apps:** `apps/bingo`, `apps/trivia`
- **Shared packages:** `packages/{audio,error-tracking,game-stats,sync,testing,theme,types,ui}` (also `.claude-mem-context` etc., but those 8 are the active ones)
- **Removed (no longer in repo):** `apps/platform-hub`, `packages/auth`, `packages/database`
- **Brand:** "Joolie Boolie", domain `joolie-boolie.com`, jb- prefix for storage
- **Middleware:** both `apps/{bingo,trivia}/src/middleware.ts` were DELETED in BEA-696 (`25cdc983`). No middleware exists in either app.

## In Scope
All code, config, docs, tests, infra config. EXCEPT historical docs directories (`docs/archive/`, `docs/standalone-conversion-plan/`, `docs/standalone-games-analysis/`).

## Out of Scope
Historical archive dirs. `.worktrees/`. `node_modules`/`.turbo`. Implementing fixes (report only).

## Key Strings to Grep For
- `platform-hub`, `@joolie-boolie/platform-hub`
- `@joolie-boolie/auth`, `@joolie-boolie/database`
- `supabase`, `@supabase/`
- `oauth`, `OAuth`, `OAUTH_`
- `jwt`, `JWT`, `SESSION_TOKEN_SECRET`
- `sign in`, `sign up`, `log in`, `Sign In`, `Log In`, `Welcome back`, `account`
- `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `NEXT_PUBLIC_SUPABASE_*`
- `/api/health` (endpoint was removed)
- `dev:hub`, `lighthouse:hub`, `build-for-e2e`

## Quality Criteria (reference only; investigators don't need to score)
Evidence strength 25%, Completeness 25%, Accuracy 20%, Actionability 20%, Nuance 5%, Clarity 5%.

## Output Format Required
Each investigator writes to `docs/post-standalone-audit/phase-1/area-{N}-{slug}.md` BEFORE returning, using the format specified in the skill doc. Every finding: evidence (file path + line number), confidence (high/medium/low), severity (critical/high/medium/low), recommended action.

## 5 Investigation Areas

1. **Area 1 — User-Facing Drift** (copy, UX, affordances, error states)
2. **Area 2 — Code-Level Dead Weight** (imports, utilities, stores, hooks, types, routes)
3. **Area 3 — Security & Infrastructure Drift** (headers, cookies, env, Vercel, DNS, monitoring)
4. **Area 4 — Test & Tooling Drift** (unit, E2E, fixtures, dev scripts, lint, Turbo)
5. **Area 5 — Documentation & Developer Onboarding**

Each investigator gets ONLY their area assignment in the prompt, plus this packet for shared context.

## Known Input from BEA-697 (do not re-investigate for Area 4)
- `waitForHydration` helper expects `button, input, [role=button]` but both home pages now only render links
- `e2e/bingo/health.spec.ts` calls removed `/api/health`
- Trivia `display.spec.ts` timeouts have two causes: same hydration helper + `startGameViaWizard` hangs because `397fe843` removed auto-template loading
- Test copy drift exists in `home.spec.ts` files (expects strings no longer rendered)
- ~28 tests affected across 5+ spec files
- Plan doc: `docs/plans/BEA-697-e2e-baseline-fix.md` (on branch `chore/BEA-697-e2e-baseline-plan`)

Area 4 investigator should take these findings as GIVEN and focus on OTHER test/tooling drift (unit tests, fixtures, dev scripts, lint mappings, turbo pipelines, etc.) — NOT redo BEA-697's work.
