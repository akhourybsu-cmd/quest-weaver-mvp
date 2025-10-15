# Phase 6 Complete: Spell & Resource Tracking

## ✅ Completed Features

### 1. **Resource Tracker Component** (`src/components/combat/ResourceTracker.tsx`)
- Visual spell slot tracking with dot indicators (filled/empty)
- Class resource tracking with reset timing (Short Rest / Long Rest)
- Real-time increment/decrement controls
- Clean UI with badge indicators showing available/total resources
- Automatic sync with character database
- Player-editable when `canEdit={true}`

### 2. **Resource Setup Dialog** (`src/components/combat/ResourceSetupDialog.tsx`)
- Full resource configuration interface for characters
- **Spell Slots:**
  - Add spell slots by level (1-9)
  - Specify total slots per level
  - Remove spell slots
  - Sorted display by level
- **Class Resources:**
  - Add custom-named resources (Rage, Ki Points, Sorcery Points, etc.)
  - Set total amount
  - Define reset timing (Short Rest or Long Rest)
  - Remove resources
- Badge-based display of configured resources
- Validation to prevent duplicates
- Saves to `characters.resources` JSONB field

### 3. **Player Character Sheet Integration**
- `ResourceTracker` now displays on player view during active/paused encounters
- Players can track and manage their own resources in real-time
- Seamless integration with existing HP/conditions/effects display

### 4. **Campaign Hub Integration**
- Added "Manage Resources" button next to "Rest" in Campaign Hub
- Players can configure their character's spell slots and class resources
- Updates persist and sync across all views

## 🎯 How It Works

### For Players:
1. **Setup Resources** (Campaign Hub):
   - Click "Manage Resources" next to the Rest button
   - Add spell slots for each level (e.g., Level 1: 4 slots, Level 2: 3 slots)
   - Add class resources (e.g., Rage: 3 uses, resets on Long Rest)
   - Save configuration

2. **Track During Combat** (Session Player):
   - View all spell slots with visual dot indicators
   - See class resources with reset timing
   - Click +/- to mark spell slots or resources as used
   - Resources update in real-time

3. **Rest to Restore**:
   - Short Rest: Restores resources marked "Short Rest"
   - Long Rest: Restores ALL resources and spell slots

### For DMs:
- Can view player resources on their character sheets
- PartyRestManager automatically restores all resources during party long rests

## 📦 Data Structure

Resources are stored in `characters.resources` as JSONB:

```typescript
{
  spellSlots: [
    { level: 1, total: 4, used: 1 },
    { level: 2, total: 3, used: 0 }
  ],
  classResources: [
    { name: "Rage", total: 3, used: 2, resetOn: "long" },
    { name: "Ki Points", total: 4, used: 1, resetOn: "short" }
  ]
}
```

## 🎨 UI Features

- **Visual Spell Slot Dots**: Filled (CircleDot) for available, empty (Circle) for used
- **Resource Badges**: Color-coded with reset timing indicators
- **Inline Controls**: Quick +/- buttons for immediate updates
- **Responsive Layout**: Works on all screen sizes
- **Real-time Updates**: Changes reflect immediately without page refresh

## 🔗 Component Integration

- ✅ `PlayerCharacterSheet` - Shows ResourceTracker during combat
- ✅ `CampaignHub` - Provides ResourceSetupDialog for configuration
- ✅ `RestManager` - Automatically restores resources based on rest type
- ✅ `PartyRestManager` - Resets all party resources on long rest

## 🚀 Next Steps - Phase 6 Extensions (Optional)

### Potential Enhancements:
1. **Spell Library Integration**
   - Add spell cards with descriptions
   - Track which spells are prepared
   - Quick-cast from spell list with automatic slot consumption

2. **Ability Usage Tracking**
   - Log when resources are used in combat
   - Track which abilities were cast and when
   - Show usage history in combat log

3. **Advanced Resource Types**
   - Hit Dice tracking
   - Temporary resources (Bardic Inspiration)
   - Charges/day abilities (1/day, 3/day)
   - Legendary Resistance tracking

4. **Auto-Resource Management**
   - Suggest spell slot based on spell level
   - Warn when resources are depleted
   - Auto-restore on encounter end

5. **Class-Specific Presets**
   - Quick setup for standard classes (Wizard, Paladin, etc.)
   - Level-based resource calculations
   - Multiclass support

---

**Phase 6 Core Complete!** The spell and resource tracking system is fully functional and integrated across player and DM views. Players can now manage spell slots and class resources with an intuitive, visual interface.
