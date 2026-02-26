
# Character Wizard Audit -- Remaining Issues

After a thorough review of all 11 wizard steps, state management, finalization logic, and rule libraries, here are the remaining issues to fix.

---

## Issue 1: Review page shows only Level 1 HP (StepReview.tsx)

**Problem**: Lines 33-35 calculate `maxHP = hitDie + conMod` -- this is only level 1 HP. For a level 5 character, the Review page will show "13 HP" when the finalized character will actually have ~40+. The finalization code (`computeDerivedStats`) correctly sums level-up HP, but the Review page does not.

**Fix**: Import `CLASS_LEVEL_UP_RULES` and replicate the full HP calculation (level 1 max + sum of levelChoices HP rolls for levels 2+), matching what `computeDerivedStats` does. This ensures the player sees accurate stats before clicking Finalize.

**File**: `src/components/character/wizard/StepReview.tsx`

---

## Issue 2: LiveSummaryPanel shows only Level 1 HP (LiveSummaryPanel.tsx)

**Problem**: Same issue as above -- line 25 shows `hitDie + conMod` regardless of character level. A level 10 Barbarian would show "14 HP" in the sidebar.

**Fix**: Same approach as Issue 1 -- compute full HP from level choices data in the draft.

**File**: `src/components/character/wizard/LiveSummaryPanel.tsx`

---

## Issue 3: Ability bonuses from ancestry not applied to scores (StepAbilities and finalization)

**Problem**: Ancestry grants `abilityBonuses` (e.g., Dwarf gets +2 CON, Elf gets +2 DEX), stored in `draft.grants.abilityBonuses`. But these bonuses are never applied to the displayed scores in StepAbilities, the LiveSummaryPanel, the Review page, or the finalization's `computeDerivedStats`. The ability scores saved to the DB are raw scores without ancestry bonuses.

**Fix**: In `computeDerivedStats` and in the Review/Summary panels, add `draft.grants.abilityBonuses` to the base ability scores before computing modifiers. The StepAbilities input fields should show the raw scores (so users can edit them), but the modifier display should include ancestry bonuses.

**Files**: `src/components/character/CharacterWizard.tsx` (computeDerivedStats), `src/components/character/wizard/StepReview.tsx`, `src/components/character/wizard/LiveSummaryPanel.tsx`, `src/components/character/wizard/StepAbilities.tsx`

---

## Issue 4: Needs are overwritten not merged when background changes (StepBackground.tsx)

**Problem**: When a background is selected on line 47, `setNeeds(needs)` replaces the class needs with background needs. If the class set `needs.skill = { required: 2, from: [...] }` and the background sets `needs.language = { required: 1, from: [...] }`, the class skill needs disappear. The `setNeedsAtom` does a shallow merge (`{ ...d.needs, ...needs }`), so if background doesn't set `skill`, the old class skill needs survive. But if background DOES set `skill` (some backgrounds grant skill choices), it overwrites the class skill needs entirely.

**Fix**: Separate class needs and background needs into distinct tracking, similar to how grants now use sources. Or, in `StepBackground`, only set the keys that the background provides, keeping existing class needs intact. The current `setNeedsAtom` shallow merge actually handles this correctly for most cases, but the issue is in `StepBasics` -- when class changes, it calls `setNeeds(needs)` which only sets `skill` and `tool`, clearing any background `language` needs. Need to ensure both steps merge rather than replace.

**File**: `src/components/character/wizard/StepBasics.tsx` -- change `setNeeds(needs)` to only set class-specific keys; `src/components/character/wizard/StepBackground.tsx` -- same for background-specific keys.

---

## Issue 5: Changing class does not reset spells/features choices (StepBasics.tsx)

**Problem**: In `handleClassChange` (line 53), when switching classes, `setClass` resets `skills` and `tools` choices, but does NOT reset `spellsKnown`, `spellsPrepared`, or `featureChoices`. If a player selects Wizard spells, then switches to Fighter, those Wizard spell IDs remain in the draft. While the Spells step won't show for Fighter, if they switch to another caster, old spell IDs may persist and cause stale data in finalization.

