# Bingo Platform - MVP Specification

## Overview

A cloud-based, web-accessible Bingo system designed for groups and communities. Replaces USB-based solutions like Game Show Mania ($395) with a modern PWA that works offline, supports dual-screen presentation, and provides admin accounts for saved configurations.

**Target User:** Activity directors and presenters at groups and communities

**Primary Differentiators vs. Free Alternatives (Let's Play Bingo):**
- Dual-screen support (presenter controls + audience display)
- Admin accounts with saved templates
- Facility branding (logo, custom titles)
- Pre-recorded professional audio
- Purpose-built for senior living use case
- Reliable support

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Frontend | React + Tailwind CSS |
| Backend (BFF) | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (via BFF) |
| Audio | Pre-recorded (AI-generated via ElevenLabs or similar) |
| Offline | PWA with Service Worker |
| Hosting | Vercel (or similar) |

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  React Frontend │ ──────► │  API Routes     │
│  (Next.js App)  │         │  (BFF Layer)    │
│                 │         │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │    Supabase     │
                            │  (PostgreSQL +  │
                            │     Auth)       │
                            │                 │
                            └─────────────────┘
```

Frontend never talks directly to Supabase. All requests go through API routes.

---

## Core Features

### 1. Dual-Screen System

**Presenter Window (Controls):**
- Game controls (start, pause, call next, reset)
- Pattern selector
- Speed control slider
- Audio toggle
- Current ball + call history (compact view)
- "Open Audience Display" button

**Audience Window (Projection):**
- Large current ball display
- Full bingo board (5x15 grid) with called numbers highlighted
- Current winning pattern display
- Clean, distraction-free UI
- Optimized for projector/large TV

**Sync Mechanism:**
- BroadcastChannel API for same-device window communication
- State changes in presenter window instantly reflected in audience window
- Graceful handling if audience window closed/reopened

---

### 2. Game Mechanics

**Bingo Format:**
- Standard 75-ball (B:1-15, I:16-30, N:31-45, G:46-60, O:61-75)
- Free space in center

**Calling Modes:**
- **Auto-call:** Configurable delay (5-30 seconds)
- **Manual:** Click/button to call next number

**Controls:**
- Start new game
- Call next number
- Pause/resume auto-call
- Undo last call (mistakes happen)
- Reset game (with confirmation)

**Display:**
- Current ball (large, prominent)
- Previous ball
- Total balls called
- Called numbers board (5x15 grid)
- Call history list

---

### 3. Pattern System

**MVP Patterns (15-20 core):**

| Category | Patterns |
|----------|----------|
| Lines | Horizontal, Vertical, Diagonal, Any Line |
| Corners | Four Corners |
| Frames | Small Frame, Large Frame |
| Shapes | Letter X, Diamond, Heart, Cross/Plus |
| Letters | Letter T, Letter L |
| Coverage | Postage Stamp (2x2), Blackout/Coverall |
| Combo | Corners + Line |

**Pattern Features:**
- Visual display of winning pattern
- Pattern selection dropdown (searchable)
- Pattern shown on both presenter and audience screens

**Post-MVP:**
- Custom pattern editor
- Save favorite patterns
- More patterns (50+)

---

### 4. Audio System

**Pre-recorded Audio Files:**
- 75 number calls: "B-1" through "O-75"
- Game sounds: start chime, winner celebration (optional)

**Audio Source:**
- AI-generated TTS (ElevenLabs or similar)
- Clear, professional voice
- Consistent quality across all numbers

**Controls:**
- Master volume control
- Mute toggle
- Audio plays on presenter device (routes to room speakers via HDMI/aux)

**Offline:**
- All audio files cached by service worker
- Works fully offline after first load

---

### 5. Admin Accounts

**Authentication (via BFF → Supabase Auth):**
- Email + password registration
- Login / logout
- Password reset flow
- Session persistence (cookies/tokens)

**Saved Data:**

```
User Profile:
├── Facility name
├── Logo (uploaded image)
└── Default game title

Saved Templates:
├── Template name ("Tuesday Night Bingo")
├── Selected pattern
├── Auto-call speed
├── Audio on/off
└── Is default (auto-load on login)
```

**Features:**
- Save current settings as template
- Load template
- Set default template
- Multiple templates per account

**Branding:**
- Upload facility logo (displayed on audience screen)
- Custom game title (displayed during games)

---

### 6. Offline Support (PWA)

**Service Worker Caching:**
- All application code (Next.js static export or appropriate caching)
- All audio files
- Logo/images

**Offline Behavior:**
- Full game functionality works offline
- Templates loaded from local cache
- Sync when back online (if changes made)

**Install:**
- "Add to Home Screen" prompt
- Works as standalone app

---

## API Routes (BFF Layer)

```
/api/auth/register     POST    Create new account
/api/auth/login        POST    Login, return session
/api/auth/logout       POST    End session
/api/auth/me           GET     Get current user
/api/auth/reset        POST    Request password reset

/api/profile           GET     Get user profile
/api/profile           PATCH   Update profile (facility name, logo, etc.)
/api/profile/logo      POST    Upload logo image

/api/templates         GET     List user's templates
/api/templates         POST    Create new template
/api/templates/:id     GET     Get specific template
/api/templates/:id     PATCH   Update template
/api/templates/:id     DELETE  Delete template
```

---

## Data Model (Supabase PostgreSQL)

```sql
-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  facility_name text,
  logo_url text,
  default_game_title text default 'Bingo Night',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saved game templates
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  pattern_id text not null,
  auto_call_speed integer default 10,
  audio_enabled boolean default true,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security (accessed via service role in API routes)
alter table public.profiles enable row level security;
alter table public.templates enable row level security;

-- Policies (API routes use service role, but these provide defense in depth)
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view own templates"
  on public.templates for select using (auth.uid() = user_id);

create policy "Users can manage own templates"
  on public.templates for all using (auth.uid() = user_id);
```

---

## Project Structure

```
bingo-project/
├── documentation/                 # Project docs
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing/home
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Template management
│   │   ├── play/
│   │   │   └── page.tsx          # Presenter view
│   │   ├── display/
│   │   │   └── page.tsx          # Audience view
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── me/route.ts
│   │       │   └── reset/route.ts
│   │       ├── profile/
│   │       │   ├── route.ts
│   │       │   └── logo/route.ts
│   │       └── templates/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   ├── components/
│   │   ├── presenter/            # Presenter window components
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── PatternSelector.tsx
│   │   │   ├── SpeedControl.tsx
│   │   │   └── CallHistory.tsx
│   │   ├── audience/             # Audience display components
│   │   │   ├── CurrentBall.tsx
│   │   │   ├── BingoBoard.tsx
│   │   │   └── PatternDisplay.tsx
│   │   ├── auth/                 # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── ui/                   # Shared UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client (if needed)
│   │   │   └── server.ts         # Server-side client (API routes)
│   │   ├── game/
│   │   │   ├── engine.ts         # Game logic
│   │   │   └── patterns.ts       # Pattern definitions
│   │   ├── audio/
│   │   │   └── player.ts         # Audio playback logic
│   │   └── sync/
│   │       └── broadcast.ts      # BroadcastChannel wrapper
│   ├── hooks/
│   │   ├── useGame.ts            # Game state hook
│   │   ├── useAudio.ts           # Audio control hook
│   │   ├── useSync.ts            # Window sync hook
│   │   └── useAuth.ts            # Auth state hook
│   ├── contexts/
│   │   ├── GameContext.tsx
│   │   └── AuthContext.tsx
│   └── types/
│       └── index.ts              # TypeScript types
├── public/
│   ├── audio/                    # Pre-recorded number calls
│   │   ├── b-1.mp3
│   │   ├── b-2.mp3
│   │   └── ... (75 files)
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # PWA icons
├── supabase/
│   └── migrations/               # Database migrations
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## UI/UX Requirements

**Accessible Design:**
- Large fonts (minimum 18px body, larger for game displays)
- High contrast (dark text on light backgrounds, or vice versa)
- Large click targets (minimum 44x44px buttons)
- Simple, uncluttered layouts
- Clear visual hierarchy

**Presenter Interface:**
- Dashboard-style layout
- All controls visible without scrolling
- Clear labeling
- Keyboard shortcuts for common actions (space = call next, etc.)

**Audience Display:**
- Maximum readability at distance
- Current ball: very large (readable from back of room)
- Board: clear grid, obvious which numbers called
- Minimal UI chrome

**Responsive:**
- Presenter: optimized for laptop (1280x720 minimum)
- Audience: optimized for 1080p projection
- Card generator: works on tablet/laptop

---

## Technical Requirements

**Browser Support:**
- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+

**Performance:**
- Initial load: <3 seconds on broadband
- Audio playback: <100ms latency
- UI interactions: <50ms response

**Accessibility:**
- Keyboard navigable
- ARIA labels where appropriate
- High contrast mode support

---

## Out of Scope (Post-MVP)

- Printable bingo cards (PDF generation)
- 90-ball bingo (UK format)
- Custom pattern editor
- Multi-language audio
- Player-facing digital cards (QR code to phone)
- Real-time multiplayer (players on own devices)
- Analytics dashboard
- Multiple concurrent games
- Subscription/payment integration
- Mobile native app

---

## Decisions Made

1. **Project name:** Joolie Boolie Bingo
2. **Audio voices:** Multiple selectable options (3-4 voices: male/female, professional/warm)
3. **Logo upload limits:** Max 2MB, jpg/png/webp
4. **Access model:** Free to play (no login required), optional accounts for saving templates
5. **Future monetization:** Ads and/or paid tier (architecture should accommodate)

---

## Next Steps

1. Initialize Next.js project with Tailwind
2. Set up Supabase project (database, auth)
3. Build API routes (auth, profile, templates)
4. Build core game engine (number generation, state management)
5. Build presenter UI
6. Build audience display + BroadcastChannel sync
7. Generate and integrate audio files
8. Build card generator with PDF export
9. PWA setup (manifest, service worker)
10. Testing with real users
