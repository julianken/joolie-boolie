# Iteration: Vercel Production Env Cleanup

## Assignment

Deepen Area 3 Finding 3-2 with the authoritative live Vercel state (not the stale on-disk pulled file), verify the `\n` data-corruption bug, audit custom domains, and produce a concrete `vercel env rm` command plan with ordering, verification, and rollback.

## Prerequisite check

- **Vercel CLI auth:** Authenticated as `julianken` (team `jimpers-projects`, org id `team_bVYUjB0ZgUT5velRCWNIglgf`). CLI version `50.10.1`.
- **Linking:** Both `apps/bingo/.vercel/project.json` and `apps/trivia/.vercel/project.json` exist and point at `prj_eZjT2Royhj7xz5syh5LQ0v62MkZ1` (bingo) and `prj_u8cTEH2rSdfknBahBwAMDEmDklZB` (trivia). No root `.vercel/` — this is a per-app linking setup (acceptable because each app is its own Vercel project).
- **Stale pulled files investigated:** `apps/{bingo,trivia}/.vercel/.env.production.local` have `mtime Feb 4 22:59:10 2026` — these predate the Wave-1 cleanup. Area 3 Finding 3-2 was derived from these stale snapshots, not from a fresh `vercel env ls`.

## MAJOR CORRECTION TO FINDING 3-2

The Phase 1 finding's severity should be **downgraded** from *critical* to *low*. A fresh `vercel env ls production` shows the cleanup already happened at some unrecorded point. The live Vercel production env contains **zero auth-related vars** on either project. The on-disk `.env.production.local` files are Feb-4 historical snapshots; the CLI "pulled from production" framing was wrong.

## Full env inventory per app per environment (live, fetched 2026-04-11)

### apps/bingo — production
| Name | Source consumers | Classification |
|---|---|---|
| `NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT` | None in source (auto-provisioned by Axiom Vercel integration, read by Next.js web-vitals) | KEEP (integration-managed) |
| `NEXT_PUBLIC_FARO_URL` | `packages/error-tracking/src/faro.ts:10` | **KEEP (but fix `\n` suffix)** |
| `OTEL_EXPORTER_OTLP_HEADERS` | `apps/bingo/src/instrumentation.ts` | KEEP |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `apps/bingo/src/instrumentation.ts` | KEEP |
| `NEXT_PUBLIC_SENTRY_DSN` | `apps/bingo/sentry.client.config.ts` | KEEP |
| `SENTRY_DSN` | `apps/bingo/sentry.server.config.ts` | KEEP |
| `SENTRY_ORG` | `apps/bingo/package.json` postbuild | KEEP |
| `SENTRY_PROJECT` | `apps/bingo/package.json` postbuild | KEEP |
| `SENTRY_AUTH_TOKEN` | `apps/bingo/package.json` postbuild (guarded) | KEEP |
| `TURBO_TEAM` | Turborepo remote cache | KEEP |

### apps/bingo — preview
Same as production (minus `NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT`, `NEXT_PUBLIC_FARO_URL`, `OTEL_*`), plus Sentry. All KEEP.

### apps/bingo — development
Only `TURBO_TEAM`. KEEP.

### apps/trivia — production
Same as bingo, **plus** `NEXT_PUBLIC_FEATURE_QUESTION_SETS`. Grep confirms **zero source consumers** for this flag in `apps/trivia/src`. Classification: **REMOVE** (dead feature flag — also has `\n` bug).

### apps/trivia — preview
Same shape as bingo preview, plus the dead `NEXT_PUBLIC_FEATURE_QUESTION_SETS`. REMOVE that one; KEEP the rest.

### apps/trivia — development
Only `NEXT_PUBLIC_FEATURE_QUESTION_SETS`. REMOVE.

**Notable gaps — vars that SHOULD be set but are not:**
- `THE_TRIVIA_API_KEY` — trivia-api proxy reads it (`apps/trivia/src/lib/trivia-api/client.ts:200`). Missing from all 3 trivia environments. Without it, the proxy falls back to unauthenticated rate-limited access. Not a cleanup target, but worth flagging.
- `TURBO_TEAM` is not set on trivia (only on bingo). Likely intentional if trivia doesn't use remote cache, or oversight.

