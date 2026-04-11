# Synthesis: Thematic

## Synthesis Approach

The evidence from Phase 1 and Phase 2 spans five investigative areas (user copy, code, security/infra, test/tooling, docs) and five verification iterations (security triage, Vercel env, docs restructure, dead types cleanup, CI/CSP validation). Rather than re-partitioning by domain, this synthesis looks across domain lines for the underlying patterns that explain why drift occurred and persisted after a substantial, intentional cleanup wave. The question is not "what is left?" but "why is it still there?"

The organizing principle is mechanism: each theme names a structural reason why a specific class of artifact was left behind. This framing is deliberately different from the area carving in Phase 1 (which asked "where?") and from Phase 2's correction work (which asked "how severe?"). Themes answer "why this category of artifact resisted cleanup."

## Core Narrative

The standalone conversion (BEA-682–695) was a successful deletion campaign against runtime code. The application logic — imports, stores, hooks, routes, middleware — was cleaned with high fidelity. What the campaign did not reach, or reached only partially, was the surfaces that describe, configure, and govern the code rather than execute it: documentation that teaches humans, configuration that instructs tooling, type definitions that express vocabulary, and copy that communicates identity to users. These surfaces share a common trait: they are consulted or displayed rather than compiled or executed, so their staleness produces no test failures and no immediate runtime errors.

The result is a codebase where what you run is correct but what you read is wrong. An engineer who boots the app sees a clean application. An engineer who reads the docs, the types, the CI workflows, or the landing-page copy encounters a ghost architecture. This gap between execution reality and description reality is the master pattern the audit found. Each of the four subordinate themes below names a specific mechanism by which that gap was created or perpetuated.

## Themes

### Theme 1: The Cleanup Stopped at the Compiler Boundary

- **Pattern:** The standalone conversion deleted everything the TypeScript compiler and bundler would reject if missing — imported modules, consumed hooks, referenced API routes, middleware files. It stopped at the boundary where deletion would have been invisible to the build: exported but unconsumed types, CI env vars that inject into a build that succeeds without them, error-categorization branches that can never fire, documentation files that are neither imported nor linted.
- **Supporting evidence:**
  - `packages/types/src/user.ts` (92 lines) and `packages/types/src/api.ts` (143 lines) export 15+ auth/API types with zero consumers in live source. They compile fine, are re-exported from the barrel, and will never be flagged by `tsc` or Vitest. (Phase 2 Iterator 4)
  - `apps/bingo/src/types/index.ts:212-307` — ~96 lines of dead bingo-specific auth-era types. Same pattern: compiled but unconsumed. (Phase 2 Iterator 4)
  - `.github/workflows/nightly.yml:81-89` injects 5 defunct env vars (`SUPABASE_URL`, `OAUTH_*`, etc.) into `pnpm build`. The clean-env build test proved the build succeeds with zero of these vars; the stub block breaks nothing and fixes nothing, which is exactly why it survived. (Phase 2 Iterator 5)
  - `packages/error-tracking/src/server.ts:90,110,125-126` — `categorizeError()` still contains `jwt`/`supabase`/`postgres` string matches that will never fire because those error types are no longer produced. (Phase 2 Iterator 4)
- **Confidence:** High. The pattern is consistent across four independent investigative threads, all of which found the same characteristic: items survive because their absence produces no observable failure.
- **Caveat:** Some "dead" exports may be intentionally preserved for forward-compatibility. `NEXT_PUBLIC_FEATURE_QUESTION_SETS` (Phase 2 Iterator 2) is ambiguous. The theme holds firmly for `user.ts` and `api.ts`, which have no conceivable future use in a localStorage-only app.

---

### Theme 2: Documentation Was Written for Humans, Maintained for AI — and Neither Happened

