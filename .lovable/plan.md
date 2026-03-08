

# Initiative Combat: Null States & Name Resolution Fix

## Problem Summary

The `initiative` table has **no foreign keys** on `combatant_id` — it's a polymorphic reference (points to either `characters` or `encounter_monsters`). Several components and the `advance-turn` edge function use PostgREST FK join syntax (`characters:combatant_id(name)`) which **silently fails** and returns null, causing names to show as empty, undefined, or "Unknown".

## Issues Found

### 1. TurnIndicator — broken FK join (names always null)
`TurnIndicator.tsx` line 71–76 uses `characters:combatant_id(name)` and `encounter_monsters:combatant_id(display_name)`. No FK exists, so both resolve to null. The component then shows nothing (returns null entirely) even when combat is active.

**Fix:** Replace the single join query with the same pattern used by `useEncounter.ts` — fetch initiative row, then separately query `characters` or `encounter_monsters` based on `combatant_type`.

### 2. SessionSpectator — broken FK join (names always null)
`SessionSpectator.tsx` line 136–137 uses the same broken FK joins. Line 238 renders `char?.name` / `monster?.display_name` which will be undefined.

**Fix:** Same approach — separate queries per combatant type, like `PlayerCombatView.tsx` does correctly.

### 3. advance-turn edge function — broken FK join
`advance-turn/index.ts` line 77 uses `character:characters(name)` on the initiative table. No FK exists. The response field `currentTurn: initiative[nextIndex].character?.name` will always be `undefined`.

**Fix:** After determining the next combatant, do a separate lookup based on `combatant_type` to get the name. Return both `currentTurn` name and type.

### 4. useEncounter.ts `addToInitiative` — wrong column name
Line 213 inserts `character_id` but the column is `combatant_id`. This function appears unused (InitiativeTracker uses its own direct insert), but it's a latent bug.

**Fix:** Change `character_id` to `combatant_id` and add `combatant_type`.

### 5. Inconsistent empty-name fallbacks
- `PlayerCombatView.tsx` falls back to `""` (empty string) for missing names
- `InitiativeTracker.tsx` falls back to `"Unknown"`
- `PlayerInitiativeDisplay.tsx` shows styled "Unidentified" with HelpCircle icon

**Fix:** Standardize: characters always have names (use `"Unknown"` as safety net), monsters use `display_name || "Unknown Creature"`. Player-facing views show "Unidentified" for hidden monsters.

## Files to Update

| File | Change |
|------|--------|
| `src/components/presence/TurnIndicator.tsx` | Replace FK join with separate queries per combatant_type |
| `src/pages/SessionSpectator.tsx` | Replace FK join with separate queries per combatant_type |
| `supabase/functions/advance-turn/index.ts` | Replace FK join; lookup name separately after determining next combatant |
| `src/hooks/useEncounter.ts` | Fix `addToInitiative` column name (`combatant_id` + `combatant_type`) |
| `src/components/player/PlayerCombatView.tsx` | Standardize empty-name fallback to `"Unknown"` / `"Unknown Creature"` |

No database migrations needed.

