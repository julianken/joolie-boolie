# Area 3 — Security & Infrastructure Drift

**Investigator:** Area 3 / Security & Infrastructure
**Scope:** Headers, CSP, cookies, env vars, Vercel/DNS config, observability, PWA, CI, hooks.
**Assumption:** BEA-682..695 Wave 1 removed `apps/platform-hub`, `packages/auth`, `packages/database`, Supabase, OAuth, and all middleware. Per-host cookies, no cross-subdomain SSO.

---

## Summary

Application code has been cleaned up well — runtime code has **no references** to `SUPABASE_*`, `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_OAUTH_*`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, or `COOKIE_DOMAIN`. However, multiple layers of configuration still assume the multi-app logged-in world:

- `.env.example` files at the repo root are **wildly stale**, still listing Supabase URL/anon key, service role, SESSION_TOKEN_SECRET, OAuth client, OAuth redirect, consent URL, and secrets labelled for production (including committed anon keys and a secret service role token — tracked in git).
- The nightly GitHub workflow still injects stale Supabase/OAuth env values into the build step.
- Local developer `.env.local` files in both apps still contain Supabase, OAuth, session secrets, and (worse) real-looking `SUPABASE_JWT_SECRET` values.
- Vercel-pulled production env files (`apps/*/.vercel/.env.production.local`) reveal the **live production deployments** still have `NEXT_PUBLIC_COOKIE_DOMAIN=".beak-gaming.com"`, `SESSION_TOKEN_SECRET`, Supabase, and OAuth env vars set, pointed at the old `beak-gaming.com` domain.
- The CSP is `Report-Only` only (not enforcing), includes an invalid directive value, and the CSP report endpoint + monitoring tunnel routes are still present and unused-trivially.
- Observability still targets real Sentry / Grafana Cloud / Axiom accounts with project slugs (`jb-bingo`, `jb-trivia`) consistent with post-rebrand — OK, but `docs/ALERTING_SETUP.md` references removed `/api/health` endpoints.
- Several vestigial E2E JWT secret artifacts remain (`E2E_JWT_SECRET`, `.env.e2e`, setup script) even though there is no middleware left to verify JWTs.
- `turbo.json` still lists `NEXT_PUBLIC_BINGO_URL` / `NEXT_PUBLIC_TRIVIA_URL` as build env though no source file reads them.

Tracked, committed files are bad. Untracked local artifacts leak even more legacy context, and production deployments are the worst offender — the Vercel environment has never been cleaned up.

---

## Findings

### FINDING 3-1 — Root `.env.example` still lists the entire removed auth stack and hard-codes live Supabase/service-role values

**Severity:** **critical**
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/.env.example` (tracked in git, `git ls-files` confirms)
  - Lines 8-9: `NEXT_PUBLIC_SUPABASE_URL=https://iivxpjhmnalsuvpdzgza.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LvRIpm-i3o17HecBwfQckg_wTVe8WPM`
  - Line 13: `SUPABASE_SERVICE_ROLE_KEY=sb_secret_Lx7THLMj2aYmg2HjqncGIw_PDrV3BPT` — an actual-looking **service role key** checked into the repo under "# TODO: Generate a unique secret for production"
  - Line 21: `SESSION_TOKEN_SECRET=029145387d41a1c431e1ccb7e9ef474f0864a220094ee3d7296bf1faa2ddf372`
  - Lines 30-38: OAuth client id (`0d87a03a-d90a-4ccc-a46b-85fdd8d53c21`), redirect URI, consent URL
  - Line 2: Still titled "Beak Bingo - Environment Variables"

**Why this matters:** The file's whole purpose is to be copied to `.env.local`. New contributors will recreate the dead auth configuration verbatim. Worse, it appears to embed real credentials into git. Whether or not the Supabase project is currently paused, committing anon/service-role keys and a SESSION_TOKEN_SECRET to a public-ish repo is a credential-disclosure incident. If any of these accounts/keys are still live, they should be rotated; if dead, the file should be reduced to the three actual variables (`TURBO_TOKEN`, `TURBO_TEAM`, `TURBO_REMOTE_ONLY`) that are the only ones the shipping code actually still uses.

