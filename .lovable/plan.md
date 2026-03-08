
# Comprehensive Bug Audit -- Character Creation & Level-Up Systems

This plan catalogs every remaining bug found through deep code inspection across the character wizard, level-up wizard, character sheet, rest system, and rules engine. Bugs are grouped by severity.

---

## Critical Bugs (Data Corruption / Incorrect Mechanics)

### 1. `computeDerivedStats` uses `Math.max(maxHP, draft.level)` instead of `Math.max(maxHP, 1)`
**File:** `CharacterWizard.tsx` line 201
**Problem:** The finalization HP calculation floors HP at `draft.level` (e.g., a level 5 character can never have fewer than 5 HP). The 5e rule is minimum 1 HP total. This was fixed in `hpCalculation.ts` but the duplicate HP logic in `computeDerivedStats` still has the old floor.
**Fix:** Change `Math.max(maxHp, draft.level)` to `Math.max(maxHp, 1)`.

### 2. `HitDiceManager` derives CON modifier incorrectly from `con_save`
**File:** `HitDiceManager.tsx` lines 31-35
**Problem:** `getConModifier()` returns `Math.floor(character.con_save / 2)`, which is wrong. The CON save value already includes proficiency bonus (if proficient). A Cleric with 14 CON (+2 mod) and proficiency (+2 prof) has con_save=4, so the function returns `Math.floor(4/2) = 2` by luck. But a level 5 Fighter (CON 14, not prof in CON save) has con_save=2, yielding `Math.floor(2/2) = 1` instead of the correct +2 mod. It should query `character_abilities` for the actual CON score.
**Fix:** Load actual CON ability score from `character_abilities` table and compute `Math.floor((con - 10) / 2)`.

### 3. `RestManager` reads resources from a `characters.resources` JSON column instead of `character_resources` table
**File:** `RestManager.tsx` lines 30-51, 80-114
**Problem:** Both short rest and long rest read/write from `charData.resources` (a JSON column on the characters table). But the character wizard and level-up wizard persist resources to the `character_resources` table. These two systems are completely disconnected -- resting never actually restores resources like Ki, Rage, Sorcery Points, etc.
**Fix:** Rewrite rest handlers to query and update the `character_resources` table instead of the JSON column.

### 4. Long rest does not restore spell slots
**File:** `RestManager.tsx` lines 80-147
**Problem:** The long rest handler restores HP, hit dice, and the `resources` JSON, but never resets `used_slots` to 0 in `character_spell_slots`. Spell slots remain expended after a long rest.
**Fix:** Add `UPDATE character_spell_slots SET used_slots = 0 WHERE character_id = ?` to the long rest handler.

### 5. Spell swap during level-up marks replacement spell as `prepared: false`
**File:** `LevelUpWizard.tsx` lines 983-989
**Problem:** When a known caster (Bard, Sorcerer, etc.) swaps a spell on level-up, the replacement spell is inserted with `prepared: false`. For known casters, known spells should always be prepared (castable). This means the swapped-in spell won't appear in the character's castable spell list.
**Fix:** Set `prepared: true` for known casters (same logic as the new spell insertion fix at line 950-957).

### 6. Magical Secrets spells marked as `prepared: false` for Bards
**File:** `LevelUpWizard.tsx` lines 1078-1085
**Problem:** Bard is a known caster, so Magical Secrets spells should be `prepared: true` (always castable). They're inserted with `prepared: false`, meaning they show up in the character's spell list but aren't marked as usable.
**Fix:** Set `prepared: true` in the Magical Secrets insert.

---

## High-Priority Bugs (Incorrect Behavior / Wrong Calculations)

### 7. CharacterSheet `SkillsTab` double-counts proficiency for expertise
**File:** `CharacterSheet.tsx` line 475
**Problem:** The skill bonus is calculated as `modifier + (isProficient ? profBonus : 0) + (hasExpertise ? profBonus : 0)`. This means a character with expertise gets `mod + prof + prof = mod + 2*prof`, which is correct per 5e. However, `isProficient` is always true when `hasExpertise` is true, so this works by coincidence. If there's ever a data integrity issue where expertise=true but proficient=false, the bonus would be wrong. More importantly, it's confusing code that should be explicit.
**Impact:** Low risk but fragile.

