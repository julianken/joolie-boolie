# Let's Play Bingo - Complete Feature Analysis

**Website:** https://letsplaybingo.io
**Source Code:** https://github.com/karolbrennan/letsplaybingo.2020 (2020 edition, retired)
**Developer:** Karol Brennan (hello@letsplaybingo.io)
**Price:** Free, no ads
**Rating:** 4.9/5 (1,250+ reviews)
**License:** MIT (open source)

---

## Platform & Technology

### Tech Stack
- ReactJS (Create React App)
- HTML/CSS/SCSS
- Web Speech Synthesis API (for voice)
- LocalStorage (for persistence)
- Service Workers (for PWA/offline)

### Browser Support
- Chrome
- Firefox
- Safari
- Edge
- Any modern browser with JavaScript enabled

### Device Support
- Desktop computers
- Laptops
- Tablets
- Smartphones
- Responsive design adapts to screen size

### Offline Capability
- Progressive Web App (PWA)
- Works offline after first visit
- Service worker caches application
- LocalStorage persists game state and settings

---

## Available Editions

1. **Main Edition** (letsplaybingo.io) - Current, actively maintained (private repo)
2. **2020 Edition** (2020.letsplaybingo.io) - Retired June 2023, open source
3. **Classic Edition** (classic.letsplaybingo.io) - Original React version
4. **90-Ball Edition** (90ball.letsplaybingo.io) - UK-style bingo (1-90)

---

## Core Game Features

### Game Modes

| Mode | Description |
|------|-------------|
| **Standard** | Traditional 75-ball bingo with auto or manual calling |
| **Manual Calling** | Display-only board where operator clicks numbers to mark them (for physical ball cage) |
| **Wild Bingo** | First number called determines a rule; matching numbers auto-marked |
| **Wild Bingo Evens/Odds** | Wild mode variant - marks all even or odd numbers |

### Number Calling

- **Auto-call Mode:** Automatic calling with adjustable delay
- **Manual Call:** Click "Call Next Number" button
- **Speed Control:** Slider from 3.5 to 30 seconds between calls
- **Start/Pause:** Toggle autoplay on/off
- **Skip Unused Numbers:** Omit columns not needed for selected pattern

### Ball Display

- Current ball prominently displayed with letter + number
- Previous ball shown for reference
- Color-coded by column:
  - B = Blue
  - I = Red
  - N = White
  - G = Green
  - O = Yellow
- Total balls called counter
- Animated ball graphics

### Call History

- List of all previously called numbers
- Displayed in order called
- Scrollable history panel

---

## Pattern System

### Pattern Count
Approximately **75+ preset patterns** available

### Complete Pattern List

**Pack Patterns:**
- 6 Pack As Shown
- 6 Pack Anywhere
- 8 Pack As Shown
- 8 Pack Anywhere
- 9 Pack As Shown
- 9 Pack Anywhere

**Standard Patterns:**
- Blackout / Coverall
- Four Corners
- Four Corners Small
- Double Bingo
- Hardway
- Regular or 4 Corners
- One Away
- Top and Bottom

**Letter/Number Patterns:**
- Letter X
- Double X
- Lucky 7
- GO
- ING Game
- B and O
- Number Sign
- Percent Sign
- Cent Sign
- Plus Sign
- Add & Subtract

**Shape Patterns:**
- Diamond
- Diamond Filled
- Diamond Inside
- Heart
- Love Letter
- Cross
- Starburst
- Clover
- Clover Leaf
- Smile
- Turtle

**Object Patterns:**
- Airplane
- Anchor
- Bow Tie
- Candlestick
- Champagne Glass
- Dog Bone
- Flag
- Hourglass
- Ladder
- Picnic Table
- Pyramid
- Top Hat
- Tree
- Umbrella
- Sputnik

