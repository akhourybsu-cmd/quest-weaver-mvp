# Phase 5 Complete — Session Management & Player View

## Completed Features ✅

### Encounter Lifecycle Management
- ✅ **EncounterControls** component manages encounter state transitions
- ✅ Four distinct states: `preparing`, `active`, `paused`, `ended`
- ✅ DM can start, pause, resume, and end encounters
- ✅ Visual badges show current encounter status
- ✅ End encounter confirmation dialog prevents accidental termination
- ✅ Reset functionality to start fresh after ended encounter

**Database Changes:**
```sql
CREATE TYPE encounter_status AS ENUM ('preparing', 'active', 'paused', 'ended');
ALTER TABLE encounters ADD COLUMN status encounter_status DEFAULT 'preparing';
```

**State Transitions:**
- `preparing` → `active`: Start combat
- `active` → `paused`: Pause for break/discussion
- `paused` → `active`: Resume combat
- `active`/`paused` → `ended`: End combat (clears initiative)
- `ended` → `preparing`: Reset for new encounter

### Player Session View
- ✅ **PlayerCharacterSheet** component shows real-time character state
- ✅ Live HP tracking with visual progress bar
- ✅ Current AC, initiative bonus, and speed display
- ✅ Active conditions with duration tracking
- ✅ Active effects with descriptions
- ✅ Current round indicator during combat
- ✅ "Need Ruling" button to signal DM

**Real-time Synchronization:**
Players see instant updates when:
- HP changes (damage/healing applied by DM)
- Conditions are added or removed
- Effects are created or expire
- Round advances
- Their character data is modified

### Need Ruling System
- ✅ **NeedRulingIndicator** component shows DM which players need help
- ✅ Badge shows count of players needing ruling
- ✅ Popover lists all players awaiting DM response
- ✅ DM can clear individual ruling requests
- ✅ Real-time notifications via Supabase subscriptions

**Player Side:**
- Toggle button to signal DM for ruling
- Visual feedback when signal is active
- Toast confirmation when DM is notified

**DM Side:**
- Alert button appears in header when players need help
- Shows character names in popover
- One-click to clear each request
- Real-time updates as players signal

### Integration Points

**SessionDM Updates:**
- Encounter controls in header (replaces old start/end buttons)
- Need ruling indicator always visible when players waiting
- Proper encounter status management
- Removed old `endEncounter` function (now handled by EncounterControls)

**SessionPlayer Updates:**
- Detects active/paused encounters
- Shows PlayerCharacterSheet during combat
- Maintains original HP management for out-of-combat
- Real-time sync with DM actions

## Component Structure
```
src/components/combat/
├── EncounterControls.tsx         # Encounter lifecycle management
├── PlayerCharacterSheet.tsx      # Player's combat view
├── NeedRulingIndicator.tsx       # DM notification system
└── [existing combat components]
```

## Database Schema
```sql
-- Encounter status tracking
encounters.status: 'preparing' | 'active' | 'paused' | 'ended'

-- Player ruling requests (already existed)
player_presence.needs_ruling: boolean

-- Indexes for performance
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_player_presence_needs_ruling ON player_presence(needs_ruling) WHERE needs_ruling = true;
```

## Real-time Subscriptions

**Player Subscriptions:**
- Character updates (HP, stats, death saves)
- Conditions (added/removed)
- Effects (created/expired/updated)
- Encounter round progression

**DM Subscriptions:**
- Player presence (ruling requests)
- Character updates (all party members)
- Encounter status changes

## User Flows

### Starting Combat (DM)
1. DM clicks "Start Combat" → creates encounter in `preparing` state
2. DM adds monsters and rolls initiative
3. DM clicks "Start Encounter" → transitions to `active`
4. Players see PlayerCharacterSheet appear automatically

### Mid-Combat Break (DM)
1. DM clicks "Pause" → encounter transitions to `paused`
2. Combat remains paused (can still view/modify)
3. DM clicks "Resume" → returns to `active`

### Ending Combat (DM)
1. DM clicks "End" → confirmation dialog
2. DM confirms → clears all initiative, sets status to `ended`
3. DM can click "Reset" to return to `preparing`

### Player Requesting Ruling
1. Player clicks "Need Ruling" button
2. DM sees alert badge in header with count
3. DM clicks alert to see which players need help
4. DM addresses player's question
5. DM clicks "Clear" to resolve request

## Next Steps

### Phase 6 — Maps & Tactical Grid (Optional)
- Grid overlay and token placement
- Fog of war for DM/player separation
- AoE template tools
- Distance measurement

### Polish & Refinements
- **Long Rest Manager**: Full HP, resource, spell slot restore
- **Short Rest Manager**: Hit dice spending, partial resource recovery
- **Automatic effect ticking**: Better integration with advance-turn
- **Combat summary**: Post-encounter stats and awards
- **Mobile responsiveness**: Optimize for tablet/phone DM screens

## Known Limitations
- Player character sheet only appears during active/paused encounters
- Manual HP adjustment still available out of combat
- No visual indicator for which character is current turn (player side)
- Ruling system is simple (no message/context from player)
