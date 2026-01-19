# Trivia Components

## Subdirectories

- `presenter/`: Presenter controls, settings, and game tools.
- `audience/`: Large-format audience display components.
- `ui/`: Shared UI helpers (modals, shortcuts, etc.).
- `pwa/`: Install prompt and offline UI.
- `stats/`: Stats display widgets.
- `providers/`: App-level providers and error boundaries.

## Conventions

- Presenter components should be interactive and stateful.
- Audience components should be read-only and high-contrast.
- Export public components from each folder's `index.ts`.

## Related Docs

- Source map: [`src/README.md`](../README.md)
