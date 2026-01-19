# Apps

This folder contains the user-facing applications. Each app is a Next.js
App Router project with shared UI, theme, and sync packages.

## Apps

- [`bingo`](./bingo/README.md) (port 3000): 75-ball bingo caller with presenter
  and audience views.
- [`trivia`](./trivia/README.md) (port 3001): team trivia game with presenter
  and audience views.
- [`platform-hub`](./platform-hub/README.md) (port 3002): game selection hub.

## Shared App Conventions

- Presenter + audience views are separate routes (`/play`, `/display`).
- State lives in Zustand stores and pure engine functions in `lib/`.
- Audience display is optimized for large screens (font size and contrast).
- Dual-screen sync uses `@beak-gaming/sync` BroadcastChannel utilities.

## Quick Commands

```bash
pnpm dev
pnpm dev:bingo
pnpm dev:trivia
pnpm dev:hub
```

## Related Docs

- Root overview: [`README.md`](../README.md)
- Shared packages: [`packages/README.md`](../packages/README.md)
