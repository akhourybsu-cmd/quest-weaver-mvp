
# Fix All Character Wizard Bugs

## Overview
Six fixes addressing grant stacking, HP calculation, derived stats, finalization persistence, and display issues across the character creation wizard.

---

## Fix 1: Ancestry Grant Stacking (StepAncestry.tsx)

**Problem**: Switching ancestry calls `applyGrants` which merges with existing grants (including previous ancestry). Same issue with sub-ancestry.

**Solution**: 
- Import `replaceGrantsAtom` and use a source-aware replacement strategy
- When ancestry changes: rebuild grants from scratch using only class grants + new ancestry grants (clear sub-ancestry too)
- When sub-ancestry changes: rebuild from class + ancestry + new sub-ancestry
- Add a new `resetAndReapplyGrantsAtom` or use a helper that collects current class grants from the draft state and re-merges with new ancestry/subancestry grants

**Implementation**: 
- Create a new `replaceSourceGrantsAtom` in `characterWizard.ts` that takes a `source` string and new grants, strips old grants of that source, then merges
- Simpler approach: since ancestry step runs after class step, we can store class-only grants separately OR just re-derive. Simplest: when ancestry changes, reset grants to `emptyGrants()`, re-apply class grants from the selected class (need to reload or cache), then apply ancestry grants
- Actually simplest: add a `clearNonClassGrantsAtom` or just track sources. Let me use the practical approach -- add source tagging to the state.

**Practical approach** (minimal changes):
- In `StepAncestry.tsx`, when handling ancestry change, build combined grants from class + ancestry and use `replaceGrants` instead of `applyGrants`. The class grants can be re-derived from `draft.classId` by loading the class again, but that's async. Better: store the class SrdClass data in the wizard state or just re-derive grants.
- Simplest fix: Add a new atom `replaceAncestryGrantsAtom` that takes ancestry grants and rebuilds the full grants set by keeping only class-sourced grants (saving throws, armor, weapons) and adding ancestry grants. Since class grants only add to `savingThrows`, `armorProficiencies`, `weaponProficiencies`, we can preserve those and replace everything else from ancestry.

**Final approach** (cleanest):
- Add a `grantSourcesAtom` that stores `{ class: Grants, ancestry: Grants, subAncestry: Grants, background: Grants }` separately
- Add a derived `computedGrantsAtom` that merges all sources
- This is the right architecture but too invasive. Instead:

**Minimal viable fix**:
- In `characterWizard.ts`, add a new atom `rebuildGrantsAtom` that accepts `{ source: string, grants: Grants }` and stores per-source grants in a new `grantSources` field, then recomputes the merged `grants` field.
- Update `StepAncestry`, `StepBackground`, and `StepBasics` to use this atom.

Actually, the simplest viable approach that doesn't require architecture changes:

- **StepAncestry.tsx**: When ancestry changes, clear sub-ancestry. Then call a new action that: (1) keeps only class grants (savingThrows + armorProficiencies + weaponProficiencies from the class), (2) merges in the new ancestry grants. We'll add `rebuildGrantsFromSourcesAtom` to the state.
- **StepBackground.tsx**: Same pattern -- keep class+ancestry grants, add background grants.

Let me go with source-tracked grants in the state.

**Changes to `src/state/characterWizard.ts`**:
- Add `grantSources: { class: Grants, ancestry: Grants, subAncestry: Grants, background: Grants }` to `WizardDraft`
- Add `setSourceGrantsAtom` that sets grants for a specific source and recomputes merged `grants`
- Keep `grants` as the merged result for backward compat

**Changes to `src/components/character/wizard/StepAncestry.tsx`**:
- Use `setSourceGrantsAtom('ancestry', grants)` instead of `applyGrants(grants)`
- Use `setSourceGrantsAtom('subAncestry', grants)` for sub-ancestry
- Clear sub-ancestry source when ancestry changes

**Changes to `src/components/character/wizard/StepBackground.tsx`**:
- Use `setSourceGrantsAtom('background', grants)` instead of `applyGrants(grants)`
- Filter displayed skills/tools/languages to show only background-sourced ones

**Changes to `src/components/character/wizard/StepBasics.tsx`**:
- Use `setSourceGrantsAtom('class', grants)` instead of `replaceGrants(grants)`

---

## Fix 2: HP Calculation in Finalization (CharacterWizard.tsx)

**Problem**: `max_hp` is hardcoded to `10`. Level-up HP rolls from `StepLevelChoices` are stored in `draft.choices.featureChoices.levelChoices` but never read during finalization.