**Recommended action:** (a) rotate the Supabase service role key and any Supabase/OAuth credentials in the file immediately in case the project is reachable; (b) rewrite `/Users/j/repos/beak-gaming-platform/.env.example` to contain only the Turbo variables (or delete it entirely since the standalone apps need no root env); (c) rename the file-level header away from "Beak Bingo"; (d) add a note that app-specific vars live in `apps/*/.env.example`.

---

### FINDING 3-2 — Vercel production deployments still have `COOKIE_DOMAIN`, Supabase, OAuth, and `beak-gaming.com` env vars set

**Severity:** **critical**
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/.vercel/.env.production.local` (gitignored; pulled from Vercel) shows what is currently live on Bingo production:
  - Line 2: `NEXT_PUBLIC_APP_URL="https://bingo.beak-gaming.com\n"` (note: the old domain, and a literal `\n` suffix that would break any URL that consumed it)
  - Line 3: `NEXT_PUBLIC_COOKIE_DOMAIN=".beak-gaming.com"`
  - Line 4: `NEXT_PUBLIC_OAUTH_CLIENT_ID`
  - Line 5: `NEXT_PUBLIC_OAUTH_CONSENT_URL="https://beak-gaming.com/oauth/consent\n"`
  - Line 6: `NEXT_PUBLIC_OAUTH_REDIRECT_URI="https://bingo.beak-gaming.com/auth/callback"`
  - Line 7: `NEXT_PUBLIC_PLATFORM_HUB_URL="https://beak-gaming.com\n"`
  - Lines 8-9: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
  - Line 11: `SESSION_TOKEN_SECRET="d298de93c9b0e2b15732aeecc58232c6605411858441e86bbef3efc596b1353c"`
- `/Users/j/repos/beak-gaming-platform/apps/trivia/.vercel/.env.production.local` is a near-mirror:
  - Line 2: `NEXT_PUBLIC_APP_URL="https://trivia.beak-gaming.com"`
  - Line 3: `NEXT_PUBLIC_COOKIE_DOMAIN=".beak-gaming.com"`
  - Lines 4-7: OAuth client, consent, redirect, platform hub URL — all at `beak-gaming.com`
  - Line 11: same `SESSION_TOKEN_SECRET`

**Why this matters:** These are not just local stale files — they are the output of `vercel env pull`, meaning the **live production Vercel environment** still has these variables set. After the Wave-1 removal, no runtime code reads them, so they are mostly inert at runtime. But: (1) they point at the old `beak-gaming.com` domain and advertise `.beak-gaming.com` as the cookie scope; if that domain is ever reacquired or re-used, any cookies still set would flow to whoever owns it; (2) the `SESSION_TOKEN_SECRET` on disk is committed-looking and identical to the value in `.env.local` and `.env.example` (see 3-1), suggesting the same secret has been shared between repo and prod Vercel for a long time; (3) the literal `\n` suffixes on several URL values are data-integrity bugs that would silently produce broken URLs if any consumer resurrected; (4) leaving stale env vars increases blast radius for any future accidental re-enablement.

**Recommended action:** run `vercel env rm` for every Bingo + Trivia production/preview/dev env var matching `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_OAUTH_*`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `NEXT_PUBLIC_COOKIE_DOMAIN`, and any `NEXT_PUBLIC_APP_URL` that still has `beak-gaming.com`. Re-pull `.env.production.local` to verify. After cleanup, rotate the shared `SESSION_TOKEN_SECRET` value out of existence (no code reads it anymore).

---

### FINDING 3-3 — Bingo and Trivia `.env.local` files still contain Supabase, OAuth, and (new) `SUPABASE_JWT_SECRET`

**Severity:** high
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/.env.local` lines 1-13:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (an HS256 JWT), `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `NEXT_PUBLIC_OAUTH_CLIENT_ID`, `NEXT_PUBLIC_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_OAUTH_CONSENT_URL`, `E2E_TESTING=true`, `E2E_JWT_SECRET`, `SUPABASE_JWT_SECRET`
- `/Users/j/repos/beak-gaming-platform/apps/trivia/.env.local` lines 1-14 similarly: same Supabase values, OAuth client, `SUPABASE_JWT_SECRET`, and `NEXT_PUBLIC_FEATURE_QUESTION_SETS=false`
- `/Users/j/repos/beak-gaming-platform/apps/bingo/.env.example` lines 11 and 14-22: declares only `NEXT_PUBLIC_APP_URL` and optional `NEXT_PUBLIC_FARO_URL`/turbo vars — explicitly states "No auth or database env vars are needed."
- `/Users/j/repos/beak-gaming-platform/apps/trivia/.env.example` similarly minimal
- Git ls-files confirms `.env.local` is gitignored in `.gitignore` lines 22-23

**Why this matters:** `.env.local` is gitignored, so this is a developer-workstation footgun rather than a public leak — but both local files contain a plausible `SUPABASE_JWT_SECRET` that looks like a real service secret (88 chars base64-ish), which no code reads post-removal. Any developer who tries to "clean up" by running `vercel env pull` again will re-hydrate these from prod (see 3-2). The `.env.example` files were cleaned (good!) but nothing walks the developer through a migration. The discrepancy between "example says nothing to set" and "local has 13 auth variables" is exactly the kind of drift that causes accidental resurrection.

**Recommended action:** Add a `docs/MIGRATION_POST_STANDALONE.md` note telling developers to delete their `apps/{bingo,trivia}/.env.local` entirely (both apps need no env vars for local dev). After Finding 3-2 is applied, re-pulling from Vercel should produce empty files. Rotate the `SUPABASE_JWT_SECRET` value out of Supabase if possible — or if the Supabase project is paused, document that it is dead. Remove any `.env.local.backup-pre-manual-test` files (tracked gitignore pattern exists at `.gitignore:58`).

---

### FINDING 3-4 — `.github/workflows/nightly.yml` injects `NEXT_PUBLIC_SUPABASE_*`, `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `NEXT_PUBLIC_OAUTH_CLIENT_ID` at build time