## `\n` data corruption investigation

**Confirmed live.** A fresh `vercel env pull .vercel/.env.production.fresh --environment=production` on both projects, dumped through `od -c`, shows literal two-character `\` `n` sequences (not `\n` as newline) embedded in string values:

- **bingo prod:** `NEXT_PUBLIC_FARO_URL="https://faro-collector-prod-us-west-0.grafana.net/collect/eb0b70c9011658884195c70fe7914203\n"`
- **trivia prod:** `NEXT_PUBLIC_FARO_URL="https://faro-collector-prod-us-west-0.grafana.net/collect/64f86e6ba184dc2be06618b891179 5ea\n"`
- **trivia prod & preview & dev:** `NEXT_PUBLIC_FEATURE_QUESTION_SETS="false\n"`

The old auth vars (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `NEXT_PUBLIC_OAUTH_CONSENT_URL`) that carried this bug in Feb 4 are GONE — the vars that still carry it are the Faro URL and the (dead) question-sets flag.

**Root cause hypothesis:** Someone ran `vercel env add FOO production` and entered the value via a shell heredoc or `echo` that appended a newline, and the CLI recorded the escaped `\n` literal rather than a raw byte. There is no automated CLI-side sanitization. `vercel env get` is not a valid subcommand (CLI rejects with "Please specify a valid subcommand: ls | add | rm | pull | run | update"), so the only way to verify is by pulling and inspecting bytes. The Vercel dashboard would show the `\n` suffix in the edit modal.

**Impact:** `NEXT_PUBLIC_FARO_URL` is consumed at `packages/error-tracking/src/faro.ts:10`. When the Faro SDK initializes with a URL ending in `%0A` (URL-encoded newline), POSTs to the collector will hit a 400 or a non-existent path. Faro is wired but silently broken in production — this is a real bug unrelated to the standalone conversion.

**Fix:** `vercel env update NEXT_PUBLIC_FARO_URL production` and paste the trailing-newline-free URL at the prompt. Repeat for preview if present, and for both apps.

## Domain configuration audit

From `vercel domains ls` (team scope):

| Domain | Registrar | Nameservers | Expiration |
|---|---|---|---|
| `joolie-boolie.com` | Vercel | Vercel | Feb 16 2027 |
| `beak-gaming.com` | Vercel | Vercel | **Feb 3 2027 (still registered)** |
| `detached-node.dev` | Vercel | Vercel | Feb 16 2027 |

From `vercel inspect bingo.joolie-boolie.com`:
```
Aliases:
  https://bingo.joolie-boolie.com        <- canonical
  https://feat-vercel-setup.vercel.app   <- stale preview branch alias
  https://bingo-jimpers-projects.vercel.app
  https://bingo-git-main-jimpers-projects.vercel.app
  https://bingo.beak-gaming.com          <- OLD DOMAIN STILL ATTACHED
```

From `vercel inspect trivia.joolie-boolie.com`:
```
Aliases:
  https://trivia.joolie-boolie.com       <- canonical
  https://trivia-nine-flax.vercel.app    <- stale preview alias
  https://trivia-jimpers-projects.vercel.app
  https://trivia-git-main-jimpers-projects.vercel.app
  https://trivia.beak-gaming.com         <- OLD DOMAIN STILL ATTACHED
