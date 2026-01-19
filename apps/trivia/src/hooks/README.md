# Trivia Hooks

App-specific hooks for game flow, sync, audio, and theme management. Prefer
hooks for side effects and keep pure logic in `lib/`.

## Conventions

- Clean up event listeners and timers in `useEffect` cleanup.
- Avoid importing React state into `lib/` modules.

## Related Docs

- Source map: [`src/README.md`](../README.md)