**Severity:** high
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/.github/workflows/nightly.yml` lines 81-89:
  ```yaml
  - name: Build all apps
    run: pnpm build
    env:
      # Stub env vars required at build time (not used at runtime)
      NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
      SESSION_TOKEN_SECRET: "0000000000000000000000000000000000000000000000000000000000000000"
      NEXT_PUBLIC_PLATFORM_HUB_URL: http://localhost:3002
      NEXT_PUBLIC_OAUTH_CLIENT_ID: placeholder-oauth-client-id
  ```
- The comment literally says "not used at runtime" — and in fact nothing reads them at build time either, since `packages/auth` and `apps/platform-hub` are gone.

**Why this matters:** This is drift, not an open hole — but it lies about what the build needs, it keeps the old vocabulary alive in CI, and it makes it harder for someone to detect that the Supabase migration is complete. It also survived the Wave-1 removal, which suggests no one closed the loop on workflow files.

**Recommended action:** delete the entire `env:` block under the "Build all apps" step in `nightly.yml`. The build should succeed with zero env vars from this workflow. Verify locally with `pnpm build` in a shell that has nothing but `PATH` set.

---

### FINDING 3-5 — `turbo.json` still lists `NEXT_PUBLIC_BINGO_URL` and `NEXT_PUBLIC_TRIVIA_URL` in `globalEnv` and the `build` task env

**Severity:** medium
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/turbo.json`:
  - Lines 5-9: `"globalEnv": ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BINGO_URL", "NEXT_PUBLIC_TRIVIA_URL"]`
  - Lines 14-21: The `build.env` repeats all three plus Sentry vars
