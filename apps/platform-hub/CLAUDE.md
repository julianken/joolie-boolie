# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Beak Gaming Platform Hub** - The central entry point for the Beak Gaming Platform. Provides game selection, authentication, and user dashboard.

## Purpose

- **Game Selector:** Links to Bingo and Trivia apps
- **Authentication:** Shared login/register for all games
- **Dashboard:** User profile, saved templates across games
- **Branding:** Facility logo management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Frontend | React + Tailwind CSS |
| Auth | Supabase Auth via @beak-gaming/auth |

## Shared Packages

- `@beak-gaming/ui` - Shared UI components
- `@beak-gaming/theme` - Senior-friendly design tokens
- `@beak-gaming/auth` - Supabase authentication

## Key Commands

```bash
# From monorepo root
pnpm dev:hub           # Start dev server on port 3002

# From apps/platform-hub
pnpm dev               # Start dev server
pnpm build             # Build app
```

## Project Structure

```
src/
├── app/
│   ├── auth/          # Login, register, reset password
│   ├── dashboard/     # User dashboard
│   └── page.tsx       # Game selector home page
└── components/
    └── game-card.tsx  # Game selection cards
```

## Routes

- `/` - Game selector (Bingo, Trivia)
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - User dashboard (protected)
