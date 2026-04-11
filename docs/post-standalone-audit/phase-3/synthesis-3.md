# Synthesis: Gaps & Decision Enablement

## Synthesis Approach

This lens interrogates the boundaries of what the audit knows rather than cataloging what it found. The method: work backward from each Phase 2 finding to ask what evidence was absent, what probes were never attempted, and what choices the evidence now enables or forecloses. Where Phase 1 and Phase 2 disagree, the disagreement itself is evidence about investigation reliability. Where Phase 2 found nothing, the absence is treated as provisional (not confirmed clean) unless the probe was exhaustive.

---

## Core Narrative

The audit produced a high-confidence picture of the code-layer and config-layer state of this monorepo at one point in time, cross-checked against the live Vercel API for the most critical claim (auth vars in production). That cross-check revealed Phase 1 overreached on three separate findings — not because Phase 1 was careless, but because it read gitignored artifacts and stale pulled files as if they were authoritative. The lesson encoded in that error is also the boundary of what this audit can tell you: everything verified against the live system (Vercel API, git ls-files, file grep, clean-env build) is high confidence; everything inferred from on-disk files that could be stale is medium; and anything that requires external system access (Supabase dashboard, GitHub Actions UI, Grafana Synthetic Monitoring console) is low confidence or an open question.

What the audit cannot tell you is almost as important as what it can. It cannot tell you whether the nightly cron is actually producing GitHub issues or silently succeeding. It cannot tell you whether the Supabase project at `iivxpjhmnalsuvpdzgza` can be unpaused by a third party right now. It cannot tell you whether the Faro `\n` corruption means Grafana RUM data for both apps has been silently black-holed since Faro was enabled — which has a direct bearing on whether any SLO alerting is actually working. These gaps are not trivial; two of them affect active security posture and one affects whether the team's observability investment is doing anything.

---

## What Phase 1 + 2 investigated but couldn't definitively resolve

**1. Supabase project status (paused vs. deleted vs. alive)**
Confidence in the "paused" hypothesis: medium. Evidence: MEMORY.md says "need update when project is unpaused"; Iterator 1's MCP query shows two post-rebrand projects but not `iivxpjhmnalsuvpdzgza`; free-tier pause does not revoke the service role key. The gap: no one hit the Supabase dashboard directly or attempted an API call to the project URL to check if it responds. A paused project returns 503 on its REST endpoint; a deleted one returns 404. This distinction matters: if it returns 503, the key is live-but-dormant and rotation is urgent; if 404, rotation is confirmatory hygiene only.

**2. Whether the nightly cron is actually firing and producing results**
Confidence: medium (the YAML trigger is live; whether GitHub has Actions enabled at the repo level is unknown). Iterator 5 confirmed the workflow file is syntactically live with a `0 8 * * *` cron and no disable guard. But GitHub's repo-level "Disable Actions" toggle is not visible from the filesystem. If it's firing: each run includes a `gh issue create` on failure step (lines 114-133 of `nightly.yml`), which means daily failures would produce GitHub issues. If Actions is disabled at the repo level, the cron never runs. Neither state was confirmed. The only definitive probe is the GitHub API: `gh api repos/:owner/:repo/actions/runs --jq '.workflow_runs[0]'`.

