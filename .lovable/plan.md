# Player Hub Navigation Fix

## Phase 1 — Critical Routing Fixes
- **`MobileBottomNav.tsx`**: Change `/player-campaign/${code}` → `/player/campaign/${code}` to match the actual route in `App.tsx`.
- **`LinkedAssetsSection.tsx`**:
  - Character links → `/player/${playerId}/characters/${id}` (player-owned route) instead of DM `/characters/${id}`.
  - DM Campaign links → `/campaign-hub` or `/campaign/${id}` (verify correct DM route).
  - Wire `playerId` via `usePlayer()` hook.
  - Make "Campaigns (as Player)" expandable with links to `/player/campaign/${join_code}`.

## Phase 2 — Remove Redundancies
- **`PlayerDashboardNew.tsx`**: Remove the `Tabs` wrapper. The dedicated `/player/${id}/characters` page already exists and is accessible via sidebar + mobile nav. Convert the dashboard into a single Campaigns overview with a "Manage Characters →" link card at the top.
- Removes the duplicate Characters tab and simplifies the landing experience.

## Phase 3 — Resilience & Edge Cases
- **`PlayerHub.tsx`**: Add a fallback UI for users without a player profile (e.g., DM-only accounts) — show a "Create Player Profile" CTA instead of infinite loading.
- **`App.tsx`**: Preserve `?redirect=` and other search params when redirecting `/player` → `/player/${id}`.

## Phase 4 — Verification
- Crawl every nav button on mobile (411px) and desktop:
  - Sidebar links, MobileBottomNav (Hub/Chars/Campaign/Notes/More), More sheet (Settings/Community/Sign Out/Campaign Hub for DMs), Settings → Linked Assets, Campaign tile actions.
- Confirm no 404s, all destinations render content.

## Files Modified
- `src/components/player/MobileBottomNav.tsx`
- `src/components/player/settings/LinkedAssetsSection.tsx`
- `src/pages/PlayerDashboardNew.tsx`
- `src/pages/PlayerHub.tsx`
- `src/App.tsx`
