# Phase 2: Class Resources System — COMPLETE ✅

## Overview
Implemented a comprehensive class resources system that integrates with the rules engine, database, and character management. Resources like Ki Points, Rage, Action Surge, and Sorcery Points are now tracked automatically and restored on rest.

---

## 1. Database Integration ✅
**File: Phase 0 Migration**
- Uses existing `character_resources` table from Phase 0
- Stores: resource_key, label, current_value, max_value, max_formula, recharge type, metadata

**Enhanced Rules Engine**
- File: `src/lib/rules/rulesEngine.ts`
- Now properly creates/updates resources in database
- Handles resource upgrades (e.g., Rage increasing from 2 to 3 at level 3)
- Evaluates formulas like "level" for Ki Points and Sorcery Points

---

## 2. Resource Definitions ✅
**File: `src/lib/rules/resourceDefinitions.ts`**

Defines all class resources by class and level:
- **Fighter**: Action Surge (L2), Indomitable (L9, L13, L17)
- **Barbarian**: Rage (L1, scales at L3, L6, L12, L17, L20 = unlimited)
- **Monk**: Ki Points (L2, equals character level)
- **Cleric**: Channel Divinity (L2, L6, L18)
- **Paladin**: Channel Divinity (L3)
- **Bard**: Bardic Inspiration (L2, changes from long to short rest at L5)
- **Druid**: Wild Shape (L2, 2 uses)
- **Sorcerer**: Sorcery Points (L2, equals character level)
- **Warlock**: Mystic Arcanum (L11, L13, L15, L17)
- **Wizard**: Arcane Recovery (L2, 1 use)
- **Ranger**: None (intentionally empty)
- **Rogue**: None (intentionally empty)

Functions:
- `getResourceGrantsForLevel(className, level)` - Get resources for specific level
- `getAllResourcesForClass(className, level)` - Get all resources up to level

---

## 3. React Hook for Resources ✅
**File: `src/hooks/useCharacterResources.ts`**

Custom hook that provides:
- `resources` - Array of character resources
- `loading` - Loading state
- `updateResource(id, newValue)` - Update resource usage
- `restoreResources('short' | 'long')` - Restore resources on rest
- `reload()` - Manually reload resources

Features:
- Real-time subscriptions via Supabase channels
- Automatic updates when resources change
- Proper error handling with toast notifications

---

## 4. Resource Panel Component ✅
**File: `src/components/character/ResourcePanel.tsx`**

Beautiful UI for tracking resources:
- Displays resource name, current/max values, recharge type
- Progress bars with color coding (red when depleted, yellow when low)
- +/- buttons for DMs/players to adjust usage
- "Short Rest" and "Long Rest" buttons to restore resources
- Badges indicating Short Rest vs Long Rest recharge
- Empty state when no resources exist

Integrated into:
- Character Sheet (Overview tab)
- Can be added to Combat View for players

---

## 5. Class Feature Seeds Updated ✅
**File: `src/data/classFeatureSeeds.ts`**

Existing features already configured with grantResource:
- **Fighter L1**: Second Wind (short rest)
- **Fighter L2**: Action Surge (short rest)
- **Rogue L1-5**: Sneak Attack progression
- **Cleric L2**: Channel Divinity (short rest)
- **Warlock L2**: Pact Magic slots
- **Sorcerer L2**: Sorcery Points (long rest)

All features with resources now automatically:
- Create resource entries in database on level-up
- Calculate max values from formulas
- Set proper recharge timing

---

## 6. Integration Points ✅

### Character Creation
- Resources automatically granted when features are applied
- Formula evaluation handles level-based resources

### Level-Up
- Resources update/upgrade automatically
- E.g., Rage 2→3 at Barbarian L3
- Ki Points increase with each Monk level

### Rest Management
- Short Rest: Restores all "short" recharge resources
- Long Rest: Restores all resources
- Toast notifications confirm restoration
- Real-time updates across all clients

### Combat Tracking
- Resources visible and editable during combat
- Can be integrated with action economy system (Phase 4)
- Supports DM and player perspectives

---

## Testing Checklist

- [x] Create Fighter character and verify Second Wind + Action Surge appear
- [x] Level up to 3 and confirm resource persists
- [x] Use a resource and verify count decreases
- [x] Short rest and verify short-rest resources restore
- [x] Long rest and verify all resources restore
- [x] Real-time updates when other users modify resources
- [x] Create Monk character and verify Ki Points = level
- [x] Sorcerer Sorcery Points scale with level

---

## Next Steps

### Phase 3: Combat Mechanics (Resistance/Vulnerability/Immunity)
- Damage type handling in damage engine
- Automatic resistance/vulnerability calculations
- Display of damage types and modifications
- Integration with existing combat tracker

### Phase 4: Action Economy & Reactions
- Track actions, bonus actions, reactions per turn
- Resource consumption during combat
- Legendary actions/reactions for monsters
- Integration with turn advancement

### Phase 5: Spellcasting Enhancement
- Spell slot usage integrated with resources
- Automatic spell slot restoration
- Pact Magic vs standard spellcasting
- Spell point variant system

### Phase 6: Encounter Builder
- Pre-configure resources for NPCs
- Resource templates for common creatures
- Bulk resource management

---

## Files Changed

### New Files
- `src/lib/rules/resourceDefinitions.ts` - Resource definitions by class/level
- `src/hooks/useCharacterResources.ts` - React hook for resource management
- `src/components/character/ResourcePanel.tsx` - UI component for resources
- `PHASE_2_COMPLETE.md` - This documentation

### Modified Files
- `src/lib/rules/rulesEngine.ts` - Enhanced resource creation/upgrade logic
- `src/components/character/CharacterSheet.tsx` - Added ResourcePanel to Overview tab
- `src/data/classFeatureSeeds.ts` - Already had resource grants configured

---

## Architecture Notes

### Why Database Table vs JSONB?
- Queryable: Can filter/aggregate resources across characters
- Relational: Easy to join with characters, encounters, campaigns
- Real-time: Supabase subscriptions work perfectly
- Typed: Database constraints ensure data integrity
- Scalable: Can add indexes, views, functions

### Formula Evaluation
Currently supports:
- `'3'` - Static number
- `'level'` - Character level
- `'floor((level+1)/2)'` - Complex expressions
- Could extend to support: `'charisma_mod'`, `'proficiency_bonus'`, etc.

### Recharge Types
- `'short'` - Restored on short or long rest
- `'long'` - Restored only on long rest
- `'daily'` - Restored at dawn (future)
- `'manual'` - Must be manually restored (future)
- `'never'` - One-time use (future)

---

## Known Limitations

1. **Ability Score Dependencies**: Bardic Inspiration should scale with Charisma modifier, currently hardcoded
2. **No Usage History**: Doesn't track when/how resources were used
3. **No Conditional Resources**: Can't grant resources based on subclass (e.g., Battlemaster maneuvers)
4. **No Partial Restoration**: E.g., Wizard's Arcane Recovery recovers spell slots, not a simple resource

These will be addressed in future phases as the rules engine matures.

---

**Phase 2 Complete!** ✨
Class resources are now fully functional, tracked in the database, and integrated with character sheets and rest mechanics.
