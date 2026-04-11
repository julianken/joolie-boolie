# Iteration: Dead Types & Dead Exports Cleanup Map

## Assignment

Produce a complete, authoritative delete list for all dead type exports across the repo, deepening the Phase 1 findings (F5, F6, F13) into a fully enumerated, grep-verified cleanup map. Scope: `packages/types`, `apps/bingo/src/types/`, `apps/trivia/src/types/`, `packages/testing/src/mocks/`, `packages/error-tracking/`, and all 8 active package barrel files.

---

## Survey: packages/types/

Source files in `packages/types/src/`: `api.ts`, `branded.ts`, `game.ts`, `index.ts`, `sync.ts`, `user.ts`

### user.ts (lines 1–92)

| Export | Declared at | Imported by | Classification |
|--------|-------------|-------------|----------------|
| `User` | user.ts:14–23 | None in live source (README only) | DELETE |
| `UserProfile` | user.ts:28–35 | None | DELETE |
| `LoginRequest` | user.ts:44–47 | None | DELETE |
| `RegisterRequest` | user.ts:52–57 | None | DELETE |
| `AuthResponse` | user.ts:62–65 | None | DELETE |
| `UpdateProfileRequest` | user.ts:70–74 | None | DELETE |
| `Session` | user.ts:83–92 | None | DELETE |

**Grep evidence**: `git grep -rn "from '@joolie-boolie/types'" apps/ packages/` returns only `packages/ui/src` (3 hits, all `ThemeMode`) and `packages/types/README.md` (documentation examples). Zero source-file imports of any `user.ts` export. The `User` type's comment still reads "UUID from Supabase Auth" confirming auth-era origin.

**Internal dependency**: `UserProfile` extends `Timestamps` (imported from `game.ts`). Once `user.ts` is deleted, `Timestamps` loses its only consumer (see `game.ts` analysis below).

### api.ts (lines 1–143)

| Export | Declared at | Imported by | Classification |
|--------|-------------|-------------|----------------|
| `ApiResponse<T>` | api.ts:30–35 | None in live source | DELETE |
| `PaginatedResponse<T>` | api.ts:52–63 | None in live source | DELETE |
| `PaginationParams` | api.ts:72–77 | None | DELETE |
| `SortDirection` | api.ts:82 | None | DELETE |
| `SortParams<T>` | api.ts:87–92 | None | DELETE |
| `ListParams<T>` | api.ts:97–99 | None | DELETE |
| `ApiError` | api.ts:108–117 | None | DELETE |
| `ApiErrorCode` | api.ts:122–129 | None | DELETE |
| `RequestMetadata` | api.ts:138–143 | None | DELETE |

**Grep evidence**: `git grep -rn "ApiResponse\|PaginatedResponse\|PaginationParams\|SortDirection\|SortParams\|ListParams\|ApiError\b\|ApiErrorCode\|RequestMetadata" apps/ packages/` — the only hits outside `packages/types/src/api.ts` are `apps/bingo/src/types/index.ts:296,301` which define their own local `ApiResponse<T>` and `PaginatedResponse<T>` (separate declarations, not imports — also dead, covered below).

### game.ts — partial deletion

| Export | Declared at | Imported by | Classification |
|--------|-------------|-------------|----------------|
| `GameStatus` | game.ts:16 | `apps/bingo/src/types/index.ts` (re-exported via `@joolie-boolie/game-stats`) | KEEP |
| `TriviaGameStatus` | game.ts:21 | None in live source (both apps define own status types) | DELETE |
| `GameType` | game.ts:30 | None | DELETE |
| `GAME_TYPE_NAMES` | game.ts:35–38 | None | DELETE |
| `GameSession` | game.ts:44–59 | None | DELETE |
| `ThemeMode` | game.ts:68 | `packages/ui/src/hooks/use-theme.ts:4`, `packages/ui/src/theme-selector.tsx:4`, `packages/ui/src/__tests__/theme-selector.test.tsx:4` | KEEP |
| `ColorTheme` | game.ts:73–83 | None | DELETE |
| `Timestamps` | game.ts:92–97 | `packages/types/src/user.ts:5,28` only (dead file) | DELETE-AFTER-REMOVING-CONSUMER |

