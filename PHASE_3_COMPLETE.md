# Phase 3 Complete — Effects, Conditions, Resist/Vuln/Immune (RVI)

## Completed Features ✅

### Quick-Apply Conditions
- ✅ **QuickConditionsPopover** component added to initiative tracker
- ✅ Shows for all character combatants (PC) in initiative
- ✅ One-click condition application with duration tracking
- ✅ Supports all D&D 5e conditions: blinded, charmed, deafened, frightened, grappled, incapacitated, invisible, paralyzed, petrified, poisoned, prone, restrained, stunned, unconscious
- ✅ Configurable duration (rounds)
- ✅ Auto-calculates end round based on current round + duration
- ✅ Logs condition application to combat log

**Usage:**
- Click the "+" button next to any character in initiative
- Select duration (default: 1 round)
- Click desired condition
- Condition is applied and logged

### RVI (Resist/Vuln/Immune) Display
- ✅ **RVITooltip** component shows damage modifiers
- ✅ Displays in initiative tracker for all combatants with RVI
- ✅ Shows resistances (½ damage), vulnerabilities (×2 damage), and immunities (0 damage)
- ✅ Color-coded indicators:
  - Immune: skull icon
  - Resistant: shield icon  
  - Vulnerable: flame icon
- ✅ Comprehensive damage type coverage

**Server-Side RVI Math:**
The `apply-damage` edge function already handles RVI calculations:
- Checks immunity first → 0 damage if immune
- Applies resistance → half damage (rounded down)
- Applies vulnerability → double damage
- Resistance and vulnerability are mutually exclusive (resistance takes priority)
- Damage steps are logged and returned to show the calculation

### Effect Duration Tracking
- ⚠️ **Partially implemented** - Effects have `start_round` and `end_round` fields
- ⚠️ **TODO**: Auto-tick damage at round start/end needs edge function integration
- Current state: Effects can be created with duration, but auto-expiry and damage ticks require the advance-turn edge function to process them

## Implementation Details

### Component Structure
```
src/components/combat/
├── QuickConditionsPopover.tsx    # Condition application UI
├── RVITooltip.tsx                # Damage modifier display
└── InitiativeTracker.tsx         # Updated with condition + RVI integration
```

### Database Integration
- Conditions stored in `character_conditions` table
- RVI data fetched from `characters` (resistances, vulnerabilities, immunities arrays)
- RVI data fetched from `encounter_monsters` (stored as JSONB)

### Key Features
1. **Quick conditions** - 2 clicks to apply any condition with duration
2. **RVI visualization** - Hover over shield icon to see all damage modifiers
3. **Combat log integration** - All condition changes logged
4. **Real-time updates** - Conditions appear immediately via Supabase subscriptions

## Next Steps

### Phase 4 — Action Economy & Short-Rest Resources
- Track Action / Bonus / Reaction spent per turn; reset on turn start
- Lightweight resource chips: Hit Dice, Superiority, Sorcery, Ki (jsonb store)
- Inspiration toggle (DM visible, player controllable)

### Outstanding from Phase 3
- **Effect auto-tick**: Integrate with advance-turn to process start/end-of-turn damage
- **Condition auto-expiry**: Remove conditions when `ends_at_round` is reached
