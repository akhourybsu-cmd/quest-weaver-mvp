

# Player Experience: Refinements & Polish

## Issues Identified

### 1. Missing Loading States

**Problem**: Most player components fetch data on mount but don't show loading indicators while fetching. Players see empty UIs or stale data briefly, creating confusion about whether the app is working.

**Affected Components**:
- `PlayerInventory.tsx` - No loading state during `fetchHoldings()`
- `PlayerSpellbook.tsx` - No loading state during `fetchSpells()` / `fetchSpellSlots()`
- `PlayerCombatView.tsx` - No loading state during initial data fetch
- `PlayerQuestTracker.tsx` - No loading state during `fetchQuests()`
- `PlayerMapViewer.tsx` - No loading state while map image loads

**Fix**: Add `loading` state with skeleton or spinner during initial fetch. Use existing `PlayerEmptyState` pattern for no-data scenarios vs loading scenarios.

---

### 2. Combat Action Economy Visual Clarity

**Problem**: In `PlayerCombatActions.tsx`, the action economy chips (Action, Bonus Action, Reaction) use check/X icons and line-through styling, but the visual distinction between "used" and "available" isn't immediately clear to new players.

**Impact**: Players might miss that they still have bonus actions available or try to take actions they've already used.

**Fix**: 
- Enhance visual contrast: used actions should be more clearly greyed out
- Add subtle animations when actions are used
- Consider adding a persistent "Actions Remaining" summary badge

---

### 3. Inconsistent Empty States

**Problem**: Some components use `PlayerEmptyState`, others use inline empty messages, and some show nothing.

**Affected**:
- `PlayerInventory.tsx` - Uses inline "No items" text (line 112)
- `PlayerSpellbook.tsx` - Has custom empty state with Sparkles icon (line 290-293)
- `PlayerCombatView.tsx` - Uses inline "No combat actions yet" (line 323)
- `PlayerJournal.tsx` - Uses `PlayerEmptyState` correctly ✓
- `PlayerQuestTracker.tsx` - Uses `PlayerEmptyState` correctly ✓

**Fix**: Standardize on `PlayerEmptyState` component across all player views for consistency.

---

### 4. Player Turn Signal Feedback

**Problem**: When a player clicks "End Turn" in `PlayerCombatActions.tsx` (line 352-378), they get a toast notification but the button doesn't disable or change state. Players might click it multiple times, creating duplicate signals.

**Impact**: DMs might see multiple "turn ended" notifications from a single player.

**Fix**: 
- Disable "End Turn" button after clicking
- Show loading state during submission
- Reset state when their next turn starts

---

### 5. Save Prompt Response Visual Feedback

**Problem**: In `SavePromptListener.tsx`, when a player rolls a save, the component removes the prompt from view (line 137), but there's no visual "slide out" or confirmation animation. The prompt just disappears abruptly.

**Impact**: Players might not be sure their save was recorded, especially on slow connections.

**Fix**: Add exit animation + keep the responded prompt visible for 1-2 seconds with "Submitted" state before removing.

---

### 6. Combat Log Truncation

**Problem**: `PlayerCombatView.tsx` limits combat log to 20 entries (line 165), but there's no indication when the log is truncated. Players might think they're seeing the full history.

**Impact**: Players can't review earlier combat actions or outcomes.

**Fix**: Add "Showing last 20 actions" hint or infinite scroll for older entries.

---

### 7. Spell Slot Visual Feedback

**Problem**: In `PlayerSpellbook.tsx` (lines 188-206), spell slots are shown as tiny dots (2px × 2px) which are hard to see and tap on mobile.

**Impact**: Players can't easily tell how many spell slots remain, especially on small screens.

**Fix**: 
- Increase dot size (8-10px)
- Add numeric label (e.g., "3/4 slots")
- Make dots interactive with tooltips

---

### 8. Map Loading Performance

**Problem**: `PlayerMapViewer.tsx` loads the full map image every time the component mounts (line 290). If the session kiosk tab switches away and back, the image reloads.

**Impact**: Slow network players see blank maps repeatedly.

**Fix**: Already optimized with `imageRef.current` check (line 288) — no changes needed. ✓

---

### 9. Character Data Sync in SessionKiosk

**Problem**: `SessionKiosk.tsx` passes `initialCharacter` to itself as state (line 113) but the sync effect (line 104-106) updates local state. If character HP changes from another source (DM edit, rest, damage), the kiosk shows stale data until the real-time subscription fires.

**Impact**: Brief race condition where players see old HP after taking damage.

**Fix**: Already handled via real-time subscription on line 148-160. No changes needed. ✓

---

### 10. Waiting Room User Experience

**Problem**: In `PlayerWaitingRoom.tsx`, if a player loads the page while a session is already live, they see "Checking for active session..." (line 192-196) then redirect. This creates an unnecessary loading screen.

**Impact**: Players might think they need to wait when they could join immediately.

**Fix**: Run the session check in parallel with player profile setup, redirect immediately if session is live without showing "waiting" UI.

---

## Implementation Priority

**High Priority** (User-facing polish):
1. Loading states for all player components
2. Action economy visual improvements
3. Standardize empty states
4. Player turn signal button state

**Medium Priority** (Edge cases & UX):
5. Save prompt animations
6. Combat log truncation hint
7. Spell slot sizing & labels

**Low Priority** (Already good or minor):
8. Map loading (already optimized)
9. Character sync (already optimized)
10. Waiting room (minor optimization)

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/player/PlayerInventory.tsx` | Add loading state; use `PlayerEmptyState` |
| `src/components/player/PlayerSpellbook.tsx` | Add loading state; use `PlayerEmptyState`; improve spell slot dots |
| `src/components/player/PlayerCombatView.tsx` | Add loading state; use `PlayerEmptyState` for combat log |
| `src/components/player/PlayerQuestTracker.tsx` | Add loading state (already has good empty state) |
| `src/components/player/PlayerCombatActions.tsx` | Improve action chip styling; disable "End Turn" after click |
| `src/components/combat/SavePromptListener.tsx` | Add exit animation for responded prompts |
| `src/components/player/PlayerWaitingRoom.tsx` | Optimize session check flow |

---

## Technical Notes

- Use `useState<boolean>` for `isLoading` flags
- Leverage existing `PlayerEmptyState` component for consistency
- Add fade-out animations using existing Tailwind `animate-fade-out` classes
- For action economy, use CSS transitions on `opacity` and `scale`