**3. Whether `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is a future-feature flag or dead**
Confidence: high that no source code currently reads it. But "dead" vs. "future-planned" is a different question. The `docs/question-sets-feature-flag/` directory tree — which exists at `/Users/j/repos/beak-gaming-platform/docs/question-sets-feature-flag/` — contains a full Phase 4 analysis report dated 2026-03-10 titled "Question Sets Feature Flag Gating" with a six-step implementation plan and the exact gating surface mapped. **This is decisive context the audit missed: the flag is NOT dead — it is a planned, partially-designed feature that was never wired up.** The env var belongs in `.env.example` as a commented optional, not deleted. Iterator 2's recommendation to `vercel env rm NEXT_PUBLIC_FEATURE_QUESTION_SETS` is technically safe (zero source consumers today) but would remove a configured-and-planned value. The correct action is keep it in `.env.example` as documented, remove the `\n` corruption, and keep it in Vercel with the correct value `false`.

**4. Correct replacement URL for `docs/ALERTING_SETUP.md` health checks**
Confidence: low. The doc currently points at `/api/health` (removed). No one identified what URL a Grafana Synthetic Monitoring probe should target instead. `docs/ALERTING_SETUP.md:52-53` will produce broken probe configurations. The answer depends on a product decision (add a `/api/health` stub back, or probe `/` with HTML body match). The audit identified the problem but could not make the decision without knowing the app's minimal-viable health signal.

**5. Whether the Faro `\n` corruption means RUM data has been black-holed in production**
Confidence: low. Iterator 2 confirmed the byte-level corruption of `NEXT_PUBLIC_FARO_URL` via `od -c`. Iterator 5 confirmed `FaroInit` is rendered and actually calls `initializeFaro()` using that env var. The `\n` corruption means the URL passed to the Faro SDK ends with a backslash-n literal — which would cause every Faro HTTP push to fail with a DNS error or 400. This means: (a) no browser-side RUM data has reached Grafana Cloud since Faro was deployed, and (b) any alerting built on Faro metrics has zero signal. This was flagged as a finding but the downstream implication — that the team's RUM SLO may currently be completely blind — was not stated explicitly.

**6. Whether the `beak-gaming.com` domain aliases on Vercel have active 301 redirects**
Confidence: medium. Iterator 2 found `bingo.beak-gaming.com` and `trivia.beak-gaming.com` still attached as Vercel aliases without confirmed 301 redirect configuration. MEMORY.md claims "beak-gaming.com → 301 redirects to joolie-boolie.com" but Iterator 2 said this contradicts the live domain audit. The distinction matters for SEO (unredirected aliases pass no link equity and confuse crawlers) and for cookie security (an unredirected alias under the old domain could receive cookies scoped to `.beak-gaming.com` if any exist on user devices).

---

## Original scope gaps (what Phase 0 missed)

**1. PWA service worker runtime behavior**
Phase 1 Area 3 glanced at `sw.ts` files and found a trivia SW with an overly broad `/api/*` matcher. But no investigation examined what the service workers do to actual network traffic during auth-era state on user devices: if a user installed the PWA when auth existed, their SW cache may have stale `login`-related routes or pre-cached responses from the old architecture. A real PWA audit would check cache names (did they change between auth and standalone?), the cache versioning strategy, and whether a cache bust was issued when middleware was removed. The current `jb-` prefix cache names were presumably set during the rebrand, but no investigator confirmed the cache version bump that forces old SWs to upgrade.

**2. App telemetry at the data layer — Sentry issues and Grafana traces**
The audit examined observability configuration (is it wired up, are keys set, is the URL correct). It never looked at what the observability data actually shows. If Sentry has open issues tagged to removed routes (`/auth/callback`, `/api/auth/*`) those are noise that confuse the current error picture. If Grafana Tempo has traces showing spans from removed middleware, that's a signal the migration date was tracked. And if Faro has zero data since day one (because of the `\n` bug), the Grafana RUM dashboard is showing a flatline that looks healthy-but-broken. None of this was investigated.

**3. DNS configuration vs. Vercel's claim**
Iterator 2 found the `beak-gaming.com` aliases still attached in Vercel. But whether the DNS records for `beak-gaming.com` actually point at Vercel (and thus those aliases are reachable) was not verified. If DNS for `beak-gaming.com` has already been pointed away (or the domain expired), the aliases are unreachable orphans with no user impact. If DNS still points at Vercel, old-domain requests hit the apps without redirect. A single `dig bingo.beak-gaming.com` would resolve this, but it was never run.

**4. localStorage migration patterns — old-prefix keys on existing user devices**
The rebrand changed the key prefix to `jb-`. But any user who used the platform before the rebrand would have `beak-` or `bingo-` or `supabase-` prefixed keys in localStorage. No investigator looked at whether the apps have migration code to read and rename old keys, or whether they silently start fresh. This is a user-experience issue, not a security issue, but it's a gap in the "standalone" story: existing users lose their game presets and history silently.

**5. Marketing site or landing page at apex domain**
MEMORY.md says `joolie-boolie.com` is the domain with platform-hub removed. What serves the apex now? If platform-hub was the only content at `joolie-boolie.com` and it was removed, the apex may 404 or redirect to Vercel's 404 page. No one verified what users get when they visit `https://joolie-boolie.com` directly.

**6. Git history reachability of leaked Supabase credentials**
Iterator 1 identified the specific commits (`3b40fb25`, `c6c4af5c`, `0b9e8078`, `e8784d7b`, `806c9f6b`, `72bd8caf`) where the service role key appears in `docs/E2E_TESTING_GUIDE.md` history. But the audit stopped at identifying the commits. No one verified that these are reachable by a third party without repo write access: is the repo public or private? If private, git history exposure is a team-internal concern only. If public or ever-public, the exposure is as described. MEMORY.md notes `julianken/joolie-boolie` as the repo — the visibility (public/private) was never stated.

---

## Decisions the audit ENABLES

**1. Proceed with the "big sweep PR" over drip cleanup — with high confidence**
The findings are sufficiently bounded and specific (11 prioritized doc actions, 6-step dead-types deletion with topological order, 3 Vercel `env rm` commands, 1 workflow line fix, 5 CSP directive changes) that a single PR can address all of them without risk of destabilizing unrelated code. The clean-env build test proving zero env var dependencies makes the CI cleanup genuinely zero-risk. The topological dependency analysis for types means there is a safe deletion order. The right call is a coordinated sweep, not a drip.

**2. Establish an automated drift-detection lint rule**
The audit provides the exact vocabulary to ban: `platform-hub`, `@joolie-boolie/auth`, `@joolie-boolie/database`, `supabase`, `SESSION_TOKEN_SECRET`, `COOKIE_DOMAIN`, `OAuth` (in import paths). A simple ESLint `no-restricted-imports` rule covering those patterns, plus a `no-restricted-syntax` rule for env var string literals matching those names in source files, would catch any future re-introduction. The audit justifies this investment: three of the five Phase 1 areas independently found drift in the same vocabulary.

**3. Move CSP from Report-Only to enforcing mode**
Iterator 5 produced a complete proposed enforcing policy. The removal of auth and OAuth eliminated the most CSP-hostile patterns (OAuth redirect URIs, cross-origin POSTs, third-party identity provider scripts). The remaining uncertainty (does `*.grafana.net` cover all Faro endpoints?) is resolved by confirming the one production Faro URL. The parallel-policies rollout approach (keep Report-Only as a secondary stricter policy) gives a safe transition path. This decision is enabled now; it was blocked before by the auth complexity.

**4. Defer `NEXT_PUBLIC_FEATURE_QUESTION_SETS` removal — keep it, fix the `\n` corruption**
The `docs/question-sets-feature-flag/` analysis tree makes the intent clear: this flag is for a planned future feature, not dead code. The correct action is `vercel env rm --env production` followed by `printf 'false' | vercel env add ... production` to write a clean value without the `\n` suffix. Do not remove it.

**5. Treat Supabase service role key rotation as unconditionally required**
The uncertainty about whether the project is paused vs. deleted is actually an argument for rotation, not against it. The blast radius if wrong (full RLS bypass on every table) is too high to wait for confirmation. If the project is dead, rotation is a no-op. If it's live-but-paused, rotation prevents a future unpause from reviving the exposed key. The audit empowers a confident "rotate regardless" decision.

---

## Decisions the audit CONSTRAINS or forecloses

**1. Forward-only cleanup is insufficient if the Supabase project is reachable**
If the project `iivxpjhmnalsuvpdzgza` is still alive (even paused), the service role key in git history is a permanent exposure that `git log -S` can retrieve. Forward-only cleanup (deleting references in HEAD) does not remove the key from git history. A history rewrite (`git filter-repo`) or GitHub's secret scanning + push protection are the only ways to address history exposure. The audit explicitly recommends against the rewrite (Iterator 1 calls for "forward-only cleanup, no git history rewrite"). That recommendation is defensible only if the project is confirmed dead — which it isn't. Until the Supabase project status is confirmed, this decision is constrained: the team cannot rationally accept the "no rewrite" recommendation without first confirming the project is deleted.

**2. Adding a `/api/health` endpoint is a design decision, not just a doc fix**
ALERTING_SETUP.md's probe URLs need to change. But deciding what URL to probe requires choosing between: (a) adding a minimal health route back to both apps (2 files, ~10 lines each), or (b) probing `/` with an HTML body match (no code change, slightly weaker signal). Option (a) is cleaner but reopens the "keep API surface minimal" principle from the standalone conversion. Option (b) works but produces a noisier probe (a CDN cache serving `/` is not the same as the Next.js runtime being healthy). This is constrained: the team must make a product call before the alerting doc can be correctly updated.

**3. The nightly cron cannot be safely "cleaned up" without first verifying Actions status**
Removing the dead env block from `nightly.yml` is safe at the code level (proven by clean-env build). But if GitHub Actions is enabled at the repo level and the nightly is firing, removing the block and committing changes the running behavior of a live workflow. If Actions is disabled, the change is cosmetic. The team needs to check the GitHub repo Settings > Actions page before any CI cleanup PR is merged, or the cleanup may silently change behavior that someone is relying on.

---

## Follow-up investigations worth funneling

**1. GitHub Actions operational status + nightly cron run history**
Single probe: `gh api repos/julianken/joolie-boolie/actions/runs --jq '.workflow_runs[] | {name, status, conclusion, created_at}' | head -20`. This answers: is the nightly actually running? is it passing or failing? is e2e.yml running on PRs? Takes five minutes and resolves the second-largest open question in the audit. Worth doing before any CI cleanup PR.

**2. Supabase project liveness check**
Single probe: `curl -s -o /dev/null -w "%{http_code}" https://iivxpjhmnalsuvpdzgza.supabase.co/rest/v1/ -H "apikey: <anon_key_from_local_env>"`. A 200 or 401 means the project is alive; a 404 means deleted; a 503 means paused. This resolves the "rotate vs. confirm-dead" question in under a minute and determines whether a git history rewrite is necessary. The anon key is available in local `.env.local`.

**3. PWA cache migration audit**
For any user who used the app before the rebrand (when keys used older prefixes), localStorage contains orphaned state. This is not a security issue but it is a silent user experience regression: saved presets and game history silently disappear on first load after an update. A one-sprint investigation would: (a) enumerate all localStorage key prefixes written before the rebrand from git history, (b) check whether any migration shim runs on app startup, (c) if none exists, write a one-time migration function that reads old-prefix keys, copies them to `jb-` keys, and removes the originals. This is worth doing before the platform-removed state is considered "complete."

---

## Meta-observation on Phase 1 vs Phase 2 corrections

Phase 2 corrected three Phase 1 findings that were materially wrong (Vercel production env, `.env.example` tracking, `start-e2e-servers.sh` tracking) and one that was wrong in a meaningful way (Faro wiring). All four errors share a root cause: Phase 1 read gitignored or untracked files and treated them as authoritative sources about the live system state. The `.env.production.local` file pulled in February was read as if it reflected April production. The `start-e2e-servers.sh` in a worktree was read as if it were the tracked version.

The lesson for the Phase 4 final report is specific: every finding should carry a provenance tag — "verified against live system," "from tracked file at HEAD," or "from on-disk artifact (gitignored, potentially stale)." Claims in the first two categories carry high confidence; claims in the third are hypotheses pending live verification. The audit's framing did not distinguish these clearly, which is why the corrections landed in Phase 2 rather than being caught in Phase 1 review. Future analysis funnels should treat untracked on-disk artifacts as "evidence of what was true at some prior point" rather than "evidence of what is true now."

---

## Confidence assessment

**High confidence (Phase 4 can cite without caveat):**
- Runtime app code has zero Supabase/auth/platform-hub references (grep-verified across all `.ts`/`.tsx`)
- Vercel production env is clean on both apps (live API verified by Iterator 2)
- `.env.example` files at HEAD are clean placeholders (Iterator 1, `git ls-files` verified)
- Dead types cleanup: full 6-step ordered list is complete and grep-verified (Iterator 4)
- `NEXT_PUBLIC_FARO_URL` has byte-level `\n` corruption breaking Faro in production (Iterator 2, `od -c` verified)
- Nightly workflow's dead env block is safe to delete (clean-env build proven by Iterator 5)
- `FaroInit` is rendered in both app layouts and `*.grafana.net` in CSP is load-bearing (Iterator 5)
- `docs/ALERTING_SETUP.md` Grafana probe URLs are broken (`/api/health` removed, line 52-53)
- 11 doc actions are correctly categorized (Iterator 3, full reads of all targeted docs)
- `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is a planned-but-unwired feature flag, not dead code (`docs/question-sets-feature-flag/` tree)

**Medium confidence (cite with caveat "per filesystem evidence"):**
- Supabase project is paused, not deleted
- Nightly cron fires daily (YAML is live; repo-level toggle unknown)
- `beak-gaming.com` aliases lack redirect (Vercel domain config shows no redirect rule, but DNS not verified)
- Grafana RUM has zero data since Faro deployed (follows from `\n` corruption; not directly confirmed via dashboard)

**Low confidence (open question in final report):**
- Correct replacement URL for health probes in ALERTING_SETUP.md (requires product decision)
- Whether old-prefix localStorage keys exist on production user devices (no migration code found, but no audit of key prefix history done)
- Whether the `e2e.yml` workflow is actually disabled via repo-level toggle (the `--project=bingo-mobile` bug would cause it to fail if it ran)

---

## Blind spots of this lens

This synthesis lens is better at identifying what was not investigated than at weighting the cost of not knowing those things. The gaps flagged here (PWA cache migration, DNS verification, Grafana dashboard state) are all genuinely uninvestigated — but this lens cannot tell you whether any of them matter in proportion to the sweep PR. A user who runs the sweep PR, rotates the Supabase key, fixes the Faro URL, and patches the ALERTING_SETUP doc has addressed the audit's highest-confidence, highest-impact findings. The gaps identified here are valid follow-up questions, not blockers.

The second blind spot: this lens focused on "what the audit didn't look at" but did not weight the probability that those uninvestigated areas contain critical findings. The PWA cache migration gap is plausibly low-impact (few returning users on a community gaming platform). The Supabase project status gap is plausibly medium-impact (project is likely paused given MEMORY.md context). The DNS/redirect gap is plausibly low-impact (old domain traffic is probably minimal). Future investigation should be sequenced accordingly: Supabase status first (because blast radius is highest if wrong), GitHub Actions status second (because it determines whether CI cleanup changes behavior), everything else as background hygiene.