**Line/Frame Patterns:**
- Large Frame
- Small Frame
- Broken Frame
- Brackets
- Two Brackets
- Railroad Tracks
- Staircase
- Layer Cake
- Checkerboard
- Double Chevron

**Arrow Patterns:**
- Arrowhead
- Crazy Arrow
- Crazy Arrowhead
- Checkmark
- Field Goal

**"Crazy" Patterns (can be rotated/flipped):**
- Crazy Arrow
- Crazy Arrowhead
- Crazy Kite
- Crazy L
- Crazy T

**Combo Patterns:**
- Postage Stamps
- Stamp and 4 Corners
- Stamp and Line
- Triangle Game

**Custom:**
- Custom pattern editor (click cells to create own pattern)

### Pattern Features

- **Visual Pattern Display:** Shows which cells need to be marked
- **Pattern Selector:** Dropdown with search functionality
- **Custom Pattern Editor:** Click individual cells to create patterns
- **"Anywhere" variants:** Pattern can appear in any rotation/position
- **"As Shown" variants:** Pattern must match exact position

---

## Audio System

### Voice Caller (Web Speech Synthesis API)

| Feature | Description |
|---------|-------------|
| **Enable/Disable** | Toggle voice on/off |
| **Voice Selection** | Choose from browser's available voices |
| **Language Support** | 40+ languages/variants supported |
| **Double Call Mode** | Repeats number with digits separated (e.g., "B-7... B... 7") |
| **Chatty Mode** | Adds contextual phrases ("Let's Play Bingo!", "Good luck!") |

### Supported Languages (Voice)
English (US, UK, AU, IN, etc.), Spanish, French, German, Italian, Portuguese, Chinese (Simplified, Traditional), Japanese, Korean, Russian, Arabic, Hindi, and 30+ more regional variants.

### Chime System

- **12 chime options** + 4 pop sounds
- Plays subtle alert before each number call
- 1-second delay before voice when chime enabled
- Selectable sound effects

### Audio Notes

- Requires user interaction before audio plays (browser policy)
- Falls back gracefully if speech synthesis unavailable
- Uses browser's built-in TTS (no external API needed)

---

## Card Generator

### Generation Options

| Setting | Options |
|---------|---------|
| **Number of Cards** | 1-100 cards per batch |
| **Card Colors** | 10 colors: red, orange, yellow, green, blue, purple, pink, aqua, gray, brown |
| **Cards Per Page** | 2, 4, or 6 cards per page |
| **Color Mode** | Color or black/white printing |

### Layout Details

| Cards/Page | Orientation | Notes |
|------------|-------------|-------|
| 2 | Landscape | Larger cards for vision accessibility |
| 4 | Portrait | Standard size |
| 6 | Landscape | Compact, more cards per sheet |

### Card Format

- Standard 5x5 grid
- B-I-N-G-O column headers
- Free space in center (N column, row 3)
- Numbers distributed correctly:
  - B: 1-15
  - I: 16-30
  - N: 31-45
  - G: 46-60
  - O: 61-75
- Randomly generated, unique cards

### Print Features

- Print button appears after generation
- Automatic page orientation
- Dynamic margins based on layout
- Browser print dialog integration

---

## User Interface

### Main Display Elements

1. **Current Ball Display** - Large, prominent current number
2. **Previous Ball** - Last called number reference
3. **Bingo Board** - 5x15 grid showing all 75 numbers, called numbers highlighted
4. **Call History Panel** - Scrollable list of called numbers
5. **Pattern Display** - Visual representation of winning pattern
6. **Control Panel** - Game controls and settings

### Controls

| Button | Function |
|--------|----------|
| Start New Game | Begin fresh game with first random call |
| Call Next Number | Manual single number call |
| Start Autoplay | Begin automatic calling |
| Pause Autoplay | Stop automatic calling |
| Reset Board | Clear all called numbers (confirmation required) |
| Shuffle Board | Animate board reset |

### Settings Panel

