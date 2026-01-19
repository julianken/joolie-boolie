---
active: true
iteration: 1
max_iterations: 100
completion_promise: "ALL_TASKS_COMPLETE"
branch: optimization-features
total_tasks: 9
completed_tasks: 0
---

# Beak Gaming Platform Optimization Tasks

## Task Dependency Graph

```
Wave 1 (READY - run in parallel):
├── T1: Fix Audio Memory Leak (audio-store.ts:243-303)
├── T2: Fix Auto-call Race Condition (use-game.ts:92-131)
├── T3: Add ENV Variable Validation (supabase clients)
├── T4: Consolidate BroadcastSync (delete duplicates)
├── T6: Remove Duplicate Slider (bingo UI)
├── T7: Add Error Boundaries (both apps)
└── T8: Add ARIA Labels (presenter components)

Wave 2 (BLOCKED → T4):
└── T5: Consolidate Session Utils

Wave 3 (BLOCKED → T1, T2):
└── T9: Add Tests for Fixes
```

---

## Agent Instructions

### How to Work on Tasks

1. **Claim a task:** Find any task with `Status: READY`, update it to `Status: IN_PROGRESS`
2. **Complete implementation:** Follow the steps in the Implementation section exactly
3. **Verify:** Run the verification command and check all Test Criteria boxes
4. **Update status:** Change to `Status: COMPLETE` and update the `completed_tasks` counter in frontmatter
5. **Unblock dependents:** When completing a task, check if it unblocks others (change their `Status: BLOCKED` → `Status: READY`)
6. **Commit:** Use the exact commit message format provided, then push to `optimization-features`

### Git Workflow

```bash
# After completing each task
git add -A
git commit -m "{commit message from task}"
git push origin optimization-features
```

### Parallelization Rules

- Multiple agents CAN work on READY tasks simultaneously
- Only claim ONE task at a time per agent
- Never work on BLOCKED tasks
- Update this document atomically when changing status

---

## Tasks

### Task T1: Fix Audio Memory Leak
**Status:** READY
**Dependencies:** None
**Priority:** CRITICAL

**Files:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/stores/audio-store.ts` (lines 243-303)

**Problem:**
Audio elements created on each play are not being properly cleaned up, causing memory leaks during long bingo sessions.

**Implementation:**
1. Add a cleanup function that releases audio resources after playback completes
2. Use `audio.onended` callback to trigger cleanup
3. Implement object pooling for frequently used sounds (ball roll, chime)
4. Add `cleanup()` method to the store that can be called on unmount
5. Ensure all `HTMLAudioElement` references are nullified after use

**Test Criteria:**
- [ ] Audio plays correctly without errors
- [ ] Memory profiler shows no audio element accumulation after 50+ ball calls
- [ ] `cleanup()` method exists and properly releases all resources
- [ ] No console warnings about audio resources

**Commit:** `fix(bingo): T1 - fix audio memory leak in audio-store`

**Verify:** `cd apps/bingo && pnpm test:run`

---

### Task T2: Fix Auto-call Race Condition
**Status:** READY
**Dependencies:** None
**Priority:** CRITICAL

**Files:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/hooks/use-game.ts` (lines 92-131)

**Problem:**
Auto-call timer can fire while previous call is still processing, causing duplicate or skipped balls.

**Implementation:**
1. Add a `isProcessing` ref to track when a call is in progress
2. Guard the auto-call callback with `isProcessing` check
3. Set `isProcessing = true` before calling, `false` after completion
4. Clear interval on component unmount to prevent stale callbacks
5. Add debounce protection for rapid manual calls during auto-call

**Test Criteria:**
- [ ] Auto-call cannot fire while previous call is processing
- [ ] No duplicate balls are ever called
- [ ] Manual call during auto-call sequence works correctly
- [ ] Interval is properly cleaned up on unmount

**Commit:** `fix(bingo): T2 - fix auto-call race condition in use-game hook`

**Verify:** `cd apps/bingo && pnpm test:run`

---

### Task T3: Add ENV Variable Validation
**Status:** READY
**Dependencies:** None
**Priority:** HIGH

