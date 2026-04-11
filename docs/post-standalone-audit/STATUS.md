# Analysis Funnel Status: Post-Standalone-Conversion Audit

## Current State
- **Phase:** 4 (COMPLETE)
- **Sub-state:** All phases complete. Final report on disk.
- **Last updated:** 2026-04-11
- **Artifact root:** /Users/j/repos/beak-gaming-platform/docs/post-standalone-audit

## Analysis Question
What needs to be updated across the Joolie Boolie monorepo as a direct consequence of the removal of platform-hub, auth, database, and all Supabase/OAuth infrastructure?

## Analysis Conclusion
The standalone conversion (BEA-682–695) was a successful deletion campaign against runtime code, but it stopped at the compiler boundary. Non-executable surfaces (types, env stubs, docs, vocabulary) were largely untouched. **"What you run is correct, but what you read is wrong."** The drift is concentrated in exactly the files AI agents consume as authoritative context, which matters disproportionately in an AI-only development model. Three URGENT security items, a well-bounded 3-5 hour Quick Wins bundle, and a larger doc + dead-code sprint make up the actionable plan.

## Domain Tags
Architecture, Developer Experience, Auth/Security, Testing, UI/Visual, DevOps/Infra, API/Backend

## Phase Completion
- [x] Phase 0: Frame — `phase-0/analysis-brief.md`
- [x] Phase 1: Investigate (5 areas) — 5 reports on disk, `phase-1-packet.md`
- [x] Phase 2: Iterate (5 iterators) — 5 reports on disk, `phase-2-packet.md`, corrected 4 Phase 1 claims
- [x] Phase 3: Synthesize (3 synthesizers) — 3 reports on disk, `phase-3-packet.md`
- [x] Phase 4: Final report — `phase-4/analysis-report.md` (~4,100 words)

## Key outputs
- **Master framing:** "What you run is correct, but what you read is wrong."
- **4 themes** (compiler boundary, docs for AI, snapshot staleness, vocabulary persistence)
- **3 URGENT items** (rotate Supabase key, rotate Sentry+Grafana tokens, fix Faro `\n` corruption)
- **Quick Wins bundle** (~3-5 hrs, 8 items)
- **Important Investments** (CSP enforcing, dead types cleanup, MANUAL_TEST_PLAN rewrite)
- **6 Open Questions** with single-command probes
- **4 Phase 2 corrections to Phase 1** (Vercel prod env, `.env.example`, `start-e2e-servers.sh`, Faro wiring) — honored as established fact in final report
- **1 Synthesis 3 correction** (`NEXT_PUBLIC_FEATURE_QUESTION_SETS` is planned-not-dead — `docs/question-sets-feature-flag/` contains a design doc)

## Context Packets Available
- `context-packets/phase-0-packet.md`
- `context-packets/phase-1-packet.md`
- `context-packets/phase-2-packet.md`
- `context-packets/phase-3-packet.md`
