# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trivia Night** - A presenter-controlled trivia system for retirement communities. Part of the Beak Gaming Platform monorepo.

**Current State:** Skeleton app, ready for feature development.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Frontend | React + Tailwind CSS |
| Backend (BFF) | Next.js API Routes |
| Database | Supabase (PostgreSQL) - shared with platform |
| Auth | Supabase Auth via @beak-gaming/auth |
| State Management | Zustand |
| Dual-Screen Sync | @beak-gaming/sync |

## Monorepo Structure

This app uses shared packages from the monorepo:
- `@beak-gaming/sync` - Dual-screen synchronization
- `@beak-gaming/ui` - Shared UI components (Button, Toggle, Slider)
- `@beak-gaming/theme` - Senior-friendly design tokens
- `@beak-gaming/auth` - Supabase authentication

## Key Commands

```bash
# From monorepo root
pnpm dev:trivia        # Start dev server on port 3001
pnpm build             # Build all apps
pnpm test              # Run all tests

# From apps/trivia
pnpm dev               # Start dev server
pnpm build             # Build trivia app
pnpm test              # Run trivia tests
```

## Project Structure

```
src/
├── app/
│   ├── api/           # BFF routes (questions, templates)
│   ├── play/          # Presenter view
│   ├── display/       # Audience view
│   └── dashboard/     # Template management
├── components/
│   ├── presenter/     # Timer, question display, scoring
│   ├── audience/      # Large question display
│   └── ui/            # App-specific components
├── lib/
│   └── game/          # Question manager, timer, scoring
├── stores/            # Zustand stores
├── hooks/             # Custom hooks
└── types/             # TypeScript types
```

## Game Mechanics

- **Format:** 4-6 rounds, 5 questions per round
- **Question Types:** Multiple choice, True/False, Short answer, Image-based
- **Timing:** 20-40 seconds per question (configurable)
- **Scoring:** Manual presenter-controlled (+1/-1 per team)
- **Teams:** Table-based (Table 1, 2, 3, etc.)

## Design Requirements

- **Senior-friendly:** Large fonts, high contrast, simple controls
- **Dual-screen:** Presenter dashboard + audience projection
- **Accessible:** Keyboard navigation, screen reader support
- **Offline-capable:** PWA support planned

## Key Documentation

- `/documentation/chat_gpt_output_project_idea.md` - Original requirements from ChatGPT
