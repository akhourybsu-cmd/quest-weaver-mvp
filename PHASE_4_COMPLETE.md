# Phase 4: Action Economy & Resource Management - COMPLETE ✅

## Overview
Phase 4 implements comprehensive action economy tracking, resource consumption validation, and turn-based action management for D&D 5E combat.

## Completed Components

### 1. **Action Economy System** (`src/components/combat/ActionEconomy.tsx`)
- **Per-Turn Action Tracking:**
  - Action (main action)
  - Bonus Action  
  - Reaction
- **Visual Indicators:** Chips show used/available state with icons
- **DM Controls:** Toggle actions used/available for each combatant
- **Database Fields:** `action_used`, `bonus_action_used`, `reaction_used` on `characters` table
- **Keyboard Shortcuts:** [ = previous turn, ] = next turn

### 2. **Automatic Reset on Turn Change** (`supabase/functions/advance-turn/index.ts`)
- **Start of Turn:**
  - Resets all action economy flags to `false`
  - Only applies to characters (not monsters)
  - Automatic when turn advances
- **Start-of-Turn Effects:**
  - Processes damage-over-time effects that tick at turn start
  - Auto-applies damage via `apply-damage` edge function
- **End-of-Turn Processing:**
  - Processes end-of-turn damage effects
  - Removes expired effects/conditions
  - Cleans up duration-based effects

### 3. **Resource Tracking** (`src/components/combat/ResourceChips.tsx`)
- **Quick Resource Display:** Shows current/max for class resources
- **Inline +/- Controls:** DM can quickly adjust resources
- **Real-time Sync:** Changes propagate immediately to all viewers
- **Configurable:** DM can add/edit/remove custom resources
- **Standard Labels:** Ki, SP (Sorcery Points), HD (Hit Dice), etc.

### 4. **Character Resources System** (`src/hooks/useCharacterResources.ts`)
- **Database-backed:** Uses `character_resources` table
- **Class Resources:** Ki Points, Rage, Spell Slots, etc.
- **Recharge Types:** short, long, dawn, dusk, never
- **Formula Support:** Resources can scale with level (e.g., `level + proficiency_bonus`)
- **Rest Integration:** Automatically restores resources on rest

### 5. **Resource Definitions** (`src/lib/rules/resourceDefinitions.ts`)
- **Per-Class Resources:** Defines all standard 5E class resources
- **Level Grants:** Resources gained at specific levels
- **Formulas:** Dynamic max values based on character stats
- **Examples:**
  - Fighter: Second Wind, Action Surge
  - Barbarian: Rage, Rage Damage
  - Monk: Ki Points (scales with level)
  - Paladin: Lay on Hands pool
  - Sorcerer: Sorcery Points

### 6. **Legendary Actions Support** (Database Schema)
- **Monster Schema:** `legendary_actions` JSON field on `encounter_monsters`
- **UI Display:** Shown in `MonsterDetailDialog` and `MonsterActionDialog`
- **Not Auto-Tracked:** Legendary actions are narrative/manual (per 5E rules)
- **Future Enhancement:** Could add legendary action pool tracking

## Integration Points

### Turn Advancement Flow
```
1. DM clicks "Next Turn"
   ↓
2. advance-turn edge function:
   - Processes end-of-turn effects (current combatant)
   - Removes expired effects/conditions
   - Resets action economy for next combatant
   - Processes start-of-turn effects (next combatant)
   - Updates is_current_turn flags
   - Increments round if cycling back to top
   ↓
3. Real-time updates propagate:
   - Initiative tracker refreshes
   - Action economy chips update
   - Resource displays sync
   - Effects update
```

### Combat Tracker Integration
```typescript
// InitiativeTracker.tsx displays for each combatant:
- ActionEconomy component (A/B/R chips)
- ResourceChips component (class resources)
- InspirationToggle (inspiration tracking)
- QuickHPControls (fast HP adjustment)
- ConditionsManager (status effects)
```

### Database Schema
```sql
-- Characters table includes:
action_used BOOLEAN DEFAULT false
bonus_action_used BOOLEAN DEFAULT false  
reaction_used BOOLEAN DEFAULT false
resources JSONB -- legacy simple resources
resistances damage_type[]
vulnerabilities damage_type[]
immunities damage_type[]

-- New character_resources table:
id UUID PRIMARY KEY
character_id UUID REFERENCES characters(id)
resource_key TEXT -- 'ki_points', 'rage', etc.
label TEXT -- Display name
current_value INT
max_value INT
max_formula TEXT -- 'level', 'level + 2', etc.
recharge TEXT -- 'short', 'long', 'dawn', 'dusk', 'never'
metadata_json JSONB
```

## Testing Scenarios