**Key note on `GameStatus`**: Bingo imports `GameStatus` from `@joolie-boolie/game-stats` (via `apps/bingo/src/types/index.ts:2`), not from `@joolie-boolie/types`. The `GameStatus` export in `game.ts` of the `types` package is never consumed directly — Trivia defines its own 5-state variant locally. However, `GameStatus` is re-exported from `packages/types/src/index.ts:25` and could represent future value. Since bingo already imports it from `game-stats`, the `game.ts` re-export in `packages/types` is also dead. Decision: DELETE from `packages/types` barrel and `game.ts` (consumers use `@joolie-boolie/game-stats` directly).

**Grep evidence for `TriviaGameStatus`**: `git grep -rn "TriviaGameStatus" apps/ packages/ 2>/dev/null | grep -v packages/types` → zero hits. Trivia defines `GameStatus = 'setup' | 'playing' | 'between_rounds' | 'ended'` locally in `apps/trivia/src/types/index.ts:106`.

**Grep evidence for `ColorTheme`**: `git grep -rn "ColorTheme" apps/ packages/ 2>/dev/null | grep -v packages/types` → zero hits.

**Grep evidence for `Timestamps`**: `git grep -rn "Timestamps" apps/ packages/ 2>/dev/null | grep "\.ts\|\.tsx"` → three hits, all in `packages/types/src/` only (`game.ts:92`, `index.ts:31`, `user.ts:5,28`). Zero external consumers.

### index.ts — barrel changes required

The barrel file (`packages/types/src/index.ts`) currently re-exports the following dead surfaces:

- **Lines 24–34** (GAME TYPES block): `GameStatus`, `TriviaGameStatus`, `GameType`, `GameSession`, `ThemeMode`, `ColorTheme`, `Timestamps` from `./game` — plus `GAME_TYPE_NAMES`. Of these, only `ThemeMode` has live consumers. After deletion, only `ThemeMode` should remain in this export block.
- **Lines 38–48** (USER TYPES block): `User`, `UserProfile`, `LoginRequest`, `RegisterRequest`, `AuthResponse`, `UpdateProfileRequest`, `Session` — entire block deleted.
- **Lines 52–64** (API TYPES block): all 9 exports — entire block deleted.
- **Lines 6–17** (JSDoc module comment): references `GameSession`, `User`, `ApiResponse` as examples — rewrite to only mention live exports.

**SYNC TYPES block (lines 68–77)** and **BRANDED TYPES block (lines 81–94)** are untouched — live consumers in `packages/sync` and `apps/bingo/src/types/`, `apps/trivia/src/types/` respectively.

### branded.ts — no changes

All exports (`Branded`, `TeamId`, `QuestionId`, `BallNumber`, `makeTeamId`, `makeQuestionId`, `makeBallNumber`) are consumed: `apps/bingo/src/types/index.ts:1` and `apps/trivia/src/types/index.ts:2–3`.

### sync.ts — no changes

Exports re-export types for convenience but apps consume sync types from `@joolie-boolie/sync` directly. No dead exports detected. The `SyncRole`, `ConnectionState`, `SyncMessage` etc. defined here are NOT imported via `@joolie-boolie/types` anywhere — `git grep -rn "SyncRole\|ConnectionState\|BaseSyncMessageType\|BaseSyncState\|ThemeSyncPayload" apps/ packages/ 2>/dev/null | grep "from '@joolie-boolie/types'"` returns zero hits. However, this is not a deletion target — it's an unused convenience layer. The file itself does no harm. Flagging for future consideration but NOT including in this delete list.

---

## Survey: apps/bingo/src/types/

File: `apps/bingo/src/types/index.ts` (307 lines total)

