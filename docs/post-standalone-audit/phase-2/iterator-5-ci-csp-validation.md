# Iteration: CI/Workflow Validation & CSP Enforcing Feasibility

## Assignment

Phase 1 flagged three critical CI/tooling issues (nightly env block, `bingo-mobile` Playwright project, `start-e2e-servers.sh` drift) and a CSP tightening opportunity (Report-Only → enforcing). This iterator validates those findings against the running repo and proposes a concrete enforcing CSP.

**Bottom line:** Every CI finding is confirmed with one important correction, the "build is zero-env" hypothesis is **definitively proven**, and the CSP can move to enforcing mode with minimal risk — but one of the values Phase 1 wanted to drop (`*.grafana.net`) is actually load-bearing.

---

## Part A — CI workflow validation

### nightly.yml

Full path: `/Users/j/repos/beak-gaming-platform/.github/workflows/nightly.yml` (134 lines).

**Triggers (lines 3-7):**
```yaml
on:
  schedule:
    - cron: '0 8 * * *'   # Daily 8am UTC
  workflow_dispatch:
```

So the workflow is **NOT commented-out or disabled at the YAML level**. It is still wired to a cron and can be manually triggered. CLAUDE.md's "GitHub Actions are disabled" claim refers to _E2E_ gating, not the nightly cron — the nightly is presumably still firing daily on `main`. This matters: any failure produces a real GitHub issue via the `gh issue create` step on lines 114-133.

**What the workflow actually does (after the fake env block):**
1. `pnpm build` — with the 5 stub env vars injected (lines 81-89)
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test:run`
5. Write success summary / open a `bug`-labeled GH issue on failure

So this is a real, still-running nightly green-build watchdog against `main`. It is NOT dead. The only dead component is the stub env block. The question becomes: does removing the stub break anything?

**Validation test (Part A.6 below):** build succeeds with literally zero relevant env vars. The stub block is dead weight, not a safety net.

**Secondary risk — the `test:run` step.** Phase 1 didn't look at this, but nightly also runs `pnpm test:run` (line 98). Trivia's vitest setup mocks `next/font/google`, both apps have clean env-validation tests, and Phase 1 Area 4 confirmed "zero unit-test drift." Running vitest with no env vars should succeed. Not tested in this iterator, but the Phase 1 claim is internally consistent: if the unit tests needed Supabase env, they'd fail locally too, and no one has reported that.

### e2e.yml

Full path: `/Users/j/repos/beak-gaming-platform/.github/workflows/e2e.yml` (189 lines).

**Triggers (lines 3-6):**
```yaml
on:
  pull_request:
    branches:
      - main
