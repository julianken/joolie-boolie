# Iteration: Documentation Restructure Strategy

## Assignment

Deep audit of structurally-stale documentation following the standalone conversion (BEA-682–695). For each stale doc: make a DELETE/REWRITE/MARK-SUPERSEDED/PATCH decision with full rationale, produce skeletons for REWRITEs, and surface any docs Area 5 missed. Decisions are based on full reads of all stale docs plus contrast reads of the clean docs.

---

## Per-Doc Decisions

### docs/MANUAL_TEST_PLAN.md

**Decision: REWRITE** (single unified file, not split)

**Rationale:** The document is structurally stale in three distinct ways. Section 1 (7 stories, lines 119-189) covers Platform Hub exclusively — login, signup, password reset, OAuth consent, dashboard, API health — all at `localhost:3002`. Section 4 (4 stories, lines 603-644) covers OAuth SSO cross-app flows, Hub security headers, E2E bypass security, and template aggregation — all removed infrastructure. The Prerequisites block (lines 29-55) instructs starting "all 3 apps," lists Platform Hub at port 3002, and tells testers to "authenticate via Supabase MCP or Platform Hub login." Sections 1 and 4 together total roughly 35% of the document. The Bugs Found table includes BEA-505 ("Platform Hub: Profile API returns 500 for E2E users"). The Automated E2E Coverage Reference claims "~137 Platform Hub E2E tests" and lists auth flows under Bingo and Trivia.

However, roughly 65% is high-quality, well-verified standalone content: Stories 2.2-2.11 (Bingo game controls, patterns, audio, dual-screen, themes, session recovery, guest mode) and 3.2-3.22 (Trivia team management, game lifecycle, scoring, rounds, TTS, keyboard shortcuts, scene choreography, timer auto-reveal, round scoring gate) with verified PASS results from runs 1-9 including multi-window dual-screen verification. Sections 5/6/7 (accessibility, PWA/offline, responsive) are clean verbatim.

The **split option** (separate bingo/trivia files) is rejected. The shared sections — Playwright MCP setup, dark mode convention, port table, test execution model, accessibility, PWA — would need duplication. A single file matches the existing path that CLAUDE.md references and keeps the two apps' test sections visually comparable for future triage.

**Rewrite skeleton:**

```
# Manual Test Plan — Joolie Boolie
[Purpose: Playwright MCP manual QA for visual/audio/interactive flows automated E2E cannot cover.]

## Quick Reference
[Table: section map for 2 apps only. Drop "Section 1 = Platform Hub" and "Section 4 = OAuth/SSO" rows.]

## Prerequisites
### 1. Start dev servers
[pnpm dev starts 2 apps. Port table: Bingo 3000, Trivia 3001. Drop Platform Hub row and "Starts all 3 apps with real auth" note.]
### 2. Playwright MCP browser setup
[Keep verbatim — dark mode emulation per MEMORY.md convention.]
### 3. Key Playwright MCP tools
[Keep verbatim.]
### 4. Tips
[Keep verbatim. Drop "authenticate via Supabase MCP" from old auth section entirely.]

## Execution History
[Preserve rows 1-9. Add a footnote: runs 1-8 included Platform Hub/OAuth flows now removed.]

## Bugs Found and Fixed
[Remove BEA-505 (Platform Hub). Keep BEA-503, BEA-504.]

## Notes
[Drop: "Template API returns E2E fixture data," "all 3 apps" security header note. Keep: Serwist SW, fullscreen API, offline mode, scoring controls note.]

## 1. Bingo
[Story 2.1 rewritten: remove "Sign in with Joolie Boolie" test and OAuth redirect test. Replace with: home loads, Play button works, statistics display, security headers on 2 apps.]
[Stories 2.2-2.11 preserved with minor edits: remove "Requires Auth" from 2.2 title; remove 2.11 tests 9 (sign in from guest OAuth) and 11 (auth token refresh). ~3 test cases removed total.]

## 2. Trivia
[Story 3.1 rewritten: remove SSO redirect test, remove "/play is protected" redirect test. Replace with: home loads, Question Sets link visible, security headers.]
[Stories 3.2-3.22 preserved with minor edits: remove "After auth" from 3.2 title. ~2 test cases removed.]
[Story 3.15.4 note "Template API 500 in E2E mode" updated or dropped.]

## 3. Accessibility & Accessible Design
[Section 5 verbatim.]

## 4. PWA & Offline
[Section 6 verbatim.]

## 5. Responsive Design
[Section 7. Remove Story 7.1 test 3 — Hub mobile. Renumber to Section 5.]

## Automated E2E Coverage Reference
[Rewrite entirely: remove Platform Hub section and auth flow bullet points. Update counts to reflect 2-app standalone reality.]
```

