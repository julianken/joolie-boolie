# Bingo Hooks

App-specific hooks for audio, sync, and statistics. Prefer hooks for
cross-cutting concerns and keep pure logic in `lib/`.

## Conventions

- Clean up event listeners and timers in `useEffect` cleanup.
- Avoid importing React state into `lib/` modules.