- **Pattern:** The documentation layer accumulated the highest concentration of stale content, and the specific items most stale are exactly the ones most likely to be fed to an AI agent as context: `CLAUDE.md`, `docs/MANUAL_TEST_PLAN.md`, `docs/APP_STRUCTURE.md`, `docs/MIDDLEWARE_PATTERNS.md`, and the ADR files. These are not just descriptively wrong — they actively mislead the AI development model that this project relies on exclusively. The drift here has a feedback-loop quality: stale docs cause agents to generate code matching the wrong model, which requires corrective passes, which produces more drift in adjacent files.
- **Supporting evidence:**
  - `docs/MANUAL_TEST_PLAN.md` Section 1 (lines 119–189) and Section 4 (lines 603–644) describe Platform Hub login, OAuth consent, and SSO flows at `localhost:3002` — an app that was deleted in Wave 1. An agent reading this file to plan a test encounters instructions for a nonexistent app. (Phase 1 Area 5, Phase 2 Iterator 3)
  - `docs/APP_STRUCTURE.md` describes `app/api/auth/`, `lib/auth/`, `middleware.ts` with "OAuth JWT verification," and a full Platform Hub section — the exact architecture deleted in BEA-682–695. (Phase 1 Area 5)
  - `apps/bingo/CLAUDE.md:7-8` describes the app as "cloud-based" and mentions "admin accounts for saved configurations." This is a direct AI context file read by every agent working on Bingo. (Phase 1 Area 5, Phase 2 Iterator 3 patch list)
  - `docs/MIDDLEWARE_PATTERNS.md` lists both `apps/bingo/src/middleware.ts` and `apps/trivia/src/middleware.ts` as "files using this pattern" — both deleted in BEA-696 (`25cdc983`). (Phase 1 Area 5)
  - `packages/testing/README.md` prominently documents Supabase mock exports (`createMockSupabaseClient`) that do not exist in `packages/testing/src/mocks/` source. Phase 2 Iterator 4 confirmed: the README advertises a dead API. (Phase 1 Area 2, Phase 2 Iterator 4)
  - ADR-002 is "Accepted" status describing the synthetic JWT E2E auth flow built on Platform Hub — removed infrastructure, no supersession note, still listed without annotation in the ADR README index. (Phase 1 Area 5, Phase 2 Iterator 3)
- **Confidence:** High. Every documentation finding in Phase 1 and Phase 2 targets a file that would be consumed by an AI agent as authoritative context. The pattern is consistent and wide.
- **Caveat:** The AI-feedback-loop risk is a consequence of the general documentation drift problem, not its exclusive cause. Human developers reading these docs would be equally misled. The AI dimension amplifies the stakes but does not change the underlying mechanism.

---

### Theme 3: Point-in-Time Snapshots Were Treated as Ground Truth

