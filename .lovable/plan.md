
# Comprehensive App Scan — Bug Report & Fix Plan (Round 3)

## Bugs Found

### Bug 1 — `CombatLog.tsx`: Hardcoded channel name causes cross-encounter collisions
**File**: `src/components/combat/CombatLog.tsx` line 43  
**Problem**: Channel is named `'combat-log-changes'` with no `encounterId` suffix. If the DM has two encounters open in different browser tabs, both subscribe to the same channel and get each other's log updates.  
**Fix**: Rename to `combat-log:${encounterId}`.

---

### Bug 2 — `useEncounter.ts`: `characters` subscription has no `encounter_id` filter — over-broad
**File**: `src/hooks/useEncounter.ts` lines 75-99  
**Problem**: The `characters` UPDATE subscription listens to ALL character updates across the entire DB with no filter. Every time any character in the app changes (HP, spells, etc.) this fires `fetchInitiative()`, which makes N+1 DB calls (one per combatant). This is a major performance and network cost issue at scale.  
**Fix**: Since we know which character IDs are in the encounter from the `initiative` state, filter by `id=in.(charId1,charId2,...)`. However, the filter string for `in` in Realtime is not supported natively. Best practical fix: move this subscription into `InitiativeTracker.tsx` where it already exists (it subscribes separately), and remove the duplicate from `useEncounter`.

---

### Bug 3 — `InitiativeTracker.tsx`: `handleAutoRollAll` uses `setTimeout` to read stale state
**File**: `src/components/combat/InitiativeTracker.tsx` lines 266-281  
**Problem**: `handleAutoRollAll` calls `setSelectedCombatants(...)` then `setTimeout(handleRollInitiative, 100)`. `handleRollInitiative` reads `selectedCombatants` from state — but at the time it executes, it reads the **closed-over stale value**, not the newly set one. The `setTimeout` is a hack that races against the React render cycle.  
**Fix**: Roll directly by passing the full `availableCombatants` list to a refactored roll function instead of relying on `selectedCombatants` state.

```typescript
const handleAutoRollAll = async () => {
  if (availableCombatants.length === 0) return;
  // Roll directly without relying on state sync
  await rollCombatants(availableCombatants);
};
```

---

### Bug 4 — `PlayerFeatures.tsx`: Missing loading state and inconsistent empty states
**File**: `src/components/player/PlayerFeatures.tsx` lines 367-373 and 430-436  
**Problem**: `PlayerFeatures` has no `isLoading` state. On mount, all four fetch functions run in parallel via `fetchAllData()` but the UI renders empty states immediately. Users see "No class features yet" briefly before data loads. Also uses inline `<div>` empty states instead of `<PlayerEmptyState>`.  
**Fix**: Add `isLoading` state + skeleton, and replace inline empty states with `<PlayerEmptyState>`.

---

### Bug 5 — `PlayerChat.tsx`: `ScrollArea` `ref` forwarding is broken
**File**: `src/components/player/PlayerChat.tsx` line 184  
**Problem**: `<ScrollArea ref={scrollRef}>` — the shadcn `ScrollArea` component does not forward refs to the underlying scroll container. `scrollRef.current` will always be the outer div, not the inner scrollable viewport. So `scrollRef.current.scrollTop = scrollRef.current.scrollHeight` does nothing, and `scrollToBottom()` never works.  
**Fix**: Use a different approach — add a sentinel `<div ref={bottomRef} />` at the end of the messages list and call `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })`.

---

### Bug 6 — `SessionControl.tsx` + `CampaignHub.tsx`: Duplicate session start logic
**File**: `src/pages/CampaignHub.tsx` lines 351-394, `src/components/campaign/SessionControl.tsx` lines 131-199  
**Problem**: `CampaignHub` has its own `handleStartSession` function (line 351) AND `SessionControl` also has `handleStart`. Both create `campaign_sessions` records and update `campaigns.live_session_id`. If both are triggered (e.g., from Encounters tab and header button), two concurrent sessions can be created.  
`CampaignHub.handleStartSession` is invoked from `EncountersTab.onLaunchEncounter` callback (line 1007). `SessionControl` is the header control.  
**Fix**: `CampaignHub.handleStartSession` should delegate to the SessionControl component, or the EncountersTab callback should check for an existing session before creating one. At minimum, add a guard: if `liveSession` already exists, skip creation.

```typescript
const handleStartSession = async () => {
  if (liveSession) {
    // Session already exists, just navigate
    handleTabChange('session');
    return;
  }
  // ...rest of creation logic
};
```

---