```

**Neither app does any redirect from `*.beak-gaming.com` to `*.joolie-boolie.com`.** Both old URLs currently serve the same production deployment directly, meaning search engines and any outstanding bookmarks still serve a "live" (but brand-inconsistent) site. This contradicts the MEMORY.md claim that `beak-gaming.com → 301 redirects to joolie-boolie.com`. Either the redirect was never configured, or it only applies at the apex `beak-gaming.com` (not the subdomains).

**Recommendation:**
1. Configure a redirect (Project → Domains → Edit `bingo.beak-gaming.com` → Redirect to `bingo.joolie-boolie.com` with permanent 301) for both subdomains.
2. Leave the old domain attached for the duration of the redirect window.
3. After ~60 days of redirect traffic, remove the aliases with `vercel domains rm bingo.beak-gaming.com --yes` and `trivia.beak-gaming.com --yes`.
4. Decide at renewal (Feb 2027) whether to let `beak-gaming.com` lapse or renew one more year as a defensive hold.

Also stale:
- `feat-vercel-setup.vercel.app` on bingo — orphan preview alias, should be removed.
- `trivia-nine-flax.vercel.app` on trivia — same.

## Env vars to KEEP

- All observability vars on both apps in all environments (Sentry, OTEL, Axiom, Faro).
- `TURBO_TEAM` on bingo (all envs). Also consider adding to trivia if remote cache is desired there.

## Env vars to ROTATE-THEN-REMOVE

**None.** The stale `SESSION_TOKEN_SECRET`, `SUPABASE_*`, `NEXT_PUBLIC_OAUTH_*`, `NEXT_PUBLIC_PLATFORM_HUB_URL`, `NEXT_PUBLIC_COOKIE_DOMAIN` vars from Area 3 Finding 3-2 are **already gone from Vercel**. The rotation concern from Phase 1 still applies to the git-tracked `.env.example` and the on-disk `.env.local` files (Finding 3-1 and 3-3), not to Vercel.

## Env vars to REMOVE

Only one: `NEXT_PUBLIC_FEATURE_QUESTION_SETS` across all three environments on the `trivia` project. Zero source consumers, and it also exhibits the `\n` data-corruption bug.

## Env vars to UPDATE (fix `\n` corruption)

- `NEXT_PUBLIC_FARO_URL` in `bingo` production — strip trailing `\n`.
- `NEXT_PUBLIC_FARO_URL` in `trivia` production — strip trailing `\n`.

## Command sequence (ordered)

```bash
# --- Phase 1: Inventory snapshot (baseline for diff) ---
cd /Users/j/repos/beak-gaming-platform
vercel env ls production --cwd apps/bingo > /tmp/bingo-prod-before.txt
vercel env ls preview    --cwd apps/bingo > /tmp/bingo-prev-before.txt
vercel env ls development --cwd apps/bingo > /tmp/bingo-dev-before.txt
vercel env ls production --cwd apps/trivia > /tmp/trivia-prod-before.txt
vercel env ls preview    --cwd apps/trivia > /tmp/trivia-prev-before.txt
vercel env ls development --cwd apps/trivia > /tmp/trivia-dev-before.txt

# --- Phase 2: Remove dead feature flag from trivia (all envs) ---
vercel env rm NEXT_PUBLIC_FEATURE_QUESTION_SETS production  --cwd apps/trivia --yes
vercel env rm NEXT_PUBLIC_FEATURE_QUESTION_SETS preview     --cwd apps/trivia --yes
vercel env rm NEXT_PUBLIC_FEATURE_QUESTION_SETS development --cwd apps/trivia --yes

# --- Phase 3: Fix \n corruption on NEXT_PUBLIC_FARO_URL (interactive) ---
# Use `vercel env update` — it prompts for the new value. Paste the clean URL WITHOUT a trailing newline.
# Bingo: https://faro-collector-prod-us-west-0.grafana.net/collect/eb0b70c9011658884195c70fe7914203
vercel env update NEXT_PUBLIC_FARO_URL production --cwd apps/bingo
# Trivia: https://faro-collector-prod-us-west-0.grafana.net/collect/64f86e6ba184dc2be06618b8911795ea
vercel env update NEXT_PUBLIC_FARO_URL production --cwd apps/trivia

# --- Phase 4: Orphan preview alias cleanup (optional, defer until confirmed stale) ---
# Only run after verifying these aren't used by any active preview deployment:
vercel alias rm feat-vercel-setup.vercel.app --yes
vercel alias rm trivia-nine-flax.vercel.app  --yes

# --- Phase 5: Old-domain 301 redirect setup ---
# Via dashboard only (CLI does not expose per-domain redirect edit for attached domains).
# Project -> bingo  -> Domains -> bingo.beak-gaming.com  -> "Redirect to" bingo.joolie-boolie.com (308)
# Project -> trivia -> Domains -> trivia.beak-gaming.com -> "Redirect to" trivia.joolie-boolie.com (308)

