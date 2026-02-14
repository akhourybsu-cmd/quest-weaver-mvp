
# Faction System: Consistency, Associates, and Missing Fields

## Problem Summary

1. **Reputation labels are inconsistent** across 3 components ("Warm" vs "Favorable" at score 25+)
2. **Player view shows no reputation** -- only influence bars appear in `PlayerFactionsView`
3. **No "Known Associates" section** -- NPCs link to factions via `faction_id` but faction views never display those NPCs
4. **No faction role field** -- NPCs can belong to a faction but can't describe their position within it (e.g., "Spymaster", "Guild Master")
5. **`faction_type` exists in DB but is invisible** -- never shown in editor, cards, or detail views

## Plan

### 1. Extract shared reputation utilities

Create `src/lib/factionUtils.ts` with a single source of truth for:
- `getReputationLabel(score)` -- unified scale: Hated / Hostile / Unfriendly / Neutral / Warm / Friendly / Revered
- `getReputationColor(score)` -- unified color classes
- `getInfluenceLabel(score)` -- Negligible / Minor / Moderate / Strong / Dominant

Replace the duplicated functions in `FactionDirectory.tsx`, `ReputationAdjuster.tsx`, `DemoFactionsTab.tsx`, `PlayerFactionsView.tsx`, and `LoreStatBar.tsx`.

### 2. Add reputation to PlayerFactionsView

Query `faction_reputation` alongside factions so players can see their standing. Display a reputation bar + label on each faction card and in the detail dialog, matching the DM view's visual style.

### 3. Add `faction_role` column to NPCs table

A new nullable text column on the `npcs` table to store the NPC's position within their linked faction (e.g., "Spymaster", "High Priest", "Recruit"). This is separate from `role_title` which describes their general role in the world.

### 4. Add faction role field to NPC editor

In `EnhancedNPCEditor.tsx`, add a "Faction Role" text input that appears conditionally when a faction is selected. Saved to the new `faction_role` column.

### 5. Add "Known Associates" section to faction detail dialog

In `FactionDirectory.tsx`'s detail dialog, query NPCs where `faction_id` matches the selected faction. Display them as a list showing:
- NPC name and portrait (avatar)
- `faction_role` (e.g., "Spymaster") or fallback to `role_title`
- Click to navigate/view the NPC

### 6. Surface `faction_type` everywhere

- **FactionEditor**: Add a select dropdown for faction_type (Guild, Religious Order, Government, Military, Criminal, Merchant, Academic, Other)
- **FactionDirectory cards**: Show faction_type as a badge below the name
- **Detail dialog**: Display faction_type in the header area
- **Search/filter**: Allow filtering by faction_type in the directory

## Technical Details

### Database Migration

```text
npcs + faction_role (text, nullable)
```

No other schema changes needed -- `faction_type` already exists on the `factions` table.

### Files Modified

- NEW: `src/lib/factionUtils.ts` -- shared reputation/influence label and color functions
- `src/components/factions/FactionDirectory.tsx` -- add Known Associates section in detail dialog, show faction_type badge on cards, use shared utils
- `src/components/factions/FactionEditor.tsx` -- add faction_type selector, use shared utils
- `src/components/factions/ReputationAdjuster.tsx` -- use shared utils (fixes "Favorable" to "Warm")
- `src/components/player/PlayerFactionsView.tsx` -- add reputation display, use shared utils
- `src/components/npcs/EnhancedNPCEditor.tsx` -- add faction_role input (conditional on faction selection)
- `src/components/demo/tabs/DemoFactionsTab.tsx` -- use shared utils
- `src/components/lore/ui/LoreStatBar.tsx` -- use shared utils for FactionStatBar

### Implementation Order

1. Create `factionUtils.ts` and run the migration (faction_role column)
2. Update FactionEditor with faction_type dropdown
3. Update FactionDirectory cards and detail dialog (faction_type badge + Known Associates)
4. Update EnhancedNPCEditor with faction_role field
5. Update PlayerFactionsView with reputation bars
6. Replace duplicated functions in remaining files
