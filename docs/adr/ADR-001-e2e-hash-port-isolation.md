# ADR-001: E2E Hash-Based Port Isolation

## Status

Accepted

## Context

The project uses a parallel AI-agent development workflow where multiple features are developed simultaneously in separate git worktrees (e.g., `.worktrees/wt-BEA-334`). Each worktree needs to run E2E tests independently against its own server instances.

The original E2E configuration hardcoded ports 3000 (Bingo), 3001 (Trivia), and 3002 (Platform Hub, since removed in the standalone conversion BEA-682–696). This meant only one worktree could run E2E tests at a time -- parallel worktrees either connected to the wrong server or failed with port conflicts.

## Decision

Assign deterministic port offsets to each worktree based on a SHA-256 hash of the worktree's absolute filesystem path.

**Algorithm** (implemented in `e2e/utils/port-isolation.ts` and `e2e/utils/port-config.ts`):

1. Detect whether the current directory is a git worktree (`.git` is a file, not a directory).
2. Hash the worktree path with SHA-256.
3. Take the first 8 hex characters and parse as an integer.
4. Map to range 0-332: `offsetIndex = hashInt % 333`.
5. Multiply by 3: `portOffset = offsetIndex * 3`.
6. Final ports: `3000 + portOffset` (Bingo), `3001 + portOffset` (Trivia), `3002 + portOffset` (reserved/unused). Only the first two slots are consumed after the standalone conversion removed Platform Hub (BEA-682–696); the third slot remains in the range allocation to keep the arithmetic stable and avoid renumbering every existing worktree.

The main repo always gets the default ports (3000, 3001, with 3002 reserved).

**Priority system** (highest to lowest):
1. Environment variable overrides (`E2E_PORT_BASE`, `E2E_BINGO_PORT`, etc.)
2. Hash-based assignment for worktrees
3. Default ports 3000-3002 for the main repo

**Port range**: 3000-3999, supporting up to 333 concurrent worktrees.

## Consequences

**Positive:**
- E2E tests run fully in parallel across any number of worktrees with no manual port management.
- Same worktree always gets the same ports (deterministic).
- No Docker or process manager required.
- Port assignment logged at test startup for debugging.

**Negative:**
- Hash collision possible (1-in-333 chance for any two worktrees). Negligible with <10 concurrent worktrees.
- Worktree setup script (`scripts/setup-worktree-e2e.sh`) must be run to configure `PORT` env vars.

**Files implementing this decision:**
- `e2e/utils/port-isolation.ts` -- core hash and detection logic
- `e2e/utils/port-config.ts` -- shared `getE2EPortConfig()` function
- `playwright.config.ts` -- consumes port config for project `baseURL` values
- `scripts/setup-worktree-e2e.sh` -- generates `.env.e2e` with port assignments

Note: `e2e/fixtures/auth.ts` previously consumed the port config for Platform Hub URLs. After the standalone conversion (BEA-682–696), it navigates directly to `/play` on the target app and no longer reads hub URLs.
