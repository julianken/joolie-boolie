# Investigation: Area 1 — User-Facing Drift

## Summary
The two apps survived the standalone conversion in relatively clean shape on the user-facing surface. There are **no remaining "sign in / sign up / log out / account" affordances** rendered in either app, no broken links to a removed platform-hub, and both PWA manifests describe the single game they ship. The drift that does remain is concentrated in three small categories: (1) marketing/metadata copy still claiming the apps are "cloud-based" despite localStorage-only persistence, (2) error-state copy that tells users to contact non-existent "staff" or "support", and (3) a brand-framing inconsistency where Bingo's landing page footer reads "Part of Joolie Boolie — games for groups and communities", implying a multi-app product that no longer exists as such. A few cosmetic inconsistencies round out the list (Trivia's `<title>` is "Trivia - Joolie Boolie" while Bingo's is just "Bingo"; Trivia is missing the PWA InstallPrompt that Bingo renders). None of the findings rise to "critical" — nothing is broken, nothing dead-ends in a 404, and there are no orphaned login UIs — but several items would mislead a first-time visitor about what the product actually is.

## Key Findings

### Finding 1: Bingo home page, meta description, and PWA manifest all describe the app as "cloud-based"
- **File:** `apps/bingo/src/app/page.tsx:26`, `apps/bingo/src/app/layout.tsx:20`, `apps/bingo/public/manifest.json:4`
- **Evidence:**
  - `page.tsx:26` — `"A cloud-based, easy-to-use bingo system designed for everyone."`
  - `layout.tsx:20` — `description: "Cloud-based Bingo system for groups and communities"`
  - `manifest.json:4` — `"description": "Cloud-based Bingo system for groups and communities"`
- **Severity:** medium
- **Confidence:** high
- **Impact:** "Cloud-based" implies a cloud backend with accounts, remote sync, or server-side state. After BEA-682–695 the app is a pure client-side PWA with localStorage-only persistence. A visitor reasonably infers they should be able to sign in, sync across devices, or share a game with a server-hosted room — none of which exist. The meta description and manifest description are also shipped to search engines and installed-PWA icons, so the claim persists outside the browser tab.
- **Recommended action:** Replace "cloud-based" with something accurate: "A modern, web-based bingo system" or "A browser-based bingo system" (or simply drop the qualifier). Update all three copies in lockstep so the landing page, `<meta description>`, and PWA manifest stay consistent.

### Finding 2: Bingo and Trivia error pages tell users to "let a staff member know" and "contact support"
- **File:** `apps/bingo/src/app/error.tsx:65`, `apps/bingo/src/app/global-error.tsx:114`, `apps/trivia/src/app/error.tsx:65`, `apps/trivia/src/app/global-error.tsx:114`
- **Evidence:**
  - `error.tsx:65` (bingo + trivia) — `"If this keeps happening, please let a staff member know."`
  - `global-error.tsx:114` (bingo + trivia) — `"If the problem continues, please contact support or try again later."`
- **Severity:** medium
- **Confidence:** high
- **Impact:** A standalone, self-service PWA has no "staff member" and no support channel. These messages were written assuming the apps were deployed at a managed venue (senior-living activity room) with on-site staff. In the standalone context, a user who hits an error is told to contact people who don't exist; the app provides no support email, no help link, no GitHub issues URL. This is actively confusing and also sets an expectation the product cannot meet.
- **Recommended action:** Rewrite both error screens with actions the user can actually take: refresh, clear cache, check network, link to a public issue tracker if there is one, or simply "If this keeps happening, try reloading the page." Remove references to "staff" and "support" unless a real support channel is added.

### Finding 3: Bingo home footer frames the app as "Part of Joolie Boolie"
- **File:** `apps/bingo/src/app/page.tsx:193-196`
- **Evidence:**
  ```
  <p className="text-lg text-muted-foreground">
    Part of <span className="font-semibold">Joolie Boolie</span> — games for groups and communities
  </p>
  ```