- `Grep` for `NEXT_PUBLIC_BINGO_URL|NEXT_PUBLIC_TRIVIA_URL` in `*.{ts,tsx,js,jsx,json,mjs}` returns **only `turbo.json` itself** — no source file reads them
- These variables historically existed to let Bingo link to Trivia's URL (and vice versa) across the multi-app install; with only two isolated apps and no cross-navigation, there is no consumer

**Why this matters:** `globalEnv` controls Turbo's cache invalidation. Keeping dead vars there means the cache considers them part of the hash, producing spurious cache misses when their values shift in CI. It also keeps the vocabulary of "we run multiple apps with shared URLs" alive in infra.

**Recommended action:** delete `NEXT_PUBLIC_BINGO_URL` and `NEXT_PUBLIC_TRIVIA_URL` from `turbo.json` both in `globalEnv` and in `build.env`. Keep `NEXT_PUBLIC_APP_URL` only if it is actually consumed (grep suggests it is not directly referenced either, since the home pages render only relative links — verify independently).

---

### FINDING 3-6 — CSP is still `Report-Only`, includes a malformed `connect-src` value, and frames a cross-origin CSP report endpoint path

**Severity:** medium
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/next.config.ts` lines 38-50 and the mirror in `/Users/j/repos/beak-gaming-platform/apps/trivia/next.config.ts` lines 38-50:
  ```
  'Content-Security-Policy-Report-Only',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.grafana.net /monitoring; font-src 'self'; worker-src 'self'; frame-src 'none'; report-uri /api/csp-report"
  ```
  - The directive name is `Content-Security-Policy-Report-Only` — browsers will report violations but **not block** them, so the policy is effectively advisory.
  - `connect-src 'self' https://*.grafana.net /monitoring` — `/monitoring` is not a valid CSP source (CSP requires a scheme or keyword); browsers silently drop invalid sources but the intent is unclear. Since Sentry tunneling already goes through `/monitoring` as a same-origin path, `'self'` already covers it.
  - `https://*.grafana.net` is present for the Grafana Faro browser SDK (`NEXT_PUBLIC_FARO_URL` in `.env.example`) — Faro is apparently not yet wired up (no `FaroProvider` imports found), so this origin is future-looking. If Faro is not being used, `*.grafana.net` is a pre-enabled path for an unused service.
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — `'unsafe-eval'` is usually only needed by a dev-mode React/Next.js bundle. In production, enforcing without it significantly raises the bar for script injection.

**Why this matters:** Because the header is `Report-Only`, none of these loose values *currently* bite. But Wave-1 removed all the auth-complicating factors that historically blocked switching to enforcing mode (OAuth redirects, third-party SSO, cross-subdomain POSTs). This is now the right moment to: (a) tighten to enforcing, (b) drop `unsafe-eval` in production, (c) remove the invalid `/monitoring` token, (d) decide whether `*.grafana.net` stays (only if Faro is committed), and (e) verify `report-uri` is still reachable (see 3-7).

**Recommended action:** convert to `Content-Security-Policy` (enforcing) with `unsafe-eval` only in dev; delete `/monitoring` from `connect-src`; gate `*.grafana.net` behind the presence of the Faro env var; add a Lighthouse/E2E assertion that the enforcing policy does not break the app; keep the `Report-Only` header as a secondary stricter policy during rollout.

---