### Bug 7 — `LiveSessionTab.tsx`: `fetchActiveEncounter` only checks `is_active=true` — misses `status`
**File**: `src/components/campaign/tabs/LiveSessionTab.tsx` line 163  
**Problem**: `fetchActiveEncounter` filters by `is_active=true` only. `EncounterControls` can set `is_active=false, status='ended'` — but if `is_active` was already false (edge case) and status is 'active', the encounter is missed. More importantly: when an encounter is ended via `EncounterControls`, `is_active` becomes `false` and `fetchActiveEncounter` returns null — but the realtime channel update fires `fetchActiveEncounter` which then correctly clears the state. This is fine. ✓ No bug.

---

### Bug 8 — `PlayerCombatActions.tsx`: `fetchAvailableMounts` / `fetchTargets` make N+1 serial queries per combatant
**File**: `src/components/player/PlayerCombatActions.tsx` lines 220-338  
**Problem**: `fetchAvailableMounts` fetches the initiative list, then for each combatant makes **individual** DB queries to get character/monster data. With 6 combatants, this is 7 sequential queries. Same for `fetchTargets`. Both run on component mount and on every initiative change.  
**Fix**: These are acceptable for the current scale (small party), but worth noting. These could be replaced with a single `select()` joining relevant tables. For now, flag as a known perf issue.

---

### Bug 9 — `PlayerInventory.tsx`: Empty state shown redundantly
**File**: `src/components/player/PlayerInventory.tsx` lines 193-204  
**Problem**: When `holdings.length === 0`, it renders `<PlayerEmptyState>` + `<AttunementManager>`. But `<AttunementManager>` fetches and shows attunement slots even when inventory is empty — it renders a full card below the empty state, which looks wrong (a "Manage Attunement" card appears below "No Items").  
**Fix**: Only show `<AttunementManager>` when there are items, specifically items with `requires_attunement = true`.

---

### Bug 10 — `PlayerCharacterSheet.tsx`: `fetchAllData` fires 10 parallel queries on mount — no deduplication
**File**: `src/components/player/PlayerCharacterSheet.tsx` lines 178-191  
**Problem**: On every `characterId` change, `fetchAllData` fires 10 simultaneous DB queries. This is fine UX-wise, but if `characterId` changes rapidly (e.g., parent re-renders), multiple sets of 10 queries run simultaneously with race conditions on the state setters.  
**Fix**: Add an `isMounted` / `AbortController` guard to skip state updates if the effect has been cleaned up (a classic React pattern).

---

### Bug 11 — `CampaignHub.tsx`: `handleStartSession` doesn't reset `loading` on path where session exists
**File**: `src/pages/CampaignHub.tsx` line 382  
**Problem**: In `handleStartSession`, if `liveSession` guard (from Bug 6 fix) is added, `setLoading(false)` is called at the end of the try block. But the original code does `setLoading(true)` at line 354 with `finally { setLoading(false) }`. If the try block uses `return` early (before the finally), `setLoading(false)` in `finally` still runs — OK. But the full page loading state being set to `true` for a session start is concerning — it causes the entire campaign hub to show the loading screen momentarily. The `loading` state is used for the initial campaigns fetch, not session control. **Fix**: Use a separate `isStartingSession` state for session start operations.

---

## Files to Update

| File | Bug(s) Fixed |
|------|-------------|
| `src/components/combat/CombatLog.tsx` | #1 (channel name collision) |
| `src/hooks/useEncounter.ts` | #2 (over-broad character subscription) |
| `src/components/combat/InitiativeTracker.tsx` | #3 (stale state setTimeout hack) |
| `src/components/player/PlayerFeatures.tsx` | #4 (missing loading state, inline empty states) |
| `src/components/player/PlayerChat.tsx` | #5 (broken scroll-to-bottom) |
| `src/pages/CampaignHub.tsx` | #6, #11 (duplicate session start, loading state misuse) |
| `src/components/player/PlayerInventory.tsx` | #9 (AttunementManager shown on empty inventory) |
| `src/components/player/PlayerCharacterSheet.tsx` | #10 (race condition on rapid characterId change) |

## Priority Order

1. **Bug #5** (Broken chat scroll) — Visible UX failure every time
2. **Bug #3** (Stale state race) — "Auto-Roll All" may silently do nothing
3. **Bug #1** (Channel collision) — Causes DMs to get wrong encounter log events
4. **Bug #6** (Duplicate sessions) — Can create phantom sessions in DB
5. **Bug #4** (PlayerFeatures loading) — Visual flicker every mount
6. **Bug #9** (AttunementManager shown on empty) — Minor visual inconsistency
7. **Bug #2** (Over-broad subscription) — Performance, non-breaking
8. **Bug #10** (Race condition on rapid ID change) — Edge case, rarely triggered
9. **Bug #11** (Loading state misuse) — CampaignHub briefly goes into full loading screen
