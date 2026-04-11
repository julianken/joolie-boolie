# Synthesis: Risk & Actionability

## Synthesis Approach

This synthesis treats Phase 2 as authoritative over Phase 1. Every finding below comes from the phase-2 packet's confirmed themes; stale claims that Phase 2 corrected (polluted Vercel env, untracked `start-e2e-servers.sh`, unwired Faro) are excluded. Each item is rated on **blast radius** (what breaks, for whom, how badly, if left unfixed) and **fix cost** (effort to execute AND verify, not just to land a diff). The 2x2 creates four action quadrants. Security-critical items are flagged URGENT and override quadrant priority. Dependency chains are called out where order matters. I am deliberately decisive — imperfect priorities beat unranked lists.

## Core Narrative

The post-standalone drift splits cleanly into three buckets: **one silently-broken production system** (Faro RUM dead from a `\n` byte in a Vercel env var), **one misfiring automation** (nightly CI cron probably firing daily against stub env vars, so real failures can't surface), and **a lot of cheap-but-confusing dead weight** (docs, types, feature flags, dead lines in a workflow). The actual security posture is better than Phase 1 suggested — Vercel prod env is clean, `.env.example` is clean, session/JWT secrets were never in git history — but a **real 32-day leak of the Supabase service role key via `docs/E2E_TESTING_GUIDE.md`** exists in git blobs and must be credibly neutralized (rotate or confirm project dead). The biggest lever is not any single fix; it's executing the **Quick Wins quadrant as one sweep** (roughly a half day) which closes the observability gap, silences the misfiring cron, removes broken references, and rotates live tokens, all without touching type code. The Important Investments quadrant (CSP enforcing, MANUAL_TEST_PLAN rewrite) can wait a cycle. Everything else is hygiene.

## URGENT (security-critical, overrides quadrant order)

These are time-sensitive independent of cost:

1. **Rotate Supabase service role key `iivxpjhmnalsuvpdzgza` (OR definitively confirm project deletion).** The key was in `docs/E2E_TESTING_GUIDE.md` git blobs for ~32 days. Current status is ambiguous — memory says "paused," MCP can't see the project. **Blast radius if still live: CRITICAL** (service role bypasses RLS, full DB access, even an empty DB is an attack pivot). **Blast radius if paused: LOW** but rotation is still cheap insurance. **Fix cost: TRIVIAL** if the project is active (Supabase dashboard → rotate → done, no consumer to update since nothing uses it) or **TRIVIAL** to confirm deletion via Supabase account login. Do this first. Source: Iterator 1.

2. **Rotate live Sentry (`sntrys_...`) and Grafana Cloud (`glc_...`) tokens in `.secrets/observability-accounts.json`.** These are active tokens that sit on a developer machine in plaintext. **Blast radius: HIGH** (Sentry org:ci scope can read/write error data and potentially manipulate org settings; Grafana Cloud tokens grant write access to traces/metrics). **Fix cost: SMALL** (rotate in each provider UI, update `.secrets` file, verify one test trace/error reaches each platform). Bundle with #1. Source: Iterator 1.

3. **Fix `NEXT_PUBLIC_FARO_URL` `\n` corruption on both Vercel projects.** Faro RUM is silently broken in production for both apps. Observability is already degraded, which means any current bug is flying blind. **Blast radius: HIGH** (no RUM = no user-impact visibility, no session replay, delayed detection of real regressions). **Fix cost: TRIVIAL** (`vercel env rm`, `vercel env add` with clean value, redeploy; Iterator 2 has copy-paste commands). Source: Iterator 2.

## Quadrant: Quick Wins (low cost × high blast radius)

Do this quadrant as a single sweep. Total ~3-5 hours of work including verification.

| Item | Blast radius | Fix cost | Source iterator |
|---|---|---|---|
| **Delete `.github/workflows/nightly.yml:81-89` stub env block** (provably dead per clean-env build test) | HIGH (cron is probably firing daily, stub env vars mask real failures, so nobody sees when anything actually breaks) | TRIVIAL (delete 9 lines, commit) | 5 |
| **Fix `.github/workflows/e2e.yml:152 --project=bingo-mobile`** (project removed from playwright.config.ts in BEA-693, workflow never updated) | HIGH (every e2e workflow run errors out on an unknown project, masking real test state) | TRIVIAL (one-line edit) | 5 |
| **Patch `docs/ALERTING_SETUP.md:52-53` Grafana Synthetic Monitoring `/api/health` URLs** (endpoint was removed) | HIGH (anyone who copies this doc to configure monitoring gets permanently broken probes — directly impairs production incident detection) | SMALL (rewrite 2 lines + pick a valid health-check target like `/` or a known 200) | 3 |
| **Remove `bingo.beak-gaming.com` / `trivia.beak-gaming.com` domain aliases OR add 301 redirects** (contradicts memory claim that redirects exist) | HIGH (old domain silently serving live content under a name users may still link to, with no redirect = brand confusion + SEO split) | SMALL (`vercel domains rm` OR add `vercel.json` redirect config + redeploy) | 2 |
| **Delete `NEXT_PUBLIC_FEATURE_QUESTION_SETS` dead flag on trivia Vercel project** | MEDIUM (flag gates no code path but confuses operators and risks someone toggling it expecting a result) | TRIVIAL (`vercel env rm`) | 2 |
| **Clean up orphan Vercel preview aliases** | MEDIUM (stale preview URLs can leak PR content, pollute analytics) | SMALL (list via `vercel`, remove dead ones) | 2 |
| **Set `THE_TRIVIA_API_KEY` on trivia Vercel project** (trivia-api proxy reads it; currently unset in prod) | HIGH (trivia-api feature silently degrades in prod, or rate-limits on a fallback) | TRIVIAL (`vercel env add`) | 2 |
| **Forward-only cleanup of `.env.example` and any remaining stale references** (Iterator 1 recommends no history rewrite) | MEDIUM (reduces copy-paste of stale secrets into new environments) | TRIVIAL (already mostly done per Phase 2) | 1 |

**Rationale for ordering within the quadrant:** The workflow fixes unblock CI signal (so any later fix can be observed). The docs patch is a landmine for whoever next configures monitoring. The domain alias and `THE_TRIVIA_API_KEY` are user-impact items.

## Quadrant: Important Investments (high cost × high blast radius)

Plan these carefully; don't rush. Each needs a dedicated branch and staged rollout.

| Item | Blast radius | Fix cost | Source iterator |
|---|---|---|---|
| **CSP enforcing-mode migration** (3-4 week parallel-policies rollout per Iterator 5) | HIGH (current report-only CSP means XSS protections aren't enforced; adding `frame-ancestors`, `base-uri`, `form-action`, `object-src`, dropping invalid `/monitoring` token) | LARGE (requires parallel report-only + enforcing policies, telemetry review, iterative widening, production traffic observation) | 5 |
| **Dead types cleanup (~404 lines, 6 ordered steps)** | MEDIUM-HIGH (type noise slows every developer and agent; wrong types invite misuse; hidden `Timestamps` dependency on `UserProfile` is a topological trap) | MEDIUM (6 ordered steps, requires typecheck + build + test verification after each; topological order matters — delete `user.ts` before `game.ts` `Timestamps` re-export) | 4 |
| **`docs/MANUAL_TEST_PLAN.md` rewrite** (preserves ~65%, drops Platform Hub and OAuth SSO sections, target ~600 lines from ~752) | MEDIUM (manual test plan is the canonical QA script; bad plan = bad QA = production regressions. But **blast radius is limited because QA can route around a stale section** whereas a developer reading broken code cannot) | MEDIUM (2-3 hours per Iterator 3; not delete-and-forget because runs 1-9 execution history and stories 2.2-2.11, 3.2-3.22 are still valid and worth keeping) | 3 |
| **Remove `jwt`/`supabase`/`postgres` string matches in `packages/error-tracking/src/server.ts:90,110,125-126 categorizeError()`** | MEDIUM (dead branches in error categorization can mis-classify real errors, hiding their true source) | SMALL (part of dead-types sweep) | 4 |

**Note on MANUAL_TEST_PLAN rewrite vs delete:** The user's question frames this as "2-3 hours — worth it?" Yes, because the alternative ("just delete the stale sections") still requires reading every section to identify the stale ones, and leaves behind a document without a coherent structure. Iterator 3 already produced the skeleton. The marginal cost of rewrite-over-delete is perhaps 60-90 minutes. **Do the rewrite, not the delete.**

## Quadrant: Cheap Hygiene (low cost × low-to-medium blast)

Bundle into sweeps. Total ~2-3 hours if batched.

| Item | Blast radius | Fix cost | Source iterator |
|---|---|---|---|
| **DELETE `docs/APP_STRUCTURE.md`** (ARCHITECTURE.md covers this correctly) | LOW | TRIVIAL | 3 |
| **DELETE `docs/MIDDLEWARE_PATTERNS.md`** (no middleware exists after BEA-696) | LOW | TRIVIAL | 3 |
| **MARK-SUPERSEDED ADR-002 and ADR-007** (preserve history, add supersession notes at top) | LOW-MEDIUM (preserves architectural decision record integrity for future readers) | SMALL | 3 |
| **PATCH `CONTRIBUTING.md` BFF section (lines 243-248)** (references removed auth architecture) | LOW | TRIVIAL | 3 |
| **PATCH `docs/E2E_TESTING_GUIDE.md` + `scripts/setup-worktree-e2e.sh:137`** (E2E_JWT_SECRET block is dead) | LOW | SMALL | 3 |
| **PATCH `apps/bingo/CLAUDE.md:7-8`** (cloud-based / admin accounts language) | LOW | TRIVIAL | 3 |
| **PATCH ADR-001 context + ADR README index** | LOW | TRIVIAL | 3 |
| **Patch `packages/types` README references** (after dead types are deleted, the README may still describe them — dependency chain below) | LOW | TRIVIAL | 4 |
| **Worktree hygiene memo: stop copying `start-e2e-servers.sh` into worktrees** (it's generated per BEA-693, not tracked; `.gitignore:71` ignores it correctly) | LOW | TRIVIAL (one sentence in the worktree setup doc) | 5 |

## Quadrant: Defer/Accept (high cost × low blast)

Document and move on. These are traps that will burn more time than they save.

| Item | Blast radius | Fix cost | Source iterator |
|---|---|---|---|
| **Git history rewrite to expunge the Supabase key leak from `docs/E2E_TESTING_GUIDE.md` blobs** | LOW (once the key is rotated or the project is dead, the blob is a dead artifact; git history rewrites break every outstanding branch/PR, force-push every collaborator, and risk lost work) | LARGE (filter-branch or BFG Repo-Cleaner + force-push to all remotes + notify all collaborators + invalidate every worktree) | 1 |
| **Resurrect dormant ADR process for the standalone conversion itself** | LOW-MEDIUM (would be nice for archaeology but the standalone conversion is already documented in BEA-682-695) | MEDIUM (write a new ADR-008 or ADR-011 summarizing the conversion) | 3 |
| **Decide definitively whether `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is future-feature or truly dead** | LOW (if future, it's a stub that harms nothing; if dead, removing from Vercel already handles the risk) | SMALL but blocked on product intent | 2 |
| **Validate the Iterator 5 CSP enforcing-policy proposal in staging** before rollout | MEDIUM | LARGE (requires parallel telemetry, live traffic observation) | 5 |

**Note:** "Defer" doesn't mean "ignore." It means "don't spend cycles on this in the current sweep." Log in Linear and revisit.

## Dependency chains

Order matters in several places:

1. **Rotate Supabase/Sentry/Grafana tokens BEFORE publicizing this audit.** Any broadcast of the finding accelerates the attack window on still-live keys.
2. **Delete `packages/types/src/user.ts` BEFORE `game.ts` Timestamps re-export** (Iterator 4's topological chain: `Timestamps` is a hidden dependency of `UserProfile`).
3. **Delete dead types BEFORE patching `packages/types` README** (otherwise the README patch is against a moving target).
4. **Fix `NEXT_PUBLIC_FARO_URL` BEFORE any CSP enforcing rollout** (broken Faro will produce empty telemetry, making CSP rollout impossible to observe).
5. **Fix the nightly.yml stub env block BEFORE trusting the nightly cron as a canary for anything else** (otherwise every future claim of "nightly passed" is noise).
6. **Resolve the "CI disabled" operational unknown BEFORE landing workflow file changes.** Check GitHub Settings → Actions to see if workflows are repo-level-disabled. If they are, the yaml fixes are cosmetic only. If they aren't, the nightly is firing and the urgency is higher.
7. **Patch `docs/E2E_TESTING_GUIDE.md` E2E_JWT_SECRET block AFTER rotating any tokens referenced therein** (otherwise the patch is a diff against a moving security state).

## Total cleanup cost estimate

- **URGENT bundle:** ~1 hour (rotate 3 tokens + fix Faro `\n`; all TRIVIAL-to-SMALL, but requires access to Supabase/Sentry/Grafana/Vercel dashboards — gate is credential access, not effort)
- **Quick Wins quadrant:** ~3-5 hours total sweep (all 8 items, mostly TRIVIAL edits plus verification)
- **Important Investments quadrant:** ~8-12 hours for dead-types + MANUAL_TEST_PLAN rewrite + categorizeError fix; **plus** ~3-4 weeks elapsed for CSP enforcing rollout (not continuous effort, mostly waiting and observing parallel policies)
- **Cheap Hygiene quadrant:** ~2-3 hours batched as a single docs+config sweep
- **Defer/Accept:** ~0 hours (documented and deferred)

**Parallelizable?** Yes. URGENT + Quick Wins can go in parallel (different surfaces). The docs sweep (Cheap Hygiene) can parallelize against dead-types cleanup (different files, no conflict). CSP enforcing is inherently serialized. Rough walltime for a focused effort: **1 day for URGENT + Quick Wins, 2 days for Important Investments (excluding CSP elapsed time), 0.5 day for Cheap Hygiene**, so **~3.5 working days total**, with CSP a background multi-week stream.

## Confidence in this risk scoring

**Overall confidence: MEDIUM-HIGH.**

**What I'm confident in:**
- URGENT ordering is correct — the Supabase key rotation is non-negotiable regardless of uncertainty, because "we don't know if it's live" is a worse posture than "we rotated it."
- Quick Wins quadrant membership — every item is grep-verified or live-system-verified per Phase 2.
- Quadrant placement (blast × cost) for the high-blast items is driven by real behavior (Faro broken in prod = HIGH; dead `bingo-mobile` flag = HIGH because it masks signal).
- Dependency chains are grounded in Iterator 4's topological analysis for types and Iterator 2's verified env state.

**What I'm less sure about:**
- "CI disabled" operational unknown makes me uncertain whether the nightly cron is actually firing. If a repo-level toggle is off, the nightly.yml fix is cosmetic, which halves its blast radius. I rated it as HIGH assuming the cron fires; downgrade to MEDIUM if someone confirms the toggle is off.
- Sentry/Grafana token rotation blast radius depends on exact scope of those tokens. "org:ci" is inferred from memory; I haven't independently verified.
- Fix cost on the MANUAL_TEST_PLAN rewrite is 2-3 hours per Iterator 3, but QA rewrites routinely expand beyond estimates. Could be 4-5 hours.
- The CSP enforcing 3-4 week estimate comes from Iterator 5's untested proposal. Real-world rollouts of enforcing CSP on apps with third-party scripts (Sentry, Faro, Grafana) routinely surface unexpected violations. Could be 6-8 weeks elapsed.

## Blind spots of this lens

1. **Adversarial-framing bias.** "Blast radius" privileges attack scenarios. It undercounts **team velocity loss** from cognitive load (reading dead code, tripping over stale docs). If you weighted velocity loss equally, the dead-types cleanup and the docs sweep would climb toward the top.
2. **Doesn't account for "landmines for new contributors."** A stale ADR or misleading README has near-zero blast radius to current operators but can derail a new developer for hours. This argues for moving **Cheap Hygiene higher than its quadrant placement** when new-contributor onboarding is imminent.
3. **Treats "verified stale" findings as cheaper than they are.** Phase 2's corrections cost real time. Every "simple" config change requires verification time that scales non-linearly with system surface area.
4. **Ignores compounding interactions.** Faro broken + stale Grafana health checks + misfiring nightly cron is a **cascade**: each masks the others, so fixing one in isolation may not restore end-to-end observability. I treat them as independent; reality may require fixing all three to validate any one of them.
5. **No business-impact weighting.** These are developer-experience apps in a small team context. A security finding that would be CRITICAL at a regulated enterprise may be MEDIUM here. I've tried to use that lens but blast radius ratings are still calibrated on worst-case leak scenarios.
6. **Phase 2 itself is a blind spot.** Phase 1's partial-staleness is a risk signal: **file-level audits without live-system queries drift out of sync fast.** Several Phase 2 corrections came from running a single live command (`vercel env ls`, `git ls-files`, clean-env build test). The final report should frame its conclusions with a caveat: "verified against live state at 2026-04-11; re-validate before acting if more than 2 weeks have passed." Any recommendation that isn't rooted in a command that can be re-run is provisional.

## Recommendations (high-level)

1. **Day 1: URGENT sweep** (rotate 3 tokens + confirm Supabase status + fix Faro `\n`). Single focused block. Gate on dashboard access.
2. **Day 1-2: Quick Wins quadrant sweep.** Batch all 8 items into one PR per logical surface (one PR for workflows, one for Vercel env, one for docs patches). Merge independently.
3. **Day 2-3: Cheap Hygiene batch.** Single docs+config cleanup PR. Easy to review, easy to revert.
4. **Week 2: Important Investments** begin. Dead-types cleanup first (scoped, verifiable, well-ordered per Iterator 4). MANUAL_TEST_PLAN rewrite in parallel if a second pair of hands is available.
5. **Week 2+ background: CSP enforcing rollout.** Parallel report-only + enforcing policies, observe for 2-3 weeks, tighten.
6. **Defer/Accept: document in Linear, revisit in a quarter.** Git history rewrite specifically should stay deferred unless a genuinely sensitive secret lands in history — the Supabase key leak is neutralized by rotation, not by rewrite.

**Framing for the final report:** Lead with the URGENT list because it's the decision a reader cares about most. Follow with Quick Wins (gives the reader something to do today). Then Important Investments (gives the reader something to plan). Then Hygiene and Defer. And **always carry the Phase 2 caveat forward**: the reliability of any finding is a function of when the underlying query was last re-run.