### FINDING 3-7 — CSP `report-uri` still points at `/api/csp-report` but the route handler is a stub that does not enforce any sanity checks

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/app/api/csp-report/route.ts` lines 6-14 and `/Users/j/repos/beak-gaming-platform/apps/trivia/src/app/api/csp-report/route.ts` identical
- Both accept any JSON body, log it via `createLogger`, and return 204
- No rate limit, no auth check, no Content-Type check, no origin validation
- `next.config.ts` also sets a `Report-To` header pointing at the same endpoint

**Why this matters:** Not a direct security hole — CSP reports are meant to be unauthenticated — but this endpoint logs whatever JSON you feed it into structured logs. If Axiom is the sink (per `.secrets/observability-accounts.json`), an attacker can spam arbitrary keys into the log stream and inflate retention costs or hide other activity via volume. Low severity because the app has no authenticated surface to pivot into.

**Recommended action:** add a tiny validator that the body is a real CSP report (has `csp-report` or `document-uri` fields), cap the body size to ~2KB, and record a rate-limit metric or hash-based dedupe. Optional: consider removing the endpoint entirely if the reports are not being actively reviewed (the log only has a `logger.warn` with no destination beyond the default sink).

---

### FINDING 3-8 — E2E JWT secret scaffold (`E2E_JWT_SECRET`, `.env.e2e`, setup script) is vestigial after middleware removal

**Severity:** medium
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/scripts/setup-worktree-e2e.sh` line 137: `export E2E_JWT_SECRET=e2e-test-secret-key-that-is-at-least-32-characters-long`
- `/Users/j/repos/beak-gaming-platform/.env.e2e` line 35: `export E2E_JWT_SECRET=...`
- Grep for `E2E_JWT_SECRET` across `apps/` and `packages/` returns **no source file hits** (only docs and the script)
- Phase-0 packet: "both `apps/{bingo,trivia}/src/middleware.ts` were DELETED in BEA-696"
- `docs/standalone-conversion-plan/phase-4/execution-plan.md:822-823` explicitly calls this out: "The E2E testing bypass pattern uses `E2E_JWT_SECRET` in game middleware to allow test JWTs. Since middleware becomes a passthrough in WU-1A/1B, `E2E_JWT_SECRET` is no longer needed in the games."
- `docs/E2E_TESTING_GUIDE.md:22,25,27,31,35` still documents the variable as **required**

**Why this matters:** There is no middleware left to consume this value. The variable is dead code. More importantly, the scaffold implies a security story that no longer exists: "we verify JWTs in E2E tests with a test secret" — in reality, nothing is verifying JWTs. Any new contributor who sees the scaffold will assume auth exists.

**Recommended action:** delete `E2E_JWT_SECRET` from `setup-worktree-e2e.sh` (line 137) and the generated `.env.e2e` template; update `docs/E2E_TESTING_GUIDE.md` to drop it from the "required" section; consider whether `E2E_TESTING=true` itself is still useful (it still has a handful of consumers for Sentry suppression in `apps/{bingo,trivia}/sentry.server.config.ts` and `apps/{bingo,trivia}/src/instrumentation.ts`, plus `use-sync.ts` debug flag; those uses are fine to keep).

---

### FINDING 3-9 — `turbo.json` `globalPassThroughEnv` still includes `E2E_TESTING`

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/turbo.json` line 4: `"globalPassThroughEnv": ["E2E_TESTING"]`
- `E2E_TESTING` is still read by `apps/{bingo,trivia}/sentry.server.config.ts`, `apps/{bingo,trivia}/src/instrumentation.ts`, and `apps/trivia/src/hooks/use-sync.ts` — legitimate usage
- Keeping it is correct; flagging low because it is coupled to Finding 3-8 (the narrative around what E2E-mode *does*)

**Why this matters:** Actually keep this one. Low-severity note only because it proves the story "E2E mode just suppresses noisy Sentry init" is still intact. If Finding 3-8 removes `E2E_JWT_SECRET` from scripts, make sure `E2E_TESTING` is not deleted along with it.

**Recommended action:** no change; document in `docs/E2E_TESTING_GUIDE.md` that `E2E_TESTING` now only gates Sentry/OTel init and the sync debug log.

---

### FINDING 3-10 — `docs/ALERTING_SETUP.md` still points Grafana Synthetic Monitoring at `/api/health`, which was removed

**Severity:** medium
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/docs/ALERTING_SETUP.md` lines 52-53:
  ```
  | `jb-bingo-health`  | `https://bingo.joolie-boolie.com/api/health`  | 60s |
  | `jb-trivia-health` | `https://trivia.joolie-boolie.com/api/health` | 60s |
  ```
- Line 65: "`Validation:` HTTP status 200, response body contains `"status":"ok"`"
- Phase-0 packet: "/api/health (endpoint was removed)"
- Grep for `/api/health` across `apps/` returns no results — the route is gone

**Why this matters:** If Grafana Synthetic Monitoring was actually configured per this doc, it is currently alerting on every probe (404) — *if* it was created. The secrets file says `"status": "initialized"` and `"checks": []` (line 51 of `.secrets/observability-accounts.json`), so the doc is describing checks that **haven't been created** yet, meaning the doc will drive future misconfiguration. Either way, the doc is wrong.

**Recommended action:** rewrite the Grafana Synthetic Monitoring section to probe `/`, `/play`, or `/display` with a string-match on the expected HTML (e.g. "Joolie Boolie"), or add a minimal `/api/health` route back to both apps that returns `{ status: 'ok' }` and update the doc. Given both apps are mostly static, probing `/` is simplest.

---

### FINDING 3-11 — `.secrets/prod-test-account.json` references a Supabase test account and a workflow that no longer exists

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/.secrets/prod-test-account.json` (gitignored):
  - Line 4: `"supabase_project": "iivxpjhmnalsuvpdzgza"`
  - Line 5: `"supabase_user_id": "58616f01-80ec-4d1c-acb7-3a60bb818e4f"`
  - Line 6: test email with a committed-looking password on line 7
  - Lines 9-13: `urls` including `"platform_hub": "https://joolie-boolie.com"` — platform-hub no longer exists
  - Line 14: "No E2E_TESTING bypass — this account authenticates through the real Supabase auth flow"
