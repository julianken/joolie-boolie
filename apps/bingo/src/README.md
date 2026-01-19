# Bingo Source Map

## Directory Map

- `app/`: Next.js routes (`/play`, `/display`) and API routes.
- `components/`: UI grouped by presenter/audience/ui.
- `hooks/`: App-specific hooks (audio, sync, statistics, etc.).
- `lib/`: Pure logic and helpers (game engine, audio, sync utilities).
- `stores/`: Zustand state containers.
- `types/`: Shared TypeScript types for the app.
- `test/`: Test helpers and setup.
- `sw.ts`: Service worker entry.

## Primary Flow

Presenter actions update stores and engine state. Sync utilities broadcast state
updates to the audience view, which renders read-only UI.

## Read Next

- Components: [`components/README.md`](./components/README.md)
- Hooks: [`hooks/README.md`](./hooks/README.md)
- Lib: [`lib/README.md`](./lib/README.md)
- Stores: [`stores/README.md`](./stores/README.md)
- Tests: [`test/README.md`](./test/README.md)
