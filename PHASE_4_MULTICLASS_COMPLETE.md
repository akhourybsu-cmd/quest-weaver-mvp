# Phase 4: Multiclassing System - Complete

## Overview
Phase 4 implements comprehensive multiclassing support per D&D 5E rules, including prerequisite validation, proficiency rules, and a user-friendly level-up flow for characters with multiple classes.

## Completed Components

### 1. Multiclass Rules Engine (`src/lib/rules/multiclassRules.ts`)

**Features:**
- **Prerequisite Validation**: All 12 classes have defined prerequisites (e.g., Paladin requires STR 13 and CHA 13)
- **Fighter Special Case**: Can use STR 13 OR DEX 13 (either meets requirement)
- **Multiclass Proficiencies**: Defines what proficiencies are gained when multiclassing INTO a class (subset of starting proficiencies per 5E rules)
- **Spellcaster Level Calculation**: Handles full casters (Bard, Cleric, Druid, Sorcerer, Wizard), half casters (Paladin, Ranger), and third casters (Eldritch Knight, Arcane Trickster)
- **Spell Slot Tables**: Complete multiclass spell slot progression for levels 1-20

**Key Functions:**
- `meetsMulticlassPrerequisites()` - Check if ability scores meet class prerequisites
- `canLeaveClass()` - Verify character meets current class prerequisites (required to multiclass out)
- `getMulticlassProficiencies()` - Get proficiencies gained when taking a level in a new class
- `calculateMulticlassSpellcasterLevel()` - Calculate combined spellcaster level for slot determination
- `getMulticlassSpellSlots()` - Get spell slots for a given multiclass spellcaster level

### 2. Add Class Dialog (`src/components/character/levelup/AddClassDialog.tsx`)

**Features:**
- Displays all 12 classes with eligibility status
- Shows prerequisites for each class
- Validates character can leave current class
- Shows proficiencies gained from multiclassing
- Automatically grants multiclass proficiencies on class addition
- Creates character_classes entry for new class

**UI Elements:**
- Class list with radio selection
- Prerequisite requirements displayed
- Eligibility indicators (✓/✗)
- Class details panel (hit die, spellcasting ability)
- Gained proficiencies preview
- Cancel/Add Class buttons

### 3. Multiclass Level Up Step (`src/components/character/levelup/MulticlassLevelUpStep.tsx`)

**Features:**
- Displays all character's current classes with levels
- Radio selection for which class to level
- Visual indicator showing level progression (e.g., "Level 5 → 6")
- Primary class badge
- "Add New Class" button for multiclassing
- Respects max level 20 and max 3 classes limits

### 4. LevelUpWizard Integration

**Changes Made:**
- Added `class-select` step for multiclass characters
- Loads character_classes data to determine multiclass state
- Auto-selects class for single-class characters
- Updates correct class level in character_classes table
- Records level history with correct class ID
- Supports adding new class during level-up flow

## Database Schema

Uses existing tables:
- `character_classes` - Tracks class_id, class_level, is_primary for each class
- `character_proficiencies` - Stores multiclass proficiency grants
- `character_level_history` - Records which class was leveled

## Multiclass Prerequisites (5E SRD)

| Class | Requirements |
|-------|--------------|
| Barbarian | STR 13 |
| Bard | CHA 13 |
| Cleric | WIS 13 |
| Druid | WIS 13 |
| Fighter | STR 13 or DEX 13 |
| Monk | DEX 13 and WIS 13 |
| Paladin | STR 13 and CHA 13 |
| Ranger | DEX 13 and WIS 13 |
| Rogue | DEX 13 |
| Sorcerer | CHA 13 |
| Warlock | CHA 13 |
| Wizard | INT 13 |

## Multiclass Proficiencies Gained

| Class | Armor | Weapons | Tools |
|-------|-------|---------|-------|
| Barbarian | Shields | Simple, Martial | - |
| Bard | Light | - | 1 skill |
| Cleric | Light, Medium, Shields | - | - |
| Druid | Light, Medium, Shields | - | - |
| Fighter | Light, Medium, Shields | Simple, Martial | - |
| Monk | - | Simple, Shortswords | - |
| Paladin | Light, Medium, Shields | Simple, Martial | - |
| Ranger | Light, Medium, Shields | Simple, Martial | 1 skill |
| Rogue | Light | Hand crossbows, Longswords, Rapiers, Shortswords | Thieves' tools, 1 skill |
| Sorcerer | - | - | - |
| Warlock | Light | Simple | - |
| Wizard | - | - | - |

## Testing Scenarios

### Basic Multiclass Addition
1. Create a level 5 Fighter with STR 13+
2. Open Level Up wizard
3. Click "Add New Class (Multiclass)"
4. Select Barbarian (requires STR 13)
5. Verify proficiencies granted
6. Complete level-up to become Fighter 5/Barbarian 1

### Prerequisite Validation
1. Create character with low CHA (e.g., 10)
2. Attempt to multiclass into Bard
3. Should see "Need: CHA 13" and be blocked

### Class Selection During Level-Up
1. With a Fighter 3/Rogue 2 character
2. Open Level Up wizard
3. Should see class selection step first
4. Select which class to level
5. Proceed with normal level-up flow

## Files Created/Modified

### New Files
- `src/lib/rules/multiclassRules.ts` - Multiclass rules engine
- `src/components/character/levelup/AddClassDialog.tsx` - Add class UI
- `src/components/character/levelup/MulticlassLevelUpStep.tsx` - Class selection step

### Modified Files
- `src/components/character/LevelUpWizard.tsx` - Integrated multiclass flow

## Known Limitations

1. **Skill Choices**: When multiclassing into classes that grant skill choices (Bard, Ranger, Rogue), the skill selection is noted but not yet implemented as an interactive step
2. **Hit Die Tracking**: Mixed hit dice for multiclass characters needs separate tracking per class
3. **Subclass Timing**: Different classes get subclasses at different levels (e.g., Cleric at 1, Fighter at 3)
4. **Spellcasting Integration**: Multiclass spell slot calculation is implemented but not yet integrated with spell preparation UI

## Future Enhancements

1. Interactive skill selection for multiclass proficiency choices
2. Per-class hit die tracking and usage during short rests
3. Multiclass spell slot display in spellcasting UI
4. Subclass selection prompts at appropriate class levels
5. Spell list merging for multiclass spellcasters

## Summary

Phase 4 provides a solid foundation for multiclassing with proper prerequisite validation, proficiency rules, and an intuitive level-up flow. Characters can now take levels in up to 3 classes while the system enforces 5E multiclassing requirements and automatically grants the correct subset of proficiencies.
