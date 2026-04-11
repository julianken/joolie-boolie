# Context Packet: Phase 3 → Phase 4

## Top-Line
All three Phase 3 syntheses converge on the same core story — the standalone conversion cleaned runtime code thoroughly but left the non-executable surfaces (docs, types, env, CI, vocabulary) behind — but each lens adds a distinct dimension the others don't cover. The final report should weave all three rather than pick one.

## Synthesis 1 (Thematic) — 4 Themes
1. **"The Cleanup Stopped at the Compiler Boundary"** — dead types/env vars/error branches survive because removing them would produce no observable failure. Compiler enforcement was the only line of defense, and it doesn't cover these surfaces.
2. **"Documentation Was Written for Humans, Maintained for AI — and Neither Happened"** — stale docs are concentrated in exactly the files AI agents read as authoritative context (CLAUDE.md, MANUAL_TEST_PLAN, APP_STRUCTURE, MIDDLEWARE_PATTERNS, ADRs, package READMEs). In an AI-only development model, documentation drift becomes a feedback loop.
3. **"Point-in-Time Snapshots Were Treated as Ground Truth"** — methodological theme. Phase 1 read stale local files (65-day-old `.vercel/.env.production.local`, untracked `start-e2e-servers.sh`, pre-PR#516 `.env.example`). Phase 2 falsified 4 findings via live verification.
4. **"Infrastructure Was Deleted But Its Vocabulary Was Not"** — words like "cloud-based", "staff member", `E2E_JWT_SECRET`, `User.id // UUID from Supabase Auth` persist without referent.
- Themes 1+4 are tightly coupled (dead types carry dead vocabulary). Themes 1+2 are the core backlog. Theme 3 is methodological and implies a standing practice.
- **Recommendation:** Two-track remediation. Track A (dead code + vocabulary, mechanical) first. Track B (docs as coherent sprint, not ad hoc patches) second.

## Synthesis 2 (Risk & Actionability) — Quadrant Map
- **URGENT (security-critical, override):** (1) Rotate Supabase service role key or confirm project dead; (2) Rotate Sentry + Grafana Cloud tokens in `.secrets/observability-accounts.json`; (3) Fix `NEXT_PUBLIC_FARO_URL` `\n` corruption (Faro silently broken in prod).
- **Quick Wins (~3-5 hrs):** delete nightly.yml env block, fix `--project=bingo-mobile`, patch ALERTING_SETUP `/api/health`, remove/redirect `beak-gaming.com` aliases, set `THE_TRIVIA_API_KEY`, delete dead feature flag (note: Synthesis 3 corrects this — keep the flag).
- **Important Investments (high cost × high blast):** CSP enforcing-mode migration (3-4 week rollout), dead types cleanup (~404 lines, 6 steps), MANUAL_TEST_PLAN rewrite (2-3 hrs), `categorizeError()` dead string matches.
- **Cheap Hygiene (bundle ~2-3 hrs):** delete APP_STRUCTURE/MIDDLEWARE_PATTERNS, mark-superseded ADR-002/007, patches to CONTRIBUTING, setup-worktree-e2e.sh, apps/bingo/CLAUDE.md, ADR-001, ADR README.
- **Defer/Accept:** Git history rewrite (LARGE cost, LOW blast once key rotated), dormant ADR process resurrection.
- **Framing for final report:** "Phase 2's correction of Phase 1 is itself a risk signal — file-level audits drift from live-system reality within days. Verified at 2026-04-11; re-validate before acting if >2 weeks old."
- **Blind spots:** adversarial bias undercounts velocity loss; onboarding landmines in docs have higher real-world blast than quadrant placement suggests; cascade interactions (Faro + Grafana + nightly cron) mean isolated fixes may not restore end-to-end observability.

## Synthesis 3 (Gaps & Decision Enablement) — Open Questions
- **🚨 CORRECTION to earlier iterators:** `NEXT_PUBLIC_FEATURE_QUESTION_SETS` is **NOT dead**. The directory `docs/question-sets-feature-flag/` contains a Phase 4 analysis report dated 2026-03-10 with a 6-step implementation plan. This flag is planned-but-unwired. Iterator 2's recommendation to `vercel env rm` is incorrect; the correct action is keep the env var and fix the `\n` corruption.
- **Unresolved Phase 1+2 questions** (each with a single probe that would resolve):
  1. Supabase project `iivxpjhmnalsuvpdzgza` status — single `curl` to `/rest/v1/` resolves alive/paused/deleted
  2. GitHub Actions operational state — single `gh api repos/julianken/joolie-boolie/actions/runs` resolves whether nightly is firing
  3. DNS pointing at Vercel for `beak-gaming.com` — single `dig` resolves alias reachability
  4. Correct `/api/health` replacement URL — requires product decision
  5. Whether Faro RUM has been black-holed since deployment — requires Grafana dashboard check
- **Original scope gaps Phase 0 missed:** PWA service worker runtime behavior (cache bust when middleware removed?), Sentry/Grafana data layer (are there open issues tagged to removed routes?), localStorage migration patterns for pre-rebrand users, apex domain content (`joolie-boolie.com` — what serves it now?), git history reachability (is the repo public or private?).
- **Decisions ENABLED:** single big-sweep PR > drip cleanup; automated drift-detection lint rule; CSP move to enforcing mode; rotate Supabase key unconditionally.
- **Decisions CONSTRAINED:** "forward-only cleanup" is only defensible if Supabase project is confirmed dead — until confirmed, git history rewrite may be required; adding `/api/health` is a design decision, not just a doc fix; nightly cron cleanup cannot be safely committed without first verifying Actions is disabled.
- **Meta-observation:** Every finding in the final report should carry a **provenance tag**: "verified against live system," "from tracked file at HEAD," or "from on-disk artifact (gitignored, potentially stale)."

## Convergence Across All 3 Syntheses
- Runtime code is clean; drift is in non-executable surfaces
- The docs layer is the highest-impact target for an AI-driven project
- Phase 2's corrections of Phase 1 are evidence about investigation methodology, not just findings
- Supabase service role key rotation is unconditional regardless of project status
- Faro `\n` corruption is a live observability outage, not just a config drift
- CSP enforcing mode is newly feasible and should happen
- Dead types cleanup is safe, bounded, and mechanical

## Divergence / Complementary Insights
- **S1 (thematic)** frames the audit as a story about *why* drift persisted; most useful for writing the executive summary and the "what is this really about" sections.
- **S2 (risk/actionability)** gives a concrete "do this first" ordering via the quadrant map; most useful for producing the Recommendations section of the final report.
- **S3 (gaps)** adds honesty about what the audit doesn't know and flags the `NEXT_PUBLIC_FEATURE_QUESTION_SETS` correction; most useful for the Confidence Assessment and Open Questions sections.
- **S1 vs S3:** S1's Theme 1 ("compiler boundary") lists `NEXT_PUBLIC_FEATURE_QUESTION_SETS` as ambiguous; S3 resolves the ambiguity with the `docs/question-sets-feature-flag/` directory evidence. S3 wins.
- **S1 vs S2:** S1 recommends "docs as coherent sprint" as Track B; S2 categorizes MANUAL_TEST_PLAN rewrite as Important Investment. Compatible — both argue for bundling docs into a single unit of work.
- **S2 vs S3:** S2's URGENT bucket and S3's CONSTRAINED decisions are both about the Supabase key — S2 says "rotate unconditionally" and S3 adds "if the project is alive, forward-only cleanup is insufficient." Compatible and complementary.

## Artifacts (Phase 4 should read raw)
- `phase-3/synthesis-1.md` — Thematic, 4 themes, ~3500 words
- `phase-3/synthesis-2.md` — Risk quadrant map, ~1900 words
- `phase-3/synthesis-3.md` — Gaps & decisions, ~4000 words (includes the question-sets-feature-flag correction)
- `phase-2/iterator-{1-5}.md` — raw Phase 2 reports (if final needs specific line-level evidence)
- `phase-1/area-{1-5}.md` — raw Phase 1 reports (mostly for historical reference; packets summarize them)
