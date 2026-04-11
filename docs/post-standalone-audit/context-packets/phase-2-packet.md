# Context Packet: Phase 2 → Phase 3

## Top-Line Reframe
Phase 1's evidence was **partially stale**. Phase 2 corrected three material claims against the live system: (a) tracked `.env.example` files are actually clean at HEAD per PR #516, (b) Vercel production env vars have zero auth leftover per live `vercel env ls`, (c) Faro IS wired up via `FaroInit` component and the CSP `*.grafana.net` is load-bearing. The real findings are smaller in breadth but sharper in resolution: specific lines to delete, specific commands to run, specific docs to rewrite vs delete vs supersede.

## Key Findings (max 7 themes)

### 1. Security drift is less severe than Phase 1 thought, but not zero
- `.env.example` files are **clean at HEAD** (PR `de391ab5` rewrote them 2026-04-09). Phase 1 scanned mid-cleanup.
- Root `.env` was **never tracked** (`.gitignore:21` covers it from day one).
- **Actual history exposure:** `docs/E2E_TESTING_GUIDE.md` contained live `SUPABASE_SERVICE_ROLE_KEY`/anon/URL for ~32 days (`3b40fb25` 2026-01-24 → `72bd8caf`/`806c9f6b` 2026-02-25). Blobs still reachable via `git log`. Session/JWT secrets were **never** in history.
- Old Supabase project `iivxpjhmnalsuvpdzgza` not visible to the connected Supabase MCP — likely paused per user memory.
- **New finding:** Live Sentry (`sntrys_...`, org:ci scope) and Grafana Cloud (`glc_...`) tokens in `.secrets/observability-accounts.json` are active and worth rotating in-sweep.
- **Recommendation:** forward-only cleanup, no git history rewrite. Rotate Supabase service role key regardless (or confirm project is dead). (Iterator 1)

### 2. Vercel production env is actually clean — Phase 1 was wrong
- Iterator 2 ran live `vercel env ls` against `jimpers-projects` team. **Zero auth-related vars** on either project in any environment. Phase 1 Finding 3-2 was based on **Feb 4 stale `.env.production.local` snapshots**; an unrecorded cleanup happened since then.
- **Severity downgrade:** Phase 1 3-2 from critical → low.
- **Real remaining Vercel work:** (a) `NEXT_PUBLIC_FEATURE_QUESTION_SETS` dead flag on trivia, (b) `NEXT_PUBLIC_FARO_URL` has confirmed `\n` byte-level corruption on both apps (verified via `od -c`), silently breaking Faro RUM, (c) `bingo.beak-gaming.com`/`trivia.beak-gaming.com` still attached as aliases **without 301 redirect** (contradicts project memory note that claims redirects exist), (d) orphan preview aliases, (e) gap: `THE_TRIVIA_API_KEY` is NOT set in Vercel for trivia but trivia-api proxy reads it. (Iterator 2)

### 3. CI workflows are NOT "disabled" in any file-visible way — they're still firing
- `nightly.yml` has a live cron `0 8 * * *` + workflow_dispatch. `e2e.yml` has a live `pull_request` trigger on `main`. Neither is commented out or guarded.
- "CI disabled" must refer to a GitHub repo-level Actions toggle or branch protection — **not visible from the filesystem**. Nightly cron is likely firing daily with stub env vars masking any real failure.
- **Clean-env build test (definitive):** `env -i HOME=$HOME PATH=$PATH SHELL=$SHELL pnpm turbo run build --force` built both apps in 12s with `0 cached, 2 successful`. `.github/workflows/nightly.yml:81-89` env block is provably dead. Delete with zero risk.
- `.github/workflows/e2e.yml:152 --project=bingo-mobile` confirmed broken. Commit `cad50658` (BEA-693) removed the project from `playwright.config.ts` but missed the workflow. Single-line fix. (Iterator 5)

### 4. `start-e2e-servers.sh` is NOT tracked — Phase 1 was wrong
- `git ls-files start-e2e-servers.sh` returns empty. `.gitignore:71` explicitly ignores it. The file Phase 1 read was a stale worktree-local copy predating BEA-693's generator update.
- **Severity downgrade:** Phase 1 Area 4 F3 / Area 2 F3 from high → low worktree hygiene memo. (Iterator 5)

