
# Character Creation Wizard & Level-Up System Review

## Executive Summary

I conducted a thorough review of the character creation wizard and level-up system. The existing implementation is **quite comprehensive** for D&D 5E SRD content, covering all 12 base classes with proper level-up rules, multiclassing, and feature choices. However, I identified several gaps and areas for improvement to ensure the system "knows everything" about 5E classes.

---

## Current System Strengths

### Character Creation Wizard
- **Full class support**: All 12 SRD classes (Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard)
- **Dynamic step generation**: Steps adapt based on level and spellcasting status
- **Incremental level choices**: When creating characters above level 1, StepLevelChoices walks through each level's decisions
- **Complete proficiency system**: Skills, tools, languages, armor, weapons, saving throws
- **Equipment bundles**: Starting equipment per class
- **Spell selection**: Proper known/prepared model per class type

### Level-Up Wizard
- **Class-specific rules**: Each class has defined hit die, ASI levels, feature choice levels, resource progression
- **Spellcasting types**: Supports known casters (Bard, Sorcerer, Warlock, Ranger), prepared casters (Cleric, Druid, Wizard, Paladin), and pact magic (Warlock)
- **Feature choices**: Fighting Styles, Expertise, Metamagic, Invocations, Pact Boons, Magical Secrets, Favored Enemy/Terrain
- **Multiclass support**: Prerequisites validation, proficiency gains, spell slot calculation

---

## Identified Gaps

### 1. Missing Third Caster Subclass Handling
The system references Eldritch Knight (Fighter) and Arcane Trickster (Rogue) in multiclass rules but doesn't properly detect spellcasting when a character has these subclasses.

**Impact**: Fighter/Rogue with spellcasting subclasses won't get spell selection steps during level-up.

### 2. Incomplete Cantrip Progression Data
Some classes missing complete cantrip progression:
- Warlock missing level 16 entry in some tables
- Eldritch Knight/Arcane Trickster cantrip progression not defined

### 3. Missing Spell Swap for Character Creation
When creating a known caster at higher levels, the "spell swap on level up" mechanic isn't applied for each level during StepLevelChoices.

### 4. Subclass-Granted Spells Not Fully Integrated
`subclassSpells.ts` only has Life Domain Cleric. Missing:
- Land Druid circle spells
- Other domain spells
- Oath spells for Paladin subclasses

### 5. Class Resources Not Created During Character Creation
StepLevelChoices handles ASI, HP, and feature choices but doesn't initialize class resources (Ki Points, Rage, Sorcery Points, etc.) during character creation.

### 6. Warlock Mystic Arcanum Not in Level-Up
Warlocks gain Mystic Arcanum at levels 11, 13, 15, 17 (one 6th/7th/8th/9th level spell each). This isn't handled in LevelUpWizard.

### 7. Ranger Beast Master Companion Not Handled
Beast Master ranger subclass (level 3) should allow selecting a beast companion. No UI exists for this.

### 8. Extra Attack and Other Automatic Features Not Highlighted
While features are loaded, milestone features like Extra Attack (Fighter/Ranger/Paladin/Monk at 5) aren't specifically called out.

### 9. Multiclass Spellcasting Ability Conflict
When multiclassing between classes with different spellcasting abilities (e.g., Cleric WIS + Sorcerer CHA), there's no UI to show which ability applies to which spells.

### 10. Level 20 Capstone Features
No special handling or highlighting of level 20 capstone abilities for each class.

---

## Technical Implementation Plan

### Phase 1: Third Caster Subclass Support (Priority: High)

**Files to modify:**
- `src/lib/rules/levelUpRules.ts`
- `src/components/character/LevelUpWizard.tsx`

**Changes:**
1. Add Eldritch Knight and Arcane Trickster to CLASS_LEVEL_UP_RULES with:
   - Cantrip progression: { 3: 2, 10: 3 }
   - Spell known progression for third casters
   - Spellcasting starts at level 3 for these subclasses

2. Update LevelUpWizard to detect subclass spellcasting:
   ```typescript
   const isThirdCaster = (className: string, subclassName: string | null) => {
     return (className === "Fighter" && subclassName === "Eldritch Knight") ||
            (className === "Rogue" && subclassName === "Arcane Trickster");
   };
   ```

3. Add spell school restrictions for third casters (Abjuration/Evocation for EK, Enchantment/Illusion for AT)

### Phase 2: Mystic Arcanum for Warlocks (Priority: High)

**Files to create:**
- `src/components/character/levelup/MysticArcanumStep.tsx`

**Files to modify:**
- `src/components/character/LevelUpWizard.tsx`
- `src/lib/rules/levelUpRules.ts`

**Changes:**
1. Add Mystic Arcanum choice to Warlock featureChoiceLevels at 11, 13, 15, 17
2. Create MysticArcanumStep component for selecting one spell of the appropriate level
3. Save to character_mystic_arcanum table (already exists)

### Phase 3: Class Resource Initialization (Priority: High)

