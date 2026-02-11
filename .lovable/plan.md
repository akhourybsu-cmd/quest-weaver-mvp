

# Player Hub and 5E Rules Audit -- Fixes and Polish Pass

## Issues Found

### 5E Rules Bugs

**1. Athletics/Acrobatics using Saving Throw values instead of Skill modifiers (CRITICAL)**
In `PlayerCombatActions.tsx` (lines 143-146, 248-249), Athletics and Acrobatics bonuses for grapple/shove contests are incorrectly set to `str_save` and `dex_save`. These are **saving throw** modifiers, not skill modifiers. Athletics = STR mod + proficiency (if proficient in Athletics). A Rogue proficient in Athletics but not in STR saves would get the wrong bonus. The fix is to query `character_skills` for Athletics/Acrobatics proficiency and compute the correct modifier from ability scores.

**2. Bardic Inspiration starts at level 1, not level 2 (levelUpRules.ts)**
`levelUpRules.ts` line 139 lists Bardic Inspiration starting at level 1, but `resourceDefinitions.ts` line 175 grants it at level 2. Both should agree. Per 5E SRD, Bards get Bardic Inspiration at level 1. The `resourceDefinitions.ts` entry is wrong -- it should be level 1.

**3. `spellTables.ts` treats all "known" casters identically**
The known spell progression table on lines 22-44 uses Bard numbers for all "known" type casters. Ranger, Sorcerer, and Warlock have different known-spell progressions. The `spellRules.ts` file has the correct per-class tables, but `spellTables.ts` (used by the wizard `spellNeedsFor` function) doesn't differentiate. This could cause incorrect spell counts during character creation for non-Bard known casters.

**4. Monster skill bonuses hardcoded to +2 in grapple/shove (PlayerCombatActions.tsx line 261)**
Monster Athletics/Acrobatics bonuses are hardcoded to `2` instead of being derived from the monster's actual stat block (`encounter_monsters` table stores ability scores or challenge rating data). This makes grapple/shove contests inaccurate for strong or weak monsters.

### Player Hub UI/Linking Issues

**5. Condition tooltips missing from player combat view**
The `PlayerCombatView.tsx` conditions tab shows condition names but no description of what each condition does mechanically (blinded, frightened, etc.). The `conditionTooltips.ts` file exists with full 5E condition descriptions but isn't used in the player view.

**6. Quest steps not individually visible to players**
`PlayerQuestTracker.tsx` shows a progress bar for quest steps but doesn't list the individual step descriptions, so players can't see what each step actually requires.

**7. No death saving throws tracking on player side**
The character sheet shows HP dropping to 0 but has no mechanism for players to track or roll death saving throws. This is a core 5E mechanic.

---

## Proposed Changes

### Fix 1: Athletics/Acrobatics Skill Calculation (PlayerCombatActions.tsx)
- Query `character_skills` table for Athletics and Acrobatics proficiency/expertise
- Query `character_abilities` for STR and DEX scores
- Compute correct skill modifiers: ability mod + (proficiency bonus if proficient) + (proficiency bonus again if expertise)
- Replace `str_save`/`dex_save` usage for grapple/shove

### Fix 2: Bardic Inspiration Start Level (resourceDefinitions.ts)
- Change Bard resource definition from `startLevel: 2` (line 175 area) to include level 1:
  - Move the `bardic_inspiration` entry from key `2:` to key `1:`

### Fix 3: Per-Class Known Spell Counts (spellTables.ts)
- Add class-name-aware logic so `spellKnownPrepared` returns correct counts for Ranger, Sorcerer, Warlock, and Bard independently instead of using one table for all "known" type casters

### Fix 4: Condition Tooltips in Player Combat View (PlayerCombatView.tsx)
- Import condition descriptions from `conditionTooltips.ts`
- Display condition mechanical effects when a player taps/hovers on a condition in the Conditions tab

### Fix 5: Quest Step Details (PlayerQuestTracker.tsx)
- Show individual quest step descriptions below the progress bar
- Mark completed steps with a checkmark and incomplete steps with an empty circle
- This lets players know what they need to do next

### Fix 6: Death Saving Throws UI (PlayerCharacterSheet.tsx)
- When `current_hp <= 0`, display a death saving throw tracker
- Show 3 success circles and 3 failure circles
- Track state in `characters` table columns (death_save_successes, death_save_failures) if they exist, or in local state with save-on-change

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/player/PlayerCombatActions.tsx` | Fix Athletics/Acrobatics calculation to use actual skill modifiers instead of saving throws |
| `src/lib/rules/resourceDefinitions.ts` | Move Bard Bardic Inspiration grant from level 2 to level 1 |
| `src/lib/rules/spellTables.ts` | Add class-specific known spell progressions for Ranger, Sorcerer, Warlock |
| `src/components/player/PlayerCombatView.tsx` | Add condition tooltips from `conditionTooltips.ts` |
| `src/components/player/PlayerQuestTracker.tsx` | Show individual quest step descriptions |
| `src/components/player/PlayerCharacterSheet.tsx` | Add death saving throw tracker when HP is 0 |

## Technical Notes

- The Athletics/Acrobatics fix requires an additional Supabase query to `character_skills` and `character_abilities` tables, which are already queried elsewhere in the player hub
- The death saving throw tracker can use local component state initially and persist via the existing `characters` table update pattern, since `death_save_successes` and `death_save_failures` columns may need to be added via migration
- Condition tooltips use the existing `conditionTooltips.ts` file which already has all 15 standard 5E conditions defined