**Files:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/lib/supabase/client.ts`
- `/Users/j/repos/beak-gaming-platform/apps/trivia/src/lib/supabase/client.ts`

**Problem:**
Missing ENV variables cause cryptic runtime errors instead of clear startup failures.

**Implementation:**
1. Create a validation function that checks required ENV variables exist
2. Throw descriptive error if `NEXT_PUBLIC_SUPABASE_URL` is missing
3. Throw descriptive error if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing
4. Run validation at module load time (not lazily)
5. Include variable name and expected format in error messages

**Test Criteria:**
- [ ] App fails fast with clear error if SUPABASE_URL is missing
- [ ] App fails fast with clear error if SUPABASE_ANON_KEY is missing
- [ ] Error messages include the variable name and expected format
- [ ] Validation runs at module initialization

**Commit:** `feat(config): T3 - add ENV variable validation for supabase clients`

**Verify:** `cd apps/bingo && pnpm build && cd ../trivia && pnpm build`

---

### Task T4: Consolidate BroadcastSync
**Status:** READY
**Dependencies:** None
**Priority:** MEDIUM

**Files:**
- DELETE: `/Users/j/repos/beak-gaming-platform/apps/bingo/src/lib/sync/broadcast.ts`
- DELETE: `/Users/j/repos/beak-gaming-platform/apps/trivia/src/lib/sync/broadcast.ts`
- UPDATE: Import references to use `@beak/sync` package instead

**Problem:**
BroadcastSync is duplicated in each app when it should be imported from `packages/sync`.

**Implementation:**
1. Verify `packages/sync` has `BroadcastSync` exported
2. Update all imports in `apps/bingo` to use `@beak/sync`
3. Update all imports in `apps/trivia` to use `@beak/sync`
4. Delete the duplicate files from both apps
5. Run build to ensure no broken imports

**Test Criteria:**
- [ ] `apps/bingo/src/lib/sync/broadcast.ts` is deleted
- [ ] `apps/trivia/src/lib/sync/broadcast.ts` is deleted
- [ ] All imports now use `@beak/sync`
- [ ] Both apps build successfully
- [ ] Dual-screen sync still works (manual test)

**Commit:** `refactor(sync): T4 - consolidate BroadcastSync to shared package`

**Verify:** `pnpm build`

---

### Task T5: Consolidate Session Utils
**Status:** BLOCKED
**Dependencies:** T4
**Priority:** MEDIUM

**Files:**
- `/Users/j/repos/beak-gaming-platform/packages/sync/src/session.ts`
- Check for duplicates in `apps/*/src/lib/`

**Problem:**
Session utilities may be duplicated across apps similar to BroadcastSync.

**Implementation:**
1. Search for session-related utilities in app `lib/` directories
2. Compare with `packages/sync/src/session.ts`
3. Consolidate any duplicates into the shared package
4. Update imports to use the shared package
5. Delete duplicate files

**Test Criteria:**
- [ ] No duplicate session utilities exist in app directories
- [ ] All session imports use shared package
- [ ] Both apps build successfully

**Commit:** `refactor(sync): T5 - consolidate session utilities to shared package`

**Verify:** `pnpm build`

---

### Task T6: Remove Duplicate Slider
**Status:** READY
**Dependencies:** None
**Priority:** LOW

**Files:**
- DELETE: `/Users/j/repos/beak-gaming-platform/apps/bingo/src/components/ui/Slider.tsx`
- UPDATE: Import references to use `@beak/ui` package

**Problem:**
Bingo app has local Slider component when one exists in shared UI package.

**Implementation:**
1. Verify `@beak/ui` exports a `Slider` component
2. Compare functionality - ensure shared version meets bingo's needs
3. Update all Slider imports in bingo to use `@beak/ui`
4. Delete the local Slider.tsx file
5. Test that slider functionality works correctly

**Test Criteria:**
- [ ] `apps/bingo/src/components/ui/Slider.tsx` is deleted
- [ ] All Slider imports use `@beak/ui`
- [ ] Bingo app builds successfully
- [ ] Slider components render and function correctly

**Commit:** `refactor(bingo): T6 - use shared Slider from @beak/ui`

**Verify:** `cd apps/bingo && pnpm build`

---

### Task T7: Add Error Boundaries
**Status:** READY
**Dependencies:** None
**Priority:** MEDIUM

**Files:**
- CREATE: `/Users/j/repos/beak-gaming-platform/apps/bingo/src/components/ErrorBoundary.tsx`
- CREATE: `/Users/j/repos/beak-gaming-platform/apps/trivia/src/components/ErrorBoundary.tsx`

**Problem:**
Runtime errors crash the entire app instead of showing a friendly error UI.

**Implementation:**
1. Create ErrorBoundary component using React error boundary pattern
2. Show senior-friendly error message (large text, clear instructions)
3. Include "Refresh Page" button with large click target (min 44x44px)
4. Log error details to console for debugging
5. Wrap main app content in error boundary in layout files

**Test Criteria:**
- [ ] ErrorBoundary.tsx exists in both apps
- [ ] Component catches and displays runtime errors gracefully
- [ ] Error UI is senior-friendly (large fonts, clear message)
- [ ] Refresh button works and has adequate click target size
- [ ] Errors are logged to console for debugging

**Commit:** `feat(ui): T7 - add error boundaries to both apps`

**Verify:** `pnpm build`

---

### Task T8: Add ARIA Labels
**Status:** READY
**Dependencies:** None
**Priority:** MEDIUM

**Files:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/components/presenter/*.tsx`
- `/Users/j/repos/beak-gaming-platform/apps/trivia/src/components/presenter/*.tsx`

**Problem:**
Presenter control components lack proper ARIA labels for screen reader accessibility.

**Implementation:**
1. Audit all presenter components for missing ARIA labels
2. Add `aria-label` to all interactive buttons (Roll, Pause, Reset, Undo)
3. Add `aria-describedby` for complex controls with help text
4. Ensure keyboard navigation works correctly
5. Add `role` attributes where semantic HTML is insufficient

**Test Criteria:**
- [ ] All buttons have descriptive aria-labels
- [ ] Screen reader can navigate all presenter controls
- [ ] Keyboard shortcuts are announced (Space=Roll, P=Pause, etc.)
- [ ] No accessibility warnings in browser dev tools

**Commit:** `feat(a11y): T8 - add ARIA labels to presenter components`

**Verify:** `pnpm lint`

---

### Task T9: Add Tests for Fixes
**Status:** BLOCKED
**Dependencies:** T1, T2
**Priority:** HIGH

**Files:**
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/stores/__tests__/audio-store.test.ts`
- `/Users/j/repos/beak-gaming-platform/apps/bingo/src/hooks/__tests__/use-game.test.ts`

**Problem:**
The critical bug fixes in T1 and T2 need test coverage to prevent regression.

**Implementation:**
1. Add tests for audio memory cleanup behavior (T1 fix)
2. Add tests for auto-call race condition prevention (T2 fix)
3. Use vitest and testing-library patterns from existing tests
4. Include edge cases: rapid calls, unmount during playback, etc.
5. Ensure tests are deterministic (no flaky timing issues)

**Test Criteria:**
- [ ] Audio store has test coverage for cleanup behavior
- [ ] use-game hook has test coverage for race condition fix
- [ ] All new tests pass consistently
- [ ] Coverage report shows improved coverage for affected files

**Commit:** `test(bingo): T9 - add tests for audio and auto-call fixes`

**Verify:** `cd apps/bingo && pnpm test:run`

---

## Progress Tracking

| Task | Status | Completed By | Commit SHA |
|------|--------|--------------|------------|
| T1 | READY | - | - |
| T2 | READY | - | - |
| T3 | READY | - | - |
| T4 | READY | - | - |
| T5 | BLOCKED | - | - |
| T6 | READY | - | - |
| T7 | READY | - | - |
| T8 | READY | - | - |
| T9 | BLOCKED | - | - |

---

## Completion

When all tasks are COMPLETE:
1. Update frontmatter `completed_tasks: 9`
2. Create PR from `optimization-features` to `main`
3. Request review
