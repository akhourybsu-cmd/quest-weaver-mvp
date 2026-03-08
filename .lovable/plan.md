

# Player Hub Audit -- Connectivity, Navigation, and Visibility

## Issues Found

### 1. Dead Navigation Link in SessionPlayer.tsx (Bug)
`SessionPlayer.tsx` line 24 navigates to `/player/dashboard` which **does not exist** as a route. Should be `/player-hub` (which auto-redirects to `/player/:playerId`).

### 2. No Link to Community/Changelog from Player Hub
The sidebar (`PlayerNavigation`) has Dashboard, Characters, Shared Notes, Settings, and conditionally Campaign Hub. There is no way for a player to reach `/community` or `/changelog` from within the Player Hub -- they must manually type the URL or go back to the landing page.

### 3. Campaign Tile "Join Session" Requires Character but No Clear Error
In `CampaignTile.tsx` line 229, the "Join Session" button is `disabled={loading || !character}` but there is no tooltip or visual explanation telling the player *why* it is disabled. A player with a live session but no assigned character sees a greyed-out button with no guidance.

### 4. PlayerNavigation Makes Redundant `getUser()` Call
The DM check in `PlayerNavigation` calls `supabase.auth.getUser()` on every mount. This was flagged in the previous optimization audit but this specific instance was not migrated to `useAuth()`.

### 5. CampaignTile Makes 2 Redundant `getUser()` Calls Per Tile
`loadCharacter()` and `checkUnreadMessages()` each call `supabase.auth.getUser()`. With 5 campaigns, that is 10 unnecessary network requests on dashboard load.

### 6. Campaign View Character Strip Has No Link to Character Sheet
In `PlayerCampaignView.tsx`, the character strip shows name/level/class but clicking on the character does nothing. Players have no quick way to view their full character sheet from the campaign view.

### 7. "Shared Notes" Page Shows All Campaign Notes (No Filtering)
`PlayerNotes.tsx` passes only `playerId` to `PlayerNotesView` without a `campaignId`. This means the Shared Notes page in the sidebar shows notes from ALL campaigns mixed together. While the campaign-specific Notes tab correctly scopes by campaign, the standalone page could be confusing.

### 8. PlayerHub.tsx Has Its Own Auth Logic (Redundant)
`PlayerHub.tsx` manages its own auth state with `getSession()`/`onAuthStateChange()` instead of using the `useAuth()` context. Since App.tsx already gates protected routes behind `session`, the auth form in PlayerHub is unreachable -- it renders `null` when the player profile auto-redirects.

### 9. No "Back to Dashboard" from Shared Notes Page
The standalone Shared Notes page (`/player/:playerId/notes`) has no visible back button or breadcrumb. The sidebar handles navigation, but on mobile the user must open the hamburger menu to leave.

### 10. Journal Tab Breaks When No Character Assigned
`PlayerCampaignView.tsx` line 217 passes `characterId={character?.id || ''}` to `PlayerJournal`. When no character is assigned, this passes an empty string, which likely causes the journal to load nothing with no explanation.

---

## Proposed Fixes

### Quick Fixes (minimal code changes)
1. **Fix dead route**: Change `/player/dashboard` to `/player-hub` in `SessionPlayer.tsx`
2. **Add Community link**: Add a `MessageCircle` "Community" nav item to `PlayerNavigation`
3. **Character required tooltip**: Add a disabled message below the "Join Session" button: "Assign a character to join"
4. **Character name links to sheet**: Make the character name/avatar in `PlayerCampaignView` clickable, navigating to `/player/:playerId/characters/:characterId`
5. **Journal empty state**: Show a message in `PlayerJournal` when `characterId` is empty: "Assign a character to start journaling"
6. **Migrate auth calls**: Replace `getUser()` in `PlayerNavigation`, `CampaignTile`, `PlayerCharacterList`, and `PlayerCharacterViewPage` with `useAuth()` context

### Medium Fixes
7. **Clean up PlayerHub.tsx**: Remove redundant auth state management; rely on App.tsx route guards and `useAuth()`
8. **Add mobile back button**: Add a back arrow on the Shared Notes page header for mobile users
9. **Shared Notes grouping**: Group notes by campaign name in the standalone Shared Notes view, or add campaign name badges to each note card

### File Changes Summary
| File | Change |
|------|--------|
| `SessionPlayer.tsx` | Fix dead `/player/dashboard` route |
| `PlayerNavigation.tsx` | Add Community link; use `useAuth()` instead of `getUser()` |
| `CampaignTile.tsx` | Use `useAuth()` for user ID; add "assign character" hint |
| `PlayerCampaignView.tsx` | Make character strip clickable to character sheet; fix journal empty state |
| `PlayerCharacterList.tsx` | Use `useAuth()` instead of `getUser()` |
| `PlayerCharacterViewPage.tsx` | Use `useAuth()` instead of `getUser()` |
| `PlayerJournal.tsx` | Handle empty `characterId` with guidance message |
| `PlayerHub.tsx` | Remove redundant auth management |

