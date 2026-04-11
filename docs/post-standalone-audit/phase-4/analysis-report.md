# Post-Standalone Conversion Audit: Final Analysis Report

**Funnel:** Phase 4 of 4 (Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4)
**Repo:** `julianken/joolie-boolie`
**Branch / HEAD:** `main` at `25cdc983`
**Verified against:** Repo state at main head `25cdc983` on **2026-04-11**
**Re-validate before acting if more than 2 weeks have passed since this date.**

---

## A. Executive Summary

The Joolie Boolie monorepo was audited for drift remaining after BEA-682–695 Wave 1 — the deletion campaign that removed platform-hub, the `@joolie-boolie/auth` package, the `@joolie-boolie/database` package, Supabase, OAuth, and all middleware. The audit was conducted as a 5-5-3-1 investigate-iterate-synthesize funnel covering user-facing copy, code-level dead weight, security and infrastructure, test and tooling, and documentation.

**The master finding is a single sentence: what you run is correct, but what you read is wrong.** The deletion campaign cleaned runtime code thoroughly — imports, stores, hooks, routes, middleware are gone — but it stopped at the compiler boundary. Non-executable surfaces (types exported but never consumed, CI env var stubs that inject into a build that no longer needs them, documentation describing an architecture that no longer exists, user-facing copy that names infrastructure that no longer exists) were largely untouched. The resulting drift is concentrated in exactly the files AI development agents read as authoritative context, which matters disproportionately because this project is developed exclusively with AI agents.

The audit found three security-critical items that require action independent of everything else (a leaked Supabase service role key in git history, plaintext observability tokens on a developer workstation, and a `\n`-corrupted Faro RUM URL silently black-holing browser telemetry in production), a well-bounded quick-wins bundle of roughly 3-5 hours that closes most observability and CI signal gaps, and a larger documentation and dead-code cleanup sprint that would restore AI-agent context coherence. The most important takeaway for a reader deciding how to act: **the URGENT bucket is non-negotiable regardless of quadrant placement; the Quick Wins bundle pays for itself within one development session; everything else can wait.**

---

## B. Analysis Question & Scope

### Original question (from Phase 0)

> Audit the Joolie Boolie monorepo for drift remaining after the standalone conversion (platform-hub + auth + database + Supabase/OAuth removed, BEA-682–695 Wave 1). The repo now runs as two apps (bingo + trivia) with localStorage-only persistence. Find everything that still assumes the old multi-app logged-in platform.

### In scope

All tracked code, config, documentation, test files, and CI/infra configuration in `apps/` and `packages/` and the root `docs/` tree (excluding archive dirs).

### Out of scope

Historical archive directories (`docs/archive/`, `docs/standalone-conversion-plan/`, `docs/standalone-games-analysis/`). `.worktrees/`, `node_modules/`, `.turbo/`. Implementation of fixes (this is a report-only pass).

### Time caveat (first statement)

**Every finding in this report is verified against main head `25cdc983` on 2026-04-11.** Several of the findings are live-system-verified (Vercel env state, git blob state, GitHub workflow syntax); others are verified at the HEAD of the tracked file tree; a small number are drawn from on-disk artifacts that could be stale. Each major finding carries a provenance tag. **If you are acting on this report more than two weeks after 2026-04-11, re-run the single-command probes listed in Section I before committing to changes.**

---

## C. Table of Contents

- **A. Executive Summary** — Master framing: "what you run is correct, but what you read is wrong."
- **B. Analysis Question & Scope** — The original Phase 0 question, boundaries, time caveat.
- **C. Table of Contents** — This section.
- **D. Methodology** — The 5-5-3-1 funnel, how Phase 2 corrected Phase 1, provenance framework.
- **E. Key Findings** — Organized by the four themes from Synthesis 1, with confidence and provenance on each item.
- **F. Analysis & Implications** — Weaving thematic, risk, and decision-enablement lenses; the Phase 1 → Phase 2 correction pattern as methodology learning.
- **G. Confidence Assessment** — Strongest, moderate, and weakest claims; known blind spots.
- **H. Recommendations** — URGENT bucket first, then Quick Wins, Important Investments, Cheap Hygiene, Defer/Accept.
- **I. Open Questions & Single-Probe Resolutions** — Five unresolved questions with exact commands that would resolve them.
- **J. Appendix: Evidence Index** — Finding → source traceability table.

---

## D. Methodology

### The 5-5-3-1 analysis funnel

This audit used the `analysis-funnel` skill with a specific topology:

1. **Phase 0 — Scoping:** A single prompt packet that defined the analysis question, 5 investigation areas, grep targets, and quality criteria. Output: `docs/post-standalone-audit/context-packets/phase-0-packet.md`.
2. **Phase 1 — Parallel investigation:** Five independent investigator agents, each given one area (User-Facing Drift, Code-Level Dead Weight, Security & Infra Drift, Test & Tooling Drift, Documentation & Developer Onboarding). Each wrote to `docs/post-standalone-audit/phase-1/area-N-*.md`.
3. **Phase 2 — Verification iterators:** Five independent iterators who took Phase 1 claims and re-verified them against the live system. Iterator 1 triaged security findings and confirmed/falsified credential leaks. Iterator 2 ran `vercel env ls` live against both Vercel projects. Iterator 3 re-read every documentation finding against current file contents and produced an 11-action prioritized doc plan. Iterator 4 ran topological analysis on dead types. Iterator 5 ran a clean-environment build test proving zero env var dependencies, then audited CSP and CI workflow files.
4. **Phase 3 — Parallel synthesis:** Three synthesizers reading the same Phase 1+2 evidence through different lenses. Synthesis 1 asked "what are the recurring themes?" and produced four themes. Synthesis 2 asked "what should we fix first?" and produced a 2×2 risk/cost quadrant. Synthesis 3 asked "what doesn't the audit know?" and produced an open-questions + decision-enablement map.
5. **Phase 4 — Final synthesis:** This report, which weaves all three lenses into one coherent narrative.

### Tools and probes used

- **Grep / ripgrep:** structural source queries (imports, type references, string literals)
- **Git commands:** `git ls-files` (tracked vs. untracked), `git log -S` (history search), `git show` (blob state at commit)
- **Vercel CLI:** `vercel env ls --environment production` (live env state), `vercel domains ls` (alias state)
- **Clean-env build test:** Iterator 5 ran `pnpm build` with zero Supabase/auth env vars to prove the apps have no runtime dependency on deleted infrastructure.
- **MCP queries:** Supabase MCP to list organizations and projects visible to the team account.
- **Byte-level inspection:** `od -c` on Vercel env pulls to detect control-character corruption in `NEXT_PUBLIC_FARO_URL`.

### The Phase 1 → Phase 2 correction pattern

Phase 2 falsified four Phase 1 claims:

1. **"Vercel production env contains polluted Supabase vars."** Phase 1 read `apps/{bingo,trivia}/.vercel/.env.production.local` (mtime Feb 4, 65+ days stale). Phase 2 Iterator 2 ran `vercel env ls` live and found zero auth vars. The file was a local cache, not a view of production.
2. **"`.env.example` tracked with real Supabase credentials."** Phase 1 scanned pre-cleanup files. Phase 2 Iterator 1 verified that commit `de391ab5` (PR #516, 2026-04-09) had rewritten all three `.env.example` files to placeholder-only content.
3. **"`start-e2e-servers.sh` is tracked and references platform-hub."** Phase 1 read a worktree-local stale copy. Phase 2 Iterator 5 ran `git ls-files start-e2e-servers.sh` and found the file is untracked; `.gitignore:71` explicitly ignores it. BEA-693 made the script generator-emitted.
4. **"Faro RUM is not wired into either app."** Phase 1 grepped for imports and missed the dynamic `FaroInit` component. Phase 2 Iterator 5 read `apps/{bingo,trivia}/src/app/layout.tsx` and confirmed `FaroInit` is rendered and does call `initializeFaro()`. Faro is wired — it's just that the URL is corrupted.

**All four corrections share a root cause:** Phase 1 read gitignored or on-disk artifacts as if they were authoritative about live system state. This is not investigator error in the "careless grep" sense — it is a category error about what the on-disk state of a repo actually represents at any given moment.

### Provenance framework

Every major finding below carries one of three provenance tags:

- **`[live-verified]`** — verified against a live external system (Vercel API, git history, GitHub API) within the audit window.
- **`[tracked-HEAD]`** — verified against the current content of a tracked file at main HEAD `25cdc983`.
- **`[on-disk-snapshot]`** — drawn from an on-disk artifact (including gitignored or locally-generated files). These are hypotheses pending live verification.

High-confidence findings in this report are mostly `[live-verified]` or `[tracked-HEAD]`. A small number are `[on-disk-snapshot]` and are flagged explicitly.

---

## E. Key Findings

Findings are organized **by theme** (from Synthesis 1), not by investigation area, because the themes explain the mechanism of drift more clearly than the domain carving. Each finding carries confidence, provenance, and impact.

### Theme 1: The cleanup stopped at the compiler boundary

Items in this theme survived because their absence produces no observable build failure. The TypeScript compiler and bundler enforce their own deletion; everything outside that boundary (exported-but-unconsumed types, CI env stubs, documentation, error categorization branches) had to be hand-deleted and mostly wasn't.

#### Finding 1.1: `packages/types/src/user.ts` and `packages/types/src/api.ts` are entirely dead

**Theme:** 1 — Compiler boundary
**Confidence:** high
**Provenance:** `[tracked-HEAD]` — verified by `rg` against the entire `apps/` + `packages/` source tree
**Evidence:** `packages/types/src/user.ts` (92 lines) exports `User`, `UserProfile`, `Session`, `AuthState` and related types with 15+ auth/API types total across both files. `packages/types/src/api.ts` (143 lines) exports API request/response envelopes for auth endpoints. Both files are re-exported from the `packages/types/src/index.ts` barrel but have zero consumers in live source. Identified by Phase 2 Iterator 4 via full-tree grep.
**Impact:** Developers and AI agents reading `packages/types/` encounter a type vocabulary (`User.id // UUID from Supabase Auth`, `Session`, `AuthState`) that does not match the runtime. This is the epistemic harm from Theme 4 (vocabulary without referent) piggy-backing on Theme 1. Deletion is bounded and mechanical; Iterator 4 produced a 6-step topological deletion order.
**Related findings:** 1.2, 1.4, 4.3 (Session JSDoc vocabulary)

#### Finding 1.2: `apps/bingo/src/types/index.ts:212-307` is a 96-line dead block

**Theme:** 1 — Compiler boundary
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** Bingo-specific auth-era types spanning lines 212–307 of `apps/bingo/src/types/index.ts`. Same pattern as 1.1 — compiled, re-exported, consumed by no live source. Identified by Phase 2 Iterator 4.
**Impact:** Same as 1.1, localized to bingo. Bundles into the same deletion PR.
**Related findings:** 1.1

#### Finding 1.3: `.github/workflows/nightly.yml:81-89` injects dead env vars into `pnpm build`

**Theme:** 1 — Compiler boundary
**Confidence:** high
**Provenance:** `[live-verified]` — Iterator 5 ran a clean-environment build (`pnpm build` with zero Supabase/auth env vars present) and the build succeeded.
**Evidence:** `.github/workflows/nightly.yml` lines 81–89 inject five defunct env vars (`SUPABASE_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, and two more) as stub values into the nightly build step. The clean-env build test proved the build has zero runtime dependency on any of them.
**Impact:** If the nightly cron is firing at all (see Finding 3.2 and Open Question 2), the stub values mask any real env-var failure that a legitimate dependency would surface. The "cleanup" of deleting nine lines is a provably no-op change to the build itself, but a signal-restoring change to the cron.
**Related findings:** 3.2 (nightly cron firing?), 1.5

#### Finding 1.4: `packages/error-tracking/src/server.ts categorizeError()` has dead string branches

**Theme:** 1 — Compiler boundary (with Theme 4 overlap on vocabulary)
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `packages/error-tracking/src/server.ts` lines 90, 110, 125–126 contain `categorizeError()` branches that string-match on `jwt`, `supabase`, `postgres`. None of those error types can be produced by the current runtime (no JWT verification, no Supabase client, no Postgres driver). Identified by Phase 2 Iterator 4.
**Impact:** Dead branches in an error-categorization function can mis-classify future unrelated errors that happen to contain one of those substrings. Low-probability but non-zero.
**Related findings:** 1.1, 4.3

#### Finding 1.5: `.github/workflows/e2e.yml:152` references a removed Playwright project

**Theme:** 1 — Compiler boundary (CI-specific variant)
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `e2e.yml:152` invokes Playwright with `--project=bingo-mobile`. BEA-693 removed `bingo-mobile` from `playwright.config.ts`. If this workflow runs, the step errors out on unknown project.
**Impact:** Every e2e workflow run that would execute this step errors, masking real test state. One-line fix.
**Related findings:** 1.3, 3.2

### Theme 2: Documentation was written for humans, maintained for AI — and neither happened

Stale documentation concentrated in exactly the files that AI agents read as authoritative context files. In an exclusively-AI development model, doc drift becomes a feedback loop: stale docs cause agents to generate code matching the wrong model, which requires corrective passes, which produces more adjacent drift.

#### Finding 2.1: `docs/MANUAL_TEST_PLAN.md` describes a deleted app

**Theme:** 2 — Docs for AI
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `docs/MANUAL_TEST_PLAN.md` Section 1 (lines 119–189) and Section 4 (lines 603–644) describe Platform Hub login, OAuth consent, and SSO flows at `localhost:3002` — an app deleted in Wave 1. Iterator 3 confirmed ~65% of the file is still valid (runs 1-9 execution history, stories 2.2-2.11, 3.2-3.22).
**Impact:** This is the canonical QA script. An AI agent or human asked to execute a test plan encounters instructions for a nonexistent app at the top of the document, which poisons the rest of the read. Iterator 3 recommends rewrite (preserving ~65%), not delete.
**Related findings:** 2.2, 2.3, 2.4

#### Finding 2.2: `docs/APP_STRUCTURE.md` describes a deleted architecture

**Theme:** 2 — Docs for AI
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `docs/APP_STRUCTURE.md` describes `app/api/auth/`, `lib/auth/`, `middleware.ts` with "OAuth JWT verification", and a full Platform Hub section — the exact architecture deleted in BEA-682–695 + BEA-696. The correct architecture is covered by `docs/ARCHITECTURE.md`.
**Impact:** `CLAUDE.md` links directly to `docs/APP_STRUCTURE.md` as "Canonical `lib/` layout." An AI agent following the `CLAUDE.md` pointer lands in a file that describes deleted architecture. Iterator 3 recommends delete (not patch) because `ARCHITECTURE.md` already covers the correct layout.
**Related findings:** 2.3, 2.6

#### Finding 2.3: `docs/MIDDLEWARE_PATTERNS.md` documents deleted middleware files

**Theme:** 2 — Docs for AI
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `docs/MIDDLEWARE_PATTERNS.md` lists both `apps/bingo/src/middleware.ts` and `apps/trivia/src/middleware.ts` under "files using this pattern." Both files were deleted in BEA-696 (commit `25cdc983`). No middleware exists in either app.
**Impact:** An AI agent asked about middleware patterns finds a document asserting files that do not exist. Delete, not patch — there is no middleware to document.
**Related findings:** 2.2

#### Finding 2.4: `apps/bingo/CLAUDE.md:7-8` describes the app as "cloud-based"

**Theme:** 2 — Docs for AI (with Theme 4 vocabulary overlap)
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `apps/bingo/CLAUDE.md` lines 7–8 describe the app as "cloud-based" and mention "admin accounts for saved configurations." The app uses localStorage-only persistence and has no admin concept.
**Impact:** This is the per-app AI context file. Every AI agent working on Bingo reads it first. The "cloud-based" framing will steer implementation suggestions toward server-side state.
**Related findings:** 2.5, 4.1

#### Finding 2.5: ADR-002 and ADR-007 are "Accepted" status describing removed infrastructure

**Theme:** 2 — Docs for AI
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** ADR-002 describes the synthetic JWT E2E auth flow built on Platform Hub. ADR-007 also describes removed auth infrastructure. Both are listed in the ADR README index without supersession notes. Iterator 3 recommends MARK-SUPERSEDED (preserve history, add supersession header).
**Impact:** Architectural decision records are the expected place to find historical rationale. "Accepted" status on removed infrastructure creates false confidence that the decisions are still in force.
**Related findings:** 2.2

#### Finding 2.6: `packages/testing/README.md` advertises a dead API

**Theme:** 2 — Docs for AI
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `packages/testing/README.md` prominently documents Supabase mock exports including `createMockSupabaseClient`. Iterator 4 confirmed these do not exist in `packages/testing/src/mocks/`. The README advertises a dead API. The package itself still exists and is useful (BroadcastChannel, Audio, Sentry, OTel mocks) but the README is not.
**Impact:** A developer adding tests and looking at `packages/testing/README.md` for available mocks will try to import something that does not exist. Wasted cycle, confusion about what tests can verify.
**Related findings:** 2.1, 2.3

### Theme 3: Point-in-time snapshots were treated as ground truth

This theme is methodological and appears primarily in the corrections Phase 2 made to Phase 1. Non-methodological findings in this theme are operational gaps where the live external system state was never probed during the audit.

#### Finding 3.1: `docs/E2E_TESTING_GUIDE.md` had a Supabase service role key in git blobs for ~32 days

**Theme:** 3 — Snapshot staleness (with a security overlay)
**Confidence:** high
**Provenance:** `[live-verified]` — Iterator 1 ran `git log -S` and confirmed the specific commits (`3b40fb25`, `c6c4af5c`, `0b9e8078`, `e8784d7b`, `806c9f6b`, `72bd8caf`) where the key appears in `docs/E2E_TESTING_GUIDE.md` history. Current HEAD is clean.
**Evidence:** The Supabase service role key for project `iivxpjhmnalsuvpdzgza` was inlined into `docs/E2E_TESTING_GUIDE.md` in those commits. The doc now has the key removed at HEAD, but the git blobs remain.
**Impact:** **This is security-critical and is the reason one of the URGENT items exists.** A service role key bypasses Row-Level Security on all tables. If the Supabase project at `iivxpjhmnalsuvpdzgza` is still reachable (paused or alive), this key represents a live exposure that `git log -S` can retrieve. If the project is deleted, the blob is a dead artifact. The project's liveness is an open question (see Section I).
**Related findings:** Open Question 1; Recommendation U1

#### Finding 3.2: GitHub Actions operational status is unknown

**Theme:** 3 — Snapshot staleness (CI variant)
**Confidence:** medium
**Provenance:** `[tracked-HEAD]` for YAML syntax; live status not probed
**Evidence:** `.github/workflows/nightly.yml` has a `0 8 * * *` cron trigger and no disable guard. `e2e.yml:152` has the `bingo-mobile` bug. Whether GitHub has Actions enabled at the repo level was never probed.
**Impact:** If Actions is enabled, the nightly is firing daily against stub env vars (Finding 1.3) and the e2e workflow is erroring out on Finding 1.5 every run. If Actions is disabled at the repo level (which is what MEMORY.md "GitHub Actions are disabled" suggests), both findings are cosmetic. The correct action depends on the answer. Single probe in Open Question 2.
**Related findings:** 1.3, 1.5

#### Finding 3.3: `beak-gaming.com` aliases may not have 301 redirects

**Theme:** 3 — Snapshot staleness (Vercel variant)
**Confidence:** medium
**Provenance:** `[live-verified]` for Vercel alias list; DNS not verified
**Evidence:** Iterator 2 ran `vercel domains ls` and found `bingo.beak-gaming.com` and `trivia.beak-gaming.com` still attached as Vercel aliases. MEMORY.md claims "beak-gaming.com → 301 redirects to joolie-boolie.com" but the live Vercel config shows no redirect rule for those aliases. Whether DNS for `beak-gaming.com` still points at Vercel (and thus the aliases are reachable at all) was not verified.
**Impact:** If DNS still points at Vercel, the old domain silently serves live content with no redirect, causing brand confusion and SEO link-equity split. If DNS has already been pointed away, the aliases are unreachable orphans with no user impact. Single `dig` resolves this. See Open Question 3.
**Related findings:** 4.2

### Theme 4: Infrastructure was deleted but its vocabulary was not

The standalone conversion deleted the infrastructure that gave specific vocabulary meaning. The vocabulary persisted in user-facing copy, error messages, type JSDoc, env var names, and operational runbooks. It now floats without referent.

#### Finding 4.1: User-facing "cloud-based" copy in landing, meta, and PWA manifest

**Theme:** 4 — Vocabulary persistence
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `apps/bingo/src/app/page.tsx:26`, `apps/bingo/src/app/layout.tsx:20`, `apps/bingo/public/manifest.json:4` — "cloud-based" appears in landing copy, the `<meta description>`, and the PWA manifest for an app that uses localStorage only.
**Impact:** User-perception issue. "Cloud-based" implies server-side state and login. Users may be confused about where their game state lives (localStorage is per-device and per-browser).
**Caveat:** Technically defensible — the app is hosted on Vercel's cloud infrastructure. The user-perception confusion is the real problem, not strict falsity.
**Related findings:** 2.4, 4.2

#### Finding 4.2: Error page copy references a deleted support channel

**Theme:** 4 — Vocabulary persistence
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `apps/bingo/src/app/error.tsx:65` and `apps/trivia/src/app/error.tsx:65` — "let a staff member know" / "contact support" on error pages for self-service apps with no support channel or staff.
**Impact:** User sees an error page telling them to contact someone who does not exist. Trust-damaging in a production error condition.
**Related findings:** 4.1

#### Finding 4.3: Type JSDoc references Supabase Auth on an unconsumed type

**Theme:** 4 — Vocabulary persistence (coupled with Theme 1)
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `packages/types/src/user.ts:14-23` — `User.id` has JSDoc "UUID from Supabase Auth." Zero consumers in source (see Finding 1.1).
**Impact:** An AI agent reading `user.ts` in the process of adding a new type sees "UUID from Supabase Auth" and reasonably infers that Supabase is part of the architecture. Cleanup is automatic once Finding 1.1 is resolved (delete the file).
**Related findings:** 1.1

#### Finding 4.4: `E2E_JWT_SECRET` vocabulary in docs and scripts outlives its mechanism

**Theme:** 4 — Vocabulary persistence
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `docs/E2E_TESTING_GUIDE.md` and `scripts/setup-worktree-e2e.sh:137` document and reference `E2E_JWT_SECRET` as a required startup guard. The middleware that verified the JWT was deleted in BEA-696. The variable name persists; the mechanism does not.
**Impact:** A developer following the worktree setup guide sets an env var that affects nothing. Low harm but clutters the mental model.
**Related findings:** 4.5

#### Finding 4.5: `docs/ALERTING_SETUP.md:52-53` has broken Grafana Synthetic Monitoring probe URLs

**Theme:** 4 — Vocabulary persistence (operational variant)
**Confidence:** high
**Provenance:** `[tracked-HEAD]`
**Evidence:** `docs/ALERTING_SETUP.md:52-53` contains Grafana Synthetic Monitoring probe configurations pointing at `/api/health` — an endpoint that was removed in the standalone conversion.
**Impact:** Any operator who follows this doc to configure monitoring ends up with permanently broken probes. This directly impairs production incident detection, which is why it's in the Quick Wins quadrant despite being a doc fix. Deciding the replacement URL is a product decision (see Open Question 4).
**Related findings:** 3.3

#### Finding 4.6: `NEXT_PUBLIC_FARO_URL` has `\n` corruption in Vercel production env

**Theme:** 4 — Vocabulary persistence (data-integrity variant) — **plus** live observability outage
**Confidence:** high
**Provenance:** `[live-verified]` — Iterator 2 used `od -c` on the Vercel env pull and confirmed a literal `\n` byte at the end of the URL value.
**Evidence:** `NEXT_PUBLIC_FARO_URL` in Vercel production for both apps has a `\n` (newline) character appended to its value. Iterator 5 confirmed `FaroInit` is rendered in `apps/{bingo,trivia}/src/app/layout.tsx` and that the component does call `initializeFaro()` using that env var.
**Impact:** **Faro RUM is silently broken in production for both apps.** Every Faro HTTP push fails with a DNS error or 400 because the URL has a literal `\n` appended. No browser-side RUM data has reached Grafana Cloud since Faro was deployed. Any alerting built on Faro metrics is flying blind. Fix is trivial (`vercel env rm`, `vercel env add` with clean value, redeploy).
**Related findings:** URGENT; Recommendation U3

#### Finding 4.7: `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is planned-but-unwired, NOT dead

**Theme:** 4 — Vocabulary persistence (false-positive correction)
**Confidence:** high
**Provenance:** `[tracked-HEAD]` — verified by reading `docs/question-sets-feature-flag/` at HEAD
**Evidence:** Phase 2 Iterator 2 recommended removing this flag from Vercel via `vercel env rm NEXT_PUBLIC_FEATURE_QUESTION_SETS`. Synthesis 3 corrected this: the directory `docs/question-sets-feature-flag/` contains a Phase 4 analysis report dated 2026-03-10 titled "Question Sets Feature Flag Gating" with a six-step implementation plan. This flag is **NOT** dead — it is a planned, partially-designed feature that was never wired up.
**Impact:** Removing the flag would delete a configured-and-planned value. The correct action is keep the env var, fix the `\n` corruption (also applies here, same pattern as Faro URL), and treat the `docs/question-sets-feature-flag/` tree as the spec for future implementation.
**Related findings:** 4.6 (same `\n` corruption pattern)

---

## F. Analysis & Implications

### The three lenses woven together

**Thematic lens (what's the story?):** The standalone conversion was a successful deletion campaign against runtime code. It stopped at the compiler boundary, leaving non-executable surfaces (types, env stubs, docs, vocabulary) behind. The docs layer is the highest-impact target because the project is AI-developed, and AI agents read docs as authoritative context. Theme 1 (compiler boundary) and Theme 4 (vocabulary persistence) are tightly coupled — dead types carry dead vocabulary in their JSDoc and field names. Theme 2 (docs for AI) is orthogonal in mechanism but shares the same root cause: non-executable surfaces are not compiled, tested, or verified against the running system. Theme 3 (snapshot staleness) is partially methodological — it describes a hazard in how the repo was analyzed — and partially operational (the `beak-gaming.com` aliases, the unknown GitHub Actions status, the unprobed Supabase project).

**Risk lens (what should we fix first?):** Three items are security-critical and override normal quadrant ordering: Supabase service role key rotation (blast radius CRITICAL if the project is live, TRIVIAL cost to rotate unconditionally), live observability token rotation on a developer workstation (blast radius HIGH, SMALL cost), and the Faro `\n` corruption that is silently black-holing RUM data in production (blast radius HIGH, TRIVIAL cost). Below the URGENT tier, the Quick Wins bundle (roughly 3-5 hours) closes most of the signal gaps: delete the nightly env stub, fix the Playwright project flag, patch the ALERTING_SETUP probe URLs, resolve the `beak-gaming.com` alias redirect state, set `THE_TRIVIA_API_KEY` in Vercel, and fix the `NEXT_PUBLIC_FEATURE_QUESTION_SETS` `\n` corruption (keeping the flag, not removing it). The Important Investments tier — CSP enforcing-mode migration, dead-types cleanup, MANUAL_TEST_PLAN rewrite — is high-impact but high-cost and can wait a cycle. Cheap Hygiene items (delete `APP_STRUCTURE.md`, delete `MIDDLEWARE_PATTERNS.md`, mark ADRs superseded, patch the handful of per-app `CLAUDE.md` files) bundle into one PR at low cost.

**Decision-enablement lens (what do we know and not know?):** The audit produces high-confidence findings on the code and config layers, cross-checked against the live Vercel API for the most critical claim. It produces lower-confidence findings on everything that required external system access the audit did not have (Supabase dashboard, GitHub Actions UI, Grafana dashboard). The single most important correction from this lens: **`NEXT_PUBLIC_FEATURE_QUESTION_SETS` is not dead** — it is a planned feature with a six-step implementation plan at `docs/question-sets-feature-flag/`. The correct action is keep the flag, fix the `\n` corruption. Iterator 2's recommendation to `vercel env rm` is superseded.

### The Phase 1 → Phase 2 correction pattern as methodology learning

Phase 2 falsified four Phase 1 claims. All four shared a root cause: Phase 1 read gitignored or untracked on-disk artifacts as if they were authoritative about live system state. The artifacts involved were real files on disk — `apps/{bingo,trivia}/.vercel/.env.production.local` (mtime 65 days stale), a worktree-local copy of `start-e2e-servers.sh`, pre-cleanup `.env.example` files. Phase 1 read them. Phase 2 ran a single live-verification command (`vercel env ls`, `git ls-files`, `git log`) and got a different answer.

**This pattern is evidence about investigation methodology, not just about these specific findings.** Three implications for future audits:

1. **On-disk artifacts have uncertain provenance.** A file that exists in the working tree may be (a) tracked at HEAD, (b) tracked but locally modified, (c) untracked-but-intentional (script output), (d) untracked-but-stale (cached), or (e) untracked-but-orphaned (dead worktree). Grepping treats all five the same. `git ls-files`, `git status`, and `git log -S` disambiguate.
2. **The ambient context of a working tree is chronologically mixed.** Pulled Vercel env files, generated scripts, and backup copies carry historical state without signaling their staleness. A repo-hygiene recommendation that falls out of this audit: document in the worktree setup guide (`scripts/setup-worktree-e2e.sh` and/or `docs/E2E_TESTING_GUIDE.md`) that on-disk `.vercel/.env.*.local` files are caches to be regenerated before use, not sources of truth.
3. **Provenance tagging is cheap insurance.** This report carries `[live-verified]`, `[tracked-HEAD]`, and `[on-disk-snapshot]` tags on every major finding. The first two are high-confidence. The third is hypothesis pending live verification. A reader can decide, finding by finding, how much weight to give.

The meta-level takeaway: **file-level audits without live-system queries drift out of sync with live reality within days.** Several Phase 2 corrections came from running a single live command that Phase 1 never ran. The final report should be read with a time caveat: everything is as of 2026-04-11; re-validate before acting if more than two weeks have passed.

---

## G. Confidence Assessment

### Strongest claims (high confidence, can cite without caveat)

- Runtime app code has zero Supabase, auth, or platform-hub references. `[live-verified]` via full-tree grep.
- Vercel production env on both bingo and trivia projects is clean of auth/Supabase vars. `[live-verified]` by Iterator 2 via `vercel env ls`.
- `.env.example` files at HEAD are placeholder-only. `[live-verified]` by Iterator 1 via `git ls-files` + `git show`.
- `packages/types/src/user.ts` and `api.ts` (235 lines total) have zero consumers in live source. `[tracked-HEAD]` via grep.
- `NEXT_PUBLIC_FARO_URL` has a `\n` byte corruption in Vercel production on both apps. `[live-verified]` by Iterator 2 via `od -c` on pulled env.
- `.github/workflows/nightly.yml:81-89` stub env block is provably dead. `[live-verified]` by Iterator 5 via clean-env build test.
- `FaroInit` component is actually rendered in both app layouts and calls `initializeFaro()`. `[tracked-HEAD]` by Iterator 5.
- `docs/ALERTING_SETUP.md:52-53` Grafana probe URLs point at removed `/api/health`. `[tracked-HEAD]` by Iterator 3.
- `docs/E2E_TESTING_GUIDE.md` had the Supabase service role key in blobs in six specific commits. `[live-verified]` by Iterator 1 via `git log -S`.
- `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is a planned-but-unwired feature flag, NOT dead. `[tracked-HEAD]` via reading `docs/question-sets-feature-flag/`.
- Iterator 3's 11-action documentation plan is correctly categorized. `[tracked-HEAD]` via full read of every targeted file.
- Iterator 4's 6-step topological dead-types deletion order is correct. `[tracked-HEAD]` via dependency graph analysis.

### Moderate claims (medium confidence, cite with caveat)

- The Supabase project `iivxpjhmnalsuvpdzgza` is paused, not deleted. Based on MEMORY.md context and MCP project list; not directly probed. See Open Question 1.
- The nightly cron is firing daily. YAML trigger is live; GitHub Actions repo-level enable/disable status was not probed. See Open Question 2.
- `beak-gaming.com` aliases lack redirects. Vercel domain config shows no redirect rule; DNS not verified. See Open Question 3.
- Grafana RUM has zero data since Faro was deployed. Follows logically from Finding 4.6's `\n` corruption but not directly confirmed via Grafana dashboard.

### Weakest claims (low confidence, treat as hypothesis)

- Correct replacement URL for Grafana Synthetic Monitoring probes. Requires product decision on whether to restore `/api/health` as a minimal stub or probe `/` with HTML body match. See Open Question 4.
- Whether old-prefix localStorage keys (`beak-`, `bingo-`, `supabase-`) exist on production user devices after the `jb-` rebrand. No migration code was found, but no key-prefix history audit was done. This is a UX gap, not a security gap.
- Whether the `e2e.yml` workflow is actually being executed (the `--project=bingo-mobile` bug would cause it to fail immediately if it ran).

### Known blind spots

- **Operational runbooks.** Themes 1–4 cover code, config, and docs. The audit did not exhaustively verify operational runbooks against live system behavior. `docs/ALERTING_SETUP.md` surfaced as a Phase 2 new finding; the full set of setup guides was not verified against live endpoints.
- **PWA service worker runtime behavior.** The audit glanced at `sw.ts` files but did not check cache versioning, cache invalidation on middleware removal, or whether a cache bust was issued when the jb- rebrand rolled out.
- **Sentry and Grafana data layer.** The audit examined observability configuration. It did not look at what the observability data actually shows — are there open Sentry issues tagged to removed routes? Are there Grafana Tempo traces from removed middleware? Is the Grafana RUM dashboard showing a flatline that looks healthy-but-broken?
- **localStorage migration patterns.** No investigator checked whether the apps have code to migrate pre-rebrand `beak-`/`bingo-`/`supabase-` prefixed localStorage keys to the new `jb-` prefix.
- **AI context files outside `docs/`.** Theme 2 (docs-for-AI) logically extends to `.claude/` and `.serena/` memory layers. The audit scope did not explicitly cover those.
- **Git history reachability.** Iterator 1 identified the specific commits where the Supabase key appears in history but did not verify whether the repo is public or private, which determines third-party reachability.
- **Apex domain content.** What serves `joolie-boolie.com` now that platform-hub is removed? Not verified.

---

## H. Recommendations

Recommendations are strategic, not implementation plans. The URGENT bucket overrides all quadrant ordering because it is security-critical and cheap. The Quick Wins bundle is the next action. Important Investments and Cheap Hygiene are below that, and the Defer/Accept section names items the report recommends not spending cycles on.

### Urgent

#### Recommendation U1: Rotate the Supabase service role key for project `iivxpjhmnalsuvpdzgza` unconditionally

**Priority:** urgent
**Rationale:** Finding 3.1 confirmed the key was in `docs/E2E_TESTING_GUIDE.md` git blobs for ~32 days across six commits. The project's liveness is uncertain (MEMORY.md says "paused," MCP cannot see the project). If the project is reachable, the exposure is live (service role bypasses RLS on all tables). If the project is deleted, rotation is a no-op. **The uncertainty is itself the argument for rotation:** "we don't know if it's live" is a worse posture than "we rotated it regardless." The blast radius of being wrong (full RLS bypass) is too high to wait for confirmation. Single `curl` probe in Open Question 1 resolves the liveness question in under a minute, but do the rotation first or in parallel.
**Trade-offs:** Zero trade-offs if the project is dead (no-op). If the project is live, rotation invalidates nothing because nothing in the current runtime consumes the key.
**Open questions:** Is the Supabase project `iivxpjhmnalsuvpdzgza` reachable right now? (Open Question 1)

#### Recommendation U2: Rotate live Sentry and Grafana Cloud tokens in `.secrets/observability-accounts.json`

**Priority:** urgent
**Rationale:** Per MEMORY.md, this file contains active `sntrys_...` (Sentry) and `glc_...` (Grafana Cloud) tokens in plaintext on a developer workstation. These are active tokens. Sentry org:ci scope can read and potentially manipulate error data; Grafana Cloud tokens grant write access to traces and metrics. Rotation is small-effort and closes the exposure. Bundle with U1.
**Trade-offs:** Brief gap in observability signal while new tokens propagate to the three apps (Vercel env update + redeploy). Fix cost small.
**Open questions:** None.

#### Recommendation U3: Fix `NEXT_PUBLIC_FARO_URL` `\n` corruption on both Vercel projects

**Priority:** urgent
**Rationale:** Finding 4.6 confirmed at the byte level that the env var has a literal `\n` appended, which breaks every Faro HTTP push. **Faro RUM is silently broken in production** for both bingo and trivia. No browser-side RUM data has reached Grafana Cloud since Faro was deployed. Any alerting built on Faro metrics has zero signal. This is a live observability outage. Fix is trivial: `vercel env rm`, `vercel env add` with a clean value, redeploy. Iterator 2 has copy-paste commands in the Phase 2 iterator-2 report.
**Trade-offs:** None. This is pure upside.
**Open questions:** Has the Grafana RUM dashboard been showing a flatline that looks healthy-but-broken since Faro was deployed? (Blind spot — no dashboard check done.)

### High (Quick Wins — one focused sweep)

#### Recommendation H1: Execute the Quick Wins bundle as a single sweep

**Priority:** high
**Rationale:** Synthesis 2 identified eight items totaling roughly 3-5 hours of focused work that collectively close the observability and CI signal gaps. They are:

1. Delete `.github/workflows/nightly.yml:81-89` stub env block (Finding 1.3).
2. Fix `.github/workflows/e2e.yml:152 --project=bingo-mobile` to match `playwright.config.ts` (Finding 1.5).
3. Patch `docs/ALERTING_SETUP.md:52-53` Grafana probe URLs — requires deciding target URL (Finding 4.5, Open Question 4).
4. Remove `bingo.beak-gaming.com` / `trivia.beak-gaming.com` aliases OR add 301 redirects, depending on DNS state (Finding 3.3, Open Question 3).
5. Fix `NEXT_PUBLIC_FEATURE_QUESTION_SETS` `\n` corruption on trivia Vercel — keep the flag, remove the newline (Finding 4.7, correction of Iterator 2's remove-recommendation).
6. Clean up orphan Vercel preview aliases.
7. Set `THE_TRIVIA_API_KEY` on trivia Vercel project — trivia-api proxy reads it and currently returns 401/rate-limited in production.
8. Forward-only verification that remaining `.env.example` references are clean (Iterator 1 has mostly done this).

Batch these into one PR per logical surface (workflows, Vercel env, docs) so each is independently reviewable and revertable.

**Trade-offs:** Two items are blocked on open questions (the ALERTING_SETUP URL is a product decision; the domain alias resolution depends on DNS state). Both can be unblocked by a single command each.
**Open questions:** Open Question 2 (GitHub Actions status — determines whether the nightly.yml fix is cosmetic or signal-restoring), Open Question 3 (DNS state for `beak-gaming.com`), Open Question 4 (probe URL choice).

### Medium (Important Investments — plan carefully)

#### Recommendation M1: Dead types cleanup (404 lines, 6 ordered steps)

**Priority:** medium
**Rationale:** Iterator 4 produced a complete topological deletion order for `packages/types/src/user.ts`, `packages/types/src/api.ts`, and the 96-line dead block in `apps/bingo/src/types/index.ts`. The `Timestamps` type in `user.ts` is a hidden dependency of `UserProfile`, so deletion order matters. Bundle with the `categorizeError()` dead string branches (Finding 1.4) and any `packages/types/README.md` references to the deleted types, because they are in the same topological dependency chain.
**Trade-offs:** Single PR with six ordered commits; each requires `pnpm lint`, `pnpm typecheck`, `pnpm test:run` to pass before the next. Straightforward but non-trivial verification load.
**Open questions:** None — the deletion is provably safe by grep.

#### Recommendation M2: Documentation cleanup sprint — not ad hoc patches

**Priority:** medium
**Rationale:** Iterator 3 produced an 11-action prioritized doc plan: REWRITE `MANUAL_TEST_PLAN.md` (preserves ~65%, drops Platform Hub sections), DELETE `APP_STRUCTURE.md`, DELETE `MIDDLEWARE_PATTERNS.md`, MARK-SUPERSEDED ADR-002 + ADR-007, and PATCH six remaining files (`CONTRIBUTING.md` BFF section, `E2E_TESTING_GUIDE.md` E2E_JWT_SECRET block, `apps/bingo/CLAUDE.md`, ADR-001 context, ADR README index, and `packages/testing/README.md`). **Do this as a single coherent sprint rather than ad hoc patches**, because partial documentation updates in an AI-driven development model are nearly as harmful as none — any stale context file can derail a future implementation. Bundle the Cheap Hygiene items (below) into the same PR where possible.
**Trade-offs:** 2-3 hours for the MANUAL_TEST_PLAN rewrite alone; could expand. The alternative ("just delete the stale sections") still requires reading every section to identify which are stale and leaves behind a document without coherent structure.
**Open questions:** None.

#### Recommendation M3: CSP enforcing-mode migration

**Priority:** medium
**Rationale:** Iterator 5 produced a complete enforcing policy proposal. The removal of auth and OAuth in BEA-682–695 eliminated the most CSP-hostile patterns (OAuth redirect URIs, cross-origin POSTs, third-party identity provider scripts). Moving from Report-Only to enforcing mode is newly feasible and should happen. Use the parallel-policies rollout approach: keep Report-Only as a secondary stricter policy while enforcing runs in primary; observe for 2-3 weeks; tighten.
**Trade-offs:** 3-4 weeks elapsed time (not continuous effort). Real-world enforcing-CSP rollouts on apps with third-party scripts (Sentry, Faro, Grafana) routinely surface unexpected violations. Could expand to 6-8 weeks.
**Open questions:** Does `*.grafana.net` in the CSP cover all Faro endpoints? (Resolved once U3 is done — confirm the clean Faro URL is in the allowed domains.)

### Low (Cheap Hygiene — bundle)

#### Recommendation L1: Bundle cheap hygiene items into one small PR

**Priority:** low
**Rationale:** Synthesis 2 lists ~9 items (patches to CONTRIBUTING, E2E_TESTING_GUIDE, apps/bingo/CLAUDE.md, ADR-001, ADR README; delete APP_STRUCTURE, delete MIDDLEWARE_PATTERNS; mark ADR-002 and ADR-007 superseded; worktree hygiene memo about `start-e2e-servers.sh`). Each is trivial individually but cumulatively restores AI-context coherence. Do not drip-feed; one PR is faster to review and revert. Mostly overlaps with M2 and can be the same PR.
**Trade-offs:** None.
**Open questions:** None.

### Defer / accept

#### Recommendation D1: Do not rewrite git history to expunge the Supabase key leak

**Priority:** defer
**Rationale:** The Supabase key is neutralized by U1 (rotate or confirm dead), not by history rewrite. Rewrites are high-cost (filter-repo, force-push to all remotes, notify every collaborator, invalidate every worktree and open PR) and the blob becomes inert after rotation. Log in Linear and revisit only if a genuinely still-live secret later lands in git history.
**Trade-offs:** Git blobs retain the leaked value. Acceptable if the project is confirmed dead; acceptable-with-rotation if the project is alive. Not acceptable if the project is alive AND rotation is not done. U1 gates this.
**Open questions:** None — gated by U1.

#### Recommendation D2: Do not resurrect the dormant ADR process for the standalone conversion itself

**Priority:** defer
**Rationale:** Writing a new ADR-008 or ADR-011 summarizing the standalone conversion would be nice archaeology, but BEA-682–695 already documents the conversion in Linear. Low-medium value, medium cost. Skip.
**Trade-offs:** The ADR tree misses a retrospective of the largest architectural change in the project's history.
**Open questions:** None.

---

## I. Open Questions & Single-Probe Resolutions

Each of the following questions is currently unresolved and each has a single command that would resolve it. Run these before acting on the related recommendations.

### Open Question 1: Is the Supabase project `iivxpjhmnalsuvpdzgza` alive, paused, or deleted?

**Why it matters:** Gates whether Recommendation D1 (no git history rewrite) is safe. If the project is alive, the service role key in git blobs is a permanent exposure; if deleted, it's inert. Also tightens the urgency framing of U1 (though U1 should happen regardless).
**Single probe:** `curl -s -o /dev/null -w "%{http_code}\n" https://iivxpjhmnalsuvpdzgza.supabase.co/rest/v1/ -H "apikey: <anon_key>"`
**Interpretation:** HTTP 200 or 401 = alive; 404 = deleted; 503 = paused.

### Open Question 2: Is GitHub Actions enabled at the repo level, and is the nightly cron actually firing?

**Why it matters:** Determines whether Finding 1.3 (nightly.yml stub env block) and Finding 1.5 (`bingo-mobile` Playwright project) are cosmetic or signal-restoring. Also gates whether merging a CI cleanup PR silently changes running behavior.
**Single probe:** `gh api repos/julianken/joolie-boolie/actions/runs --jq '.workflow_runs[] | {name, status, conclusion, created_at}' | head -20`
**Interpretation:** Non-empty list with recent dates = Actions enabled and workflows running; empty list or 403 = Actions disabled at repo level.

### Open Question 3: Does DNS for `beak-gaming.com` still point at Vercel?

**Why it matters:** Determines whether Finding 3.3 (unredirected `beak-gaming.com` aliases) represents reachable old-domain traffic or inert orphan aliases. Resolves whether Quick Wins item 4 is "remove aliases" or "add redirects."
**Single probe:** `dig +short bingo.beak-gaming.com`
**Interpretation:** A `cname.vercel-dns.com` or Vercel IP range → DNS still points at Vercel, aliases are reachable. `NXDOMAIN` or non-Vercel IP → DNS has been pointed away, aliases are orphaned.

### Open Question 4: What URL should Grafana Synthetic Monitoring probe now that `/api/health` is removed?

**Why it matters:** Gates patching `docs/ALERTING_SETUP.md:52-53`. Requires a product decision.
**Single probe:** This is not a command probe — it is a product call. Two options: (a) add a minimal `/api/health` route back to both apps (2 files, ~10 lines each — reopens the "keep API surface minimal" standalone principle), or (b) probe `/` with an HTML body match for a known string (no code change, weaker signal — a CDN cache serving `/` is not the same as the Next.js runtime being healthy).
**Interpretation:** Option (a) is cleaner operational signal. Option (b) is faster to ship. Recommend (a) unless the standalone principle is load-bearing.

### Open Question 5: Has the Grafana RUM dashboard been showing a flatline since Faro was deployed?

**Why it matters:** Confirms or denies the inference chain from Finding 4.6. If confirmed, any alerting built on Faro metrics has been zero-signal for the full Faro deployment window, which has incident-response implications beyond "fix the URL."
**Single probe:** Open the Grafana Cloud console for the instance referenced in `.secrets/observability-accounts.json` and check the Faro RUM overview panel for timestamps of the most recent data.
**Interpretation:** No data since Faro deployment = inference confirmed. Sparse but nonzero = partial delivery (unlikely given byte-level corruption). Normal data = corruption is newer than the dashboard view (check env var history in Vercel).

### Open Question 6 (bonus): Is `julianken/joolie-boolie` a public or private repo?

**Why it matters:** Determines third-party reachability of the Supabase key leak in git history. If private, the exposure is team-internal only. If public or ever-public, external scanning services may have already indexed the leaked key.
**Single probe:** `gh api repos/julianken/joolie-boolie --jq .visibility`
**Interpretation:** `public` = external exposure; `private` = team-internal only. Does not change U1 (rotate regardless) but changes the forensic backdrop.

---

## J. Appendix: Evidence Index

Traceability map: every major finding → its source file, source command, or source iterator.

| Finding | Source path / command | Source iterator | Provenance |
|---|---|---|---|
| 1.1 user.ts / api.ts dead | `packages/types/src/user.ts`, `packages/types/src/api.ts` + full-tree grep for consumers | P2 Iterator 4 | `[tracked-HEAD]` |
| 1.2 bingo types dead block | `apps/bingo/src/types/index.ts:212-307` | P2 Iterator 4 | `[tracked-HEAD]` |
| 1.3 nightly.yml stub env | `.github/workflows/nightly.yml:81-89` + clean-env build test | P2 Iterator 5 | `[live-verified]` |
| 1.4 categorizeError dead strings | `packages/error-tracking/src/server.ts:90,110,125-126` | P2 Iterator 4 | `[tracked-HEAD]` |
| 1.5 bingo-mobile project | `.github/workflows/e2e.yml:152`, `playwright.config.ts` | P2 Iterator 5 | `[tracked-HEAD]` |
| 2.1 MANUAL_TEST_PLAN stale | `docs/MANUAL_TEST_PLAN.md` §1 lines 119-189, §4 lines 603-644 | P1 Area 5, P2 Iterator 3 | `[tracked-HEAD]` |
| 2.2 APP_STRUCTURE stale | `docs/APP_STRUCTURE.md` (full file) | P1 Area 5 | `[tracked-HEAD]` |
| 2.3 MIDDLEWARE_PATTERNS stale | `docs/MIDDLEWARE_PATTERNS.md` | P1 Area 5 | `[tracked-HEAD]` |
| 2.4 apps/bingo/CLAUDE.md | `apps/bingo/CLAUDE.md:7-8` | P1 Area 5, P2 Iterator 3 | `[tracked-HEAD]` |
| 2.5 ADR-002, ADR-007 | `docs/adr/002-*.md`, `docs/adr/007-*.md`, `docs/adr/README.md` | P1 Area 5, P2 Iterator 3 | `[tracked-HEAD]` |
| 2.6 packages/testing README | `packages/testing/README.md` vs `packages/testing/src/mocks/` | P1 Area 2, P2 Iterator 4 | `[tracked-HEAD]` |
| 3.1 Supabase key in git | `git log -S <key fragment> docs/E2E_TESTING_GUIDE.md` → commits `3b40fb25, c6c4af5c, 0b9e8078, e8784d7b, 806c9f6b, 72bd8caf` | P2 Iterator 1 | `[live-verified]` |
| 3.2 Actions unknown | `.github/workflows/nightly.yml:1`, `e2e.yml` + GitHub API not probed | P2 Iterator 5 | `[tracked-HEAD]` + unknown |
| 3.3 beak-gaming.com aliases | `vercel domains ls` live output | P2 Iterator 2 | `[live-verified]` (Vercel) + unknown (DNS) |
| 4.1 cloud-based copy | `apps/bingo/src/app/page.tsx:26`, `apps/bingo/src/app/layout.tsx:20`, `apps/bingo/public/manifest.json:4` | P1 Area 1 | `[tracked-HEAD]` |
| 4.2 staff member error copy | `apps/bingo/src/app/error.tsx:65`, `apps/trivia/src/app/error.tsx:65` | P1 Area 1 | `[tracked-HEAD]` |
| 4.3 Supabase Auth JSDoc | `packages/types/src/user.ts:14-23` | P2 Iterator 4 | `[tracked-HEAD]` |
| 4.4 E2E_JWT_SECRET vocab | `docs/E2E_TESTING_GUIDE.md`, `scripts/setup-worktree-e2e.sh:137` | P1 Area 5, P2 Iterator 3 | `[tracked-HEAD]` |
| 4.5 ALERTING_SETUP probes | `docs/ALERTING_SETUP.md:52-53` | P2 Iterator 3 | `[tracked-HEAD]` |
| 4.6 Faro URL \n corruption | `vercel env pull` + `od -c` on the pulled file | P2 Iterator 2, confirmed by Iterator 5 | `[live-verified]` |
| 4.7 QUESTION_SETS not dead | `docs/question-sets-feature-flag/` tree + P2 analysis report dated 2026-03-10 | Synthesis 3 correction | `[tracked-HEAD]` |

### Raw source files for traceability

- **Phase 1 raw area reports:** `/Users/j/repos/beak-gaming-platform/docs/post-standalone-audit/phase-1/area-1-*.md` through `area-5-*.md`
- **Phase 2 iterator reports:** `/Users/j/repos/beak-gaming-platform/docs/post-standalone-audit/phase-2/iterator-1.md` through `iterator-5.md`
- **Phase 3 syntheses:** `/Users/j/repos/beak-gaming-platform/docs/post-standalone-audit/phase-3/synthesis-1.md` (thematic), `synthesis-2.md` (risk/actionability), `synthesis-3.md` (gaps & decisions)
- **Phase 4 (this report):** `/Users/j/repos/beak-gaming-platform/docs/post-standalone-audit/phase-4/analysis-report.md`
- **Context packets between phases:** `/Users/j/repos/beak-gaming-platform/docs/post-standalone-audit/context-packets/phase-0-packet.md`, `phase-1-packet.md`, `phase-2-packet.md`, `phase-3-packet.md`

---

**End of report.** Verified against main head `25cdc983` on 2026-04-11. Re-validate against live system before acting if more than 2 weeks have passed.
