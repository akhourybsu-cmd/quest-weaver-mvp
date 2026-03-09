
# DM Combat Components — Bug Scan Report

## Components Scanned
- `InitiativeTracker.tsx`
- `EncounterControls.tsx`
- `CombatLog.tsx`
- `MonsterRoster.tsx`
- `QuickHPControls.tsx`
- `useEncounter.ts`
- `useCombatActions.ts`
- `MonsterActionDialog.tsx`

---

## Bugs Found

### Bug 1 — `InitiativeTracker.tsx`: Over-broad character subscription (line 78-98)
**Severity**: Performance  
**Problem**: The `character-updates:${encounterId}` channel subscribes to ALL `characters` table UPDATE events with no filter. Every HP change, spell slot update, or equipment swap for any character in the entire app fires `fetchAvailableCombatants()`. For active campaigns with 20+ characters, this causes constant unnecessary re-fetches.

**Fix**: This subscription is redundant — character stats for those in initiative are already fetched when initiative updates. Remove this subscription entirely; the `encounter_monsters` subscription and `useEncounter`'s initiative subscription handle updates.

---

### Bug 2 — `EncounterControls.tsx`: No error handling for `handleEndEncounter` operations (lines 54-74)
**Severity**: Medium  
**Problem**: `handleEndEncounter` chains two `await` calls (delete initiative, update encounter) but only shows a success toast. If the first call fails, the second still executes, leaving the encounter in a partial state (initiative intact but encounter marked as ended). No error handling exists.

**Fix**: Wrap in try/catch, check both errors, and only show success if both succeed:
```typescript
try {
  const { error: initError } = await supabase.from('initiative').delete()...;
  if (initError) throw initError;
  const { error: encError } = await supabase.from('encounters').update(...)...;
  if (encError) throw encError;
  toast({ title: "Encounter Ended", ... });
} catch (e) {
  toast({ title: "Error ending encounter", description: e.message, variant: "destructive" });
}
```

---

### Bug 3 — `MonsterActionDialog.tsx`: Hardcoded `currentRound: 1` in damage payload (line 132)
**Severity**: Medium  
**Problem**: When a monster hits a target, `currentRound: 1` is hardcoded in the `apply-damage` payload. The combat log will record all monster damage as happening in Round 1, regardless of actual round.

**Fix**: Pass `currentRound` as a prop to the dialog (it's available in parent context) and use it in the payload.

---

### Bug 4 — `MonsterRoster.tsx`: Missing dependency in `useEffect` (line 57)
**Severity**: Low (ESLint warning)  
**Problem**: `fetchMonsters` is called inside `useEffect` but not listed in dependencies. While this works due to closure capturing `encounterId`, it can cause issues if `fetchMonsters` is memoized or if additional state is added later.

**Fix**: Either add `fetchMonsters` to deps (requires `useCallback`) or inline the fetch call. For simplicity, leave as-is but add ESLint suppression comment.

---

### Bug 5 — `QuickHPControls.tsx`: `optimisticHP` not reset when props change (lines 35, 41)
**Severity**: Low  
**Problem**: If `currentHP` prop changes externally (e.g., realtime update) while `optimisticHP` is set, the component displays stale optimistic value until user interaction clears it. This can show incorrect HP if another DM or realtime source updates HP.

**Fix**: Reset `optimisticHP` when `currentHP` changes:
```typescript
useEffect(() => {
  setOptimisticHP(null);
}, [currentHP]);
```

---

### Bug 6 — `useCombatActions.ts`: `isLoading` blocks all combat actions globally (lines 27, 134, 223, 269)
**Severity**: Medium  
**Problem**: A single `isLoading` state gates ALL combat actions. If DM triggers `applyDamage` to monster A, they cannot `applyHealing` to player B until the first completes. In fast combat, this creates noticeable lag.

**Fix**: Track loading per-action or per-target. For now, acceptable as actions are fast. Flag for future improvement.

---

### Bug 7 — `CombatLog.tsx`: Virtualization height mismatch with Collapsible entries
**Severity**: Low (Visual)  
**Problem**: The virtualizer uses `estimateSize: () => 60` (line 35), but when entries are expanded via `Collapsible`, they grow taller. The virtualization doesn't recalculate row heights, causing visual overlap.

**Fix**: Call `virtualizer.measure()` after toggling expansion, or use `measureElement` with dynamic sizing. For now, this is minor — log entries rarely need expansion.

---

### Bug 8 — `useEncounter.ts`: `nextTurn` and `previousTurn` use stale `initiative` array
**Severity**: Medium  
**Problem**: `nextTurn` and `previousTurn` are wrapped in `useCallback` with `[..., initiative, ...]` deps. But when called rapidly, the `initiative` array may be stale from the closure. If DM clicks "Next Turn" twice quickly before state updates, both clicks use the same stale index, potentially skipping a combatant.

**Fix**: Use functional update pattern or fetch current state from DB. For now, the 100-200ms between clicks usually allows state to settle. Flag as known edge case.

---

## Files to Update

| File | Bug(s) Fixed |
|------|-------------|
| `src/components/combat/InitiativeTracker.tsx` | #1 (remove over-broad subscription) |
| `src/components/combat/EncounterControls.tsx` | #2 (add error handling) |
| `src/components/combat/MonsterActionDialog.tsx` | #3 (pass currentRound prop) |
| `src/components/combat/QuickHPControls.tsx` | #5 (reset optimisticHP on prop change) |

---

## Priority Order

1. **Bug #3** (Wrong round in combat log) — Data integrity issue
2. **Bug #2** (Missing error handling) — Can leave encounter in broken state
3. **Bug #1** (Over-broad subscription) — Performance drain
4. **Bug #5** (Stale optimistic HP) — Minor visual bug

Bugs #4, #6, #7, #8 are flagged but acceptable for now.