| Export | Declared at | Imported by | Classification |
|--------|-------------|-------------|----------------|
| `BingoColumn` | line 5 | `apps/bingo/src/**` (live) | KEEP |
| `BallNumber` | line 11 | `apps/bingo/src/**` (live) | KEEP |
| `BingoBall` | lines 14–18 | `apps/bingo/src/**` (live) | KEEP |
| `GameStatus` | line 21 | `apps/bingo/src/**` (live) | KEEP |
| `GameState` | lines 23–33 | `apps/bingo/src/**` (live) | KEEP |
| `PatternCell`, `BingoPattern`, `PatternCategory` | lines 36–57 | live | KEEP |
| `GameTemplate` | lines 60–68 | live | KEEP |
| `VoicePackId`, `VoicePackMetadata`, `VoiceManifest` | lines 72–86 | live | KEEP |
| `AudioState` | lines 89–96 | live | KEEP |
| `ThemeMode` | line 99 | live (local re-export) | KEEP |
| `SyncMessageType`, `AudioSettingsPayload`, `ThemePayload` | lines 102–130 | live | KEEP |
| `SyncMessageBase`, `BingoSyncMessage`, `SyncMessage` | lines 133–162 | live | KEEP |
| `BallDeck`, `DrawResult` | lines 165–174 | live | KEEP |
| `COLUMN_RANGES`, `COLUMNS` | lines 177–185 | live | KEEP |
| `RollSoundType`, `RollDuration`, `RollSoundConfig`, `ROLL_SOUND_OPTIONS` | lines 188–201 | live | KEEP |
| `RevealChimeType`, `REVEAL_CHIME_OPTIONS` | lines 204–210 | live | KEEP |
| **`BingoGameSessionStatus`** | **line 216** | **zero consumers in bingo src** | **DELETE** |
| **`BingoGameSession`** | **lines 218–230** | **zero consumers in bingo src** | **DELETE** |
| **`CreateBingoGameRequest`** | **lines 232–237** | **zero consumers in bingo src** | **DELETE** |
| **`UpdateBingoGameRequest`** | **lines 239–248** | **zero consumers in bingo src** | **DELETE** |
| **`BingoSessionWinner`** | **lines 257–260** | **zero consumers in bingo src** | **DELETE** |
| **`BingoSession`** | **lines 266–278** | **zero consumers in bingo src** | **DELETE** |
| **`CreateBingoSessionRequest`** | **lines 280–284** | **zero consumers in bingo src** | **DELETE** |
| **`UpdateBingoSessionRequest`** | **lines 286–290** | **zero consumers in bingo src** | **DELETE** |
| **`ApiResponse<T>`** | **lines 296–299** | **zero consumers in bingo src** | **DELETE** |
| **`PaginatedResponse<T>`** | **lines 301–307** | **zero consumers in bingo src** | **DELETE** |

**Grep evidence**: `git grep -n "BingoSession\|CreateBingoSessionRequest\|UpdateBingoSessionRequest\|BingoGameSession\|CreateBingoGameRequest\|UpdateBingoGameRequest\|BingoGameSessionStatus\|BingoSessionWinner" apps/bingo/src/ | grep -v apps/bingo/src/types/index.ts` → zero hits. `git grep -n "ApiResponse\|PaginatedResponse" apps/bingo/src/ | grep -v apps/bingo/src/types/index.ts` → zero hits.

The section header comments at lines 212 ("GAME SESSION TYPES (API)"), 253 ("SESSION HISTORY TYPES (API)"), and 292 ("API RESPONSE TYPES") should also be removed.

---

## Survey: apps/trivia/src/types/

File: `apps/trivia/src/types/index.ts` — all exports are live. The file imports from `@joolie-boolie/types/branded` (kept) and from local submodules `./guards` and `./audience-scene` (both live).

No dead exports found in trivia's type module. This is consistent with Phase 1 not flagging trivia types.

---

## Survey: packages/testing/src/mocks/

Files present: `audio.ts`, `broadcast-channel.ts`, `index.ts`, `otel.ts`, `sentry.ts`

**No Supabase mock source file exists.** There is no `supabase.ts`, `user.ts`, or auth-related file in `packages/testing/src/mocks/`.

**Grep evidence**: `git grep -rn "supabase\|createMockUser\|createMockSession\|createMockSupabase" packages/testing/src/` → zero hits in source files.

The `sentry.ts` mock uses `setUser` (a Sentry API method), which is unrelated to application-level auth. The `setUser` calls mock Sentry's own user context API — this is correct and should be kept.

**Conclusion for testing package**: No source deletions required. The dead content is purely in `packages/testing/README.md` (documentation drift, not in scope for this iterator).

---

## Survey: packages/error-tracking/

**File: `packages/error-tracking/src/server.ts`**

Two dead string matchers in `categorizeError()` at lines 110 and 125–126:

| Location | Dead content | Recommendation |
|----------|--------------|----------------|
| Line 90 (comment) | `jwt, postgres, supabase, etc.` | Update comment |
| Line 110 | `message.includes('jwt')` | DELETE matcher line |
| Lines 125–126 | `message.includes('postgres')` and `message.includes('supabase')` | DELETE both lines |

