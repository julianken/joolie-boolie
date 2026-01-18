# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Beak Gaming Platform** - A unified gaming platform for retirement communities, featuring Bingo, Trivia, and future games. Built as a Turborepo monorepo with shared packages.

## Monorepo Structure

```
beak-gaming-platform/
├── apps/
│   ├── bingo/           # Beak Bingo - 75-ball bingo game
│   ├── trivia/          # Trivia Night - Team trivia game
│   └── platform-hub/    # Central hub - auth, dashboard, game selector
├── packages/
│   ├── sync/            # Dual-screen synchronization (BroadcastChannel)
│   ├── ui/              # Shared UI components (Button, Toggle, Slider)
│   ├── theme/           # Senior-friendly design tokens and CSS
│   ├── auth/            # Supabase authentication wrappers
│   ├── game-engine/     # Abstract game state machine
│   ├── database/        # Supabase database utilities
│   └── testing/         # Shared test utilities and mocks
└── supabase/            # Database migrations and functions
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm |
| Framework | Next.js 16 (App Router) |
| Frontend | React 19 + Tailwind CSS 4 |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Testing | Vitest + Testing Library |

## Key Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Run all apps
pnpm dev:bingo        # Run bingo only (port 3000)
pnpm dev:trivia       # Run trivia only (port 3001)
pnpm dev:hub          # Run platform-hub only (port 3002)

# Build
pnpm build            # Build all apps and packages

# Test
pnpm test             # Run all tests

# Clean
pnpm clean            # Clean all build artifacts
```

## Shared Packages

### @beak-gaming/sync
Dual-screen synchronization using BroadcastChannel API.
- `BroadcastSync` class for channel management
- `useSync` hook for React integration
- `createSyncStore` for Zustand state

### @beak-gaming/ui
Senior-friendly UI components:
- `Button` - Primary, secondary, danger variants
- `Toggle` - Large accessible switch
- `Slider` - Range input with labels

### @beak-gaming/theme
Design tokens and CSS:
- `globals.css` - Senior-friendly colors, fonts, spacing
- `tailwind.preset.js` - Tailwind configuration
- TypeScript token exports

### @beak-gaming/auth
Supabase authentication:
- Server and client utilities
- Auth hooks
- Session management

## Design Principles

1. **Senior-friendly:** Large fonts (18px+ base), high contrast, 44px+ touch targets
2. **Simple controls:** Big buttons, minimal typing, clear labels
3. **Dual-screen:** Presenter controls + audience projection
4. **Offline-capable:** PWA support, cached assets
5. **Accessible:** Keyboard navigation, screen reader support

## Development Workflow

1. Work in the appropriate app directory (`apps/bingo`, `apps/trivia`, etc.)
2. Shared code goes in `packages/`
3. Use workspace dependencies: `@beak-gaming/sync`, `@beak-gaming/ui`, etc.
4. Run tests before committing
5. Each app can be deployed independently

## Environment Variables

Create `.env.local` in each app:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Git History

- `apps/bingo/` contains the original beak-bingo git history
- `apps/trivia/` contains the original trivia-project .claude history
- Each app maintains its own CLAUDE.md for context