### 1. Basic Action Economy
1. Start combat with Fighter
2. Click "Action" chip → becomes used/greyed
3. Click "Bonus Action" → becomes used
4. Click "Next Turn" → chips reset to available
5. Verify both DM and players see updates

### 2. Resource Consumption
1. Level 3 Monk starts combat (3 Ki Points)
2. Announce "Flurry of Blows" (costs 1 Ki)
3. DM clicks [-] on Ki chip → 3 → 2
4. Continue combat, use more Ki
5. Take short rest → Ki restores to max

### 3. Turn-Based Effects
1. Apply "Poison" effect (2d6 damage, end of turn, 3 rounds)
2. Advance turn → damage applies automatically
3. Verify in combat log
4. After 3 rounds → effect expires automatically

### 4. Legendary Actions (Manual)
1. Open monster actions for Ancient Dragon
2. Navigate to "Legendary" tab
3. See all legendary actions listed
4. DM narrates use (not auto-tracked per 5E design)

## Known Limitations

1. **Monster Action Economy:** 
   - Monsters don't have A/B/R tracking (could be added if needed)
   - Legendary actions are manual (by 5E design)
   - Reactions are tracked narratively

2. **Resource Validation:**
   - No automatic "cost checking" before actions
   - DM manually adjusts resources when abilities are used
   - Future: Could validate spell slot costs, Ki costs, etc.

3. **Reaction Timing:**
   - Reactions can be used on any turn (correctly implemented)
   - Reset at start of creature's own turn
   - No automatic "reaction prompt" system

4. **Legendary Resistance:**
   - Not auto-tracked (manual DM decision per 5E rules)
   - Could add counter in future

## Future Enhancements

### Phase 4+: Advanced Action Economy
- [ ] Automatic resource cost validation
- [ ] "Can afford?" checks before actions
- [ ] Legendary action pool tracking (3 actions, costs 1-3 each)
- [ ] Lair actions automation
- [ ] Reaction prompt system
- [ ] Multi-attack tracking
- [ ] Haste/Slow action modifications

### Phase 5: Spellcasting Integration
- [ ] Spell slot tracking as resources
- [ ] Auto-deduct spell slots on cast
- [ ] Pact Magic vs standard slots
- [ ] Prepared spell management
- [ ] Ritual casting tracking

## Architectural Notes

### Why Manual Resource Tracking?
D&D 5E relies heavily on player/DM communication about resource use. Fully automatic tracking would require:
- Parsing every ability description
- Complex rules engine for edge cases
- "Declare action" system in UI
- Heavy UX overhead

Current design balances automation (action economy reset, effect damage) with flexibility (manual resource adjustment).

### Action Economy Reset Logic
Only characters get action economy reset because:
- Monsters often have different action structures
- Monster turns are DM-controlled (less need for tracking)
- Legendary actions work differently (can be used on other turns)
- If needed, monsters can be given action economy in future

### Resource Architecture
Two systems exist:
1. **Legacy `resources` JSONB field:** Simple key-value (e.g., `{ki_points: {current: 2, max: 3}}`)
2. **New `character_resources` table:** Proper relational with formulas, recharge types

Both are supported for backwards compatibility. New resources use the table.

## Files Modified

### New Files
- `src/components/combat/ActionEconomy.tsx` - Action chips component
- `src/components/combat/ResourceChips.tsx` - Resource tracking UI
- `src/hooks/useCharacterResources.ts` - Resource management hook
- `src/lib/rules/resourceDefinitions.ts` - Class resource definitions

### Modified Files
- `src/components/combat/InitiativeTracker.tsx` - Integrated ActionEconomy
- `supabase/functions/advance-turn/index.ts` - Added action economy reset
- `src/components/monsters/MonsterActionDialog.tsx` - Legendary actions tab
- `src/components/monsters/MonsterDetailDialog.tsx` - Legendary display
- `src/lib/rules/rulesEngine.ts` - Resource creation on level up

### Database Migrations
- Added `action_used`, `bonus_action_used`, `reaction_used` to `characters`
- Created `character_resources` table
- Added `legendary_actions` to monster tables

## Summary

**Phase 4 Status: COMPLETE ✅**

All core action economy features are implemented and working:
- ✅ Per-turn action tracking (A/B/R)
- ✅ Automatic reset on turn advancement  
- ✅ Resource tracking (Ki, Rage, Spell Slots, etc.)
- ✅ Real-time synchronization
- ✅ DM controls for manual adjustment
- ✅ Integration with rest system
- ✅ Legendary action display (manual use)
- ✅ Effect-based automation (damage-over-time)

The system successfully balances 5E rules complexity with practical usability. DMs can quickly track combat flow while maintaining flexibility for edge cases and narrative choices.

**Next Phase:** Phase 5 - Spellcasting Enhancement (spell slot tracking, preparation, automatic slot consumption)