**Impact**: The `'auth'` and `'storage'` categories will still fire for `unauthorized`, `forbidden`, `authentication`, `database`, and `query` matches — all of which can genuinely occur in the trivia API proxy route. The `jwt`, `postgres`, and `supabase` substrings can never match in the current codebase since no code generates errors with those substrings. Removing them is a pure cleanup with no behavioral change for live error flows.

**Barrel file**: `packages/error-tracking/src/index.ts` exports `AppError`, `ErrorBoundary`, `ErrorDisplay`, logger utilities. None of these reference auth concepts. No changes needed.

---

## Survey: other packages' barrel files

| Barrel | Auth/dead exports found | Action |
|--------|------------------------|--------|
| `packages/audio/src/index.ts` | None | No change |
| `packages/error-tracking/src/index.ts` | None | No change |
| `packages/game-stats/src/index.ts` | None | No change |
| `packages/sync/src/index.ts` | None | No change |
| `packages/testing/src/index.ts` | None | No change |
| `packages/theme/src/index.ts` | None (owns its own `ThemeMode` inline) | No change |
| `packages/types/src/index.ts` | 3 dead sections (user, api, partial game) | Trim — see delete list |
| `packages/ui/src/index.ts` | None | No change |

---

## Dependency Chain Analysis

The dead types form two dependency chains:

**Chain A — user.ts internal:**
```
Timestamps (game.ts) ← UserProfile (user.ts)
User (user.ts) ← AuthResponse (user.ts)
User (user.ts) ← Session (user.ts)
User (user.ts) ← UserProfile (user.ts)
```
`Timestamps` is used only by `UserProfile`. Once `user.ts` is deleted, `Timestamps` has zero consumers anywhere in the repo, making it safe to delete from `game.ts` and remove from `index.ts`.

**Chain B — game.ts dead cluster:**
```
GameStatus (game.ts) ← GameSession (game.ts) [via status field]
GameType (game.ts) ← GAME_TYPE_NAMES (game.ts) [via Record<GameType,...>]
```
`GameSession` references `GameStatus` but `GameStatus` itself has live consumers (bingo imports it from `@joolie-boolie/game-stats`). The deletion order is: delete `GameSession` first (the consumer of `GameStatus`), which leaves `GameStatus` still valid. Then separately assess `GameStatus` re-export from `packages/types` — since bingo and trivia never import `GameStatus` from `@joolie-boolie/types`, deleting the `packages/types` re-export of `GameStatus` is safe.

**Chain C — bingo/src/types local cluster:**
```
BingoSession ← BingoSessionWinner [via winner field]
CreateBingoSessionRequest ← no cross-references to live types
UpdateBingoSessionRequest ← BingoSessionWinner [via winner field]
BingoGameSession ← BingoGameSessionStatus [via status field]
CreateBingoGameRequest ← no cross-references to live types
UpdateBingoGameRequest ← BingoGameSessionStatus [via status field]
```
All types in Chain C are dead as a group. None are imported outside the type file. All can be deleted simultaneously.

---

## Final Delete List (Ordered)

The ordering is topologically sorted: delete consuming types before the types they depend on.

### Step 1 — apps/bingo/src/types/index.ts (lines 212–307)

- DELETE lines 212–307: the entire "GAME SESSION TYPES (API)", "SESSION HISTORY TYPES (API)", and "API RESPONSE TYPES" sections
- Specific types removed: `BingoGameSessionStatus`, `BingoGameSession`, `CreateBingoGameRequest`, `UpdateBingoGameRequest`, `BingoSessionWinner`, `BingoSession`, `CreateBingoSessionRequest`, `UpdateBingoSessionRequest`, `ApiResponse<T>`, `PaginatedResponse<T>`
- No barrel file changes needed (app-local types file)
- Consumers to update: none (verified zero imports)
- Line savings: ~96 lines

### Step 2 — packages/types/src/user.ts

- DELETE ENTIRE FILE (lines 1–92)
- Affected barrel: `packages/types/src/index.ts` lines 38–48 — remove entire USER TYPES re-export block (9 lines)
- Consumers to update: none (verified zero imports from any live source file)
- Line savings: 92 lines (file) + 11 lines (barrel block) = 103 lines

### Step 3 — packages/types/src/api.ts

