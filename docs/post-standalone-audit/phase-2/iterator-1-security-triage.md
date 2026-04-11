# Iteration: Security Incident Triage

## Assignment
Verify the tracking status of env files flagged in Phase 1 Finding 1, enumerate every secret currently present in the working tree or in git history, assess blast radius for each, and produce an ordered rotation + cleanup plan that is executable without further research.

## Findings

### 1. Tracking & exposure status

`.gitignore` has correct protective rules at lines 21-23 (`.env`, `.env.local`, `.env.*.local`), line 50 (`.secrets/`), lines 57-58 (`*.backup-pre-manual-test`), and lines 66-71 (`.env.vercel`, `.env.e2e`, `.env.real-auth`, `start-e2e-servers.sh`). **`git ls-files | grep '\.env'` returns only three `.env.example` files (root, bingo, trivia) — nothing else is tracked.**

| File | Tracked? | Introduced at | Fields present | Shape |
|---|---|---|---|---|
| `.env.example` (repo root) | **tracked** | `06c8480a` 2026-01-19; rewritten clean in `de391ab5` 2026-04-09 | `TURBO_TOKEN`, `TURBO_TEAM`, `TURBO_REMOTE_ONLY` | placeholder only |
| `apps/bingo/.env.example` | **tracked** | `06c8480a` 2026-01-19; rewritten clean in `de391ab5` 2026-04-09 | `NEXT_PUBLIC_APP_URL`, commented `NEXT_PUBLIC_FARO_URL`, commented `TURBO_*` | placeholder only |
| `apps/trivia/.env.example` | **tracked** | `06c8480a` 2026-01-19; rewritten clean in `de391ab5` 2026-04-09 | `NEXT_PUBLIC_APP_URL`, commented `NEXT_PUBLIC_FEATURE_QUESTION_SETS`, commented `THE_TRIVIA_API_KEY`, commented `NEXT_PUBLIC_FARO_URL`, commented `TURBO_*` | placeholder only |
| `.env` (repo root) | **gitignored** (line 21) — never tracked in history; `git log --all --diff-filter=A -- .env` empty | — | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sb_publishable shape), `SUPABASE_SERVICE_ROLE_KEY` (sb_secret shape, 32-char body), `SESSION_TOKEN_SECRET` (64-hex), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_OAUTH_CLIENT_ID` (UUID), `NEXT_PUBLIC_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_OAUTH_CONSENT_URL` | **real** (sb_secret prefix + 32-char body; 64-hex session; valid UUID) |
| `.env.local` (repo root) | **gitignored** (line 22) | — | `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_BINGO_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT-shaped legacy anon), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_TRIVIA_URL`, `SESSION_TOKEN_SECRET` (64-hex), `SUPABASE_SERVICE_ROLE_KEY` (sb_secret shape), `VERCEL_OIDC_TOKEN` (JWT-shaped) | **real** (Vercel-pulled) |
| `.env.real-auth` | **gitignored** (line 70) | — | `NEXT_PUBLIC_SUPABASE_URL` (localhost), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sb_publishable), `SUPABASE_SERVICE_ROLE_KEY` (sb_secret), `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_*_URL` fields | **real for local Supabase**, but localhost-scoped |
| `.env.e2e` | **gitignored** (line 69) | — | Port env exports, `E2E_TESTING`, `E2E_JWT_SECRET` (literal "e2e-test-secret-key-that-is-at-least-32-characters-long") | **test placeholder** only |
| `apps/bingo/.env.local` | **gitignored** (line 22) | — | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT-shaped), `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `NEXT_PUBLIC_OAUTH_CLIENT_ID`, `NEXT_PUBLIC_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_OAUTH_CONSENT_URL`, `E2E_TESTING`, `E2E_JWT_SECRET`, `SUPABASE_JWT_SECRET` (88-char base64) | **real** |
| `apps/trivia/.env.local` | **gitignored** (line 22) | — | Same Supabase/session/JWT fields as bingo, different OAuth client ID (UUID), `NEXT_PUBLIC_FEATURE_QUESTION_SETS`, `SUPABASE_JWT_SECRET` (same as bingo) | **real** |
| `apps/bingo/.env.local.backup-pre-manual-test` | **gitignored** (line 58) | — | Same production Vercel shape, older `SESSION_TOKEN_SECRET` `cf72e72498fb7...` | **real, stale backup** |
| `apps/trivia/.env.local.backup-pre-manual-test` | **gitignored** (line 58) | — | Same, `SESSION_TOKEN_SECRET` `f5a2929fd684f...` | **real, stale backup** |
| `apps/bingo/.vercel/.env.production.local` | **gitignored** (`.vercel`, line 64) | — | Full production Vercel env, including `SESSION_TOKEN_SECRET` (`d298de93...`), `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_COOKIE_DOMAIN=".beak-gaming.com"` (old domain), `NEXT_PUBLIC_OAUTH_CLIENT_ID`, `VERCEL_OIDC_TOKEN` | **real, live on production** |
| `apps/trivia/.vercel/.env.production.local` | **gitignored** (`.vercel`, line 64) | — | Full production Vercel env, same `SESSION_TOKEN_SECRET=d298de93...` as bingo, `NEXT_PUBLIC_SUPABASE_*`, old domain URLs | **real, live on production** |
| `.secrets/observability-accounts.json` | **gitignored** (line 50) | — | Sentry `auth_token` (`sntrys_...`), Grafana Cloud `api_token` (`glc_...`), `otlp_auth_header` base64 Basic | **real, live for observability** |
| `.secrets/prod-test-account.json` | **gitignored** (line 50) | — | (not inspected — out of incident scope but flagged for completeness) | unknown |