# --- Phase 6: Gap fill — set the missing key for trivia ---
# Read value from 1Password or from existing dev .env.local
printf '%s' "$THE_TRIVIA_API_KEY_VALUE" | vercel env add THE_TRIVIA_API_KEY production --cwd apps/trivia
```

Notes on command safety:
- `vercel env rm ... --yes` is non-interactive; required for CI. For a manual session, drop `--yes` to get a confirmation prompt.
- `vercel env update` is always interactive (prompts for the new value, does not accept stdin reliably). That is why the `\n` fix must be run by a human at a TTY — or via dashboard.
- None of the `rm` commands touch the auth vars referenced in Finding 3-2 because those are already absent. There is therefore **no ordering risk** for the cleanup itself.

## Verification step

```bash
# Diff before/after snapshots
vercel env ls production  --cwd apps/trivia > /tmp/trivia-prod-after.txt
diff /tmp/trivia-prod-before.txt /tmp/trivia-prod-after.txt

# Byte-level verification that \n corruption is gone
cd /Users/j/repos/beak-gaming-platform/apps/bingo
vercel env pull .vercel/.env.production.verify --environment=production --yes
od -c .vercel/.env.production.verify | grep -E '\\\s+n' && echo "STILL CORRUPTED" || echo "CLEAN"
rm .vercel/.env.production.verify

cd /Users/j/repos/beak-gaming-platform/apps/trivia
vercel env pull .vercel/.env.production.verify --environment=production --yes
od -c .vercel/.env.production.verify | grep -E '\\\s+n' && echo "STILL CORRUPTED" || echo "CLEAN"
rm .vercel/.env.production.verify

# Trigger a redeploy so the new values actually take effect in the running build
vercel redeploy https://bingo.joolie-boolie.com  --no-wait
vercel redeploy https://trivia.joolie-boolie.com --no-wait
```

**Why redeploy matters:** Vercel bakes env vars at build time (for Next.js `NEXT_PUBLIC_*` vars) and at invocation time (for server vars). The `\n` fix on `NEXT_PUBLIC_FARO_URL` will not take effect in the client bundle until a fresh build runs.

## Risk & rollback

**Risk of removing `NEXT_PUBLIC_FEATURE_QUESTION_SETS`:** Near zero. Grep in `apps/trivia/src` returns no references, Turbo `build.env` does not list it, no `next.config.ts` reference. The only risk is that a pending PR on an unshipped branch references it — verifiable with `git log --all --grep=FEATURE_QUESTION_SETS`. Mitigation: before removal, check open PRs.

**Risk of fixing `NEXT_PUBLIC_FARO_URL`:** None. The current value is broken (URL with a literal `\n` tail cannot be POSTed to successfully). Fixing it moves the Faro SDK from "silently no-ops with 400s" to "actually sends RUM data." This is strictly an improvement.

**Detection if something depends on a removed var unexpectedly:**
1. Client-side: Next.js build will successfully complete (env vars are optional chain via `process.env.FOO`). Runtime errors would surface as Sentry errors after redeploy.
2. Server-side: Vercel Functions panic on undefined required vars during cold start — would appear as `FUNCTION_INVOCATION_FAILED` in Vercel Runtime Logs.
3. Monitor `Deployments → Functions → Logs` for 10 minutes after redeploy; watch Sentry for new issues tagged `jb-bingo` / `jb-trivia`.

**Rollback:**
```bash
# If removing NEXT_PUBLIC_FEATURE_QUESTION_SETS breaks something (unlikely):
printf 'false' | vercel env add NEXT_PUBLIC_FEATURE_QUESTION_SETS production --cwd apps/trivia
printf 'false' | vercel env add NEXT_PUBLIC_FEATURE_QUESTION_SETS preview    --cwd apps/trivia
printf 'false' | vercel env add NEXT_PUBLIC_FEATURE_QUESTION_SETS development --cwd apps/trivia

# If the Faro URL update corrupts something, revert to the \n-suffixed version via dashboard
# (keep the old value pasted into a 1Password note before the update).