- DELETE ENTIRE FILE (lines 1–143)
- Affected barrel: `packages/types/src/index.ts` lines 52–64 — remove entire API TYPES re-export block (13 lines)
- Consumers to update: none (verified zero imports)
- Line savings: 143 lines (file) + 13 lines (barrel block) = 156 lines

### Step 4 — packages/types/src/game.ts (partial)

Remove the following dead exports from `game.ts`:

- **DELETE** `TriviaGameStatus` (line 21)
- **DELETE** `GameType` (line 30)
- **DELETE** `GAME_TYPE_NAMES` (lines 35–38, including the `satisfies` expression)
- **DELETE** `GameSession` interface (lines 44–59, including the section comment header at 42–43)
- **DELETE** `ColorTheme` type (lines 73–83, including comment)
- **DELETE** `Timestamps` interface (lines 90–97, including comment) — safe to delete because `UserProfile` (its only consumer) is deleted in Step 2

Also **DELETE** `GameStatus` re-export from game.ts (line 16) since no package consumes it via `@joolie-boolie/types`.

**KEEP**: `ThemeMode` (line 68) — consumed by `packages/ui/src/hooks/use-theme.ts`, `packages/ui/src/theme-selector.tsx`, and their tests via `from '@joolie-boolie/types'`.

- Affected barrel: `packages/types/src/index.ts` lines 24–34 — the GAME TYPES re-export block should be reduced to export only `ThemeMode from './game'`. Remove `GameStatus`, `TriviaGameStatus`, `GameType`, `GameSession`, `ColorTheme`, `Timestamps`, and `GAME_TYPE_NAMES { GAME_TYPE_NAMES }`.
- Line savings: ~30 lines from `game.ts` + ~12 lines from barrel = 42 lines

### Step 5 — packages/types/src/index.ts (JSDoc header)

- UPDATE lines 6–17: the module-level JSDoc comment lists `GameSession`, `User`, `ApiResponse` as example imports. Rewrite to only document live exports (`ThemeMode`, `SyncMessage`, `TeamId`, `QuestionId`, `BallNumber`).
- Line savings: ~4 lines (net, rewrite not pure deletion)

### Step 6 — packages/error-tracking/src/server.ts (minor cleanup)

- DELETE line 110: `message.includes('jwt')`
- DELETE lines 125–126: `message.includes('postgres')` and `message.includes('supabase')`
- UPDATE line 90 (comment): remove `jwt, postgres, supabase, etc.` from the comment
- The surrounding `if` blocks remain valid: `'auth'` still catches `unauthorized`/`forbidden`/`authentication`; `'storage'` still catches `database`/`query`
- Line savings: 3 lines

---

## Verification Commands

After applying all deletions, the following commands verify zero regressions:

**1. Confirm no dangling imports of deleted types:**
```bash
git grep -rn "User\b\|UserProfile\|LoginRequest\|RegisterRequest\|AuthResponse\|UpdateProfileRequest\b" \
  apps/ packages/ \
  | grep -v "README\|CLAUDE\|\.md\|comment\|setUser\|ErrorUser\|userMessage\|userAction\|\.env"
```
Expected result: zero output (or only comments/env files).

**2. Confirm no dangling imports of deleted API types:**
```bash
git grep -rn "from '@joolie-boolie/types'" apps/ packages/ \
  | grep -v "ThemeMode\|SyncRole\|SyncMessage\|ConnectionState\|BaseSyncMessageType\|ThemeSyncPayload\|BaseSyncState\|Branded\|TeamId\|QuestionId\|BallNumber\|makeTeamId\|makeQuestionId\|makeBallNumber\|README\|\.md"
```
Expected result: zero output (every remaining import from `@joolie-boolie/types` should be `ThemeMode` or a branded type).

**3. Confirm no dangling game type imports:**
```bash
git grep -rn "GameSession\b\|GameType\b\|GAME_TYPE_NAMES\|TriviaGameStatus\|ColorTheme\|Timestamps\b" \
  apps/ packages/ \
  | grep -v "packages/types/src/game.ts\|README\|\.md"
```
Expected result: zero output.

**4. Confirm no dangling bingo local type imports:**
```bash
git grep -rn "BingoSession\b\|CreateBingoSessionRequest\|UpdateBingoSessionRequest\|BingoGameSession\b\|ApiResponse\b\|PaginatedResponse\b" \
  apps/bingo/src/ \
  | grep -v "apps/bingo/src/types/index.ts"
```
Expected result: zero output.

