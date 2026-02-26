

# Audit and Fix: Character Creation Wizard -- All 12 Classes, Levels 1-20

## Issues Found

After thorough review of the wizard code, SRD data, and level-up rules, here are the issues categorized by severity:

### Critical Bugs

**1. Subclass level hardcoded to 3 (StepBasics.tsx:87)**
The wizard blocks subclass selection unless `level >= 3`, but per 5e rules:
- Cleric, Sorcerer, Warlock: subclass at level 1
- Druid, Wizard: subclass at level 2
- All others: subclass at level 3

Fix: Look up the actual `unlock_level` from the loaded subclasses data (it's already stored in the DB), or fall back to the `subclassLevel` from `CLASS_LEVEL_UP_RULES`.

**2. Grants stack on class switch (StepBasics.tsx:60)**
When a player changes their class selection, `applyGrants` merges new grants with old ones (e.g., switching from Fighter to Wizard keeps Fighter's armor/weapon proficiencies and saving throws). Should use `replaceGrantsAtom` instead, or reset grants before applying.

**3. Spellcasting ability hardcoded to WIS (StepSpells.tsx:91)**
`getKnownPreparedModel` is called with `draft.abilityScores.WIS` for ALL classes. This means Bard/Sorcerer/Warlock/Paladin (CHA casters) and Wizard (INT caster) get wrong prepared spell counts. For example, a Wizard with INT 16 (+3) would show prepared max based on WIS instead.

### Moderate Issues

**4. StepLevelChoices doesn't handle spell/cantrip gains per level**
When creating a level 5+ character, the wizard walks through levels 2-N for HP and feature choices, but never prompts for new spells or cantrips gained at each level. For known casters (Bard, Sorcerer, Warlock, Ranger), each level adds 1-2 new spells known, and cantrip counts increase at levels 4 and 10. These are silently skipped.

**5. Pact boon not persisted across level steps**
The Warlock pact boon chosen at level 3 is stored in `levelChoices[level3].pactBoon`, but the Invocation selector at levels 5+ reads from `currentChoices.pactBoon` (the current level's choices), so it can't filter invocations by pact boon prerequisite.

**6. Spells step shows for half-casters at level 1**
Ranger and Paladin get spellcasting at level 2. The `checkIsSpellcaster` function correctly identifies them as casters, but the Spells step is shown even at level 1, where they have 0 slots and 0 spells known. The step gracefully handles this by showing an error, but it's confusing.

### Minor Issues

**7. Orphan spell data in database**
~826 spells with `level: 0` and empty `classes: []` exist in `srd_spells`. They don't affect gameplay (filtered out by class-based queries) but waste storage.

**8. Paladin max level for features is 19 (not 20)**
The feature data for Paladin only goes up to level 19. Missing level 20 capstone feature.

---

## Planned Fixes

### File: `src/components/character/wizard/StepBasics.tsx`
- Replace hardcoded `minLevelForSubclass = 3` with dynamic lookup from `CLASS_LEVEL_UP_RULES[className].subclassLevel` or the `unlock_level` field from loaded subclasses
- Change `applyGrants(grants)` to first reset grants, then apply -- use `replaceGrantsAtom` or add a reset step before applying class grants
- Reset subclass-related grants when class changes

### File: `src/components/character/wizard/StepSpells.tsx`
- Replace hardcoded `draft.abilityScores.WIS` with a lookup based on the class's `spellcasting_ability` field (already available on `selectedClass`)
- Map ability name to the correct score key (e.g., "Wisdom" -> WIS, "Charisma" -> CHA, "Intelligence" -> INT)
- Gate the entire Spells step: if the class has 0 slots and 0 known spells at the current level, show an informational message instead of the full spell picker

### File: `src/components/character/CharacterWizard.tsx`
- Refine `checkIsSpellcaster` to also check `draft.level >= 2` for half-casters (Ranger, Paladin) so the Spells step doesn't appear at level 1

### File: `src/components/character/wizard/StepLevelChoices.tsx`
- Add cantrip and spell selection steps to `levelRequirements` when the class gains cantrips or known spells at a given level
- Track accumulated pact boon across levels so invocation filtering works at levels 5+
- Add `cantripGain` and `spellsKnownGain` checks using existing helper functions from `levelUpRules.ts`

---

## What Will Work After These Fixes

| Class | Subclass Level | Spellcasting | Level 1-20 Progression |
|-------|---------------|-------------|----------------------|
| Barbarian | 3 | None | HP + Rage scaling + ASI |
| Bard | 3 | Known (CHA) | Cantrips + spells + expertise + Magical Secrets |
| Cleric | 1 | Prepared (WIS) | Domain at 1 + Channel Divinity + cantrips |
| Druid | 2 | Prepared (WIS) | Circle at 2 + Wild Shape + cantrips |
| Fighter | 3 | None | Fighting Style + ASI (7 total!) + Action Surge |
| Monk | 3 | None | Ki scaling + ASI |
| Paladin | 3 | Prepared (CHA) | Fighting Style at 2 + spells at 2+ + Oath at 3 |
| Ranger | 3 | Known (WIS) | Favored Enemy/Terrain + Fighting Style + spells at 2+ |
| Rogue | 3 | None | Expertise at 1 and 6 + ASI |
| Sorcerer | 1 | Known (CHA) | Origin at 1 + Metamagic + Sorcery Points |
| Warlock | 1 | Pact (CHA) | Patron at 1 + Invocations + Pact Boon at 3 |
| Wizard | 2 | Spellbook (INT) | Tradition at 2 + Arcane Recovery + cantrips |

