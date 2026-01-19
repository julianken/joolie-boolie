# Packages

Shared libraries used across the apps. Each package exposes a stable API via
its `src/index.ts` entrypoint.

## Package Map

- [`auth`](./auth/README.md): Supabase auth client/server helpers and UI.
- [`database`](./database/README.md): Supabase database helpers and queries.
- [`error-tracking`](./error-tracking/README.md): Error tracking integration.
- [`game-engine`](./game-engine/README.md): Game engine utilities.
- [`sync`](./sync/README.md): Dual-screen synchronization utilities.
- [`testing`](./testing/README.md): Test helpers and mocks.
- [`theme`](./theme/README.md): Design tokens and theme utilities.
- [`types`](./types/README.md): Shared TypeScript types.
- [`ui`](./ui/README.md): Shared UI components.

## Conventions

- Import from package names (e.g. `@beak-gaming/ui`) rather than deep paths.
- Keep public APIs in `src/index.ts`.
- Each package should define its own `pnpm test:run` if tests exist.

## Related Docs

- Root overview: [`README.md`](../README.md)
- Apps index: [`apps/README.md`](../apps/README.md)