**Solution**: In `handleFinalizeCharacter`, compute max_hp:
- Level 1 HP = hitDie + CON modifier
- For levels 2+, sum up `levelChoices[i].hpRoll + conMod` for each level
- Use `calculateLevel1HP` from `dnd5e.ts` and the level choices data

```
const hitDie = CLASS_LEVEL_UP_RULES[draft.className]?.hitDie || 8;
const conMod = Math.floor((draft.abilityScores.CON - 10) / 2);
let maxHp = hitDie + conMod; // Level 1

const levelChoices = (draft.choices.featureChoices.levelChoices as LevelChoices[]) || [];
for (const lc of levelChoices) {
  maxHp += (lc.hpRoll || (Math.floor(hitDie / 2) + 1)) + conMod;
}
maxHp = Math.max(maxHp, draft.level); // Min 1 HP per level
```

---

## Fix 3: Derived Stats in Finalization (CharacterWizard.tsx)

**Problem**: `proficiency_bonus`, `ac`, `initiative_bonus`, `passive_perception`, `speed`, `spell_save_dc`, `spell_attack_mod`, saving throw values are all hardcoded or zeroed.

**Solution**: Compute all derived stats before writing to DB:
- `proficiency_bonus` = `calculateProficiencyBonus(draft.level)`
- `ac` = `10 + DEX modifier` (unarmored default)
- `initiative_bonus` = DEX modifier
- `passive_perception` = 10 + WIS modifier + (proficiency if perception proficient)
- `passive_investigation` = 10 + INT modifier + (proficiency if investigation proficient)  
- `passive_insight` = 10 + WIS modifier + (proficiency if insight proficient)
- `speed` = ancestry speed (from selected ancestry data) or 30
- `hit_die` = `d{hitDie}`
- `hit_dice_total` = `draft.level`
- `hit_dice_current` = `draft.level`
- Saving throws: compute each save value (ability mod + proficiency if proficient)
- Spellcasting: `spell_ability`, `spell_save_dc`, `spell_attack_mod` from class spellcasting ability

---

## Fix 4: Persist Level-Up Feature Choices (CharacterWizard.tsx)

**Problem**: ASI ability increases, selected feats, fighting styles, invocations, metamagic, pact boon, expertise, favored enemies/terrains, and magical secrets from `StepLevelChoices` are stored in `draft.choices.featureChoices.levelChoices` but never written to the database.

**Solution**: During finalization, iterate over `levelChoices` and:
- **ASI**: Apply ability score increases to the ability scores before writing to `character_abilities`
- **Feats**: Write to `character_features` with source "feat"
- **Fighting Style**: Write to `character_features` with source "class"
- **Expertise**: Write to `character_skills` with `expertise: true`
- **Invocations**: Write to `character_features` with source "invocation"
- **Metamagic**: Write to `character_features` with source "metamagic"
- **Pact Boon**: Write to `character_features` with source "class"
- **Favored Enemy/Terrain**: Write to `character_features`
- **Magical Secrets**: Add to spells known

---

## Fix 5: Persist Description/Personality (CharacterWizard.tsx)

**Problem**: `personality_traits`, `ideals`, `bonds`, `flaws` fields exist on the characters table but the finalization doesn't write `draft.personality`, `draft.ideals`, `draft.bonds`, `draft.flaws`.

**Solution**: Add these fields to the character update in finalization:
```
personality_traits: draft.personality || null,
ideals: draft.ideals || null,
bonds: draft.bonds || null,
flaws: draft.flaws || null,
```

---

## Fix 6: Background Display Shows All Grants (StepBackground.tsx)

**Problem**: Lines 50-53 display `draft.grants.skillProficiencies` which includes ALL skills (class + background), not just background-sourced ones.

**Solution**: With the source-tracked grants from Fix 1, display only `grantSources.background` skills/tools/languages. Or filter by checking against the selected background's known grants.

---

## Files to Modify

| File | Fixes |
|------|-------|
| `src/state/characterWizard.ts` | Fix 1: Add `grantSources` field and `setSourceGrantsAtom` |
| `src/components/character/wizard/StepBasics.tsx` | Fix 1: Use source-tracked grants |
| `src/components/character/wizard/StepAncestry.tsx` | Fix 1: Use source-tracked grants |
| `src/components/character/wizard/StepBackground.tsx` | Fix 1, 6: Use source-tracked grants, filter display |
| `src/components/character/CharacterWizard.tsx` | Fix 2, 3, 4, 5: Compute HP, derived stats, persist all choices |

## Implementation Order
1. State changes (characterWizard.ts) -- foundation for everything
2. StepBasics, StepAncestry, StepBackground -- use new source-tracked grants
3. CharacterWizard finalization -- HP, derived stats, persistence
