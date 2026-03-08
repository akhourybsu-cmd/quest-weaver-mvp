

# Player Hub Continued Evaluation -- Findings & Fixes

## Remaining Issues Found

### 1. PlayerChat Has 2 Unmigrated `getUser()` Calls (Performance)
`PlayerChat.tsx` calls `supabase.auth.getUser()` in both `fetchSenderName` (line 68) and `handleSendMessage` (line 131). Every message send triggers a network call to the auth server. Should use `useAuth()`.

### 2. SessionPlayer.tsx Has Unmigrated `getUser()` Call (Performance)
Line 31 calls `getUser()` on mount. Should use `useAuth()` for `currentUserId`.

### 3. PlayerWaitingRoom, AssignCharacterDialog, LinkedAssetsSection, AccountSection -- 4 More Unmigrated Auth Calls
These player-facing components still call `getUser()` directly instead of using the cached `useAuth()` context.

### 4. PlayerChat Realtime Channel Uses Static Name (Bug)
Line 45: `supabase.channel('campaign-messages:${campaignId}')` -- correct. But `PlayerJournal` line 46 uses hardcoded `'player-journal'` without campaign/character scoping. If a player has multiple campaign journals open in tabs, they'd share a single channel and could miss updates.

### 5. PlayerCampaignView Doesn't Re-fetch When `userId` Becomes Available (Race Condition)
`loadCharacter()` depends on `userId` from `useAuth()`, but the `useEffect` on line 35 only watches `campaignCode`. If auth loads after the component mounts, the character fetch fires with `userId = null` and silently returns nothing.

### 6. Lore Cards Missing Fade-in Animation
All other tab views (Quests, NPCs, Locations, Factions, Timeline) use `opacity-0 animate-fade-in` on list items for smooth entry. `PlayerLoreView` cards (line 235) don't have this animation, making them visually inconsistent.

### 7. Quest Tracker Missing "Available" Status
Quests are split into `in_progress` and `completed`, but quests with status `available` or `not_started` are silently filtered out by the display logic (lines 80-81). Players can't see quests their DM has marked visible but not yet started.

### 8. No Loading State on Several Tab Views
`PlayerNPCDirectory`, `PlayerLocationsView`, `PlayerFactionsView`, `PlayerTimelineView` have no loading spinner -- they show empty states immediately on mount before data arrives, which can flash briefly.

---

## Proposed Fixes

### Auth Migration (6 files)
Replace `getUser()` with `useAuth()` in:
- `PlayerChat.tsx` -- use `userId` and `user` from context
- `SessionPlayer.tsx` -- use `userId` from context
- `PlayerWaitingRoom.tsx` -- use `userId` from context
- `AssignCharacterDialog.tsx` -- use `userId` from context
- `LinkedAssetsSection.tsx` -- use `userId` from context
- `AccountSection.tsx` -- use `user` from context for email

### Bug Fixes
- **PlayerJournal**: Scope the realtime channel name to include `characterId`
- **PlayerCampaignView**: Add `userId` to the `useEffect` dependency array so `loadCharacter` re-runs when auth resolves
- **Quest Tracker**: Include `available`/`not_started` quests in display with a separate "Available" section

### Visual Consistency
- **PlayerLoreView**: Add `opacity-0 animate-fade-in` with staggered delay to lore cards
- **Tab loading states**: Add a simple loading boolean to NPC, Locations, Factions, Timeline views so they show a spinner before data arrives instead of flashing the empty state

### File Changes Summary
| File | Change |
|------|--------|
| `PlayerChat.tsx` | Use `useAuth()` instead of 2x `getUser()` |
| `SessionPlayer.tsx` | Use `useAuth()` instead of `getUser()` |
| `PlayerWaitingRoom.tsx` | Use `useAuth()` instead of `getUser()` |
| `AssignCharacterDialog.tsx` | Use `useAuth()` instead of `getUser()` |
| `LinkedAssetsSection.tsx` | Use `useAuth()` instead of `getUser()` |
| `AccountSection.tsx` | Use `useAuth()` for email |
| `PlayerJournal.tsx` | Scope realtime channel name |
| `PlayerCampaignView.tsx` | Add `userId` to useEffect deps |
| `PlayerQuestTracker.tsx` | Add "Available" quest section |
| `PlayerLoreView.tsx` | Add fade-in animation to cards |
| `PlayerNPCDirectory.tsx` | Add loading state |
| `PlayerLocationsView.tsx` | Add loading state |
| `PlayerFactionsView.tsx` | Add loading state |
| `PlayerTimelineView.tsx` | Add loading state |