**Fix**: In `setClassAtom`, also reset `spellsKnown: []`, `spellsPrepared: []`, `featureChoices: {}`.

**File**: `src/state/characterWizard.ts` (setClassAtom)

---

## Issue 6: Equipment bundle auto-select doesn't persist to draft (StepEquipment.tsx)

**Problem**: Lines 63-67 auto-select the first bundle via `useEffect`, but `setEquipmentBundle` only fires when `draft.choices.equipmentBundleId` is falsy. If a user goes back from Equipment to Basics, changes class, then returns -- the old bundle ID may still be set from the previous class, pointing to a bundle that no longer exists for the new class. The UI won't highlight anything.

**Fix**: When `bundles` change (due to class change), check if the current `equipmentBundleId` exists in the new bundles. If not, auto-select the first new bundle.

**File**: `src/components/character/wizard/StepEquipment.tsx`

---

## Issue 7: Review page does not show level choices summary

**Problem**: The Review page shows `featureChoices` (from StepFeatures dialog choices), but doesn't summarize the level-up choices from StepLevelChoices -- ASI selections, fighting styles, metamagic, pact boon, invocations, expertise, etc. These are stored under `draft.choices.featureChoices.levelChoices` but the Review page doesn't parse them into a readable summary.

**Fix**: Add a "Level-Up Choices" section to StepReview that iterates over `levelChoices` and displays:
- HP per level (roll + CON mod)
- ASI or Feat chosen
- Fighting style name
- Metamagic options
- Invocations
- Pact boon
- Expertise skills
- Favored enemies/terrains

**File**: `src/components/character/wizard/StepReview.tsx`

---

## Issue 8: StepLevelChoices levelChoices array uses wrong index structure

**Problem**: `levelChoices` is initialized as an array of `{ level: N }` objects (line 82), but `updateCurrentChoices` finds the item by `c.level === currentLevel`. Meanwhile, the finalization code treats it as a Record keyed by level number string (`levelChoices[lvl]`). The array format means `levelChoices[2]` returns the object at index 2 (which might be level 4), not level 2.

Actually, looking more carefully: `computeDerivedStats` at line 166 does `for (let lvl = 2; lvl <= draft.level; lvl++)` and accesses `levelChoices[lvl]` -- but `levelChoices` is stored as an array via `setDraft`, and then finalization accesses it as `draft.choices.featureChoices.levelChoices`. The cast to `Record<string, any>` on line 614 means it iterates with `Object.entries(levelChoices)` getting array indices (0, 1, 2...) instead of level numbers (2, 3, 4...).

**Fix**: Convert `levelChoices` storage to a Record keyed by level number instead of an array. In StepLevelChoices, change the save effect to store as `{ [level]: choices }` instead of an array.

**File**: `src/components/character/wizard/StepLevelChoices.tsx`

---

## Files to Modify

| File | Issues |
|------|--------|
| `src/state/characterWizard.ts` | #5: Reset spells/features on class change |
| `src/components/character/wizard/StepReview.tsx` | #1, #3, #7: Full HP calc, ancestry bonuses, level choices summary |
| `src/components/character/wizard/LiveSummaryPanel.tsx` | #2, #3: Full HP calc, ancestry bonuses |
| `src/components/character/wizard/StepAbilities.tsx` | #3: Show ancestry bonus in modifier display |
| `src/components/character/CharacterWizard.tsx` | #3: Apply ancestry bonuses in computeDerivedStats |
| `src/components/character/wizard/StepBasics.tsx` | #4: Merge needs instead of replace |
| `src/components/character/wizard/StepBackground.tsx` | #4: Merge needs instead of replace |
| `src/components/character/wizard/StepEquipment.tsx` | #6: Validate bundle ID on class change |
| `src/components/character/wizard/StepLevelChoices.tsx` | #8: Store levelChoices as Record not array |