### 5. Faro IS wired up — Phase 1 Area 3 3-6 was wrong
- Phase 1 said "Faro is apparently not yet wired up (no `FaroProvider` imports found)." False — the component is `FaroInit`, not `FaroProvider`. It IS imported and rendered in both `apps/bingo/src/app/layout.tsx:8,59` and `apps/trivia/src/app/layout.tsx:8,58`, consuming `NEXT_PUBLIC_FARO_URL` via `packages/error-tracking/src/faro.ts:10`.
- **Implication:** `https://*.grafana.net` in CSP `connect-src` is **load-bearing** and must stay. Faro's current production URLs are also `\n`-corrupted (see Vercel finding above) so Faro is broken in prod anyway.
- **CSP enforcing mode is feasible** with a 3-4 week parallel-policies rollout. Iterator 5 proposed a concrete enforcing policy adding `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, `upgrade-insecure-requests`, dropping invalid `/monitoring` token, keeping `*.grafana.net`, conservatively adding `*.sentry.io` / `*.ingest.sentry.io`. (Iterator 5)

### 6. Dead types cleanup: concrete 6-step, ~404 lines to remove
- `packages/types/src/user.ts` (92 lines) — delete entire file + re-exports
- `packages/types/src/api.ts` (143 lines) — delete entire file + re-exports
- `apps/bingo/src/types/index.ts` lines 212-307 (~96 lines) — 10 dead types (not just 3 as Phase 1 F13 named)
- `packages/types/src/game.ts` — partial, ~30 lines (`GameStatus` re-export, `TriviaGameStatus`, `GameType`, `GAME_TYPE_NAMES`, `GameSession`, `ColorTheme`, `Timestamps`). Only `ThemeMode` is alive.
- `packages/error-tracking/src/server.ts:90,110,125-126` — remove `jwt`/`supabase`/`postgres` string matches in `categorizeError()`
- **Topological order matters:** `Timestamps` is a hidden dependency of `UserProfile`; delete after `user.ts`.
- `packages/testing/src/mocks/` has NO Supabase source file — the README drift is documentation-only (confirms Phase 1 F7 and simplifies Iterator 3's dependency chain). (Iterator 4)

### 7. Docs strategy: 11 prioritized actions across REWRITE/DELETE/MARK-SUPERSEDED/PATCH
- **REWRITE** (1): `docs/MANUAL_TEST_PLAN.md` — preserves ~65% (stories 2.2-2.11 + 3.2-3.22 + runs 1-9 execution history) while dropping Section 1 (Platform Hub, 7 stories) and Section 4 (OAuth SSO, 4 stories). Target ~600 lines from ~752.
- **DELETE** (2): `docs/APP_STRUCTURE.md` (ARCHITECTURE.md already covers this correctly); `docs/MIDDLEWARE_PATTERNS.md` (no middleware exists).
- **MARK-SUPERSEDED** (2): ADR-002 (update status + supersession note at top, preserve history below); ADR-007 (annotate ADR-002 cross-reference).
- **PATCH** (6): `CONTRIBUTING.md` BFF section (lines 243-248), `docs/E2E_TESTING_GUIDE.md` + `scripts/setup-worktree-e2e.sh:137` (E2E_JWT_SECRET block), `apps/bingo/CLAUDE.md:7-8` (cloud-based / admin accounts), ADR-001 context, ADR README index, **new finding: `docs/ALERTING_SETUP.md:52-53`** (`/api/health` URLs in Grafana Synthetic Monitoring — Area 5 missed this; anyone configuring from this doc gets permanently broken probes).
- ADRs 003-006 **confirmed nonexistent**. ADR process is dormant — no new ADRs since 2026-01, including none for the standalone conversion itself. (Iterator 3)

## Confidence Levels

**High confidence (verified live or via definitive commands):**
- Clean-env build test proves nightly.yml env block is dead
- Live `vercel env ls` proves Phase 1 3-2 was stale
- `git log` + `git show` trace of docs/E2E_TESTING_GUIDE.md history exposure
- `git ls-files start-e2e-servers.sh` empty → not tracked
- `FaroInit` grep → Faro is wired up
- Dead types cleanup list (every claim backed by grep query)
- Workflow triggers (YAML files read directly)

**Medium confidence:**
- Supabase project status (can't confirm from outside the owning account)
- Whether the nightly cron is actually firing (visible from filesystem only as a live YAML trigger; GitHub repo-level toggle unknown)
- CSP enforcing rollout timeline (proposed but not tested live)
- Live Sentry/Grafana tokens actually rotatable without breaking observability (depends on ops)

**Low confidence:**
- Whether `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is future-feature or truly dead
- Correct replacement URL for `docs/ALERTING_SETUP.md` health checks

## Contradictions & Open Questions (for Phase 3 to resolve)

1. **Iterator 1 vs Iterator 2 on Vercel prod env.** Iterator 1 (security) said "Vercel production env vars are still polluted" — but that was based on Phase 1 evidence without re-running the query. Iterator 2 (deployment) ran live `vercel env ls` and found them clean. **Iterator 2 wins** (live API > stale snapshot). Phase 3 should treat Vercel as already-clean modulo the feature flag + `\n` corruption + domain alias findings.

2. **"CI disabled" meaning.** Workflow YAML files have live triggers. The phrase in CLAUDE.md must mean something else — probably a repo-level toggle, branch protection, or manual "GitHub Actions are disabled" configuration. Phase 3 should note this as an operational unknown and recommend checking the repo Settings > Actions page before acting on CI findings.

3. **What is the Supabase project's actual status?** Memory says "paused (free tier)". Iterator 1's MCP query couldn't see the project ref (two post-rebrand projects ARE visible). Likely paused, possibly deleted. Phase 3 should recommend rotating the service role key regardless, because the uncertainty is worse than the work.

## Artifacts (read only if needed)
- `phase-2/iterator-1-security-triage.md`: ~4000 words — full rotation plan, git history, blast radius table, risk assessment
- `phase-2/iterator-2-vercel-prod-env.md`: ~3500 words — live env ls results, `\n` corruption investigation, domain audit, copy-paste vercel commands
- `phase-2/iterator-3-docs-restructure.md`: ~5000 words — 11-action prioritized doc plan with skeletons for each REWRITE
- `phase-2/iterator-4-dead-types-cleanup.md`: ~4500 words — 6-step ordered delete list with per-export grep evidence, topological dependency analysis
- `phase-2/iterator-5-ci-csp-validation.md`: ~5000 words — clean-env build test, CSP enforcing policy proposal, workflow trigger analysis, PR/.husky/.lintstaged audit
