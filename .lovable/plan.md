
# Comprehensive Scan — Bug Report & Fix Plan

## Bugs Found

### Bug 1 — `SessionKiosk.tsx`: `fetchEncounterStatus` fires a toast every time on every realtime update (line 231)
**Problem**: Every time `fetchEncounterStatus()` is called (including on initiative changes and encounter updates), it fires `toast({ title: "⚔️ Combat Active" })` if an encounter is found. This means players get spammed with "Combat Active" toasts whenever anything in the encounter changes (e.g. a monster's HP updates, turn advances, etc.).

**Fix**: Only show the toast when transitioning from no-encounter → encounter, by comparing previous state.

```typescript
// Before setting activeEncounter, check if it was already set
if (encounter && !activeEncounter) {
  toast({ title: "⚔️ Combat Active", description: "An encounter has started!" });
}
```

---

### Bug 2 — `PlayerPresence.tsx`: `toggleRaiseHand` upsert doesn't update local `needsRuling` state
**Problem**: The upsert fires and toast shows, but `setNeedsRuling` is never called after a successful upsert. The button visually stays in the old state until the realtime subscription fires `loadPresence()`, which is a race condition. If the subscription is slow, the button appears to not respond.

**Fix**: Optimistically update state before the upsert:
```typescript
setNeedsRuling(newRulingState); // optimistic
// ...do upsert
// on error, revert: setNeedsRuling(!newRulingState)
```

---

### Bug 3 — `PlayerCombatView.tsx`: Initiative loading state not shown in Initiative tab
**Problem**: `isLoading` skeleton is only rendered inside the "log" tab (line 332-337). The initiative tab has no loading state — it renders an empty list while `fetchInitiative()` runs, which involves multiple async DB calls per combatant.

**Fix**: Add loading skeletons to the initiative tab as well.

---

### Bug 4 — `PlayerCombatView.tsx`: Conditions tab empty state uses inline text (inconsistent)
**Problem**: Line 383-385 uses a plain `<div>` with `"No active conditions"` text instead of `<PlayerEmptyState>`, breaking the established pattern.

**Fix**: Replace inline text with:
```tsx
<PlayerEmptyState icon={Shield} title="No Conditions" description="You have no active conditions." />
```

---

### Bug 5 — `SessionKiosk.tsx`: `initiativeChannel` subscription never re-creates when `activeEncounter` changes
**Problem**: The realtime subscription for initiative (line 132-142) is created inside the `useEffect` that also depends on `[character.id, campaignId, activeEncounter]`. However, when `activeEncounter` first becomes non-null (after the encounter fetch), the subscription tries to filter on `encounter_id=eq.${activeEncounter}` — but at that moment `activeEncounter` may still be the *old* value (null) from closure capture. The subscription is built before `setActiveEncounter` triggers a re-render.

**Root cause**: `fetchEncounterStatus` sets `activeEncounter` via `setActiveEncounter`, but the effect that creates `initiativeChannel` reads `activeEncounter` from the closed-over value. On first mount, this is `null` so no initiative channel is created. After re-render, the effect re-runs and a channel is finally created — but now both the old cleanup and new setup run, which is correct. This should actually work via re-render, **but** the toast bug (Bug 1) means it triggers on every update, flooding the UI.

**Secondary concern**: The `initiativeChannel` filter uses `activeEncounter` from the outer closure. When the effect re-runs due to `activeEncounter` changing, the old channel is cleaned up and a new one created. This is correct behavior. **No code change needed here** — just fix Bug 1.

---

### Bug 6 — `PlayerCharacterSheet.tsx`: `getHPColor` uses undefined CSS variables
**Problem**: Line 368-371 references `'bg-buff-green'`, `'bg-warning-amber'`, `'bg-hp-red'` but the established color variables throughout other components (like `PlayerCombatView.tsx`) use `'bg-status-buff'`, `'bg-status-warning'`, `'bg-status-hp'`. This inconsistency may cause the HP bar to render in a fallback/grey color.

**Fix**: Unify to the consistent color class names:
```typescript
if (pct > 0.5) return 'bg-status-buff';
if (pct > 0.25) return 'bg-status-warning';
return 'bg-status-hp';
```

---

### Bug 7 — `PlayerSpellbook.tsx`: `fetchSpells` order by related table column may silently fail
**Problem**: Line 133 uses `.order("srd_spells(level)")`. This PostgREST foreign table ordering syntax is not guaranteed to work the same across Supabase SDK versions and may silently fail, returning spells in insertion order. `groupSpellsByLevel` already handles grouping, so this isn't catastrophic, but the sort order within groups could be unpredictable.

**Fix**: Sort client-side after fetching instead:
```typescript
const sorted = (data as any[]).sort((a, b) => a.srd_spells.level - b.srd_spells.level);
setCharacterSpells(sorted);
```

---

### Bug 8 — `PlayerWaitingRoom.tsx`: Channel name not unique — collides across tabs/components
**Problem**: Line 163 creates a channel named `'waiting-for-session'` (hardcoded, no campaignId suffix). If the user has multiple tabs or the component mounts twice in StrictMode, both subscribe to the same channel, causing unexpected behavior and "duplicate channel" warnings.

**Fix**: Use `'waiting-for-session:${campaignToCheck}'` as the channel name.

---

### Bug 9 — `SessionKiosk.tsx`: `sendBeacon` called without body (line 201)
**Problem**: Line 201 calls `navigator.sendBeacon?.(url)` with only the URL but no body. The Supabase REST API PATCH/DELETE needs a body and correct headers. This `sendBeacon` call will never work as intended — it sends a GET with empty body, which the REST endpoint ignores (or returns an error). The fallback on line 203-207 is correct but synchronous and may not complete on tab close.

**Fix**: Remove the broken `sendBeacon` call entirely (it's security-blocked on many Supabase configs anyway). The async fallback is sufficient for soft navigation, and tab-close presence is a best-effort operation.

---

### Bug 10 — `PlayerInventory.tsx`: Realtime channel filters on `campaign_id` but character items use `owner_id`
**Problem**: The realtime subscription on line 47-58 watches `holdings` filtered by `campaign_id=eq.${campaignId}`. But `fetchHoldings` fetches items where `owner_id=characterId OR owner_type=PARTY`. If another character in the same campaign receives an item, the current player's kiosk will also refetch, causing unnecessary re-renders. This is a **performance bug** (not a correctness bug), but worth fixing.

**Fix**: This is acceptable behavior for now (party inventory sharing). No code change needed.

---

## Files to Update

| File | Bug(s) Fixed |
|------|-------------|
| `src/components/session/SessionKiosk.tsx` | #1 (toast spam), #9 (sendBeacon) |
| `src/components/presence/PlayerPresence.tsx` | #2 (optimistic state update) |
| `src/components/player/PlayerCombatView.tsx` | #3 (initiative loading), #4 (conditions empty state) |
| `src/components/player/PlayerCharacterSheet.tsx` | #6 (HP color class names) |
| `src/components/player/PlayerSpellbook.tsx` | #7 (spell sort) |
| `src/components/player/PlayerWaitingRoom.tsx` | #8 (channel name collision) |