**Phase 1 was wrong on two points:** (a) Area 2 F1 speculated `.env` might be tracked — it is **not**, and was **never** in history; (b) the Phase 1 description of root `.env.example` as containing real secrets no longer matches HEAD — the file was cleaned in `de391ab5` (2026-04-09, commit message "fix: remove remaining user-system artifacts for standalone mode", PR #516), so the tracked example is **currently a placeholder-only file**. Phase 1 scanned before or during that cleanup.

### 2. Git history exposure

Despite HEAD being clean, **the Supabase service role key and publishable anon key were committed to `docs/E2E_TESTING_GUIDE.md` for roughly one month** (2026-01-24 → 2026-02-25) before being replaced with placeholders. The value blobs are still reachable via `git log`, `git show`, or git's loose-object storage:

| Secret field | Shape / evidence | Commits containing real value |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_` + 32-char body) | `sb_secret_` prefix, ~35 chars total | `3b40fb25` 2026-01-24 (introduced in `docs/E2E_TESTING_GUIDE.md`), `c6c4af5c` 2026-01-23, `0b9e8078` 2026-01-23, `e8784d7b` 2026-02-15, `806c9f6b` + `72bd8caf` 2026-02-25 (replacement commits) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`sb_publishable_` + body) | `sb_publishable_` prefix, ~40 chars | `3b40fb25` 2026-01-24, `d04ae7e5` 2026-01-25, `806c9f6b` + `72bd8caf` 2026-02-25 |
| `NEXT_PUBLIC_SUPABASE_URL` project ref `iivxpjhmnalsuvpdzgza` | subdomain | Same commit set plus 12 other tracked files (all in `docs/archive/*` paths, per CLAUDE.md out-of-scope) |
| `NEXT_PUBLIC_OAUTH_CLIENT_ID` bingo UUID `0d87a03a-...` | UUID | Present at HEAD in three out-of-scope paths: `docs/archive/2026-01-22-oauth-planning/README.md`, `docs/archive/oauth-planning/INITIATIVE_1_REVISED_OAUTH.md`, `docs/standalone-games-analysis/phase-1/area-2-platform-hub.md` |
| `SESSION_TOKEN_SECRET` value `029145387d...` (from root `.env`) | 64-hex | **Not in history** — only in on-disk `.env` (gitignored) |
| `SESSION_TOKEN_SECRET` value `d298de93c9b0e...` (from Vercel prod + apps `.env.local`) | 64-hex | **Not in history** — Vercel-only and in local `.env.local` |
| `SESSION_TOKEN_SECRET` values `cf72e72...`, `f5a2929...`, `675683880...` | 64-hex (older backups and local real-auth) | **Not in history** |
| `SUPABASE_JWT_SECRET` `bJZzn1MPI...` (88-char base64) | base64 JWT secret | **Not in history** — only in `apps/*/.env.local` |
| Sentry `sntrys_...` auth token | `sntrys_` prefix | **Not in history** — only in `.secrets/` (gitignored) |
| Grafana Cloud `glc_...` API token | `glc_` prefix | **Not in history** — only in `.secrets/` (gitignored) |
| Vercel OIDC tokens (JWT-shaped) | short-lived (`exp` fields show ~12h TTL) | **Not in history** — refreshed by CLI |

**Conclusion:** history exposure is limited to the Supabase project URL, anon key, and service role key (Supabase credential triad), exposed for ~32 days via `docs/E2E_TESTING_GUIDE.md`. Session secrets and JWT secrets were never committed.

### 3. Blast radius per secret (assuming secret is live)

| Secret field | What it authorises | Value source |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (project `iivxpjhmnalsuvpdzgza`) | **Full admin bypass of RLS on every table and storage bucket in the Supabase project.** Can read/write/delete any row, create users, sign arbitrary JWTs as any user, invoke any Edge Function, drop tables. Value is exposed in git history on the `main` branch. | `docs/E2E_TESTING_GUIDE.md` commit history + multiple local files + Vercel prod env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Row-level-security-bounded client access. Low direct risk on its own; dangerous when combined with poorly-scoped RLS policies or public tables. Because the project is post-rebrand inactive, actual tables are unknown. | Same |
| `SESSION_TOKEN_SECRET` (HMAC 64-hex, the auth-era session token signer) | Forges or tampers with server-signed session tokens on whichever app uses it. However, per BEA-696 (commit `25cdc983`), **both `apps/{bingo,trivia}/src/middleware.ts` are deleted**, and a grep for `SESSION_TOKEN_SECRET` in current app source shows no remaining consumer. Live on Vercel prod env but not read by runtime code. Dead value. | Only on-disk, in Vercel prod env |
| `NEXT_PUBLIC_OAUTH_CLIENT_ID` (`0d87a03a-...` bingo, `0cd92ba6-...` trivia) | Public OAuth 2.1 client identifier. Not a secret in the confidential-client sense, but reveals the OAuth client registrations on the deleted Platform Hub. No blast radius alone. | Local files + two in-scope docs are clean; still present in `docs/archive/*` (out-of-scope) |
| `SUPABASE_JWT_SECRET` (88-char base64, same on bingo + trivia) | Verifies HS256-signed Supabase JWTs. If the Supabase project is alive, lets an attacker forge JWTs that the project's API accepts as any user (if used). Per CLAUDE.md + MEMORY, the middleware verification chain was `SUPABASE_JWT_SECRET (HS256) → SESSION_TOKEN_SECRET → JWKS (ES256)` — but middleware is deleted, so no runtime consumer. Still a rotation target because the value exists on-disk and in app env. | Local `apps/*/.env.local` only |
| Sentry `sntrys_...` auth token | **Live**. Scope "org:ci". Can upload source maps, create releases, delete events, access error data. | `.secrets/observability-accounts.json` |
| Grafana Cloud `glc_...` API token | **Live**. Scopes metrics:write, logs:write, traces:write. Can inject fake telemetry, exhaust quota. | `.secrets/observability-accounts.json` |
| Vercel OIDC tokens | Short TTL (~12h visible in `exp`). Used for authenticated dev pulls. Already expired by the time this report is written. | `.vercel/` pulled files |

### 4. Supabase project status (what the repo knows)

- **Project ref:** `iivxpjhmnalsuvpdzgza.supabase.co` — NOT listed by `mcp__supabase__list_projects` under the connected MCP account. Visible projects are `xwopquuffahvuekrjqry` (mind-controlled) and `rbdsvsmemsyyywdivqxt` (detached-node), both `ACTIVE_HEALTHY`, both created post-rebrand (Feb 2026). **The old project is either under a different org, deleted, or paused-and-hidden from the MCP token's view.**
- **User memory** (`MEMORY.md` "Rebrand (COMPLETE)" section): _"Supabase auth URLs: Need update when project is unpaused (free tier limit)"_ — confirms the project was intended to be paused on free tier at the time of rebrand.
- **Inferred status:** likely paused. But a free-tier pause does NOT revoke the service role key — it only stops the API. If the project owner unpauses, the exposed key in git history becomes live immediately. Rotation is still required.

### 5. Rotation + cleanup plan (ordered, executable)

Run every step from the repo root unless noted. Each step is idempotent where possible.

**Phase A — Rotate live credentials (highest priority; do this first)**

1. **Rotate Sentry auth token** (`sntrys_...`). Revoke at `https://sentry.io/settings/account/api/auth-tokens/`, create a new token scoped `org:ci`, and update `.secrets/observability-accounts.json`. Then `vercel env rm SENTRY_AUTH_TOKEN production` on both apps and `vercel env add SENTRY_AUTH_TOKEN production` with the new value. _Reason: `.secrets/` is gitignored but nothing prevents an accidental `git add -f`._
2. **Rotate Grafana Cloud access policy token** (`glc_...`). In Grafana Cloud portal → Access Policies → `joolie-boolie-otlp` → rotate token. Update `.secrets/observability-accounts.json` and `OTEL_EXPORTER_OTLP_HEADERS` in Vercel env.
3. **Rotate or retire `SUPABASE_SERVICE_ROLE_KEY`.** If the Supabase project `iivxpjhmnalsuvpdzgza` still belongs to the user:
   - If reachable: `supabase login`, then in the dashboard → Project Settings → API → click "Reset service_role key". This immediately invalidates the exposed value.
   - If unreachable (deleted or not under current account): no action possible, but the exposure is moot because no endpoint to attack.
4. **Rotate `NEXT_PUBLIC_SUPABASE_ANON_KEY`** from the same dashboard (same ref). This key is public by design but because it was bound to the pre-rebrand project, rotating it is cheap and prevents confusion. (If project is unreachable, skip.)
5. **Rotate `SESSION_TOKEN_SECRET` in Vercel prod** (even though unused) to prevent "secrets live in vercel env" surprises during post-standalone cleanup:
   - `vercel env rm SESSION_TOKEN_SECRET production --yes` on bingo project (run from `apps/bingo/`).
   - `vercel env rm SESSION_TOKEN_SECRET production --yes` on trivia project (run from `apps/trivia/`).

**Phase B — Remove the dead Vercel env surface (matches Phase 1 Finding 2)**

6. In `apps/bingo/`:
   ```
   vercel env rm NEXT_PUBLIC_COOKIE_DOMAIN production --yes
   vercel env rm NEXT_PUBLIC_OAUTH_CLIENT_ID production --yes
   vercel env rm NEXT_PUBLIC_OAUTH_CONSENT_URL production --yes
   vercel env rm NEXT_PUBLIC_OAUTH_REDIRECT_URI production --yes
   vercel env rm NEXT_PUBLIC_PLATFORM_HUB_URL production --yes
   vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
   vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes
   ```
7. Repeat step 6 in `apps/trivia/`.
8. Fix the corrupted `NEXT_PUBLIC_APP_URL` (contains a literal `\n`): `vercel env rm NEXT_PUBLIC_APP_URL production --yes` then `vercel env add NEXT_PUBLIC_APP_URL production` with the correct value `https://bingo.joolie-boolie.com` (bingo) / `https://trivia.joolie-boolie.com` (trivia). Same fix for `NEXT_PUBLIC_PLATFORM_HUB_URL` and `NEXT_PUBLIC_OAUTH_CONSENT_URL` if they are re-added — but they shouldn't be.
9. `vercel redeploy --no-wait` on each project to make the env removal take effect.

**Phase C — Local cleanup of on-disk secrets**

10. Delete all local files that are redundant now that apps are standalone with localStorage-only:
    ```
    rm /Users/j/repos/beak-gaming-platform/.env
    rm /Users/j/repos/beak-gaming-platform/.env.local
    rm /Users/j/repos/beak-gaming-platform/.env.real-auth
    rm /Users/j/repos/beak-gaming-platform/apps/bingo/.env.local
    rm /Users/j/repos/beak-gaming-platform/apps/trivia/.env.local
    rm /Users/j/repos/beak-gaming-platform/apps/bingo/.env.local.backup-pre-manual-test
    rm /Users/j/repos/beak-gaming-platform/apps/trivia/.env.local.backup-pre-manual-test
    rm /Users/j/repos/beak-gaming-platform/apps/bingo/.vercel/.env.production.local
    rm /Users/j/repos/beak-gaming-platform/apps/trivia/.vercel/.env.production.local
    ```
11. Re-create a clean `apps/bingo/.env.local` with only `NEXT_PUBLIC_APP_URL=http://localhost:3000` if dev servers need it (matches the committed example). Same for trivia on port 3001. Or run `vercel env pull --environment=production apps/{bingo,trivia}/.vercel/.env.production.local` after Phase B to regenerate a clean pull.

**Phase D — Git history decision (NOT a rewrite)**

12. **Do NOT rewrite history.** The exposed values are: (a) a Supabase project that is likely paused/deleted and unreachable; (b) a publishable anon key that was public by design. History rewrite (BFG / `git filter-repo`) would require all contributors to re-clone and break all existing PR refs, tags, and the Vercel deployment cache. The risk/benefit math only favors a rewrite if the secret is still live. **After step 3 invalidates the service role key, the history exposure becomes moot** — a rotated key is just a random 32-char string. Forward-only cleanup is sufficient.
13. **Instead, add a `SECURITY.md` note documenting the incident**, the 2026-01-24 → 2026-02-25 exposure window, and that the project was rotated on rotation-date. This creates an auditable record without rewriting.

**Phase E — Prevent recurrence**

14. Add pre-commit secret scanning: install `gitleaks` or `trufflehog` via a Husky `pre-commit` hook that blocks any staged diff matching `sb_secret_`, `sb_publishable_`, `sntrys_`, `glc_`, `SESSION_TOKEN_SECRET=[0-9a-f]{40,}`, and `SUPABASE_JWT_SECRET=[A-Za-z0-9+/=]{60,}`. Example gitleaks rules already cover most of these.
15. Add the following values as **Deny Rules** in Vercel:
    - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_TOKEN_SECRET`, `NEXT_PUBLIC_COOKIE_DOMAIN`, `NEXT_PUBLIC_OAUTH_*`, `NEXT_PUBLIC_PLATFORM_HUB_URL` — remove from both projects and don't re-add.
16. Strip OAuth client ID `0d87a03a-d90a-4ccc-a46b-85fdd8d53c21` from the one non-archive doc that still mentions it: `docs/standalone-games-analysis/phase-1/area-2-platform-hub.md` (or confirm that doc is considered historical/out-of-scope per the audit packet's "Out of Scope: historical archive dirs" rule — `standalone-games-analysis/` is arguably archival).

**Acceptance criteria (run these to verify cleanup):**

```
# 1. No tracked file contains any secret-shaped string
git ls-files -z | xargs -0 grep -El 'sb_secret_|sntrys_|glc_|SESSION_TOKEN_SECRET=[0-9a-f]{40,}|SUPABASE_JWT_SECRET=[A-Za-z0-9+/=]{60,}' ; echo $?  # must be 1

# 2. No tracked file references the old Supabase project
git ls-files -z | xargs -0 grep -l 'iivxpjhmnalsuvpdzgza' ; echo $?  # must be 1

# 3. No on-disk env files except sanctioned examples + a minimal .env.local for dev
find . -maxdepth 4 -name '.env*' -not -path './node_modules/*' -not -path './.next/*' -not -path './.turbo/*' -not -path './.worktrees/*'
# Expected: only .env.example files, optionally a minimal apps/*/.env.local

# 4. Vercel prod env is clean
(cd apps/bingo && vercel env ls production | grep -E 'SUPABASE|OAUTH|PLATFORM_HUB|COOKIE_DOMAIN|SESSION_TOKEN_SECRET')  # must be empty
(cd apps/trivia && vercel env ls production | grep -E 'SUPABASE|OAUTH|PLATFORM_HUB|COOKIE_DOMAIN|SESSION_TOKEN_SECRET') # must be empty
```

### 6. Risk assessment

| Action | What breaks if we DO it | What stays broken if we DON'T | Attacker impact now |
|---|---|---|---|
| Rotate Sentry auth token | CI source-map upload fails until secret updated in Vercel env + GitHub env (if any workflow uses it). | Any leak of `.secrets/observability-accounts.json` gives org-scoped CI access to Sentry. | **Medium.** Sentry token is live; scope is `org:ci`. |
| Rotate Grafana Cloud token | Vercel OTel export fails until new token deployed. | Same leak vector. | **Medium.** Token is live; lets attacker inject telemetry. |
| Rotate/retire Supabase service role key | Nothing — no runtime reads it, and middleware is deleted. Rotation is a no-op at the app level. | A paused free-tier Supabase project, **if unpaused by the owner**, immediately has an admin key in git history. | **High if project is alive; zero if deleted.** Cannot verify which from outside the account. Treat as high. |
| Remove Vercel prod env vars (`SUPABASE_*`, `OAUTH_*`, `PLATFORM_HUB_URL`, `COOKIE_DOMAIN`, `SESSION_TOKEN_SECRET`) | Nothing. No runtime code reads these post-BEA-696 (middleware deleted). Fixes the `\n` corruption in URL values as a side effect. | Dead env surface remains, future devs waste time untangling it, any accidental re-import into code would revive a ghost path. | **None at runtime**, but reduces leak surface. |
| Delete local `.env.local` + `.env` + backups | Dev workflow must be re-checked; anything still reading these (unlikely — confirmed none in-source) breaks. `pnpm dev` should still run since `apps/*/.env.example` are the only ones needed. | Secrets sit on disk on the dev machine forever, accidental `git add -f` or shell history leak possible. | **Low.** Requires local access. |
| **NOT** rewriting git history | — | Paused Supabase project ref stays in history. If the key is never rotated AND the project is unpaused by someone, history grep finds it. | **Medium-to-high depending on rotation step 3.** After rotation, the historical value is dead data. |
| Add gitleaks pre-commit hook | Developers hit the hook on any future accidental commit of a matching pattern. Low friction. | Recurrence of this exact incident is not prevented. | N/A (prevention). |

## Resolved Questions (from Phase 1 open questions)

1. **"Root `.env` tracking status"** — `.env` is **not tracked, never has been in history.** `git ls-files .env` returns empty; `git log --all --follow --diff-filter=A -- .env` returns empty. `.gitignore:21` has been protecting it since initial commit.
2. **Root `.env.example` current content vs Phase 1 description** — Phase 1 described the file as containing real secrets. It **no longer does**; commit `de391ab5` (2026-04-09, "fix: remove remaining user-system artifacts for standalone mode", PR #516) rewrote it to a 15-line Turbo-only placeholder. Same commit cleaned `apps/bingo/.env.example` and `apps/trivia/.env.example`. Phase 1's scan was pre-cleanup.
3. **Where the exposed values actually live today** — on-disk gitignored files + live Vercel prod env + git history of `docs/E2E_TESTING_GUIDE.md` between `3b40fb25` (2026-01-24) and `72bd8caf` (2026-02-25).

## Remaining Unknowns

1. **Whether the Supabase project `iivxpjhmnalsuvpdzgza` is actually still alive, paused, or deleted.** `mcp__supabase__list_projects` does not return it under the current MCP account. To definitively know, the user must log into the Supabase dashboard as the original owning account (likely a different email than the current "detached-node" org).
2. **Whether any GitHub Actions secret was ever set with these values.** `.github/workflows/nightly.yml` injects defunct env vars but the actual secrets in the GitHub repo's Settings → Secrets panel cannot be read by any tool; the user must audit them directly at `https://github.com/julianken/joolie-boolie/settings/secrets/actions`.
3. **Whether the Sentry `sntrys_` token is scoped only to the "detached-node" org** (low blast radius) or has cross-org access. The `.secrets/` JSON says `org:ci` but Sentry's token scope model should be verified in the Sentry UI.
4. **`.secrets/prod-test-account.json` contents.** Not inspected in this triage because out of the specific incident scope, but should be added to Phase C cleanup if it also contains live credentials.

## Revised Understanding

The security picture is **materially better than Phase 1 implied**. The tracked `.env.example` files are already clean at HEAD — the cleanup happened the same day Phase 1 was run, which is why Phase 1 saw inconsistent state. The real open exposures are:

1. **One-month historical exposure of the Supabase credential triad** in `docs/E2E_TESTING_GUIDE.md` (Jan 24 → Feb 25, 2026). Mitigation: rotate the service role key at the provider, don't rewrite history.
2. **Live production Vercel env** on both bingo and trivia still carries the pre-rebrand auth env surface + a Supabase service role key sibling. No runtime code reads these, but they're a rotation target and the URL fields are corrupted with literal `\n` substrings (Phase 1 Finding 2 was exactly right).
3. **`.secrets/` directory** contains genuinely live Sentry and Grafana Cloud tokens that should be rotated whenever a secrets audit happens, regardless of the Supabase incident.
4. **Seven local on-disk `.env.*` files** carry inert-but-still-real values from the pre-rebrand world. Safe to delete; deletion is the cleanest remediation.

The cleanup plan above is forward-only — no history rewrite, no force push, no destructive git operations. It relies on the provider-side key rotation (Supabase, Sentry, Grafana Cloud) to kill the historical leak, and on Vercel env removal + local file deletion to kill the live leak. Acceptance criteria are executable scripts.
