

# Final Bug Audit -- Remaining Issues

After reviewing all previously fixed files plus adjacent systems, here are the remaining bugs that were missed or introduced by the broader architecture.

---

## Critical

### 1. `PartyRestManager` still uses legacy `resources` JSON column
**File:** `src/components/combat/PartyRestManager.tsx` lines 35-61
**Problem:** The party-wide long rest reads `charData.resources` (the JSON column) and restores it -- exactly the same bug that was fixed in `RestManager.tsx`. It also fails to reset `character_spell_slots.used_slots`, `pact_slots_used`, `mystic_arcanum_*_used`, or `hit_dice_current`. This means party long rests through the DM panel do nothing for the `character_resources` table and leave spell slots expended.
**Fix:** Rewrite to mirror `RestManager.handleLongRest` -- restore `character_resources`, reset `character_spell_slots`, restore hit dice, and clear death saves/temp HP.

### 2. `RestManager` long rest does not trigger parent data reload
**File:** `src/components/character/RestManager.tsx` / `SessionKiosk.tsx`
**Problem:** After a long rest completes, `RestManager` shows a toast but doesn't call any `onUpdate` callback. The parent components (`SessionKiosk`, `CharacterSheet`) still display stale HP/hit dice/spell slot values until the user manually navigates away and back. The `HitDiceManager` has `onHeal` but `RestManager` has no equivalent for the long rest.
**Fix:** Add an `onUpdate` callback prop to `RestManager` and invoke it after both short and long rests.

### 3. `SpellsTab` callbacks never wired -- "Prepare Spells", "Spellbook", "Custom Spell" buttons invisible
**File:** `src/components/character/CharacterSheet.tsx` lines 293-301
**Problem:** The previous fix made buttons conditional on callbacks being defined (`onOpenSpellPreparation && ...`). Since the parent never passes these callbacks, ALL three buttons are now permanently hidden. A prepared caster (Cleric/Wizard/Druid) cannot prepare spells from the character sheet at all.
**Fix:** Wire up `setShowSpellPreparation`, `setShowCustomSpell`, and `setShowSpellbook` as props to `SpellsTab`. The parent already declares these state variables (lines 43-45) but doesn't pass them.

---

## High Priority

### 4. `LevelUpWizard` doesn't update `character.hit_die` for multiclass
**File:** `src/components/character/LevelUpWizard.tsx` line 704-711
**Problem:** The `charUpdates` object updates `hit_dice_total` and `hit_dice_current` but never updates `character.hit_die`. For a Fighter (d10) who multiclasses into Wizard, the stored `hit_die` stays "d10" forever. `HitDiceManager` reads `character.hit_die` to determine the die size when spending hit dice during a short rest -- it should use the die for the class the hit die belongs to, not a single stored value. This is a deeper design issue: multiclass characters have mixed hit dice pools.
**Fix (minimal):** For single-class characters, this is fine. For multiclass, the `hit_die` field is inherently broken. As a stop-gap, store the hit die of the class being leveled. Long-term, hit dice should be tracked per-class.

### 5. `LevelUpWizard.loadFeatures` only loads features for `character.class`, not the class being leveled
**File:** `src/components/character/LevelUpWizard.tsx` lines 547-598
**Problem:** `loadFeatures` queries `srd_class_features` using `character.class` (the primary class name) and `character.subclass_id`. In a multiclass scenario where a Fighter 5 is leveling Wizard to 2, it loads Fighter features for level 6 instead of Wizard features for level 2.
**Fix:** Use `selectedClassToLevel.className` instead of `character.class`, and the class-specific subclass ID instead of `character.subclass_id`.

### 6. `LevelUpWizard.loadFeatures` fires before `selectedClassToLevel` is set
**File:** `src/components/character/LevelUpWizard.tsx` lines 371-376
**Problem:** `loadFeatures()` is called in a `useEffect` that depends on `[open, characterId]` but `selectedClassToLevel` is only set after `loadCharacter()` resolves. So `loadFeatures` runs with stale data, and when `selectedClassToLevel` changes later, `loadFeatures` doesn't re-run.
**Fix:** Add `selectedClassToLevel` to the dependency array of the features `useEffect`, and guard `loadFeatures` against `!selectedClassToLevel` for multiclass characters.