- **Pattern:** Several Phase 1 findings scored as critical turned out to be based on filesystem artifacts that represented a specific historical moment — stale pulled env files with `mtime Feb 4`, a worktree-local untracked `start-e2e-servers.sh`, `.env.example` files scanned before a cleanup PR landed. This is not purely investigator error; the codebase accumulates locally-derived, gitignored files (pulled Vercel env, generated start scripts, backup `.env` copies) that carry historical state without any mechanism to signal their staleness. The repo's ambient local context is chronologically mixed.
- **Supporting evidence:**
  - `apps/{bingo,trivia}/.vercel/.env.production.local` had `mtime Feb 4 22:59:10 2026` — 65+ days stale at audit time. Phase 1 Area 3 reported this as live Vercel production state; Phase 2 Iterator 2 ran `vercel env ls` live and found zero auth vars. (Phase 2 Iterator 2, phase-2-packet finding 2)
  - `start-e2e-servers.sh` at repo root was read by Phase 1 Area 4 as a tracked file containing `pnpm --filter @joolie-boolie/platform-hub dev`. Phase 2 Iterator 5 ran `git ls-files start-e2e-servers.sh` and found the file untracked; `.gitignore:71` explicitly ignores it. The file was a stale worktree copy predating BEA-693's generator update. (Phase 2 Iterator 5, phase-2-packet finding 4)
  - Root `.env.example`, bingo `.env.example`, trivia `.env.example` — described in Phase 1 as containing real Supabase credentials. Phase 2 Iterator 1 verified that `de391ab5` (PR #516, 2026-04-09) rewrote all three to placeholder-only content; Phase 1 scanned during or before that cleanup. (Phase 2 Iterator 1, phase-2-packet finding 1)
  - `docs/E2E_TESTING_GUIDE.md` — live `SUPABASE_SERVICE_ROLE_KEY` in git history for ~32 days (commits `3b40fb25` through `72bd8caf`). Requires `git log`-level verification to detect; on-disk HEAD is clean. (Phase 2 Iterator 1)
- **Confidence:** High. Phase 2 directly falsified three Phase 1 critical findings using live verification commands. The falsifications share the same root cause: on-disk artifacts without verified relationship to live system state.
- **Caveat:** This theme is partly a finding about audit methodology, not solely about the codebase. The codebase's contribution is the existence of the stale files — pulled env files, gitignored generated scripts, backup copies — which create ambient misleading context. Remediation belongs to both the audit process and the local developer hygiene conventions.

---

### Theme 4: Infrastructure Was Deleted But Its Vocabulary Was Not

- **Pattern:** The standalone conversion deleted the infrastructure that gave specific vocabulary its meaning: "cloud-based," "staff member," "admin accounts," "Part of Joolie Boolie," `E2E_JWT_SECRET`, `SESSION_TOKEN_SECRET`, `GameSession`, `Session`. The infrastructure was deleted but the vocabulary persisted in user-facing copy, error messages, documentation, type JSDoc, env var names, and operational runbooks. The vocabulary now floats without referent, creating meaning mismatches that compound: a user reading "cloud-based" infers server-side state; an agent reading `Session` with JSDoc "UUID from Supabase Auth" infers auth infrastructure; a developer reading "let a staff member know" infers a managed venue deployment.
- **Supporting evidence:**
  - `apps/bingo/src/app/page.tsx:26`, `apps/bingo/src/app/layout.tsx:20`, `apps/bingo/public/manifest.json:4` — "cloud-based" appears in landing copy, `<meta description>`, and PWA manifest for an app with localStorage-only persistence. (Phase 1 Area 1)
  - `apps/bingo/src/app/error.tsx:65`, `apps/trivia/src/app/error.tsx:65` — "let a staff member know" and "contact support" on error pages for a self-service app with no support channel or staff. (Phase 1 Area 1)
  - `packages/types/src/user.ts:14-23` — `User.id` JSDoc reads "UUID from Supabase Auth" on a type with zero consumers in a codebase with no Supabase. The vocabulary outlived the system it named. (Phase 2 Iterator 4)
  - `docs/E2E_TESTING_GUIDE.md` and `scripts/setup-worktree-e2e.sh:137` — document and reference `E2E_JWT_SECRET` as a required startup guard. The middleware that verified the JWT was deleted in BEA-696; the vocabulary outlived the mechanism. (Phase 1 Area 5, Phase 2 Iterator 3 patch list)
  - `apps/bingo/src/app/page.tsx:193-196` — "Part of Joolie Boolie — games for groups and communities" footer implies a navigable platform parent that no longer exists. (Phase 1 Area 1)
  - `docs/ALERTING_SETUP.md:52-53` — health check probe URLs pointing at removed `/api/health` endpoint. An operator following this doc configures permanently broken Grafana Synthetic Monitoring probes. (Phase 2 Iterator 3, new finding not in Phase 1)
- **Confidence:** High for copy, documentation, and env vocabulary. Medium for type JSDoc specifically (minor relative to structural items).
- **Caveat:** "Cloud-based" is technically defensible — the app is hosted on Vercel's cloud infrastructure. The user-perception confusion is the real problem, not strict falsity. The other vocabulary items (staff member, admin accounts, `E2E_JWT_SECRET`, `Session` JSDoc) are unambiguous.

---

## Theme Relationships

Themes 1 and 4 are tightly coupled. Dead types (Theme 1) often carry dead vocabulary (Theme 4) in their JSDoc and field names — they are simultaneously invisible to the compiler and semantically misleading to readers. Deleting `user.ts` and `api.ts` resolves a subset of the vocabulary problem automatically.

Theme 2 is orthogonal to Themes 1 and 4 in mechanism (AI feedback loop vs. compiler boundary vs. vocabulary persistence) but shares the same root cause: documentation, like unexported types and unused env vars, is not compiled, tested, or verified against the running system. Documentation cleanup does not help with dead types, and dead-type cleanup does not help with docs.

Theme 3 is methodological rather than architectural. It describes a hazard in how the repo is analyzed, not how it functions. It is substantially orthogonal to the other three and should be understood as a caveat on confidence levels throughout the audit rather than a remediation target in its own right. The practical implication is that any cleanup PR should verify current state via live commands (`vercel env ls`, `git ls-files`, `git log`) rather than trusting on-disk snapshots.

Themes 1 and 2 together constitute the core cleanup backlog. Themes 3 and 4 are diagnostic: Theme 3 explains why audit findings have uneven confidence, and Theme 4 explains why the drift is epistemically harmful beyond mere dead code volume.

---

## Blind Spots

**Operational surface.** Themes 1–4 cover code, config, and docs. The audit did not exhaustively verify operational runbooks against live system behavior. `docs/ALERTING_SETUP.md:52-53` surfaced late as a Phase 2 new finding — a single example of operational drift that probably has more instances in `docs/`. The full set of setup guides and runbooks was not verified against live endpoints.

**The Vercel domain alias gap.** Phase 2 Iterator 2 found that `bingo.beak-gaming.com` and `trivia.beak-gaming.com` are still attached as Vercel aliases without 301 redirects, contradicting the project memory's claim that redirects exist. This is a live infrastructure misconfiguration that does not fit any of the four themes — not dead code, not stale documentation, not vocabulary drift, not snapshot staleness. It is an active operational gap.

**Forward-compatibility ambiguity.** Thematic analysis cannot resolve whether `NEXT_PUBLIC_FEATURE_QUESTION_SETS` and similar items are dead weight or placeholders for planned work. That requires a product-intent decision outside audit scope.

**The `\n` corruption in Faro URLs.** This is a live observability bug (Faro silently broken in production on both apps) unrelated to the standalone conversion and fitting none of the four themes. It is a data-integrity issue in how env vars were set. Phase 2 found it; the thematic lens does not surface it, which means a purely thematic cleanup plan would miss it.

**AI context files outside `docs/`.** Theme 2 (documentation misleads AI) should logically extend to the memory layer (`.claude/`, `.serena/`). The audit scope did not explicitly cover those files. Given the project's AI-only development model, they represent a real risk vector.

---

## Recommendations

The four themes imply a two-track remediation, sequenced to respect dependencies. Track A (Themes 1 and 4) targets dead code and vocabulary and should run first because it is mechanical and low-risk: delete `packages/types/src/user.ts` and `packages/types/src/api.ts` in topological order (after confirming `Timestamps` dependency chain per Iterator 4's analysis), remove the 96-line dead block in `apps/bingo/src/types/index.ts`, clean `packages/error-tracking/src/server.ts` error-category branches, and patch landing copy, error copy, and `E2E_JWT_SECRET` vocabulary references in the same commit so vocabulary and infrastructure deletion are atomic. Track B (Theme 2) targets documentation and should be treated as a single coherent sprint rather than ad hoc patches — Iterator 3's prioritized 11-action plan (REWRITE `MANUAL_TEST_PLAN`, DELETE `APP_STRUCTURE` + `MIDDLEWARE_PATTERNS`, MARK-SUPERSEDED ADR-002/ADR-007, PATCH 6 remaining files) is the right unit of work, because partial documentation updates are nearly as harmful as none in an AI-agent development model where any stale context file can derail a future implementation. Theme 3 implies a standing practice change: document in `docs/E2E_TESTING_GUIDE.md` or the worktree setup guide that on-disk `.vercel/.env.*.local` files should always be regenerated via `vercel env pull` before use, treating them as caches rather than sources of truth.