```

Fires on any PR targeting `main`. **No comment-out, no `if: false` guard, no disabled marker.** The YAML is fully live.

**How "CI is disabled" actually works.** Examining the workflow, I see no mechanism in the file that disables it. CLAUDE.md line 11 says "GitHub Actions are disabled" and instructs developers to run E2E locally. The only way this is actually disabled must be via one of:
1. Repository → Settings → Actions → Disabled entirely (GitHub UI toggle, not in the file)
2. Branch protection rule that does NOT require the E2E gate as a status check
3. The workflow is genuinely running but no one has looked at the results

I cannot verify (1) without hitting the GitHub API. What I CAN verify is that **the workflow file will not parse and run correctly**: line 152 invokes `--project=bingo-mobile`, and `playwright.config.ts` lines 90-110 only define projects `bingo` and `trivia`. Playwright 1.57 errors out with "No projects matched" when an explicit project filter doesn't match. Confirmed via `git log --follow playwright.config.ts` — commit `cad50658` ("feat: clean up E2E infrastructure for standalone mode (BEA-693) #515") removed `bingo-mobile` from the config but missed the workflow invocation.

**Does fixing it matter?** Yes — three reasons:
1. If Actions is toggled back on (intentional or accidental), every PR will go red immediately, block the merge gate, and require an emergency fix PR.
2. Anyone inspecting the workflow file to understand the CI story sees a ghost project and wastes time investigating.
3. The gate step (lines 173-188) has `if: always()` and bails when `needs.e2e.result != success` — a broken inner step hard-fails the gate, so the workflow file itself is a landmine for re-enablement.

### Other workflows

Glob `/Users/j/repos/beak-gaming-platform/.github/workflows/*` returned exactly **two** files: `nightly.yml` and `e2e.yml`. No dependabot.yml, no release.yml, no deploy.yml, no lighthouse.yml. No additional broken workflows to find.

`.github/` glob returned: `PULL_REQUEST_TEMPLATE.md`, `workflows/nightly.yml`, `workflows/e2e.yml`. **No `.github/ISSUE_TEMPLATE/` directory exists.**

### start-e2e-servers.sh tracking status

**Phase 1 Area 4 F3 is WRONG.** The file is **not tracked**.

```
$ git ls-files start-e2e-servers.sh
(empty)

$ git check-ignore -v start-e2e-servers.sh
.gitignore:71:start-e2e-servers.sh	start-e2e-servers.sh
```

The tracked status says `nothing to commit, working tree clean` while the file exists on disk. It is explicitly listed in `.gitignore` at line 71. My working copy shows the 3-app (platform-hub) version because this worktree was set up before the BEA-693 cleanup, not because a stale version is tracked in git. The F3 evidence cited `git ls-files` "returns it" — that was incorrect; re-running returns empty.

The generator at `scripts/setup-worktree-e2e.sh` lines 153-218 produces the correct 2-app version (bingo + trivia only). Running `./scripts/setup-worktree-e2e.sh` will overwrite the on-disk stale copy with the correct one. There is **no fix required to tracked repo content** for F3 — only a memo to contributors to re-run the setup script in existing worktrees. This downgrades F3 from "high-severity broken tracked file" to "low-severity worktree hygiene note."

The confusion is understandable because `setup-worktree-e2e.sh` line 239 also **adds** `start-e2e-servers.sh` to `.gitignore` if missing — so earlier clones might have had a tracked version that someone later un-tracked. Current state: cleanly ignored.

### playwright.config.ts project enumeration

Current projects (lines 90-110):
1. `bingo` — `testDir: ./e2e/bingo`, Desktop Chrome, port from `portConfig.bingoPort`, 1280×720 viewport
2. `trivia` — `testDir: ./e2e/trivia`, Desktop Chrome, port from `portConfig.triviaPort`, 1280×720 viewport

**Exactly two projects.** No `bingo-mobile`, no `trivia-mobile`, no webkit/firefox variants.

Git history for the projects block:
- `cad50658` (BEA-693, standalone cleanup) — removed `bingo-mobile`
- `06c8480a` (initial infra) — added the multi-project list originally
- Between those, `06ae9885` (BEA-375) had active `bingo-mobile` auth-navigation fixes

So the historical list was `{bingo, trivia, bingo-mobile}` and the mobile project was always tied to mobile auth flows. It was correctly removed in BEA-693; only the workflow file was missed.

Grep for `bingo-mobile` across the repo (excluding archives) returns exactly one real hit in `.github/workflows/e2e.yml:152`. The rest are doc-only mentions in `phase-1/`, the phase packet, `STATUS.md`, and `docs/archive/BEA-350-SOLUTION.md`.

### Clean-env build test result

**This is the highest-signal item.** I ran three progressively stricter tests.

**Test 1 — `env -i` with no cache bust, no .env.local deletion:**
```
env -i HOME=$HOME PATH=$PATH SHELL=$SHELL pnpm build 2>&1 | tail -40
```
Result: both apps built successfully. One of them came from Turbo cache (`1 cached, 2 total`), so this wasn't yet definitive.

**Test 2 — clean env + `--force` to bust Turbo cache:**
```
env -i HOME=$HOME PATH=$PATH SHELL=$SHELL bash -c 'pnpm turbo run build --force'
```
Result: `Tasks: 2 successful, 2 total / Cached: 0 cached, 2 total / Time: 12.284s`. Both apps rebuilt from scratch, no cached artifacts, in a clean env. Still used `.env.local` files which Next.js auto-loads.

**Test 3 (definitive) — clean env + `--force` + .env.local files moved aside:**
```
mv apps/bingo/.env.local apps/bingo/.env.local.iter5-bak
mv apps/trivia/.env.local apps/trivia/.env.local.iter5-bak
env -i HOME=$HOME PATH=$PATH SHELL=$SHELL bash -c 'pnpm turbo run build --force'
# restore
mv apps/bingo/.env.local.iter5-bak apps/bingo/.env.local
mv apps/trivia/.env.local.iter5-bak apps/trivia/.env.local
```
Result (verbatim tail):
```
 Tasks:    2 successful, 2 total
Cached:    0 cached, 2 total
  Time:    12.052s
```

Both apps built successfully with:
- NO parent shell env (`env -i`)
- NO `.env.local` files
- NO Turbo cache reuse (`--force`)
- Only `HOME`, `PATH`, `SHELL` set

Route tables for both apps are intact (`/`, `/display`, `/play`, `/api/csp-report`, `/api/monitoring-tunnel`, plus trivia's `/api/trivia-api/*`). Serwist service-worker precache generated normally. `postbuild` (Sentry sourcemap upload) correctly no-op'd with "Skipping source map upload (SENTRY_AUTH_TOKEN not set)".

**Conclusion:** The entire `env:` block at `.github/workflows/nightly.yml:81-89` is **provably dead**. Finding 3-4 and Area 4 F1 are fully resolved — the recommended action (delete the block) is safe with zero risk to the nightly build. Finding 3-5's concern that `turbo.json` lists `NEXT_PUBLIC_BINGO_URL`/`NEXT_PUBLIC_TRIVIA_URL` in `globalEnv` is also validated: those vars were never set in this clean-env run and the build still succeeded, confirming no code consumes them.

---

## Part B — CSP enforcing feasibility

### Current CSP analysis

Both `apps/bingo/next.config.ts` and `apps/trivia/next.config.ts` set (lines 38-41, identical value):

```
Content-Security-Policy-Report-Only:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' https://*.grafana.net /monitoring;
  font-src 'self';
  worker-src 'self';
  frame-src 'none';
  report-uri /api/csp-report
```

Also set (lines 42-49): `Report-To` header pointing at `/api/csp-report` via a `csp-endpoint` group.

**Directive-by-directive review:**

| Directive | Current | Assessment |
|---|---|---|
| `default-src` | `'self'` | Correct. |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | `'unsafe-inline'` required for Next.js inline boot scripts (no nonces configured). `'unsafe-eval'` usually needed only in dev — Next.js 16 production bundles built with Turbopack do not rely on `Function()` for anything production-critical. Worth testing for removal. |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind 4 emits `<style>` with inline rules and `style="..."` attrs (runtime dynamic classes). `'unsafe-inline'` is load-bearing. |
| `img-src` | `'self' data: blob:` | Correct. `data:` covers icons/base64 SVGs, `blob:` covers service-worker cached images. |
| `connect-src` | `'self' https://*.grafana.net /monitoring` | **`/monitoring` is invalid** — CSP sources must be scheme/host/keyword. Browsers silently drop it. `'self'` already covers the same-origin `/monitoring` tunnel route, so dropping `/monitoring` is harmless. **BUT `*.grafana.net` IS load-bearing** — see finding below. |
| `font-src` | `'self'` | Next.js Font Optimization inlines Google Fonts at build time, so no external font origin needed. Correct. |
| `worker-src` | `'self'` | Correct. Serwist service worker is same-origin (`/sw.js` rewrite). |
| `frame-src` | `'none'` | Correct. No embeds. |
| `report-uri` | `/api/csp-report` | Correct, but endpoint itself is unhardened (see Finding 3-7). |

**CORRECTION TO PHASE 1 FINDING 3-6:** That finding claimed "Faro is apparently not yet wired up (no `FaroProvider` imports found), so `*.grafana.net` is a pre-enabled path for an unused service." **This is wrong.** Faro is fully wired:

- `packages/error-tracking/src/faro.ts` — initializes the Grafana Faro Web SDK using `NEXT_PUBLIC_FARO_URL`
- `packages/error-tracking/src/components/FaroInit.tsx` — dynamic-imports `initFaro` on the client
- `apps/bingo/src/app/layout.tsx:8,59` — imports and renders `<FaroInit appName="bingo" />`
- `apps/trivia/src/app/layout.tsx:8,58` — imports and renders `<FaroInit appName="trivia" />`

Finding 3-6 searched for `FaroProvider`, which doesn't exist; the real component is `FaroInit`. Iterator 2 (`phase-2/iterator-2-vercel-prod-env.md`) caught this — `NEXT_PUBLIC_FARO_URL` is live in Vercel prod for both apps and pointed at `faro-collector-prod-us-west-0.grafana.net` (though with a trailing `\n` bug, a separate issue).

**Consequence for CSP:** `https://*.grafana.net` in `connect-src` **must stay**. Removing it would break Faro RUM beacons in enforcing mode.

### Proposed enforcing policy

Two-phase approach. **Phase 1 — fix directives, stay Report-Only:**

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' https://*.grafana.net https://*.ingest.sentry.io https://*.sentry.io;
font-src 'self';
worker-src 'self';
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
report-uri /api/csp-report;
report-to csp-endpoint;
```

Changes from current:
- **Dropped invalid `/monitoring`** — same-origin `'self'` already covers the Sentry tunnel route.
- **Kept `https://*.grafana.net`** — Faro is actively used.
- **Added `https://*.sentry.io` and `https://*.ingest.sentry.io`** — Sentry's fallback/direct transport paths. The tunnel at `/monitoring` covers the main case, but Sentry's browser SDK may attempt direct ingestion if the tunnel fails, and replay/session endpoints sometimes bypass the tunnel. Conservative to include.
- **Added `frame-ancestors 'none'`** — modern replacement for `X-Frame-Options: DENY` (both can coexist, frame-ancestors is more expressive).
- **Added `base-uri 'self'`** — prevents `<base>` injection attacks that redirect relative URLs.
- **Added `form-action 'self'`** — prevents form-post hijack.
- **Added `object-src 'none'`** — blocks `<object>`/`<embed>`/Flash.
- **Added `upgrade-insecure-requests`** — auto-upgrades any accidental `http://` references.
- **Added `report-to csp-endpoint`** — pairs with the existing `Report-To` header.

**Phase 2 — attempt `'unsafe-eval'` removal and flip to enforcing:**

Test whether Next.js 16 production bundles with Turbopack still require `'unsafe-eval'`. Per Next.js docs, production builds since v13.4 generally don't — the main reliance on `eval`/`Function()` is in dev-mode HMR. If the test passes (no CSP violations logged for `script-src` without `'unsafe-eval'`), ship:

```
script-src 'self' 'unsafe-inline';
```

If it fails (e.g., a third-party dependency uses `Function()` at runtime), leave `'unsafe-eval'` only in the enforcing header, which is still better than the current status quo (no enforcement at all).

**Flip the header name to `Content-Security-Policy` once Phase 1 has been observed for ~1 week with zero unexpected violations in `/api/csp-report` logs.**

### Risks and rollout strategy

**Risks:**
1. **Sentry SDK direct ingestion breaks** — if the tunnel misbehaves and Sentry falls back to direct, the added `*.sentry.io` origin covers it. Low risk.
2. **Faro direct ingestion breaks** — `*.grafana.net` covers it. Low risk.
3. **`'unsafe-eval'` removal breaks a third-party lib** — zustand, react-aria, serwist, @sentry/nextjs, @grafana/faro-*. I'm not aware of any that use `eval`, but it needs testing.
4. **Tailwind 4 inline styles break under a stricter `style-src`** — mitigated by keeping `'unsafe-inline'`. No change to style-src in the proposal.
5. **Service worker break** — Serwist generates `sw.js` at same origin; `worker-src 'self'` is correct.
6. **Inline `<Script>` from `next/script`** — Next.js uses inline bootstrap scripts. `'unsafe-inline'` on script-src remains, so this is fine unless we switch to nonce-based CSP (which is a larger architectural change, not proposed here).

**Rollout strategy:**

1. **Week 0:** Ship the fixed Report-Only (Phase 1 above — adds `frame-ancestors`, `base-uri`, `form-action`, `object-src`, `upgrade-insecure-requests`, drops invalid `/monitoring`). No user impact because still Report-Only. Watch `/api/csp-report` for any new violations caused by the added restrictions.
2. **Week 1:** Harden `/api/csp-report` per Phase 1 Finding 3-7 (body shape validation, size cap, dedupe) so the new observability layer isn't a DoS target.
3. **Week 2:** Add a SECOND header `Content-Security-Policy` (enforcing) with the SAME policy. Next.js allows multiple headers with the same `source` regex. This creates a parallel enforcing policy while still collecting violations via Report-Only. Watch production for actual breakage.
4. **Week 3:** If clean, drop the Report-Only header. Keep the enforcing one only.
5. **Week 4 (optional):** Attempt `'unsafe-eval'` removal in a separate PR, measured the same way.

**E2E assertion to add during rollout:** add a Playwright test that visits `/play` and `/display` on both apps, captures browser console messages for `Content Security Policy` blocks, and fails if any are observed. This catches CSP regressions before merge.

---

## Part C — PR template + dev tooling

### .github/PULL_REQUEST_TEMPLATE.md

Full path: `/Users/j/repos/beak-gaming-platform/.github/PULL_REQUEST_TEMPLATE.md` (68 lines).

**Platform-hub references:** None. The template is fully clean of `platform-hub`, `auth`, `Supabase`, `login`, `account`, or any pre-standalone vocabulary. The `Testing` section (lines 41-60) lists `pnpm test:run`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e` followed by `pnpm test:e2e:summary` — all current commands that work in the standalone world.

**Five-Level Explanation (lines 12-18):** Requires five levels of increasing technical depth (non-technical → deep technical) for every PR. This is a workflow preference, not a platform-era artifact. It still makes sense in a standalone repo because: (a) the project is developed exclusively by AI agents and the five levels force the agent to articulate design intent, (b) nothing in the requirement depends on multi-app architecture, (c) single-app repos benefit from the discipline as much as monorepos.

**Verdict:** No changes needed. The template is post-standalone-clean.

**One small note:** The E2E Test Results section (lines 50-60) embeds a mock summary block with `0 failed ← REQUIRED`. This depends on `pnpm test:e2e:summary` producing that exact format. Not drift, just a coupling worth knowing.

### .github/ISSUE_TEMPLATE/

**Does not exist.** Glob `/Users/j/repos/beak-gaming-platform/.github/**/*` returned `PULL_REQUEST_TEMPLATE.md` plus the two workflow files and nothing else. CLAUDE.md notes that issue tracking uses Linear (BEA-### format), not GitHub Issues, so an absent ISSUE_TEMPLATE directory is consistent with the team's workflow. No drift to flag.

### .lintstagedrc.js

Full path: `/Users/j/repos/beak-gaming-platform/.lintstagedrc.js` (36 lines).

Lists 10 packages in `packageMap` (lines 4-15): bingo, trivia, sync, ui, theme, types, audio, game-stats, error-tracking, testing. **No references to `@joolie-boolie/auth`, `@joolie-boolie/database`, or `@joolie-boolie/platform-hub`.** Phase 1 Area 4 F11/cleanups reported this as correct, and that is verified.

**Area 4 F7 concern on `packages/testing`:** confirmed. `packages/testing/package.json` lines 16-19 lists only `lint` and `typecheck` scripts. When a file under `packages/testing/` is staged, `.lintstagedrc.js` line 33 runs `turbo run test:run --filter=@joolie-boolie/testing...`, which Turbo treats as "task not defined on this package" and silently skips. The lint-staged output still shows green because turbo returns exit 0. A developer editing mocks sees "tests passed" but nothing was actually run.

**Recommendation:** Either (a) add `"test:run": "echo 'no tests'"` to `packages/testing/package.json`, making the no-op explicit, or (b) remove the `'packages/testing/'` entry from the packageMap. Option (a) is safer because if someone later adds real tests to `packages/testing`, they automatically pick up lint-staged coverage.

### .husky/pre-commit

Full path: `/Users/j/repos/beak-gaming-platform/.husky/pre-commit` (2 lines):
```sh
#!/usr/bin/env sh
pnpm exec lint-staged
```

Single line invoking lint-staged. No legacy guards, no platform-hub references, no broken paths. Works with the current toolchain. **No changes needed.**

CLAUDE.md explicitly prohibits `--no-verify` ("if hooks fail, fix the underlying issue before committing"), so this hook is the enforcement point for lint/typecheck/test on every commit. It's load-bearing and correct.

---

## Resolved Questions (from phase-1 open questions)

### Q2: CI "disabled" — what does it actually mean?

**Resolved.** "Disabled" does **not** mean the workflow files are commented out or gated by `if: false`. Both `nightly.yml` and `e2e.yml` have live `on:` blocks (`nightly.yml`: cron + workflow_dispatch; `e2e.yml`: pull_request to main). The disabling must be via GitHub repo-level Actions toggle or branch protection rules that don't require the E2E gate — neither of which is visible from the filesystem.

**Implication:** Fixing both workflows matters because:
- The nightly appears to still be running daily (cron is live) and will silently succeed on stub env while masking any real build regression that depends on a genuine env.
- The E2E workflow will error the moment someone re-enables Actions at the repo level, because `--project=bingo-mobile` will fail.

### Q3: Is build literally zero-env?

**Definitively resolved.** See Part A, Test 3. Both apps build cleanly with `env -i HOME=$HOME PATH=$PATH SHELL=$SHELL`, no `.env.local` files, and Turbo cache forced off. The nightly workflow's `env:` block at lines 83-89 is dead weight. Confidence: verified by runtime execution.

---

## Remaining Unknowns

1. **GitHub repo-level Actions toggle state.** Can only be verified via GH API or repo Settings UI; out of reach for a filesystem-only iterator. If the toggle is "On" (the default), the nightly cron has been running for weeks with stub env vars — we should check recent nightly run history on GitHub to see if they're actually completing.

2. **Whether `'unsafe-eval'` is truly droppable from production `script-src`.** Requires a build + production preview test with `Content-Security-Policy` enforcing, minus `'unsafe-eval'`, and verification that no libraries blow up. Cannot verify statically.

3. **Exact Sentry ingestion domains needed in `connect-src`.** The proposed policy adds `*.sentry.io` and `*.ingest.sentry.io` as a safety net; the actual minimum set depends on whether Sentry's Next.js SDK tunnel at `/monitoring` fully covers replay/session/metric channels. Needs one production smoke test with CSP-violation monitoring.

4. **Phase 1 Area 4 F3 correction not yet reported upstream.** My finding (the file is gitignored, not tracked) contradicts the original area-4 doc's evidence line; that document should be annotated with a correction when Phase 2 synthesis happens.

---

## Revised Understanding

1. **The CI findings are real and fixable with near-zero risk.** Delete the nightly env block. Delete `--project=bingo-mobile` from e2e.yml. Both changes are single-line deletions. The clean-env build test is the strongest evidence in the audit so far — the nightly env block is not just redundant, it is **provably dead**.

2. **Phase 1 Area 4 F3 was half-wrong.** `start-e2e-servers.sh` is NOT tracked; it's gitignored. The divergence between the generator in `setup-worktree-e2e.sh` and the on-disk file is a worktree-hygiene issue, not a repo-content issue. Severity drops from "high (broken tracked file)" to "low (worktree staleness memo)." The fix is a docs note: "run `./scripts/setup-worktree-e2e.sh` after pulling BEA-693 or later."

3. **Phase 1 Area 3 Finding 3-6 overstated the CSP cleanup opportunity.** `*.grafana.net` is load-bearing (Faro is fully wired via `FaroInit` in both app layouts) — it must stay. `/monitoring` is indeed invalid and can be dropped. But the most important correction is that the ENTIRE connect-src narrative in Finding 3-6 was based on the false assumption that Faro is unused.

4. **The enforcing CSP is feasible and should roll out in 3-4 weeks with a parallel-policies rollout strategy.** The biggest wins are `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, and `upgrade-insecure-requests` — all of which can ship immediately in Report-Only with zero risk. The enforcing flip is then a one-line header-name change after the observation window.

5. **The PR template, husky pre-commit, and `.lintstagedrc.js` are all post-standalone-clean.** Area 4 F7 (testing-package lint-staged no-op) is confirmed and has a trivial fix. No other CI/tooling drift in these files.

6. **Environment-isolated, cache-forced build test is the strongest validation technique in this audit.** A single 12-second runtime test invalidated every `env:` concern in the nightly workflow. Future iterators should use this pattern when validating "is this env var still load-bearing" claims rather than grepping for consumers, because grep misses dynamic env access patterns.

7. **Two skill-system false positives encountered during this audit.** The Vercel-plugin PreToolUse hook fires on filename patterns, not semantic intent. Reading `.github/workflows/nightly.yml` triggered the "workflow" skill (for Vercel Workflow DevKit, which this project does not use). Reading `next.config.ts` triggered `next-cache-components`, `next-upgrade`, and `turbopack` skill suggestions even though the read was for CSP header review, not cache components or upgrades. Reading `package.json` triggered the `bootstrap` skill suggestion. These are filename-driven, not intent-driven, and should be treated as advisory by future iterators. I did not invoke the suggested skills because none applied to the actual task.
