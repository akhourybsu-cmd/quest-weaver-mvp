

# Player Hub Consistency Pass -- Findings and Fixes

## Current State

After reviewing all 25+ Player Hub files, routes, hooks, and types, the system is in solid shape following the previous overhaul. The unified `PlayerPageLayout` is applied consistently, the Notes visibility bug is fixed, the unlink flow has proper confirmation, and `SessionPlayer` correctly redirects to `/player-hub`. However, several inconsistencies remain:

---

## Inconsistencies Found

### 1. `linkCampaign()` does NOT create `campaign_members` entry

When a player joins a campaign via the **JoinCampaignDialog** (dashboard "Join Campaign" button), `usePlayerLinks.linkCampaign()` only creates a `player_campaign_links` row. It does **not** create a `campaign_members` entry.

The **WaitingRoom** was fixed to create both, but the JoinCampaignDialog is a separate path. This means a player who joins via the dashboard dialog will be linked but won't have a `campaign_members` row until they visit the waiting room. If they go directly to a live session (clicking "Join Session" on the tile), the `CampaignContext` won't find their role and session features may break.

**Fix:** Add `campaign_members` sync to `linkCampaign()` in `usePlayerLinks.ts`, matching the WaitingRoom pattern.

### 2. `PlayerHome` component still exists (dead code)

The `/player-home` route was correctly removed from `App.tsx`, but the `PlayerHome` component file (`src/components/permissions/PlayerHome.tsx`) remains. It's not imported anywhere. It's dead code that should be removed for hygiene.

**Fix:** Delete `src/components/permissions/PlayerHome.tsx`.

### 3. `PlayerNotesView` hardcoded height breaks in campaign tab context

The `PlayerNotesView` uses `h-[calc(100vh-12rem)]` for its container and `h-[calc(100vh-16rem)]` for the scroll area. This calculation assumes the component is rendered in a full-page context (standalone Notes page). When embedded inside the `PlayerCampaignView` (inside a tab, under a header + character card + tab bar), it overflows because the actual available space is much less than `100vh - 12rem`.

**Fix:** Remove hardcoded viewport-height calculations and use `flex-1` / `overflow-auto` patterns that adapt to their parent container. Or accept a `className` prop for height customization.

### 4. `PlayerCharacterSheet` uses `as any` casts for ancestry/subclass data

Lines 200-209 of `PlayerCharacterSheet.tsx` use `(data as any).srd_ancestries`, `(data as any).srd_subancestries`, `(data as any).srd_subclasses`. The types file includes these relations, so these casts are unnecessary and hide potential errors.

**Fix:** Remove `as any` casts and use proper typed access.

### 5. Mobile layout inconsistency: `PlayerPageLayout` uses `useIsMobile()` but `SessionPlayer` does not use `PlayerPageLayout`

This is intentional -- `SessionPlayer` is a live session and needs a different layout (no sidebar, just a header bar). However, the `SessionPlayer` header doesn't have a consistent design with the rest of the Player Hub:
- No player avatar or branding
- "Exit" button text is hidden on mobile (only shows arrow icon) which may confuse first-time users

**Fix:** Add a subtle tooltip on the exit button for mobile, and style the SessionPlayer header to match the Player Hub brass/fantasy theme.

### 6. `PlayerCharacterList` has a speed stat hardcoded to "30 ft"

Line 316: `<span>30 ft</span>` -- the speed is hardcoded rather than read from `character.speed`. This was likely a placeholder.

**Fix:** Use `character.speed` (need to add `speed` to the character select query).

### 7. `CampaignTile` and `PlayerCampaignView` both independently load character data

Both components fetch the character for a campaign independently using nearly identical queries. The `PlayerCampaignView` loads character data in `loadCharacter()`, and `CampaignTile` does the same in its own `loadCharacter()`. If the user changes their character from one view, the other won't reflect it until remounted.

This is a known architectural issue (Redundancy 4 from the previous audit). While a full shared hook would be ideal long-term, for now the code works correctly because each component mounts independently.

**Fix:** No change needed now -- flag for future refactoring.

### 8. `PlayerNavigation` collapse state persists in localStorage but doesn't sync across tabs

Minor -- the sidebar collapse is stored in `localStorage` but doesn't listen for `storage` events. Opening the player hub in two tabs can show different sidebar states.

**Fix:** Low priority, no change needed.

### 9. `CharacterSelectionDialog` uses `window.confirm()` for reassignment warning

Line 102: `window.confirm(...)` is used instead of the app's `AlertDialog` component. This breaks the visual consistency and can't be styled with the fantasy theme.

**Fix:** Replace `window.confirm()` with a proper `AlertDialog` component, matching the pattern used in `CampaignTile`.

---

## Implementation Plan

### Phase 1: Critical Data Integrity Fix
1. **`usePlayerLinks.ts`** -- Add `campaign_members` sync to `linkCampaign()`. After creating the `player_campaign_links` row, get the auth user and create a `campaign_members` entry if one doesn't exist. This ensures both tables are synced regardless of whether the player joins via the dialog or the waiting room.

### Phase 2: Code Cleanup
1. **Delete** `src/components/permissions/PlayerHome.tsx` (dead code, no imports)
2. **`PlayerCharacterSheet.tsx`** -- Remove `as any` casts on ancestry/subclass data
3. **`PlayerCharacterList.tsx`** -- Fix hardcoded speed: add `speed` to the character query and display `character.speed` instead of `30`

### Phase 3: Layout Fixes
1. **`PlayerNotesView.tsx`** -- Replace hardcoded `h-[calc(100vh-12rem)]` and `h-[calc(100vh-16rem)]` and `h-[calc(100vh-24rem)]` with flexible height patterns that work in both standalone page and embedded tab contexts
2. **`SessionPlayer.tsx`** -- Style the header to match the Player Hub fantasy theme (add brass border accent, font-cinzel on character name)

### Phase 4: UX Polish
1. **`CharacterSelectionDialog.tsx`** -- Replace `window.confirm()` with a styled `AlertDialog` for the campaign reassignment warning

---

## Technical Details

### `campaign_members` sync in `linkCampaign()`

```text
After inserting into player_campaign_links:
1. Get current auth user via supabase.auth.getUser()
2. Check if campaign_members row exists for (campaign_id, user_id)
3. If not, insert { campaign_id, user_id, role: 'player' }
```

### `PlayerNotesView` height fix

Replace the fixed viewport calculations with a container that fills available space:

```text
Container: use flex flex-col with a passed-in max-height or simply overflow-auto
ScrollArea: remove fixed calc heights, let parent control sizing
```

### Files Changed

| File | Changes |
|------|---------|
| `src/hooks/usePlayerLinks.ts` | Add `campaign_members` sync to `linkCampaign()` |
| `src/components/permissions/PlayerHome.tsx` | DELETE (dead code) |
| `src/components/player/PlayerCharacterSheet.tsx` | Remove `as any` casts |
| `src/components/player/PlayerCharacterList.tsx` | Fix hardcoded speed, add `speed` to query |
| `src/components/player/PlayerNotesView.tsx` | Fix hardcoded height calculations |
| `src/pages/SessionPlayer.tsx` | Style header to match Player Hub theme |
| `src/components/character/CharacterSelectionDialog.tsx` | Replace `window.confirm` with `AlertDialog` |

### No database changes needed

All schema, constraints, triggers, and RLS policies are correct.