**What is dropped vs. kept:**
- DROP: Section 1 entirely (7 stories, ~70 lines), Section 4 entirely (4 stories, ~45 lines), Prerequisites §3 "Authentication," Platform Hub port row, BEA-505 bug row, "3 apps" notes, auth-specific test cases within 2.1/2.11/3.1
- KEEP: Stories 2.2-2.11 with minor edits, Stories 3.2-3.22 with minor edits, Sections 5/6/7 verbatim, execution history, Playwright MCP setup block

**Target length:** ~600-700 lines (down from ~752)

---

### docs/APP_STRUCTURE.md

**Decision: DELETE**

**Rationale:** The entire document describes the old architecture. The Game App Layout tree (lines 10-31) includes `api/auth/`, `api/templates/`, `api/sessions/`, `auth/callback/`, `lib/auth/`, `lib/session/`, and `middleware.ts` described as "OAuth JWT verification (lazy JWKS init)." The Platform Hub section (lines 58-95) describes an app that no longer exists. The Key Differences table (lines 97-105) has Platform Hub as a third column comparing auth roles.

`docs/ARCHITECTURE.md` already contains a correct and complete App Structure section (lines 47-65) showing the current layout: `app/api/` (minimal routes only), `app/play/`, `app/display/`, `components/presenter/`, `components/audience/`, `lib/game/`, `lib/sync/`, `stores/`, `hooks/`, `types/`. This was apparently rewritten as part of the standalone conversion and is accurate. APP_STRUCTURE.md is a separate file covering the same topic with entirely stale content.

**Where content migrates:** Nothing is lost. A minor addition to ARCHITECTURE.md noting trivia-specific (scene router, question editor) and bingo-specific (patterns/, ball-deck) subdirectory additions would close any gap without requiring a standalone file.

---

### docs/MIDDLEWARE_PATTERNS.md

**Decision: DELETE**

**Rationale:** The entire document documents the lazy JWKS initialization pattern for Next.js middleware. The "Files Using This Pattern" section (lines 60-63) lists `apps/bingo/src/middleware.ts` and `apps/trivia/src/middleware.ts` — both deleted in BEA-696. Neither app has middleware. The Anti-Pattern example shows Supabase JWKS fetching. The Correct Pattern shows OAuth JWT middleware. No current code implements or needs this pattern.

