# Work In Progress - Status as of 2026-01-19

## Quick Summary

- **66 modified files** + **143 new untracked files**
- **1 failing test** needs fixing before commit
- Multiple feature streams partially complete

---

## Failing Test (Fix First)

**File:** `packages/ui/src/__tests__/use-confetti.test.ts:224`

**Issue:** The `fire` function from `useConfetti` hook isn't maintaining referential stability across re-renders.

**Fix:** Wrap the `fire` function in `useCallback` in `packages/ui/src/hooks/use-confetti.ts`

```bash
cd packages/ui && pnpm test:run
```

---

## Work Streams

### 1. Bingo App (`apps/bingo`)

**New files to review:**
- `src/app/api/games/` - Game API routes
- `src/app/api/sessions/` - Session management API
- `src/app/api/templates/` - Template API
- `src/components/presenter/PatternEditor.tsx` - Pattern editing UI
- `src/components/presenter/PatternLibrary.tsx` - Pattern library
- `src/components/presenter/VoicePackSelector.tsx` - Voice pack selection
- `src/components/presenter/VoicePackPreview.tsx` - Voice pack preview
- `src/components/stats/` - Statistics components
- `src/hooks/use-statistics.ts` - Statistics hook
- `src/lib/api/` - API client utilities
- Error pages (`error.tsx`, `global-error.tsx`, `not-found.tsx`)
- `lighthouserc.js`, `vercel.json` - Deployment config

**Modified:**
- `src/app/play/page.tsx` - Presenter page updates
- `src/types/index.ts` - Type definitions expanded

### 2. Trivia App (`apps/trivia`)

**New files to review:**
- `src/app/api/` - API routes
- `src/components/presenter/AudioSettingsPanel.tsx` - Audio settings
- `src/components/presenter/BuzzInPanel.tsx` - Buzz-in system
- `src/components/presenter/SettingsPanel.tsx` - Settings UI
- `src/components/presenter/ThemeSelector.tsx` - Theme selection
- `src/components/presenter/TimerDisplay.tsx` - Timer component
- `src/components/audience/PauseOverlay.tsx` - Pause overlay
- `src/components/audience/AudienceTimerDisplay.tsx` - Audience timer
- `src/components/pwa/` - PWA components
- `src/hooks/use-buzz-in.ts` - Buzz-in hook
- `src/hooks/use-theme.ts` - Theme hook
- `src/hooks/use-tts.ts` - Text-to-speech hook
- `src/hooks/use-sounds.ts` - Sound effects hook
- `src/lib/game/buzz-in.ts` - Buzz-in logic
- `src/stores/audio-store.ts` - Audio state
- `src/stores/theme-store.ts` - Theme state
- `src/sw.ts` - Service worker
- Error pages, `lighthouserc.js`, `vercel.json`

**Modified:**
- `src/app/play/page.tsx` - Major presenter updates (+439 lines)
- `src/app/display/page.tsx` - Display page updates
- `src/hooks/use-game-keyboard.ts` - Keyboard shortcuts expanded
- `src/lib/game/engine.ts` - Game engine expanded
- `src/stores/game-store.ts` - Store updates

### 3. Platform Hub (`apps/platform-hub`)

**New files to review:**
- `src/app/login/` - Login page
- `src/app/signup/` - Signup page
- `src/app/forgot-password/` - Password reset
- `src/app/dashboard/` - Dashboard page
- `src/components/` - UI components
- Error pages, `lighthouserc.js`, `vercel.json`

**Modified:**
- `src/app/page.tsx` - Home page major updates (+291 lines)

### 4. Packages

**Auth (`packages/auth`):**
- New: `src/client.ts`, `src/server.ts`, `src/middleware.ts`
- New: `src/hooks/`, `src/components/`
- New: `src/types.ts`, `src/__tests__/`

**Database (`packages/database`):**
- New: `src/client.ts`, `src/queries.ts`, `src/filters.ts`
- New: `src/pagination.ts`, `src/errors.ts`
- New: `src/hooks/`, `src/tables/`, `src/__tests__/`

**Error Tracking (`packages/error-tracking`):**
- Entirely new package

**Types (`packages/types`):**
- Entirely new package

**Testing (`packages/testing`):**
- New: `src/mocks/supabase.ts`
- New: `src/setup.ts`

**UI (`packages/ui`):**
- New: Skeleton components, confetti, web-vitals
- **Has failing test** (see above)

### 5. Infrastructure

**New:**
- `.github/` - GitHub workflows
- `e2e/` - End-to-end tests
- `playwright.config.ts` - Playwright config
- `performance.config.js` - Performance config
- `lighthouserc.js` - Root Lighthouse config
- `vercel.json` - Root Vercel config
- `README.md`, `CONTRIBUTING.md` - Documentation
- `.env.example` - Environment template

---

## Recent Commits (Context)

```
897a3b6 Add error observability to BroadcastSync
4b5a684 Fix test failures and add test coverage
0f1ac5b improve display page accessibility and test coverage
e7e250b add accessibility CSS and sync test improvements
acfe961 add sync loop prevention to BroadcastSync
```

---

## Suggested Order of Operations

1. **Fix failing test** in `packages/ui` (useConfetti stability)
2. **Run full test suite** to verify everything passes
3. **Review and commit by feature area:**
   - Infrastructure/config files first
   - Packages (auth, database, error-tracking, types)
   - App updates (bingo, trivia, platform-hub)
4. **Consider breaking into multiple commits** by logical grouping

---

## Commands

```bash
# Run all tests
pnpm test:run

# Run specific package tests
cd packages/ui && pnpm test:run

# Check what would be committed
git status

# Stage by area
git add packages/ui/
git add packages/auth/
# etc.
```