- Pattern selector with search
- Custom pattern editor
- Voice caller toggle and options
- Chime selector
- Autoplay speed slider
- Wild bingo toggle
- Skip unused numbers toggle
- Manual calling mode toggle

---

## Data Persistence

### LocalStorage

Automatically saves and restores:
- Current board state
- All called numbers
- Call history
- Selected pattern
- All settings (voice, speed, etc.)
- Game progress

### Session Behavior

- Refresh page: Game state preserved
- Close and reopen: Game state restored
- Clear browser data: Resets to defaults

---

## Additional Features

### Virtual Meeting Support

- Screen sharing compatible
- Works with Zoom, Teams, Google Meet
- Caller shares screen, players view board
- Voice caller audible through screen share audio

### Accessibility

- Large, high-contrast numbers
- Color-coded balls by column
- Voice calling for visually impaired
- 2-per-page card option for larger print
- Responsive design for various screen sizes

### Help & Support

- Built-in help page with feature documentation
- FAQ section
- Bug report functionality (pre-populates device/game state)
- Email support: hello@letsplaybingo.io

### Other Pages

- About page
- Privacy policy
- Terms of service
- Donation page
- Release notes / changelog

---

## Limitations & Gaps

### What's Missing (vs. Paid Solutions)

| Feature | Let's Play Bingo | Game Show Mania |
|---------|------------------|-----------------|
| Dual screen (presenter/audience) | No | Yes |
| Customizable backgrounds | No | Yes |
| Facility branding/logo | No | Yes |
| Multi-language voice (6 lang) | Browser-dependent | Built-in |
| Dedicated support | Email only | Phone support |
| Guaranteed updates | Developer discretion | N/A (static) |
| Account system | No | No |
| Save preferences across devices | No (local only) | No |

### Technical Limitations

- **Voice depends on browser:** Quality varies by browser/OS
- **No true offline install:** Must load once with internet first
- **No native app:** Browser-only (though PWA installable)
- **Single developer:** Long-term maintenance uncertain
- **No commercial support:** Passion project, no SLA

### UI/UX Observations

- Settings panel can be overwhelming
- No dedicated "presenter mode" (fullscreen focused view)
- Card generator is separate page, not integrated
- Pattern list is long - no categorization

---

## Opportunities for Differentiation

Based on this analysis, our solution could differentiate by offering:

1. **True dual-screen support** - Separate presenter controls and audience display
2. **Simpler UI** - Focused on the retirement community use case, less overwhelming
3. **Facility customization** - Logo, custom backgrounds, branded experience
4. **Account system** - Login and access settings from any device
5. **Curated patterns** - Organized by category, favorites, most-used
6. **Integrated card generator** - Built into main flow, not separate page
7. **Reliable support** - Known contact for when things go wrong
8. **Purpose-built for seniors** - Larger default fonts, simpler controls, high contrast

---

## Source Code Reference

The 2020 edition source code structure:

```
src/
├── index.js                    # Entry point
├── utils.js                    # Patterns, board generation, languages
├── components/
│   ├── BingoGame.js           # Main game component
│   ├── pages/
│   │   ├── About.js
│   │   ├── CardGenerator.js
│   │   ├── Donate.js
│   │   ├── Help.js
│   │   ├── Patterns.js
│   │   ├── Privacy.js
│   │   ├── ReleaseNotes.js
│   │   └── Terms.js
│   └── subcomponents/
│       ├── BingoBoard.js
│       ├── BingoCard.js
│       ├── CallHistory.js
│       ├── Footer.js
│       ├── Pattern.js
│       └── PatternDisplay.js
├── chimes/                     # Audio files
├── fonts/
├── images/
└── sass/                       # Styling
```

GitHub repos (open source, MIT license):
- https://github.com/karolbrennan/letsplaybingo.2020
- https://github.com/karolbrennan/letsplaybingo.classic
- https://github.com/karolbrennan/letsplaybingo.90ball