# Instant production rollback to the pre-change deployment:
vercel rollback   # rolls prod alias back to the previous deployment
```

## Resolved Questions

- **Is Finding 3-2 still critical?** No. The live Vercel prod env is already clean of the pre-standalone auth surface. The finding was based on a stale Feb 4 `.env.production.local` file that was never refreshed after the actual removal happened. Phase 1 Finding 3-2 should be restated as "historical snapshot; live Vercel already clean" and the severity downgraded from critical to low (just the `\n` residue and one dead flag remain).
- **Is the `\n` corruption real or a display artifact?** Real. Byte-level dump confirms two characters (`\`, `n`) embedded in the value, not a newline byte. It affects `NEXT_PUBLIC_FARO_URL` and `NEXT_PUBLIC_FEATURE_QUESTION_SETS` today; historically also affected the now-removed auth URLs.
- **Are `bingo.beak-gaming.com` / `trivia.beak-gaming.com` still active?** Yes, attached as aliases to the live production deployments with no redirect in place. MEMORY.md's "301 redirects to joolie-boolie.com" claim is wrong (or applies only to apex).

## Remaining Unknowns

- Who removed the auth vars from Vercel and when? The CLI doesn't expose an audit log from my access level. Could check Vercel audit logs in the dashboard if needed for incident timeline. Not blocking for cleanup.
- Is `NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT` auto-managed by the Axiom Vercel integration, or was it manually set? If integration-managed, removing it (if ever desired) would require uninstalling the integration, not `vercel env rm`. Not a cleanup target — leaving it alone.
- Whether `THE_TRIVIA_API_KEY` should be provisioned in Vercel prod or stay client-limited. Product decision — flag for follow-up.
- Whether the `feat-vercel-setup.vercel.app` and `trivia-nine-flax.vercel.app` aliases are truly orphans or tied to a disabled preview branch. Check `Project → Deployments → filter: preview` before removing.

## Revised Understanding

The Phase 1 Area 3 Finding 3-2 "Vercel production deployments still have COOKIE_DOMAIN, Supabase, OAuth, and beak-gaming.com env vars set" is materially **out of date**. The live Vercel state is clean of the auth env surface — cleanup already happened, it just wasn't recorded and the stale on-disk `.env.production.local` files were misread as authoritative during Phase 1.

The real remaining Vercel hygiene work is:
1. Remove one dead feature flag (`NEXT_PUBLIC_FEATURE_QUESTION_SETS`, three environments, one project).
2. Fix two `\n`-corrupted `NEXT_PUBLIC_FARO_URL` values.
3. Set up 301/308 redirects from `*.beak-gaming.com` subdomains to `*.joolie-boolie.com` (the Phase 1 packet's domain claim was wrong — they currently serve the same deployment directly, not redirect).
4. Clean up orphan preview aliases.
5. Optionally provision `THE_TRIVIA_API_KEY` for trivia prod to unblock the rate-limited fallback.

This is a **~10-minute cleanup**, not the hours-long rotation-and-remove operation that Finding 3-2 implied.

## Relevant file paths

- `/Users/j/repos/beak-gaming-platform/apps/bingo/.vercel/project.json` — bingo project link (live)
- `/Users/j/repos/beak-gaming-platform/apps/trivia/.vercel/project.json` — trivia project link (live)
- `/Users/j/repos/beak-gaming-platform/apps/bingo/.vercel/.env.production.local` — **stale Feb 4 snapshot; delete** (misled Phase 1)
- `/Users/j/repos/beak-gaming-platform/apps/trivia/.vercel/.env.production.local` — **stale Feb 4 snapshot; delete** (misled Phase 1)
- `/Users/j/repos/beak-gaming-platform/packages/error-tracking/src/faro.ts:10` — consumer of the `\n`-corrupted `NEXT_PUBLIC_FARO_URL`
- `/Users/j/repos/beak-gaming-platform/apps/trivia/src/lib/trivia-api/client.ts:200` — reads `THE_TRIVIA_API_KEY` (not set in Vercel prod)
- `/Users/j/repos/beak-gaming-platform/apps/bingo/vercel.json:10` — declares `TURBO_REMOTE_ONLY=true` at build time
- `/Users/j/repos/beak-gaming-platform/apps/trivia/vercel.json:10` — same
- `/Users/j/repos/beak-gaming-platform/docs/post-standalone-audit/phase-1/area-3-security-infra-drift.md` — Finding 3-2 that needs corrected