**5. Typecheck passes:**
```bash
pnpm typecheck
```
Expected result: zero errors.

---

## Line Savings Estimate

| Change | Lines removed |
|--------|--------------|
| `apps/bingo/src/types/index.ts` lines 212–307 | 96 |
| `packages/types/src/user.ts` — delete entire file | 92 |
| `packages/types/src/index.ts` — USER TYPES block (lines 38–48) | 11 |
| `packages/types/src/api.ts` — delete entire file | 143 |
| `packages/types/src/index.ts` — API TYPES block (lines 52–64) | 13 |
| `packages/types/src/game.ts` — partial deletion (~30 lines) | 30 |
| `packages/types/src/index.ts` — GAME TYPES block (lines 24–34, reduce to 1 export) | 12 |
| `packages/types/src/index.ts` — JSDoc header (rewrite, net –4) | 4 |
| `packages/error-tracking/src/server.ts` — 3 dead lines | 3 |
| **Total** | **~404 lines** |

The two deleted files (`user.ts` at 92 lines, `api.ts` at 143 lines) account for 235 lines by themselves.

---

## Resolved Questions

1. **Is `Timestamps` safe to delete?** Yes. Its only consumer is `UserProfile` in `user.ts` (which is deleted in Step 2). No external file imports `Timestamps` — confirmed by `git grep -rn "Timestamps" apps/ packages/ | grep "\.ts\|\.tsx"` returning only `packages/types/src/` files.

2. **Is `ThemeMode` in game.ts a live dependency?** Yes — `packages/ui/src/hooks/use-theme.ts` imports `ThemeMode` directly from `@joolie-boolie/types`. This is a real consumer. `ThemeMode` must be retained in `game.ts` and re-exported from `index.ts`.

3. **Does `packages/ui` re-export `ThemeMode` downstream?** `packages/ui/src/index.ts` does not re-export `ThemeMode`, so there is no second-order consumer to worry about.

4. **Are the bingo local `BingoGameSession`/`BingoSession` clusters used anywhere?** Confirmed zero — `git grep` of all type names against `apps/bingo/src/` excluding the type file itself returns zero hits.

5. **Does testing/src/mocks/ contain any Supabase source?** No. Five files exist: `audio.ts`, `broadcast-channel.ts`, `index.ts`, `otel.ts`, `sentry.ts`. None reference `supabase`, `User`, `Session`, or auth. The README drift is a documentation problem, not a source problem.

---

## Remaining Unknowns

1. **`packages/types/src/sync.ts` is a convenience re-export layer that is never consumed via `@joolie-boolie/types`.** Apps import sync types directly from `@joolie-boolie/sync`. This makes `sync.ts` a dead module in practice, but it is not harmful. Not included in this delete list since it requires a broader audit of whether `@joolie-boolie/types` is intended to aggregate all shared types. Flagged for a future cleanup pass.

2. **`GameStatus` in `packages/types/src/game.ts` is technically never imported via `@joolie-boolie/types`.** Bingo imports it from `@joolie-boolie/game-stats`. The `packages/types` re-export is dead. This is included in Step 4 above but should be confirmed against any future type consumers before applying.

---

## Revised Understanding

Phase 1 (F5, F6, F13) correctly identified the primary targets. This analysis deepens the picture in three ways:

1. **`Timestamps` is a dependent dead type** not called out by Phase 1. It only lives because `UserProfile` uses it. Once `user.ts` is deleted, `Timestamps` becomes an orphan and should be removed from `game.ts` as well.

2. **The bingo type file has a larger dead surface than F13 described.** F13 focused on `BingoSession`/`CreateBingoSessionRequest`/`UpdateBingoSessionRequest` and their `userId` fields. The full dead cluster extends to `BingoGameSession`, `CreateBingoGameRequest`, `UpdateBingoGameRequest`, `BingoGameSessionStatus`, `BingoSessionWinner`, plus local `ApiResponse<T>` and `PaginatedResponse<T>` — 10 dead exports in total across 96 lines.

3. **`TriviaGameStatus` and `ColorTheme` are dead in `packages/types/src/game.ts`** but were not named in F6. Neither is imported by any consumer. Both can be removed as part of Step 4.