- **Severity:** medium
- **Confidence:** high
- **Impact:** "Part of Joolie Boolie" strongly implies a family of apps accessible from a parent hub — exactly the mental model the standalone conversion was meant to delete. The text is not a link, so the user has no way to act on it, but the phrasing sets the expectation that there's a bigger product they're a sub-page of. Compounds with Finding 5 (Trivia's tab title also leans on "Joolie Boolie") to give the appearance of a platform that no longer exists.
- **Recommended action:** Either drop the footer line entirely or rephrase to something brand-neutral like "A modern bingo system for groups and communities." If "Joolie Boolie" is still the umbrella brand and the owner wants to keep cross-promotion, make the link explicit and functional — currently it's neither.

### Finding 4: Bingo home "How It Works" step 1 references the "Play Now" CTA and "Open Display" button with quotes that may go stale
- **File:** `apps/bingo/src/app/page.tsx:143`, `apps/bingo/src/app/page.tsx:155`
- **Evidence:**
  - Line 143 — `Click &quot;Play Now&quot; on your computer to access the game controls.`
  - Line 155 — `Click &quot;Open Display&quot; and move the window to your projector or TV.`
- **Severity:** low
- **Confidence:** high
- **Impact:** Both button labels still match the actual CTA text on the page and on `/play`, so this is currently correct. Flagging only because the "Open Display" text is duplicated here from the presenter view and would silently drift if either is renamed. No user impact today.
- **Recommended action:** No action needed today. Consider extracting button labels to a shared constant if this kind of instructional copy proliferates.

### Finding 5: Metadata title inconsistency between Bingo and Trivia
- **File:** `apps/bingo/src/app/layout.tsx:19`, `apps/trivia/src/app/layout.tsx:20`
- **Evidence:**
  - Bingo — `title: "Bingo"`
  - Trivia — `title: 'Trivia - Joolie Boolie'`
  - PWA manifests agree with their layouts: `apps/bingo/public/manifest.json:2` `"name": "Bingo"` vs `apps/trivia/public/manifest.json:2` `"name": "Trivia - Joolie Boolie"`
- **Severity:** low
- **Confidence:** high
- **Impact:** Browser tab, bookmark, OS task-switcher, and PWA installed name all differ between the two sister apps. Not broken, just asymmetric. Combined with Finding 3, the Trivia tab title is the stronger of the two "Joolie Boolie" footprints — a user who opens both tabs sees one branded as a sub-page of Joolie Boolie and one branded as a standalone product.
- **Recommended action:** Pick one convention across both apps. Two equally defensible options: (a) both use short names — `"Bingo"` and `"Trivia"` — since each is deployed at its own subdomain; or (b) both use `"Bingo - Joolie Boolie"` / `"Trivia - Joolie Boolie"` for SEO. Do not leave them split.

### Finding 6: Trivia landing page has no Statistics section header and minimal copy compared to Bingo
- **File:** `apps/trivia/src/app/page.tsx:1-26`
- **Evidence:** Trivia's `Home` component renders one `<h1>`, one paragraph, one "Play" button, then drops straight into `<StatsDisplay />` with no hero section, no features section, and no "How it works" guidance. Bingo's landing page has 3 sections (`page.tsx:8-127`), 6 feature cards, 4-step walkthrough, footer, and stats. The two landing pages are built to completely different specs.
- **Severity:** low
- **Confidence:** high
- **Impact:** Not a correctness issue — the page works — but a new user landing on trivia gets almost no information about what the product is or how to use it, while a Bingo user gets a polished welcome experience. This asymmetry is not drift-from-platform; it's drift-from-sister-app. Flagged because a user who visits both apps will perceive inconsistent product polish.
- **Recommended action:** Out of scope for this audit; track as a product polish issue. At minimum add 1-2 sentences of "what is this and how do I use it" copy.

### Finding 7: Trivia's display page and audience-scene type reference a "room code" that is never rendered
- **File:** `apps/trivia/src/app/display/page.tsx:150`, `apps/trivia/src/types/audience-scene.ts:33`, `apps/trivia/src/components/audience/scenes/WaitingScene.tsx:25`, `apps/trivia/src/app/globals.css:424`
- **Evidence:**
  - `display/page.tsx:150` — JSDoc: `"Requires a valid session ID or room code in the URL query parameter."`
  - `audience-scene.ts:33` — Type comment: `"Pre-game: breathing wordmark + room code + team roster grid."`
  - `WaitingScene.tsx:25` — JSX comment: `{/* Cinematic waiting display with room code */}`
  - `globals.css:424` — CSS comment: `/* Brand gradient text — wordmark, room code, hero text, "ANSWERS" */`
- **Severity:** low
- **Confidence:** high
- **Impact:** None of these are user-visible strings — they're source-code comments. The WaitingDisplay component (`WaitingDisplay.tsx:21-94`) does not render a room code anywhere; the URL parameter is `?session=<uuid>` only. So a real user never sees "room code" on screen. The risk is cosmetic and forward-looking: the next developer reading these comments may wire up logic against a feature that doesn't exist, and any grep-based audit will flag them as stale. Strictly speaking this overlaps with Area 2/5, but the JSDoc in `display/page.tsx:150` is the nearest thing to user-facing text (it's the module-level contract).
- **Recommended action:** Strip "room code" from all four comment/doc locations; the app has sessions only. If a room code feature is planned, track it as a Linear issue rather than leaving stub comments. Cross-area: primarily Area 5 (doc drift).

### Finding 8: Trivia does not render the PWA InstallPrompt that Bingo does
- **File:** `apps/bingo/src/app/play/page.tsx:367` (`<InstallPrompt appName="Bingo" />`) vs Trivia `apps/trivia/src/app/play/page.tsx` (no import, no usage)
- **Evidence:** `Grep` for `InstallPrompt` across `apps/trivia/src` returns zero matches. `Grep` for `InstallPrompt` in `apps/bingo/src/app/play/page.tsx` returns line 367.
- **Severity:** low
- **Confidence:** high
- **Impact:** Trivia is a PWA (manifest exists, service worker registered in `layout.tsx:56`) but never shows the "Install Trivia" prompt on supported browsers. This is a feature gap / sister-app asymmetry, not drift per se. Noted here because an audit of "what the user sees" should flag that one app offers installation and the other does not despite both being PWAs.
- **Recommended action:** Add `<InstallPrompt appName="Trivia" />` to `apps/trivia/src/app/play/page.tsx` so the two apps have parity. This is code-level; also a cross-area observation for Area 2.

## Surprises
- **There is zero remaining auth UI**. I expected to find at least a stale "Sign In" button component or a ghost route; I found none. The removal was thorough on the user-facing side. The only `login-button` reference in the entire `apps/{bingo,trivia}/src` tree is a **negative test assertion** (`apps/bingo/src/app/__tests__/page.test.tsx:25: "should NOT render a login button"`) — a test that proves the button is gone, which is great.
- **Both not-found pages use only internal routes** (`/`, `/play`, `/display`) and do not reference any removed endpoints like `/hub`, `/auth`, `/api/health`, etc. Very clean.
- **The trivia home page is much less developed than bingo's.** This is unrelated to the standalone conversion, but noticeable on any audit that compares the two apps.
- **Both apps describe themselves as "for groups and communities"** — that framing is accurate for a self-service dual-screen PWA and not drift, but worth mentioning because it's the closest remaining echo of "multi-tenant platform" language and the author may want to revisit whether "for groups" still reads cleanly in a standalone context.

## Unknowns & Gaps
- I did not render the pages in a browser to verify the actual DOM and runtime-generated copy (e.g., toast messages, dynamic status labels). All findings are based on static source inspection. It is possible a dynamic error path shows additional stale copy I missed.
- I did not check `packages/ui/src/**` in depth beyond `install-prompt.tsx` and `service-worker-registration.tsx`. A shared component somewhere (e.g., `Toast`, `Modal`, `ErrorBoundaryProvider`) could still contain a stale "platform" or "sign in" string that bleeds into both apps. If Area 2 finds any, they should be cross-checked against user-facing surfaces.
- I did not audit the shipped service-worker caching manifest at runtime (`/sw.js`). It's possible Serwist is still caching a stale offline fallback that references removed routes.
- The E2E / unit test files contain strings like "Welcome to" and "Sign in" — I filtered these out per area scope, but if any tests **assert against** those strings, the tests themselves would be drift (Area 4's problem, not mine).

## Cross-Area Observations
- **Area 2 (code-level dead weight):** The "room code" comments (Finding 7) are stub documentation for a feature that does not exist in code. There may be unused type discriminants or scene fields still tied to the concept — worth checking in `types/audience-scene.ts` and the scene state machine.
- **Area 2 (code-level dead weight):** Trivia is missing the `InstallPrompt` import + render (Finding 8). Not drift exactly, but asymmetric component usage.
- **Area 5 (docs):** `apps/bingo/CLAUDE.md:7` and `apps/bingo/documentation/mvp_specification.md:5` still describe Bingo as offering "admin accounts for saved configurations." Post-standalone there are no admin accounts. `apps/trivia/documentation/chat_gpt_output_project_idea.md:25` describes Trivia as a "cloud-based Trivia platform" — also stale. These are docs, not user-facing UI, but they tee up new drift if someone copies the wording into user copy.
- **Area 5 (docs):** `apps/trivia/src/app/api/trivia-api/questions/route.ts:4` contains the JSDoc `"Public endpoint (no auth required — supports guest mode)."` The phrase "supports guest mode" is a leftover from the multi-app auth era — after standalone, there is no non-guest mode, so "supports guest mode" is meaningless. Strictly a code comment (not user-facing), but worth flagging.
- **Area 4 (tests):** `apps/bingo/src/app/__tests__/page.test.tsx:25` includes a negative assertion `"should NOT render a login button"` which is load-bearing evidence that the login button was removed. Keep the assertion but the associated test name has become historical.

## Raw Evidence Index

**Files read (full or partial):**
- `docs/post-standalone-audit/context-packets/phase-0-packet.md` (full)
- `apps/bingo/CLAUDE.md` (full)
- `apps/trivia/CLAUDE.md` (full)
- `apps/bingo/src/app/page.tsx` (full, 200 lines)
- `apps/bingo/src/app/layout.tsx` (full, 65 lines)
- `apps/bingo/src/app/error.tsx` (full, 93 lines)
- `apps/bingo/src/app/global-error.tsx` (full, 186 lines)
- `apps/bingo/src/app/not-found.tsx` (full, 91 lines)
- `apps/bingo/src/app/play/page.tsx` (full, 370 lines)
- `apps/bingo/src/app/play/loading.tsx` (full, 146 lines)
- `apps/bingo/src/app/display/page.tsx` (full, 541 lines)
- `apps/bingo/src/app/icon.tsx` (full)
- `apps/bingo/public/manifest.json` (full)
- `apps/bingo/src/components/stats/StatsDisplay.tsx` (full)
- `apps/trivia/src/app/page.tsx` (full, 26 lines)
- `apps/trivia/src/app/layout.tsx` (full, 64 lines)
- `apps/trivia/src/app/error.tsx` (full, 93 lines)
- `apps/trivia/src/app/global-error.tsx` (full, 186 lines)
- `apps/trivia/src/app/not-found.tsx` (full, 91 lines)
- `apps/trivia/src/app/play/page.tsx` (full, 565 lines)
- `apps/trivia/src/app/play/loading.tsx` (full, 194 lines)
- `apps/trivia/src/app/display/page.tsx` (full, 159 lines)
- `apps/trivia/src/app/icon.tsx` (full)
- `apps/trivia/public/manifest.json` (full)
- `apps/trivia/src/components/stats/StatsDisplay.tsx` (full)
- `apps/trivia/src/components/audience/scenes/WaitingScene.tsx` (full)
- `apps/trivia/src/components/audience/WaitingDisplay.tsx` (full)
- `apps/trivia/src/components/presenter/SetupGate.tsx` (partial, lines 1-170)
- `apps/trivia/src/components/presenter/TriviaApiImporter.tsx` (lines 400-420)
- `apps/trivia/src/types/audience-scene.ts` (lines 25-40)
- `apps/trivia/src/app/globals.css` (lines 415-445)
- `apps/trivia/src/app/api/trivia-api/questions/route.ts` (lines 1-20)
- `packages/ui/src/install-prompt.tsx` (full)
- `packages/ui/src/service-worker-registration.tsx` (full)

**Grep queries run (all scoped to `apps/{bingo,trivia}/src`, case-insensitive):**
- `sign.?in|sign.?up|log.?in|log.?out|logout|welcome back|welcome to` → only test assertions, no live UI
- `account|platform|invite|dashboard|profile|avatar` → one match in `TriviaApiImporter.tsx:408` ("no account required" describing the external Trivia API, not a Joolie Boolie account — legitimate usage)
- `Joolie Boolie Platform|joolie.boolie.platform|platform-hub|beak.gaming|beak gaming` → zero matches
- `room code|roomCode|room.?Code` → 4 matches, all code comments (Finding 7)
- `host|join|connect.*?(to|with)|share.*?(link|game)|guests?` → one real match: `route.ts:4` "supports guest mode" (comment only)
- `team.code|team.join|join.*code|enter.*?code|waiting room|session.*?invite|host.*?code` → zero matches
- `staff member|admin|administrator|support.*?team|contact.*?support` → 4 matches, all in error.tsx / global-error.tsx (Finding 2)
- `You are|Your account|Your profile|Your games|Your library|Your team` → zero matches (one in historical docs only)
- `saved to your|synced across|your devices|cloud sync|your cloud` → zero matches
- `cloud-based` → Finding 1 (3 user-facing instances) + historical docs
- `platform|auth|login|sign.?in|logout` in globals.css → zero matches
- `Bingo.*?Trivia|Trivia.*?Bingo|other game|choose.*?game|switch.*?game|game.*?hub` → zero cross-app references
- `another game|return to platform|all games|game library|back to hub` → zero matches
- `InstallPrompt` in `apps/trivia/src` → zero matches (Finding 8)
- `openGraph|og:|twitter:card|twitter:title|ogImage` → zero matches (apps do not ship OG metadata)

**Glob queries run:**
- `apps/{bingo,trivia}/**/manifest.{ts,tsx,js,json}` → both `public/manifest.json` files, plus `apps/bingo/public/audio/voices/manifest.json` (not user-facing)
- `apps/{bingo,trivia}/**/{robots,sitemap}.{ts,tsx,js,xml,txt}` → none exist
- `apps/bingo/src/components/stats/**`, `apps/trivia/src/components/stats/**` → StatsDisplay files
- `apps/trivia/src/components/presenter/SetupGate.tsx` → confirmed exists