### 8. CharacterSheet `OverviewTab` recalculates initiative from raw DEX instead of stored `initiative_bonus`
**File:** `CharacterSheet.tsx` line 326
**Problem:** Initiative is calculated as `calculateModifier(abilities.dex)`, ignoring the stored `character.initiative_bonus`. If a feat or feature modifies initiative (e.g., Alert feat adds +5), this won't reflect it. The stored value from finalization should be used.
**Fix:** Use `character.initiative_bonus` instead of recalculating.

### 9. `needsSubclass` in LevelUpWizard has incomplete logic for multiclass subclass checks
**File:** `LevelUpWizard.tsx` lines 333-352
**Problem:** The `needsSubclass` memo checks `character.subclass_id` (the main character field) but doesn't check per-class subclass assignments. In a multiclass scenario (e.g., Fighter 5 / Cleric 1 leveling Cleric to 2), `character.subclass_id` might be set for Fighter, but the Cleric still needs a subclass at Cleric level 2+. The code has a TODO comment acknowledging this at line 339-340 but doesn't resolve it.
**Fix:** Query `character_classes` for the specific class's subclass_id rather than relying on the top-level field.

### 10. Multiclass Paladin/Ranger half-caster level calculation uses `level >= 2` check unnecessarily
**File:** `multiclassRules.ts` lines 164-168
**Problem:** The `calculateMulticlassSpellcasterLevel` function only counts Paladin/Ranger levels if `cls.level >= 2`. While this matches RAW (half-casters get spellcasting at level 2), the `getSpellSlotInfo` in `spellRules.ts` does NOT have this guard -- it always adds `Math.floor(halfCasterLevels / 2)`. This means the two slot calculation functions disagree for a level 1 Paladin in a multiclass. The slot tables handle this naturally (floor(1/2) = 0), so the guard is unnecessary and creates inconsistency.
**Fix:** Remove the `level >= 2` guard in `calculateMulticlassSpellcasterLevel` to match `getSpellSlotInfo`.

### 11. `checkIsSpellcaster` checks class name for subclass-based casters incorrectly
**File:** `CharacterWizard.tsx` lines 266-282
**Problem:** The function checks `className.toLowerCase().includes("eldritch knight")` and `"arcane trickster"` against the class name. But the class name is "Fighter" or "Rogue" -- the subclass name is "Eldritch Knight" / "Arcane Trickster". These checks will never match, so third-caster subclasses won't get a Spells step in the creation wizard.
**Fix:** Also check `draft.subclassId` and look up the subclass name, or check against the subclass rather than class name.

---

## Medium-Priority Bugs (UI/UX / Edge Cases)

### 12. `CharacterCard` shows "Subclass Available" at level 3+ for ALL classes
**File:** `CharacterCard.tsx` line 89
**Problem:** The badge shows when `character.level >= 3 && !character.subclass_name`. But different classes get subclasses at different levels (Cleric/Sorcerer/Warlock at 1, Druid at 2, most others at 3). A level 2 Druid won't see it; a level 2 Paladin will incorrectly not see it either (Paladins get oath at 3 which is correct, but Clerics should see it from level 1).
**Fix:** Use class-specific subclass level from `CLASS_LEVEL_UP_RULES[className].subclassLevel`.

### 13. Character deletion uses `window.location.reload()` instead of callback
**File:** `CharacterCard.tsx` line 61
**Problem:** After deleting a character, the page does a full reload instead of calling a provided `onDelete` callback. This is jarring UX and breaks SPA navigation state.
**Fix:** Accept an `onDelete` callback prop and call it, or trigger the parent's `loadCharacters()`.

### 14. `StepProficiencies` filters orphaned skills but doesn't remove them from the draft
**File:** `StepProficiencies.tsx` lines 27-29
**Problem:** `validSelectedSkills` filters out skills no longer in the legal pool, and uses this for the `remaining` count. But it never actually updates `draft.choices.skills` to remove the orphaned selections. If the user proceeds without toggling, the orphaned skills persist into finalization and get saved to the database.
**Fix:** Add a `useEffect` that dispatches skill removals when orphaned skills are detected.

