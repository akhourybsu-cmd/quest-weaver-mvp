

# Player Hub Comprehensive Audit and Polish

## Current State Summary

The Player Hub consists of 12 routes, 24+ components, and 2 hooks. The core flow is:

1. `/player-hub` -- Auth gate + auto-redirect to dashboard
2. `/player/:playerId` -- Main dashboard (Characters tab + Campaigns tab)
3. `/player/:playerId/characters` -- Dedicated characters page
4. `/player/:playerId/characters/:characterId` -- Character sheet view
5. `/player/:playerId/settings` -- Player profile settings
6. `/player/:playerId/notes` -- Shared notes reader
7. `/player/campaign/:campaignCode` -- Out-of-session campaign browser
8. `/player/waiting?campaign=X` -- Waiting room for session start
9. `/session/player?campaign=X` -- Live session play
10. `/player-home` -- Legacy component (dead route)
11. `/player` -- Redirect to `/player-hub`

---

## Bugs Found

### Bug 1: `PlayerSettings.tsx` uses `useState()` as an effect (line 26)

```typescript
useState(() => {
  if (player) { ... }
});
```

This is a misuse of `useState`. The callback runs once on mount as an initializer, never re-runs when `player` changes. So if `player` loads after mount (which it always does -- it's async), the name/color/avatar fields stay at their defaults (empty string, `#3b82f6`, null). The settings page shows blank fields until the user manually types.

**Fix:** Replace with `useEffect` that runs when `player` changes.

### Bug 2: `PlayerCampaignView` Notes tab shows wrong data

The Notes tab in the campaign view passes `playerId` to `PlayerNotesView`, which loads notes from ALL campaigns the player belongs to. But the user is viewing a specific campaign -- they should only see notes from that campaign.

**Fix:** Add an optional `campaignId` prop to `PlayerNotesView` and filter notes to only that campaign when provided.

### Bug 3: `PlayerCampaignView` -- no mobile responsive layout

Unlike `PlayerDashboardNew` which has mobile header + sheet navigation, `PlayerCampaignView`, `PlayerCharactersPage`, `PlayerCharacterViewPage`, `PlayerSettings`, and `PlayerNotes` all render the desktop sidebar with no mobile handling. On mobile, the fixed-width sidebar takes up 256px, leaving almost no space for content.

**Fix:** Apply the same mobile pattern from `PlayerDashboardNew` (detect mobile, show hamburger sheet instead of sidebar) to all player pages.

### Bug 4: `PlayerWaitingRoom` cleanup function never runs

The `initializeWaitingRoom` function returns a cleanup function (to unsubscribe from the channel), but since it's called inside a `useEffect` that doesn't return that cleanup, the channel subscription is never cleaned up on unmount.

**Fix:** Restructure so the channel subscription cleanup is properly returned from the `useEffect`.

### Bug 5: `CampaignTile` unlink button deletes directly without confirmation

Clicking the unlink icon on a campaign tile calls `onUnlink` which is `refreshLinks`. But looking at the actual flow: `onUnlink` in `PlayerDashboardNew` just calls `refreshLinks()`. The actual unlink button in `CampaignTile` calls `onUnlink` -- but wait, the `Link2Off` button's `onClick` is `onUnlink`, which is `refreshLinks`. This means clicking unlink just refreshes the list but doesn't actually unlink anything. The unlink functionality is broken.

**Fix:** Wire up the unlink button to actually call `unlinkCampaign(link.id)` from `usePlayerLinks`, with a confirmation dialog.

### Bug 6: `SessionPlayer` redirects to `/campaign-hub` on errors instead of player dashboard

When `SessionPlayer` can't find the campaign or character, it navigates to `/campaign-hub` (DM route) instead of the player dashboard.

**Fix:** Navigate to `/player-hub` or the player dashboard instead.

---

## Redundancies Found

### Redundancy 1: `/player-home` route is dead

`PlayerHome` (`src/components/permissions/PlayerHome.tsx`) depends on `useCampaign()` from `CampaignContext`, which requires a `?code=` search param. The route `/player-home` doesn't provide any campaign context, so it always shows "Loading your campaign..." forever. This component was from an older architecture before the Player Hub was built.

**Fix:** Remove the `/player-home` route from `App.tsx`. Keep the `PlayerHome` component if it's used elsewhere, but remove the dead route.

### Redundancy 2: `PlayerCharactersPage` is a wrapper that only adds a header

`PlayerCharactersPage` renders `PlayerNavigation` + a heading + `PlayerCharacterList`. But `PlayerDashboardNew` already has a Characters tab that renders the exact same `PlayerCharacterList`. Both exist as separate routes.

However, the Characters page serves as a standalone view accessible from the sidebar, while the dashboard embeds it in a tab. This is acceptable UX (sidebar link goes to dedicated page). Keep both but ensure consistency.

### Redundancy 3: `campaign_members` vs `player_campaign_links`

Two tables serve similar purposes:
- `campaign_members` -- Used by `CampaignContext` for session-level role checking (DM/PLAYER)
- `player_campaign_links` -- Used by Player Hub for campaign membership

The `PlayerWaitingRoom` only creates a `player_campaign_links` entry but never creates a `campaign_members` entry. This means a player who joins via the waiting room may not have the right role in `CampaignContext`. This is a potential session join issue.

**Fix:** When creating a `player_campaign_links` entry in the waiting room, also ensure a `campaign_members` entry exists. Add a note about this dual-table situation for future unification.

### Redundancy 4: Character loading duplicated in 4 places

`CampaignTile`, `PlayerCampaignView`, `SessionPlayer`, and `PlayerHome` all independently fetch the user's character for a campaign. Each has slightly different error handling and query patterns.

**Fix:** This is addressed below in the refactoring section.

---

## UX/Design Improvements

### 1. Unify mobile layout across all player pages

Only `PlayerDashboardNew` has mobile support. Apply a shared layout wrapper:

Create a `PlayerPageLayout` component that:
- Accepts `playerId`, `title`, `children`
- On desktop: renders `PlayerNavigation` sidebar + content
- On mobile: renders sticky header with hamburger menu + Sheet nav + content
- Used by all 5 player pages (Dashboard, Characters, CharacterView, Settings, Notes, CampaignView)

### 2. Improve PlayerNavigation active state

The "My Campaigns" link goes to `/player/:playerId` (the dashboard) but so does the sidebar "Home" link which goes to `/`. This is confusing. Rename:
- "Home" to "Landing Page" or remove it (players don't need to go back to the marketing page)
- "My Campaigns" label stays as the dashboard link

### 3. Campaign view header needs character context

When viewing a campaign out-of-session, the character card is a separate section. Make it more integrated -- show the character avatar and name in the header alongside the campaign name for a more connected feel.

### 4. Empty states need action buttons

Several empty states just show text. Add clear CTAs:
- Characters empty: "Create Your First Character" (already done)
- Campaigns empty: "Join Your First Campaign" (already done)
- Campaign View with no character: Add "Create Character" button alongside "Select Character"

### 5. SessionPlayer needs a back/exit button

Currently there's no way to leave a session from `SessionPlayer` except browser back. Add an "Exit Session" button in the header that navigates back to the player dashboard.

---

## Implementation Plan

### Phase 1: Fix Critical Bugs
1. Fix `PlayerSettings.tsx` `useState` misuse -- replace with `useEffect`
2. Fix `PlayerCampaignView` Notes tab to filter by campaign
3. Fix `CampaignTile` unlink button (add confirmation + actual delete)
4. Fix `PlayerWaitingRoom` channel cleanup
5. Fix `SessionPlayer` error redirects (use player routes, not DM routes)

### Phase 2: Create Shared Layout
1. Create `PlayerPageLayout` component with mobile/desktop handling
2. Refactor `PlayerDashboardNew` to use it
3. Refactor `PlayerCharactersPage`, `PlayerCharacterViewPage`, `PlayerSettings`, `PlayerNotes`, `PlayerCampaignView` to use it

### Phase 3: Clean Up Redundancies
1. Remove dead `/player-home` route from `App.tsx`
2. Ensure `PlayerWaitingRoom` creates `campaign_members` entry alongside `player_campaign_links`

### Phase 4: UX Polish
1. Fix `PlayerNavigation` menu items (remove confusing "Home" link, clarify labels)
2. Add "Exit Session" button to `SessionPlayer` header
3. Add confirmation dialog to campaign unlink action
4. Improve `PlayerCampaignView` character card integration in header

---

## Technical Details

### `PlayerPageLayout` Component Structure

```text
PlayerPageLayout
  props: { playerId, title, subtitle?, backPath?, children }
  
  Desktop:
    [PlayerNavigation sidebar] [Content area with max-w-7xl mx-auto p-8]
  
  Mobile:
    [Sticky header: hamburger + title]
    [Sheet with PlayerNavigation]
    [Content area with p-4]
```

### Files Changed

| File | Changes |
|------|---------|
| `src/components/player/PlayerPageLayout.tsx` | NEW -- shared layout wrapper |
| `src/pages/PlayerDashboardNew.tsx` | Use PlayerPageLayout, remove inline mobile logic |
| `src/pages/PlayerCharactersPage.tsx` | Use PlayerPageLayout |
| `src/pages/PlayerCharacterViewPage.tsx` | Use PlayerPageLayout |
| `src/pages/PlayerSettings.tsx` | Use PlayerPageLayout, fix useState bug |
| `src/pages/PlayerNotes.tsx` | Use PlayerPageLayout |
| `src/pages/PlayerCampaignView.tsx` | Use PlayerPageLayout, fix Notes tab campaign filter |
| `src/components/player/PlayerNotesView.tsx` | Add optional `campaignId` prop for filtering |
| `src/components/player/CampaignTile.tsx` | Fix unlink button, add confirmation dialog |
| `src/components/player/PlayerWaitingRoom.tsx` | Fix channel cleanup, add campaign_members sync |
| `src/components/player/PlayerNavigation.tsx` | Clean up menu items |
| `src/pages/SessionPlayer.tsx` | Fix error redirects, add exit button |
| `src/App.tsx` | Remove `/player-home` dead route |

### No database changes needed

All schema and RLS policies are correct for the Player Hub flow.

