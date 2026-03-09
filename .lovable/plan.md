

## Add Player Hub Access to Landing Page

### Problem
When authenticated, the landing page only shows "Go to Dashboard" which navigates to `/campaign-hub` (DM-focused). Players have no way to reach `/player-hub` from the home page since the last navbar cleanup removed internal app links.

### Solution
Add a split navigation for authenticated users that distinguishes between DM and Player entry points:

**Navbar changes (desktop + mobile):**
- Replace the single "Go to Dashboard" button with two buttons for authenticated users:
  - **Campaign Hub** (Crown icon) — routes to `/campaign-hub` (DM dashboard)
  - **Player Hub** (Shield icon) — routes to `/player-hub` (player dashboard)
- Style: Campaign Hub as the primary CTA, Player Hub as an outline/secondary button beside it
- Mobile menu: add both as full-width buttons in the authenticated section

### File to modify
- `src/pages/Index.tsx` — navbar desktop actions (lines 220-238) and mobile menu (lines 304-313)