### 7. Multiclass level-up doesn't update `character.class` for the "active class" display
**File:** `src/components/character/LevelUpWizard.tsx` line 704
**Problem:** When a multiclass character levels up a non-primary class, `charUpdates` never changes `character.class`. The character header will still show "Level 6 Fighter" when they're actually Fighter 5 / Wizard 1. The `character.class` field should either show the primary class or "Fighter 5 / Wizard 1" format.
**Fix (minimal):** This is a display concern. Add a `class_display` computed field or update `character.class` to a composite string when multiclassing.

---

## Medium Priority

### 8. `CharacterSheet` header shows `character.subclass_id && " - Subclass"` instead of the actual subclass name
**File:** `src/components/character/CharacterSheet.tsx` line 167
**Problem:** The header displays a hardcoded string "Subclass" when a subclass ID exists, instead of the subclass's actual name (e.g., "Life Domain", "Champion"). The subclass name is not loaded anywhere in `CharacterSheet`.
**Fix:** Query the subclass name from `srd_subclasses` using `character.subclass_id` and display it.

### 9. `CharacterSheet` does not show `SpellSlotTracker` or spells preparation for non-caster characters with spells from feats/items
**File:** `src/components/character/CharacterSheet.tsx` line 238
**Problem:** The Spells tab is gated on `spells.length > 0`. A character who gained a spell through a feat (e.g., Magic Initiate) but hasn't had `character_spells` populated yet will never see the tab. Additionally, a character with spell slots (from multiclass) but no spells in the `character_spells` table won't see spell slots.
**Impact:** Edge case, minor.

### 10. `StepProficiencies` orphan-removal `useEffect` can cause infinite loop
**File:** `src/components/character/wizard/StepProficiencies.tsx` lines 33-39
**Problem:** The effect depends on `validSelectedSkills.length` and `selectedSkills.length`. When it calls `toggleSkill` for each orphan, that changes `selectedSkills.length`, which retriggers the effect. If the `toggleSkill` atom doesn't remove the skill (e.g., due to validation logic preventing toggle-off of granted skills), this loops forever.
**Fix:** Use a ref to track whether cleanup is in progress, or compare arrays by value instead of length.

### 11. `CharacterCard.onComplete` calls `onDelete` instead of a proper `onRefresh` callback
**File:** `src/components/character/CharacterCard.tsx` line 195
**Problem:** After level-up completes, the `LevelUpWizard.onComplete` calls `onDelete ? onDelete() : window.location.reload()`. The `onDelete` callback is meant for deletion, not refreshing after level-up. Semantically wrong and could cause issues if `onDelete` does more than just reloading (e.g., removes the card from state).
**Fix:** Add a separate `onRefresh` callback prop, or rename `onDelete` to `onDataChange`.

---

## Low Priority

### 12. `character_spell_slots` lack a unique constraint on `(character_id, spell_level)`
**Impact:** `SpellSlotTracker.initializeSlots` uses insert (not upsert), and `LevelUpWizard.updateSpellSlots` does manual check-then-insert. Without a unique constraint, concurrent operations or re-runs could create duplicate slot entries for the same spell level, causing double slots to appear.
**Fix:** Add a unique constraint via migration.

### 13. `HitDiceManager` doesn't update parent state after rolling
**File:** `src/components/character/HitDiceManager.tsx` lines 80-88
**Problem:** After rolling a hit die and updating the database, the `HitDiceManager` calls `onHeal(healing)` which just shows a toast in the parent. But the parent's `character` prop is stale -- the HP and hit dice counts in the UI don't update until a full reload. The `RestManager` wrapping it also doesn't trigger a re-fetch.
**Fix:** The `onHeal` callback should trigger a parent data refresh.

---

## Implementation Order

1. **Bug #3** (SpellsTab callbacks) -- quick wiring fix, high user impact
2. **Bug #1** (PartyRestManager) -- critical for DM workflow
3. **Bug #2** (RestManager onUpdate) -- critical for data freshness
4. **Bug #5-6** (loadFeatures multiclass) -- wrong features shown
5. **Bug #8** (subclass name display) -- cosmetic but confusing
6. **Bug #10** (orphan removal loop) -- potential crash
7. **Bug #11** (onComplete semantics) -- cleanup
8. **Bug #4, 7** (multiclass hit die/class display) -- design decisions needed
9. **Bugs #9, 12, 13** -- minor/edge cases