- The file describes a manual-QA workflow that relies on Supabase auth which has been removed

**Why this matters:** The file is gitignored, so it is not leaking. But it encodes a mental model (real-auth production QA) that no longer applies. A new developer reading it would assume production still has auth. Low severity because it is purely documentation in a secrets blob.

**Recommended action:** delete the file or replace its contents with `{ "status": "deprecated", "reason": "standalone conversion removed auth" }`. Disable the underlying Supabase test user account.

---

### FINDING 3-12 — `.secrets/observability-accounts.json` references `grafana_synthetic_monitoring` plans for removed endpoints

**Severity:** low
**Confidence:** medium
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/.secrets/observability-accounts.json` lines 46-52:
  ```json
  "grafana_synthetic_monitoring": {
    ...
    "checks": [],
    "notes": "Plugin activated. HTTP checks for joolie-boolie.com, bingo.joolie-boolie.com, trivia.joolie-boolie.com to be created during implementation."
  }
  ```
- This matches ALERTING_SETUP.md (3-10). The `joolie-boolie.com` root host will 301 to... nothing meaningful (no platform-hub anymore), though the custom domain is still valid per MEMORY.md

**Why this matters:** Low-severity planning artifact. The secrets file is gitignored so it is not public, but its notes field will mislead future work. It also lists auth tokens for Sentry, Grafana, and Axiom (redacted per instructions) that are actively used — those are fine.

**Recommended action:** update the `notes` field in `grafana_synthetic_monitoring` to describe the actual probes that exist once Finding 3-10 is resolved. No rotation needed on the token fields (they are in-use observability tokens, not auth secrets).

---

### FINDING 3-13 — `packages/types/src/user.ts` exports `User`, `UserProfile`, `LoginRequest`, `Session`, etc. for a removed auth system

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/packages/types/src/user.ts`:
  - Lines 14-23: `interface User` with "Unique identifier (UUID) from Supabase Auth"
  - Lines 28-35: `interface UserProfile extends User, Timestamps`
  - Lines 44-57: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `UpdateProfileRequest`
  - Lines 83-92: `interface Session { accessToken, refreshToken, expiresAt, user }`
- Grep for `LoginRequest|RegisterRequest|AuthResponse|UpdateProfileRequest|interface Session` in `/apps` returns nothing — runtime code no longer uses these