The underlying engineering principle (don't make network calls at module load time) has general validity but zero attachment to any current file. Preserving a 66-line document for a pattern with no consumer is actively misleading — a new developer would conclude the apps have middleware they can look up.

**Where content migrates:** Nothing. The archive link to `docs/archive/e2e-history/2026-01-23-fix-e2e-auth.md` (the full debugging session) remains in the archive.

---

### docs/E2E_TESTING_GUIDE.md

**Decision: PATCH**

**Rationale:** The document is largely accurate and high-quality. The production build mode section, deterministic waits section, port isolation section, test checklist, debugging guide, and CI/CD section are all correct. The drift is concentrated and surgical:

1. **Lines 15-36** (Prerequisites / E2E_JWT_SECRET block): Must be removed entirely. `playwright.config.ts` sets `E2E_TESTING=true` but zero source files read `E2E_JWT_SECRET` (confirmed via grep — only docs and `scripts/setup-worktree-e2e.sh:137` reference it). The statement "app will throw at startup if E2E_JWT_SECRET not set" is definitively false — the guard was deleted with the middleware. The new prerequisite is simply: valid `.env.local` with `THE_TRIVIA_API_KEY` for trivia.

2. **Lines 155-192** ("Quick Reference for Test Authors" / "What the Auth Fixture Does"): The fixture names `authenticatedBingoPage`/`authenticatedTriviaPage` are misleading misnomers — the fixture navigates to `/play` and dismisses the modal; no authentication occurs. The section should explain this plainly: the fixture names are historical artifacts, no auth setup happens, the "Retries up to 3x on rate limit errors" bullet no longer applies (that was for Supabase rate limits).

3. **`scripts/setup-worktree-e2e.sh:137`** (`export E2E_JWT_SECRET=...`): Should be removed in the same pass. This is a tooling change but belongs with this patch.

Total: ~30 lines removed/rewritten out of 586.

---

### CONTRIBUTING.md

**Decision: PATCH**

**Rationale:** Only the "BFF Pattern" subsection (lines 243-248) contains drift: "Frontend never talks directly to Supabase: Frontend → API Routes → Supabase." Everything else — AI-agent development model, Linear tracking, branch naming, commit conventions, test patterns, PR process, accessibility requirements — is accurate and well-written.

**Surgical change:** Replace the BFF Pattern subsection with:

```
### API Routes

API routes are minimal. The only server-side routes are:
- CSP report endpoint (`/api/csp-report`)
- Monitoring tunnel (`/api/monitoring`)
- Trivia API proxy (`/api/trivia` — keeps the API key server-side)

All data persistence is localStorage via Zustand persist middleware.
There is no database or auth backend.
```

Total: 6 lines replaced with ~8 lines.

---

### docs/adr/ADR-001-e2e-hash-port-isolation.md

**Decision: PATCH**

**Rationale:** The ADR is correct and describes live implemented behavior. The algorithm, the port formula, the files implementing it — all accurate and current. The only drift is: (a) Context section mentions "3002 (Platform Hub)" in the original hardcoded port list; (b) Algorithm step 6 says "Final ports: `3000 + portOffset`, `3001 + portOffset`, `3002 + portOffset`" — the third slot is unused now; (c) "Files implementing this decision" includes `e2e/fixtures/auth.ts -- consumes port config for hub/app URLs` — the hub URL reference may be vestigial.

**Surgical change:** Update the Context paragraph to note Platform Hub has been removed. Note in Algorithm step 6 that only the first two ports are used; the third slot is allocated but unused. Update or remove the `e2e/fixtures/auth.ts` file reference if hub URL is no longer consumed there.

Total: 3-4 lines.

---

### docs/adr/ADR-002-synthetic-jwt-auth-e2e.md

**Decision: MARK-SUPERSEDED**

**Rationale:** The entire ADR documents the synthetic JWT auth infrastructure — Platform Hub login route, `packages/auth/src/game-middleware.ts`, bingo/trivia middleware production guards — all deleted in BEA-696. The current status is "Accepted" which actively misleads. This is a historical record of a decision made and later reversed. It should not be deleted; ADRs are immutable records. The correct action is to update the status and add a brief supersession note.

**Change:** Update Status from "Accepted" to "Superseded." Add at the top of the document (after the Status header):

```
> **Superseded (2026-Q1):** Platform Hub, `packages/auth`, and bingo/trivia middleware were
> removed in the standalone conversion (BEA-682–696). No authentication infrastructure exists
> in the current codebase. `E2E_JWT_SECRET` is no longer read by any source file. 
> `e2e/fixtures/auth.ts` navigates directly to `/play` — no JWT setup occurs.
```

Do not rewrite the decision, rationale, or consequences. Preserve the historical record intact below the note.

---

### docs/adr/ADR-007-docker-isolation-rejected.md

**Decision: MARK-SUPERSEDED**

**Rationale:** The Status is already "Rejected" — this is a rejected ADR documenting an approach that was evaluated and discarded. The Supabase references in the rationale (point 4: "E2E tests use `E2E_TESTING=true` to bypass Supabase for auth (ADR-002)") are stale, but since this is historical the risk is low. However, the ADR-002 cross-reference points at a now-superseded ADR, which could cause a reader to follow a chain of increasingly stale decisions.

**Change:** Add one sentence to the existing Consequences section: "Note: ADR-002 (Synthetic JWT Auth), referenced in rationale point 4, was subsequently superseded when the standalone conversion (BEA-682–696) removed authentication infrastructure entirely." No other changes needed.

---

### docs/adr/README.md

**Decision: PATCH**

**Rationale:** The index table shows ADR-002 as "Accepted." This must be updated to "Superseded" to match the ADR file change above.

**Confirmed:** ADRs 003-006 do not exist. The glob `docs/adr/ADR-00*.md` returned only ADR-001, ADR-002, ADR-007. The README index lists only these three. There is no gap to fill.

**Change:** Update ADR-002's Status column from "Accepted" to "Superseded."

---

## Missed Docs (Not in Area 5 Report)

### docs/ALERTING_SETUP.md — PATCH (HIGH severity finding)

Area 5 noted this file "was not found via glob." It exists and contains a specific actionable problem: the Grafana Synthetic Monitoring section (lines 52-53) configures health checks against `https://bingo.joolie-boolie.com/api/health` and `https://trivia.joolie-boolie.com/api/health`. The `/api/health` endpoint was removed from both apps (this was a known finding in the Phase 0 packet: "grep string: `/api/health` (endpoint was removed)"). Any operator configuring Grafana from this guide will set up health checks that always fail.

**Decision: PATCH.** Update the health check target URLs to the apps' root path (`/`) or an existing endpoint. The Sentry project names (`jb-bingo`, `jb-trivia`), monthly review checklist, and credentials reference are accurate. Only the health check URLs need updating.

### docs/security-log.md — CLEAN

Operational log of nightly security runs. Entries describe April 2026 dependency updates. No architecture references. No action needed.

### packages/game-stats/CLAUDE.md — CLEAN

Accurately describes stats module exports, localStorage keys (`jb:bingo-statistics`, `jb:trivia-statistics`), and the deliberate design decision about Trivia's 5-state GameStatus. No auth or Supabase references. No action needed.

### apps/bingo/CLAUDE.md — PATCH (MEDIUM)

Lines 7-8: "A cloud-based, web-accessible Bingo system" and "provides admin accounts for saved configurations." Both claims are wrong. This is an AI-assistant context file loaded on every bingo task — an agent given this context will look for auth/account infrastructure.

**Change:** Rewrite Project Overview lines 7-8 to: "A standalone, web-accessible Bingo PWA for groups and communities. Works offline with no accounts or backend — all configuration saved locally via localStorage."

### packages/testing/README.md — PATCH (MEDIUM, dependent on Area 2)

Marketing of `createMockSupabaseClient` as a live feature. Patch should be sequenced after Area 2's code deletion plan is finalized — if the mock code is deleted, the README section goes with it; if kept, add a deprecation notice.

### packages/types/README.md — PATCH (MEDIUM, dependent on Area 2)

Quick-start example shows auth types as package value. Stale absolute file path on line 613. Same dependency on Area 2 cleanup.

### apps/bingo/documentation/mvp_specification.md, apps/trivia/documentation/chat_gpt_output_project_idea.md

Pre-project brainstorm artifacts. Not linked from any operational doc. Not architecture drift. Out of scope for this iteration — recommend a separate archaeology pass to move to `docs/archive/` if desired.

---

## Prioritized Action List

1. **PATCH `CONTRIBUTING.md` — BFF Pattern section (lines 243-248).** First file a new contributor or agent reads. Incorrect architectural claim causes incorrect code generation. Effort: 10 minutes. Priority: immediate.

2. **MARK-SUPERSEDED `docs/adr/ADR-002-synthetic-jwt-auth-e2e.md` + PATCH `docs/adr/README.md`.** ADR-002 listed as "Accepted" tells developers the auth JWT bypass is live. Any agent researching E2E infrastructure finds this first. Effort: 15 minutes. Priority: immediate.

3. **PATCH `apps/bingo/CLAUDE.md` — Project Overview lines 7-8.** Loaded into agent context on every bingo task. "Cloud-based" + "admin accounts" causes agents to look for auth infrastructure. Effort: 5 minutes. Priority: high.

4. **PATCH `docs/E2E_TESTING_GUIDE.md` + `scripts/setup-worktree-e2e.sh:137`.** Any developer writing a new E2E test will follow this guide and add `E2E_JWT_SECRET` setup that accomplishes nothing. The false "app will throw at startup" statement is high-confidence misinformation. Do both files in one pass. Effort: 30 minutes. Priority: high.

5. **REWRITE `docs/MANUAL_TEST_PLAN.md`.** Largest scope but preserves the most value. Verified test records from runs 1-9 are worth keeping. Do not rush — incorrect edits that corrupt the PASS/NOT TESTED record would be worse than leaving the stale sections temporarily. Effort: 2-3 hours. Priority: high.

6. **PATCH `docs/ALERTING_SETUP.md` — `/api/health` URLs in Grafana section.** Operational risk: anyone configuring monitoring from this doc gets permanently broken health checks. Effort: 10 minutes. Priority: medium (low likelihood of imminent execution, but high consequence if it happens).

7. **DELETE `docs/APP_STRUCTURE.md`.** A developer researching app layout finds this before ARCHITECTURE.md and looks for `lib/auth/` that doesn't exist. Effort: 5 minutes (delete + 5 lines in ARCHITECTURE.md). Priority: medium.

8. **DELETE `docs/MIDDLEWARE_PATTERNS.md`.** A developer researching whether middleware exists finds this and concludes it does. Effort: 5 minutes (delete). Priority: medium.

9. **PATCH `docs/adr/ADR-001-e2e-hash-port-isolation.md` — Platform Hub port reference.** Algorithm is correct; this is cosmetic history cleanup. Effort: 10 minutes. Priority: low.

10. **MARK-SUPERSEDED `docs/adr/ADR-007-docker-isolation-rejected.md` — Add annotation.** Rejected ADR, lowest active risk. Effort: 5 minutes. Priority: low.

11. **PATCH `packages/testing/README.md` and `packages/types/README.md`.** Sequenced after Area 2 dead-code cleanup. Priority: low, blocked on Area 2.

---

## Resolved Questions

**ADRs 003-006:** Confirmed nonexistent. Glob returned only ADR-001, ADR-002, ADR-007. The README index confirms three total. No gap.

**Is `E2E_JWT_SECRET` still read in source?** Confirmed no. Grep across full repo: only docs and `scripts/setup-worktree-e2e.sh:137`. Zero source file reads. The E2E_TESTING_GUIDE statement "app will throw at startup" is definitively false.

**MANUAL_TEST_PLAN split option:** Rejected. Shared sections would need duplication across two files. Single-file rewrite preserves unified test record.

**Does `docs/ALERTING_SETUP.md` exist?** Yes, confirmed. Area 5 missed it. Contains `/api/health` drift.

**Is the ADR process still active?** No new ADRs since 2026-01. The standalone conversion (a major architectural change) generated none. The process appears dormant, which is acceptable for a 2-app standalone platform.

---

## Remaining Unknowns

1. Whether removing `E2E_JWT_SECRET` from `scripts/setup-worktree-e2e.sh` breaks any downstream script logic. The variable is exported but nothing reads it — removal should be safe but warrants a test run.

2. Whether `packages/testing`'s `createMockSupabaseClient` is still exported from `src/index.ts`. Area 5 confirmed the README markets it; Area 2 must confirm code status before the README patch is finalized. (Iterator 4 confirmed the mock source file does not exist — README drift is documentation-only.)

3. The correct replacement URL for `docs/ALERTING_SETUP.md`'s Grafana health checks. The `/api/health` endpoint is gone; the Next.js root `/` returns 200 but checking response body for `"status":"ok"` would fail. The replacement needs to be confirmed against the actual live app before updating the doc.

---

## Revised Understanding

**Refinement 1: MANUAL_TEST_PLAN is worth rewriting, not deleting.** The volume of verified, evidence-backed test cases for standalone game flows represents accumulated testing knowledge. The rewrite preserves ~65% of existing content and the full execution history.

**Refinement 2: APP_STRUCTURE.md and MIDDLEWARE_PATTERNS.md should be deleted, not rewritten.** ARCHITECTURE.md already covers app structure accurately. No middleware exists to document. Writing replacement content would create duplication with ARCHITECTURE.md.

**Refinement 3: CONTRIBUTING.md and E2E_TESTING_GUIDE.md need patches, not rewrites.** Drift is confined to specific sections. The rest of both files is accurate and high quality.

**Refinement 4: docs/ALERTING_SETUP.md is a previously undetected medium-severity finding.** The `/api/health` endpoint removal affects production monitoring configuration, not just developer docs.
