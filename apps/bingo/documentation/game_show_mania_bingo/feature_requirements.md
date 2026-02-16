# Feature Requirements - Derived from Competitive Analysis

## Must-Have (MVP)

Based on what Game Show Mania offers and what facilities expect:

### Core Game
- [ ] Standard 75-ball bingo (B:1-15, I:16-30, N:31-45, G:46-60, O:61-75)
- [ ] Free space in center
- [ ] Manual number calling (click to call next)
- [ ] Auto-call mode with configurable delay
- [ ] Pause/resume game
- [ ] Undo last call (critical for mistakes)
- [ ] Reset/new game

### Patterns
- [ ] At minimum, support the common patterns:
  - Straight line (horizontal, vertical, diagonal)
  - Four corners
  - Blackout/coverall
  - Letter patterns (L, T, X, etc.)
  - Postage stamp (2x2 corner)
- [ ] Display current winning pattern on screen
- [ ] Pattern selection before game starts

### Audio
- [ ] Voice callouts for numbers ("B-7", "N-31", etc.)
- [ ] Text-to-speech or pre-recorded audio
- [ ] Volume control
- [ ] Mute option
- [ ] Optional sound effects (ball drop, winner celebration)

### Display
- [ ] Large, readable numbers (users with vision issues)
- [ ] High contrast mode option
- [ ] Fullscreen mode
- [ ] Called numbers board (show all called numbers)
- [ ] Current number prominently displayed
- [ ] Last few numbers called visible

### Dual Screen Support
- [ ] Presenter view: controls + compact board
- [ ] Audience view: large display for projection
- [ ] Sync between windows (BroadcastChannel API or similar)
- [ ] "Open Audience Display" button that spawns new window

### Card Generation
- [ ] Generate valid, randomized bingo cards
- [ ] PDF export for printing
- [ ] Multiple cards per page (1, 2, 4, or 6)
- [ ] Configurable number of cards to generate
- [ ] Ensure no duplicate cards in batch

### Offline Support (PWA)
- [ ] Service worker for offline caching
- [ ] Works without internet after first load
- [ ] App manifest for "install to home screen"
- [ ] Graceful handling when offline

---

## Should-Have (Post-MVP)

### Account System
- [ ] Login/authentication
- [ ] Save game preferences
- [ ] Save custom patterns
- [ ] Access from any device

### Enhanced Patterns
- [ ] Pattern editor (create custom patterns)
- [ ] Save/load custom patterns
- [ ] Pattern library (100+ options like competitors)

### Customization
- [ ] Customizable backgrounds/themes
- [ ] Upload facility logo
- [ ] Custom game titles ("Tuesday Night Bingo!")
- [ ] Holiday themes

### Multi-Language
- [ ] Spanish voice callouts (high priority for some facilities)
- [ ] Other languages as needed

### Quality of Life
- [ ] Game history/session log
- [ ] "Resume last game" after browser close
- [ ] Keyboard shortcuts for presenter
- [ ] Statistics (numbers called, game duration)

---

## Nice-to-Have (Future)

### Expansion Games
- [ ] 90-ball bingo (UK/international style)
- [ ] Speed bingo
- [ ] Themed bingo (music bingo, picture bingo)

### Player Cards (Digital)
- [ ] QR code to load card on personal device
- [ ] Auto-daub feature
- [ ] "Bingo!" button for players

### Facility Management
- [ ] Multi-room support
- [ ] Multiple concurrent games
- [ ] Admin dashboard
- [ ] Usage analytics

### Integrations
- [ ] Zoom/Teams integration for virtual bingo
- [ ] Calendar/scheduling

---

## Technical Requirements

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
(Cover last 2-3 years of browsers for older facility computers)

### Performance
- Fast initial load (<3s on decent connection)
- Smooth animations (60fps)
- Responsive to input (no lag on button clicks)
- Work on modest hardware (older facility laptops)

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatible (for presenters with disabilities)
- Keyboard navigable
- High contrast support
- Large click targets

### Audio Considerations
- Handle browser autoplay restrictions
- User interaction required before audio plays
- Fallback if audio fails (visual-only mode)
- Support for system audio routing (external speakers)