### 15. `useMemo` dependency array for `STEPS` is missing `checkIsSpellcaster` dependencies
**File:** `CharacterWizard.tsx` lines 285-287
**Problem:** The `STEPS` memo depends on `checkIsSpellcaster()` which reads `draft.className` and `draft.level`. The dependency array has `draft.level` and `draft.className`, but `checkIsSpellcaster` also references `draft.subclassId` (for third-casters). If the user selects an Eldritch Knight subclass, the steps won't recompute to include "Spells".
**Fix:** Add `draft.subclassId` to the dependency array (and fix bug #11 above).

### 16. Warlock pact slot cleanup in `updateSpellSlots` assumes old level is exactly `pactSlotLevel - 1`
**File:** `LevelUpWizard.tsx` lines 1347-1355
**Problem:** When the pact slot level increases (e.g., from 2 to 3 at Warlock level 5), the code deletes spell slots at `pactSlotLevel - 1` (i.e., 2). But if the character is going from Warlock 6 to 7, the pact slot jumps from level 3 to 4 -- it should delete level 3 slots, not `4-1=3` which happens to be correct. However, going from level 8 to 9 (level 4 to 5 slots), it deletes level 4 which is correct. The logic works by coincidence because pact slot levels increase by 1, but it's fragile and doesn't handle edge cases like a character being loaded at an inconsistent state.
**Impact:** Low risk but fragile.

### 17. `SpellsTab` in `CharacterSheet` receives `onOpenSpellPreparation` etc. but they are never passed
**File:** `CharacterSheet.tsx` lines 294-300 vs 697
**Problem:** The `SpellsTab` component signature expects `onOpenSpellPreparation`, `onOpenCustomSpell`, `onOpenSpellbook` callbacks. But at line 295-300, the component is rendered without these props. The buttons inside SpellsTab that call these functions will error silently (undefined is not a function).
**Fix:** Pass the appropriate state setters from the parent, or make the buttons conditional on the callbacks being defined.

---

## Low-Priority Bugs (Polish / Minor Issues)

### 18. `saveDraft` effect in CharacterWizard doesn't include `currentStep` in wizard state during auto-save updates
**File:** `CharacterWizard.tsx` line 492
**Problem:** The `wizardState.currentStep` is set in `saveDraft`, but when the user navigates steps without changing draft data, the auto-save doesn't fire (since `draft` didn't change). If they close and resume, they'll land on the step that was last auto-saved, not the step they were on.
**Fix:** Include `currentStep` in the effect dependency array alongside `draft`.

### 19. Missing `key` prop on LevelUpWizard rendered inside CharacterCard
**File:** `CharacterCard.tsx` line 177
**Problem:** The `LevelUpWizard` is rendered inside the card without any mechanism to force re-initialization between level-ups. After completing one level-up and closing, the next open might carry stale state if the effect cleanup doesn't fully reset.
**Impact:** Mitigated by the `useEffect` reset in LevelUpWizard, but adding `key={character.level}` would be more robust.

### 20. `character_proficiencies` upsert may fail without a unique constraint
**File:** `CharacterWizard.tsx` line 959-962
**Problem:** The proficiencies are upserted, but the upsert requires a unique constraint on `(character_id, type, name)`. If this constraint doesn't exist, each finalization creates duplicate proficiency rows.
**Fix:** Verify the DB has the unique constraint, or use delete-then-insert pattern.

---

## Summary

| Severity | Count | Key Areas |
|----------|-------|-----------|
| Critical | 6 | HP floor, CON mod derivation, rest system disconnected from resources/slots, spell prepared flags |
| High | 5 | Initiative, subclass detection, third-caster spells step, multiclass edge cases |
| Medium | 6 | UI badges, orphaned skills, wizard state persistence, pact slot cleanup |
| Low | 3 | Auto-save step tracking, key props, upsert constraints |
| **Total** | **20** | |

The most impactful fixes are #2-#4 (the rest system is fundamentally broken), #5-#6 (spell usability after level-up), and #1 (HP floor). These should be addressed first.
