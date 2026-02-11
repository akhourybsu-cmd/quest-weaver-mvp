

# Comprehensive Player Hub and 5E Rules Pass -- Round 2

## Issues Found

### Critical 5E Rules Bug

**1. `spellNeedsFor` doesn't pass className to `spellKnownPrepared` (5eRules.ts line 244)**
The previous fix added per-class spell tables to `spellTables.ts`, but `spellNeedsFor` in `5eRules.ts` still calls `spellKnownPrepared(cls, level)` without the third `className` parameter. This means the class-specific tables are never actually used during character creation -- it always falls back to the Bard table for all known casters. The `classIdentifier` parameter is right there but never passed through.

Fix: Change line 244 from `spellKnownPrepared(cls, level)` to `spellKnownPrepared(cls, level, classIdentifier)`.

### Player Hub Missing Animations

**2. Player Hub views have zero stagger/entrance animations**
The campaign manager side got staggered card entrances, card-glow hover, and btn-press effects in the last pass, but none of the player-facing components received them. The following player views render cards/lists that could benefit from staggered fade-in entrances:
- `PlayerNPCDirectory.tsx` -- NPC cards
- `PlayerLocationsView.tsx` -- Location cards
- `PlayerFactionsView.tsx` -- Faction cards
- `PlayerQuestTracker.tsx` -- Quest cards
- `PlayerTimelineView.tsx` -- Timeline event cards
- `PlayerCharacterSheet.tsx` -- Core stat sections

### Player Hub Polish Issues

**3. PlayerEffects conditions don't use conditionTooltips**
The `PlayerEffects.tsx` component (rendered in the effects panel during combat) shows conditions but doesn't import or display the mechanical descriptions from `conditionTooltips.ts`. While the Conditions tab in `PlayerCombatView.tsx` was fixed in the last pass, `PlayerEffects.tsx` still shows conditions with no mechanical info. Players who look at effects see raw condition names with no explanation of what they do.

**4. Player Hub NPC cards missing card-glow hover effect**
The campaign manager cards got the `card-glow` CSS class for brass border glow on hover, but the player-side NPC, Location, and Faction cards don't use it. This creates visual inconsistency between the DM and player experience.

**5. Session Player has excessive console.log statements**
`SessionPlayer.tsx` has 6+ `console.log` calls (lines 118, 309-311, 417-419) that ship to production. These should be removed for a polished experience.

**6. PlayerInitiativeDisplay shows monster HP to players unconditionally**
In `PlayerInitiativeDisplay.tsx`, monster HP is shown if `is_visible_to_players` is true, but the similar display in `PlayerCombatView.tsx` also shows HP for monsters via `is_hp_visible_to_players`. These use two different column names (`is_visible_to_players` vs `is_hp_visible_to_players`), which could cause monsters to appear in initiative but with no HP, or vice versa. Need to verify consistency.

**7. Saving throw display doesn't indicate proficiency**
The character sheet shows saving throw modifiers but doesn't visually distinguish which saves the character is proficient in. In 5E, each class grants proficiency in exactly 2 saving throws, and players need to know which ones they're proficient in (it affects modifier calculation). A small proficiency dot or indicator would help.

### Linking and Data Flow

**8. PlayerCampaignView doesn't show subclass in character card**
Per the existing memory about `character-display-subclass-visibility`, subclass should be shown prominently alongside class and level. The `PlayerCampaignView.tsx` character card (line 155) shows "Level X Class" but doesn't query or display the subclass name. The character query (line 67) doesn't join `srd_subclasses`.

**9. Quest location link doesn't use the linked location**
`PlayerQuestTracker.tsx` line 136 shows `quest.locations[0]` (the legacy text array field) instead of the linked `quest.location?.name` (from the `location_id` foreign key join fetched on line 65). This means even when a DM properly links a quest to a location, the player sees the old text-based location instead.

---

## Proposed Changes

### Fix 1: Pass className in spellNeedsFor (5eRules.ts)
- Line 244: Change `spellKnownPrepared(cls, level)` to `spellKnownPrepared(cls, level, classIdentifier)`
- One-line fix that activates the per-class spell tables already in place

### Fix 2: Add staggered entrance animations to Player Hub views
Apply the same `animate-fade-in` with index-based `animationDelay` pattern used on the campaign manager to:
- `PlayerNPCDirectory.tsx` -- NPC card list items
- `PlayerLocationsView.tsx` -- Location card grid
- `PlayerFactionsView.tsx` -- Faction card grid
- `PlayerQuestTracker.tsx` -- Quest card items
- `PlayerTimelineView.tsx` -- Timeline event cards

Also add `card-glow` hover class to player-side cards for consistent brass glow on hover.

### Fix 3: Add condition tooltips to PlayerEffects.tsx
- Import `CONDITION_TOOLTIPS` from `conditionTooltips.ts`
- Display mechanical effects below condition names (inline, same as the mobile treatment in PlayerCombatView)

### Fix 4: Remove console.log statements from SessionPlayer.tsx
- Remove 6 debug log statements from production code

### Fix 5: Add saving throw proficiency indicators to PlayerCharacterSheet.tsx
- Query the character's class to determine which two saving throws are proficient
- Display a small filled dot next to proficient saves (matching the skill proficiency dot pattern already used)

### Fix 6: Show subclass in PlayerCampaignView character card
- Update the character query to join `srd_subclasses(name)` via the `subclass_id` foreign key
- Display "Level X Class (Subclass)" in the character card

### Fix 7: Use linked location name in PlayerQuestTracker
- Prefer `quest.location?.name` over `quest.locations?.[0]` when displaying quest location
- Fall back to legacy text field if no linked location exists

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/rules/5eRules.ts` | Pass `classIdentifier` to `spellKnownPrepared` call (1 line) |
| `src/components/player/PlayerNPCDirectory.tsx` | Add staggered fade-in and card-glow to NPC cards |
| `src/components/player/PlayerLocationsView.tsx` | Add staggered fade-in and card-glow to location cards |
| `src/components/player/PlayerFactionsView.tsx` | Add staggered fade-in and card-glow to faction cards |
| `src/components/player/PlayerQuestTracker.tsx` | Add staggered fade-in to quest cards; fix location link |
| `src/components/player/PlayerTimelineView.tsx` | Add staggered fade-in to timeline events |
| `src/components/player/PlayerEffects.tsx` | Add condition tooltips from conditionTooltips.ts |
| `src/components/player/PlayerCharacterSheet.tsx` | Add saving throw proficiency indicators |
| `src/pages/SessionPlayer.tsx` | Remove console.log statements |
| `src/pages/PlayerCampaignView.tsx` | Show subclass in character card |

## Technical Notes

- The stagger animation pattern is: `className="opacity-0 animate-fade-in"` with `style={{ animationDelay: \`${Math.min(index * 30, 300)}ms\`, animationFillMode: 'forwards' }}`
- The `card-glow` class is already defined in `index.css` from the previous animation pass
- Saving throw proficiency can be determined from the class data -- each class has exactly 2 proficient saves defined in the SRD. These are already stored in `character_proficiencies` table with type `'save'` or can be derived from the class name using a lookup table
- The `spellKnownPrepared` fix is the most mechanically important -- without it, Rangers get told they know 22 spells at level 20 (Bard count) instead of 11