**Why this matters:** These types are dead but still exported from `@joolie-boolie/types`. They keep the auth vocabulary alive in autocomplete/imports. Strictly this is code dead-weight (Area 2), but I'm flagging it here because the `User.id` JSDoc explicitly says "from Supabase Auth" — a developer reading an autocomplete popover would assume auth still exists.

**Recommended action:** defer to Area 2 for the full cleanup; at minimum, update the JSDoc to drop "from Supabase Auth" now to prevent mental-model drift during the interim.

---

### FINDING 3-14 — `apps/{bingo,trivia}/package.json` `postbuild` script still runs `sentry-cli sourcemaps upload`, conditional on `SENTRY_AUTH_TOKEN`

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/package.json` line 8
- `/Users/j/repos/beak-gaming-platform/apps/trivia/package.json` line 8
  ```
  "postbuild": "if [ -n \"$SENTRY_AUTH_TOKEN\" ]; then sentry-cli sourcemaps inject .next && sentry-cli sourcemaps upload --org $SENTRY_ORG --project $SENTRY_PROJECT .next; else echo 'Skipping source map upload (SENTRY_AUTH_TOKEN not set)'; fi"
  ```
- `turbo.json` line 18-20 lists `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` as build env — **not** `SENTRY_AUTH_TOKEN`, so Turbo won't invalidate on that token changing, which is OK
- `next.config.ts` `productionBrowserSourceMaps: false` — so browser source maps are not emitted; the sentry-cli upload would still process server bundles

**Why this matters:** This isn't drift from the standalone removal — Sentry is actively maintained. Flagging because the `sentry-cli sourcemaps upload` step could fail silently if `SENTRY_ORG` or `SENTRY_PROJECT` is missing in prod. Confirm those are still set in Vercel (they are probably listed in the stale 3-2 env dump).

**Recommended action:** verify `SENTRY_ORG=detached-node`, `SENTRY_PROJECT=jb-bingo` (or `jb-trivia`), and `SENTRY_AUTH_TOKEN` are set in production Vercel envs for each app, and document the expected values in the app-level `.env.example` files (currently absent). No security risk; just observability hygiene.

---

### FINDING 3-15 — Service worker fetch-handler does not cache auth endpoints, but trivia SW caches `/api/*` generically — now includes `/api/csp-report` and `/api/monitoring-tunnel`

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/trivia/src/app/sw.ts` lines 53-69:
  ```ts
  {
    matcher: ({ url }) => url.pathname.startsWith('/api/'),
    handler: new NetworkFirst({
      cacheName: API_CACHE_NAME,
      plugins: [...],
      networkTimeoutSeconds: 10,
    }),
  },
  ```
- Will cache `/api/csp-report` (POST responses — which Serwist's NetworkFirst typically only caches GET) and `/api/monitoring-tunnel`
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/app/sw.ts` does **not** have a generic `/api/*` match — only voice-pack and SFX matchers
- There is no post-standalone cleanup needed for auth-endpoint bypass, since auth endpoints are gone

**Why this matters:** The generic `/api/*` matcher in Trivia's SW would try to cache the monitoring tunnel's POST responses. Serwist's `NetworkFirst` usually ignores non-GET requests for caching, but the intent is fuzzy and risks returning a stale error page to the monitoring tunnel during network transitions. No security implication — just latent bugginess.

**Recommended action:** tighten the Trivia SW matcher to `/api/trivia-api/*` (the only API that benefits from NetworkFirst) and exclude `/api/csp-report` and `/api/monitoring-tunnel`.

---

### FINDING 3-16 — Stale `.env.local.backup-pre-manual-test` files in both apps and `.env.real-auth` at repo root

**Severity:** low
**Confidence:** high
**Evidence:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/.env.local.backup-pre-manual-test` and `/Users/j/repos/beak-gaming-platform/apps/trivia/.env.local.backup-pre-manual-test` — both created by Vercel CLI and contain OAuth URIs, Supabase anon keys, Session token secrets, Vercel OIDC tokens
- `/Users/j/repos/beak-gaming-platform/.env.real-auth` — "Created by Vercel CLI" line 1, contains `CORS_ALLOWED_ORIGINS="https://feat-vercel-setup.vercel.app,https://trivia-nine-flax.vercel.app"` (old preview URLs), full Supabase + Session + OIDC token
- All three are gitignored (`.gitignore:57-58` and `:70`)

**Why this matters:** Untracked but present on-disk leftovers. `.gitignore:58 *.backup-pre-manual-test` protects against accidental commits but does not delete them. Each file contains a (possibly expired) `VERCEL_OIDC_TOKEN` — these are short-lived but some have `exp: 1770271373` style Unix timestamps that need inspection to confirm dead.

**Recommended action:** delete `apps/bingo/.env.local.backup-pre-manual-test`, `apps/trivia/.env.local.backup-pre-manual-test`, `.env.real-auth`, and `.env.e2e` (regeneratable by the setup script). The gitignore entries can stay as defensive measures.

---

## Cross-Cutting Observations

**Cookies:** Grep for `cookies()`, `Set-Cookie`, `setCookie`, `cookieStore`, `jb_` across `apps/` returns **zero matches**. The runtime code has been cleaned of all cookie-setting logic. Only the Vercel production env var `NEXT_PUBLIC_COOKIE_DOMAIN` remains (Finding 3-2). This is consistent with the Phase-0 note that middleware was deleted.

**CORS:** Grep for `CORS_ALLOWED_ORIGINS`, `cors`, `CORS` in `/apps` and `/packages` returns no matches. Cleaned.

**CSP `frame-src 'none'`:** present in both apps — good, blocks iframing. `X-Frame-Options: DENY` is also set, doubling the protection. Keep both.

**HSTS:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — set on both apps (`next.config.ts:36`). `includeSubDomains` is correct even with the one-host-per-app model; it costs nothing and may still apply if the apex is ever used.

**Permissions-Policy:** `camera=(), microphone=(), geolocation=()` — clean. Consider adding `payment=()` since there is no payment flow.

**`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`**: set, appropriate.

**Secrets directory:** `.secrets/observability-accounts.json` has real tokens for Sentry CI, Grafana Cloud OTLP, Axiom, and Grafana Synthetic Monitoring. These are gitignored per `.gitignore:50`. Do not expose; do not rotate; these are legitimate observability tokens in active use.

**Production Vercel pull file anomaly:** `apps/bingo/.vercel/.env.production.local` has literal `\n` characters embedded in several URL values (line 2, 5, 7) — if any code path ever consumed these, it would pass a newline through to a URL parser and break. Not a security issue but a data-integrity bug in the upstream Vercel env config.

## Prioritized Cleanup Order

1. **Rotate credentials** exposed in `.env.example` and on-disk files (SUPABASE_SERVICE_ROLE_KEY, SESSION_TOKEN_SECRET, SUPABASE_JWT_SECRET). Highest priority because the service role key could provide admin access to the Supabase project if still alive.
2. **Clean Vercel production env vars** on both Bingo and Trivia projects (Finding 3-2) — single `vercel env rm` sweep.
3. **Rewrite `.env.example` files** at root and per-app to be minimal (Finding 3-1).
4. **Delete** nightly workflow env block (Finding 3-4) and `turbo.json` dead env vars (Finding 3-5).
5. **Delete** `.env.local`, `.env.local.backup-pre-manual-test`, `.env.real-auth`, `.env.e2e`, `prod-test-account.json` locally (Findings 3-3, 3-11, 3-16).
6. **Strip** `E2E_JWT_SECRET` from setup script, docs, and `.env.e2e` template (Finding 3-8).
7. **Fix ALERTING_SETUP.md** to point at a live endpoint (Finding 3-10).
8. **Consider CSP enforcing mode** now that the multi-origin complexity is gone (Finding 3-6).
9. **Tighten Trivia SW** `/api/*` matcher (Finding 3-15).
10. **Tighten CSP report endpoint** validation (Finding 3-7), dead auth types (Finding 3-13), Sentry postbuild verification (Finding 3-14).