**Files to modify:**
- `src/components/character/CharacterWizard.tsx` (handleFinalizeCharacter)
- `src/components/character/wizard/StepLevelChoices.tsx`

**Changes:**
1. After character creation finalization, calculate and insert all class resources:
   - Barbarian: Rage uses
   - Bard: Bardic Inspiration
   - Cleric: Channel Divinity
   - Druid: Wild Shape
   - Fighter: Second Wind, Action Surge, Indomitable
   - Monk: Ki Points
   - Paladin: Lay on Hands, Divine Sense, Channel Divinity
   - Sorcerer: Sorcery Points
   - Warlock: (Pact slots handled separately)
   - Wizard: Arcane Recovery

2. Use the existing resourceProgression data from CLASS_LEVEL_UP_RULES

### Phase 4: Subclass Spell Lists (Priority: Medium)

**Files to modify:**
- `src/lib/rules/subclassSpells.ts`

**Changes:**
1. Expand AUTO_PREPARED_BY_SUBCLASS to include all SRD subclasses:
   - Cleric domains (Life only in SRD)
   - Druid circles (Land with terrain-based spells)
   - Paladin oaths (Devotion only in SRD)

2. Update StepSpells to merge subclass auto-prepared spells into the spell list display

### Phase 5: Spell Swap During Character Creation (Priority: Medium)

**Files to modify:**
- `src/components/character/wizard/StepLevelChoices.tsx`

**Changes:**
1. For known casters (Bard, Sorcerer, Ranger, Warlock), add spell swap option at each level
2. Track previous level's spells and allow replacing one with each new level
3. Display running total of known spells

### Phase 6: Beast Master Companion (Priority: Low)

**Files to create:**
- `src/components/character/levelup/BeastCompanionStep.tsx`

**Database changes:**
- May need new table: `character_companions`

**Changes:**
1. Detect Ranger + Beast Master subclass at level 3
2. Show beast selection (SRD beasts with CR 1/4 or lower)
3. Store companion data for character sheet display

### Phase 7: Multiclass Spellcasting Clarity (Priority: Low)

**Files to modify:**
- `src/components/player/PlayerSpellbook.tsx`
- `src/components/spells/SpellCastDialog.tsx`

**Changes:**
1. Show spellcasting ability per class in character sheet
2. Display separate spell save DCs and attack modifiers for each class
3. Clarify which slots are shared vs. pact magic

---

## Summary of Changes by File

| File | Changes |
|------|---------|
| `levelUpRules.ts` | Add third caster data, Mystic Arcanum levels, cantrip fixes |
| `LevelUpWizard.tsx` | Add Mystic Arcanum step, third caster detection, subclass spell detection |
| `CharacterWizard.tsx` | Add class resource initialization on finalization |
| `StepLevelChoices.tsx` | Add spell swap option for known casters |
| `subclassSpells.ts` | Expand auto-prepared spell lists |
| `MysticArcanumStep.tsx` | New component for Warlock 11+ spell selection |
| `BeastCompanionStep.tsx` | New component for Beast Master ranger |
| `spellRules.ts` | Add third caster spell slot calculations |

---

## Validation Checklist

After implementation, verify these scenarios work correctly:

**Character Creation:**
- [ ] Level 1 Fighter with no spells (correct)
- [ ] Level 3 Fighter Eldritch Knight gets spell selection
- [ ] Level 5 Bard has correct cantrip/spell counts
- [ ] Level 3 Warlock can select Pact Boon
- [ ] Level 10 Bard sees Magical Secrets step
- [ ] Creating a level 5 character walks through all HP/feature choices for levels 1-5
- [ ] Class resources (Ki, Rage, etc.) are created on finalization

**Level-Up:**
- [ ] Level 4 ASI/Feat choice appears for all classes
- [ ] Level 6 Fighter gets extra ASI (Fighter-specific)
- [ ] Level 11 Warlock gets Mystic Arcanum selection
- [ ] Multiclass character can choose which class to level
- [ ] Adding new class shows prerequisite check
- [ ] Wizard gets 2 spellbook spells per level
- [ ] Warlock invocations filter by prerequisites

**Multiclass:**
- [ ] Full caster + Half caster spell slots calculated correctly
- [ ] Third caster levels contribute properly
- [ ] Warlock pact slots remain separate

---

## Estimated Effort

| Phase | Complexity | Files | Est. Time |
|-------|------------|-------|-----------|
| Phase 1 (Third Casters) | Medium | 2 | 2-3 hours |
| Phase 2 (Mystic Arcanum) | Medium | 3 | 1-2 hours |
| Phase 3 (Resources) | Low | 2 | 1 hour |
| Phase 4 (Subclass Spells) | Low | 1 | 30 min |
| Phase 5 (Spell Swap) | Medium | 1 | 1-2 hours |
| Phase 6 (Beast Master) | High | 2+ | 2-3 hours |
| Phase 7 (Multiclass Clarity) | Low | 2 | 1 hour |

**Total: ~8-12 hours of development work**

Would you like me to proceed with implementing these fixes in priority order?
