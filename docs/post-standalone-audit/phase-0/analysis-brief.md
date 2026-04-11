# Phase 0 — Analysis Brief

## Analysis Question

What needs to be updated across the Joolie Boolie monorepo as a direct consequence of the removal of `apps/platform-hub`, `packages/auth`, `packages/database`, and all Supabase/OAuth/JWT auth infrastructure (BEA-682–695, Wave 1)?

Where is there still drift between the codebase's current reality (two standalone apps, localStorage-only persistence, no backend identity) and artifacts (code, config, copy, docs, tests, infra, monitoring) that were written for the old multi-app logged-in platform?

## Context

- **Architecture before:** multi-app platform (`platform-hub` + `bingo` + `trivia`) tied together by Supabase auth, OAuth token exchange, cross-subdomain SSO cookies, a shared `packages/auth` and `packages/database`. Deployed on `joolie-boolie.com`, `bingo.joolie-boolie.com`, `trivia.joolie-boolie.com`.
- **Architecture after:** two fully standalone apps (`bingo`, `trivia`). No backend identity. All data stored in localStorage with the `jb-` prefix. Platform-hub and all auth packages gone.
- **Main head:** `25cdc983` (as of 2026-04-11).
- **Recent cleanup commits that already landed:** `5a0b431d`, `a4738b94`, `b42ac974`, `25cdc983` (platform-hub config references, voice-pack-temp, oauth scripts, dead middleware, tracked settings backups).
- **Related open work:** BEA-697 (PR #523) is a planning doc for restoring the E2E baseline — its findings are ONE input to this funnel, not the whole thing.

## Scope

### In scope
- Two active apps (`apps/bingo`, `apps/trivia`) and 10 shared packages
- Root config files (`.lintstagedrc.js`, `turbo.json`, `package.json`, `vercel.json`, `.gitignore`, eslint, lighthouse, performance)
- All `docs/` *except* `docs/archive/`, `docs/standalone-conversion-plan/`, `docs/standalone-games-analysis/` (historical records)
- `.secrets/observability-accounts.json` structural shape (no secrets exposed in output)
- CI workflows under `.github/workflows/` (even if disabled)
- Test suites (unit + E2E + fixtures)
- Environment variable declarations (env examples, vercel project config)

### Out of scope
- `docs/archive/` and `docs/standalone-conversion-plan/` — historical records, intentionally preserved
- `.worktrees/` — feature branches, not main state
- `node_modules/`, `.turbo/`, `.next/`, `dist/`, generated files
- Actually implementing any fixes — this funnel produces a report only

### Non-goals
- Not producing an implementation plan
- Not prioritizing cosmetic wishlist items ("nice to have" typography tweaks)
- Not re-auditing the standalone conversion itself (that was BEA-682–695)

## Known Knowns

- `apps/platform-hub/` is gone from `main`
- `packages/auth/` and `packages/database/` are gone from `main`
- `jb-` is the current prefix for localStorage keys, BroadcastChannel names, cookies
- Both apps have no middleware (both `apps/{bingo,trivia}/src/middleware.ts` deleted in BEA-696, `25cdc983`)
- Sentry + Grafana + Axiom are still wired to observe both apps
- CSP report + Sentry tunnel + trivia-api proxy are the only remaining API routes
- The E2E baseline is broken (BEA-697) — at least 28 tests affected across 5+ spec files; NOT caused by BEA-696

## Known Unknowns

1. What dead code references removed packages (`@joolie-boolie/auth`, `@joolie-boolie/database`, `@joolie-boolie/platform-hub`)?
2. What UI affordances still imply login/account/platform (copy strings, buttons, menus)?
3. What security headers (CSP/CORS/cookies) are still tuned for cross-subdomain SSO that no longer exists?
4. What env vars are referenced but no longer meaningful (SUPABASE_*, OAUTH_*, SESSION_TOKEN_SECRET, etc.)?
5. What deps are installed but unused (`@supabase/*`, JWT libs, auth libs)?
6. What docs still describe a multi-app platform?
7. What unit tests still import from removed modules or reference removed strings?
8. What Vercel/DNS configuration still assumes the old subdomain architecture?
9. What monitoring/alerting dashboards reference deleted services or projects?
10. What tooling config (`.lintstagedrc.js`, `turbo.json`, `eslint.config.*`) still references removed packages?

## Suspected Unknowns

- Shared packages may still export auth-related types or hooks
- Service worker config may still cache auth endpoints
- PWA manifests may have stale scopes or icons pointing at platform-hub
- Pre-commit hooks may reference scripts that are gone
- `.vscode/` settings or editor configs referencing removed files
- Docker / dev container configs referencing removed services

## Domain Tags

| Domain | Relevance |
|---|---|
| **Architecture** | Central — the whole question is about architectural drift |
| **Developer Experience** | High — docs/tooling/onboarding all assume the old world |
| **Auth/Security** | High — headers, cookies, CSP, env vars, middleware |
| **Testing** | High — E2E drift + unit test drift + fixtures |
| **UI/Visual** | Medium — user-facing copy + affordances |
| **DevOps/Infra** | Medium — Vercel, CI, monitoring, deployment |
| **API/Backend** | Medium — routes, middleware, proxies |

7 domains tagged (more than the usual 5-domain cap, but justified: this is a deliberate broad-sweep audit by user request). The 5 investigation areas below collapse these domains into independently investigable facets.

## Quality Criteria

| Criterion | Weight | Notes |
|---|---|---|
| Evidence strength | 25% | Every finding must cite file path + line number where possible |
| Completeness | 25% | Must cover all 7 tagged domains |
| Accuracy | 20% | Claims verified against current `main` at 25cdc983 |
| Actionability | 20% | Each finding has severity + concrete recommended action |
| Nuance | 5% | Flag trade-offs (e.g., "leave or fix" judgment calls) |
| Clarity | 5% | Grouping + severity badges for scannability |

Completeness and Actionability are bumped above the default weights because the user explicitly asked for an actionable audit grouped by dimension.

## 5 Investigation Areas

### Area 1 — User-Facing Drift (copy, UX, affordances, error states)
**Domain(s):** UI/Visual, Developer Experience
**Question:** What does a user visiting the live site still see that implies they're on a "platform" / expected to log in / part of a multi-app identity system? Landing pages, empty states, "sign in" buttons, account menus, "welcome back" greetings, share URLs assuming user context, error pages referencing removed endpoints, copy strings with `platform-hub` / `joolie-boolie platform` / `Sign in`.
**Subagent type:** `ui-design:ui-designer`

### Area 2 — Code-Level Dead Weight (imports, utilities, stores, hooks, types, routes)
**Domain(s):** Architecture, API/Backend, React/Components
**Question:** What unused code remains after the auth/platform removals? Leftover auth guards, orphaned hooks/stores, dead API routes, stale type exports, references to removed packages by name, feature flags for the removed world, unused utilities, dead middleware patterns. Must grep for `@joolie-boolie/auth`, `@joolie-boolie/database`, `@joolie-boolie/platform-hub`, `supabase`, `oauth`, `jwt` across non-test code.
**Subagent type:** `code-refactoring:legacy-modernizer`

### Area 3 — Security & Infrastructure Drift (headers, cookies, env, Vercel, DNS, monitoring)
**Domain(s):** Auth/Security, DevOps/Infra
**Question:** What security configuration is still tuned for cross-subdomain SSO that no longer exists? CSP allowing old origins, CORS for removed domains, cookies with wrong scope/domain, env vars referencing removed secrets (SUPABASE_*, OAUTH_*, SESSION_TOKEN_SECRET, JWT_*), Vercel project configs, DNS pointing at removed subdomains, monitoring/alerting resources (Sentry projects, Grafana dashboards, OTel span names) referencing deleted services, PWA manifest scopes.
**Subagent type:** `security-compliance:security-auditor`

### Area 4 — Test & Tooling Drift (unit tests, E2E, fixtures, dev scripts, lint, Turbo)
**Domain(s):** Testing, Developer Experience
**Question:** What test and tooling config is broken or references removed things? Unit tests importing from removed modules, fixtures with platform-hub/supabase strings, mock data assuming user accounts, dev scripts for the old multi-app workflow, `.lintstagedrc.js` mappings for removed packages, `turbo.json` pipeline references, `eslint.config.*` drift. BEA-697 E2E findings are ONE input here, not the whole thing. Must NOT re-investigate what BEA-697 already covered — use it as given.
**Subagent type:** `backend-development:tdd-orchestrator`

### Area 5 — Documentation & Developer Onboarding
**Domain(s):** Developer Experience
**Question:** What documentation would mislead a new contributor or returning developer? Root and app `CLAUDE.md` files, `README.md` files at every level, docs under `docs/` (EXCLUDING `docs/archive/`, `docs/standalone-conversion-plan/`, `docs/standalone-games-analysis/`), setup guides, runbooks, architecture diagrams, PR templates. Look for references to multi-app architecture, removed packages, removed commands (`dev:hub`, `lighthouse:hub`), removed env vars, removed API surfaces.
**Subagent type:** `feature-dev:code-explorer`

---

**Carving rationale:** Areas are orthogonal — Area 1 is user-visible, Area 2 is internal code, Area 3 is config/infra, Area 4 is tests/tooling, Area 5 is human-facing docs. A finding could belong to multiple areas in principle, but the primary ownership is clear. If an investigator finds evidence in another area's territory, they note it and let the phase-1-packet aggregate.
