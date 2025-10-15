# Phase 5 Extended — Rest Systems & Effect Management

## Additional Features Implemented ✅

### Enhanced Rest Manager (Player)
- ✅ **Short Rest** now properly handles resource restoration
- ✅ **Long Rest** fully restores:
  - HP to maximum
  - All resources (Ki, Sorcery Points, Hit Dice, etc.)
  - Death saves (success and fail counters cleared)
  - Action economy (action, bonus action, reaction reset)
  - Temporary HP removed
- ✅ Improved feedback with detailed restoration messages
- ✅ Minimum 1 HP healing on short rest (even with bad rolls)

### Party-Wide Rest Manager (DM)
- ✅ **PartyRestManager** component for DM control
- ✅ Single-click long rest for entire party
- ✅ Confirmation dialog to prevent accidents
- ✅ Batch processes all party members
- ✅ Clears all active effects and conditions from encounters
- ✅ Detailed feedback showing what was restored

**What Gets Restored:**
- All party members' HP to max
- All resources recharged (per character)
- Death saves cleared
- Action economy reset
- All effects removed from encounters
- All conditions removed from encounters
- Temporary HP cleared

### Improved Effect/Condition Expiry
- ✅ Better error logging in advance-turn function
- ✅ More robust deletion of expired effects
- ✅ More robust deletion of expired conditions
- ✅ Separate error handling for each cleanup operation
- ✅ Console logging for debugging expiry issues

## Technical Implementation

### Resource Restoration Logic
```typescript
// Get current resources
const resources = character.resources || {};

// Restore each to max
Object.keys(resources).forEach(key => {
  if (resources[key]?.max !== undefined) {
    resources[key].current = resources[key].max;
  }
});
```

### Party-Wide Updates
```typescript
// For each party member
for (const char of characters) {
  // Fetch their data
  const { data } = await supabase
    .from("characters")
    .select("max_hp, resources")
    .eq("id", char.id)
    .single();

  // Restore resources
  const restoredResources = restoreAllResources(data.resources);

  // Update character
  await supabase
    .from("characters")
    .update({
      current_hp: data.max_hp,
      death_save_success: 0,
      death_save_fail: 0,
      resources: restoredResources,
      // ... other resets
    })
    .eq("id", char.id);
}
```

### Effect Cleanup on Long Rest
```typescript
// Get active encounters
const { data: encounters } = await supabase
  .from("encounters")
  .select("id")
  .eq("campaign_id", campaignId)
  .in("status", ["active", "paused"]);

// Clear effects and conditions for each
for (const encounter of encounters) {
  await supabase.from("effects").delete().eq("encounter_id", encounter.id);
  await supabase.from("character_conditions").delete().eq("encounter_id", encounter.id);
}
```

## Component Integration

### SessionPlayer.tsx
- RestManager already integrated
- Now properly restores resources and death saves
- Enhanced feedback to players

### SessionDM.tsx
- **NEW**: PartyRestManager in Party tab
- Located after party stats cards
- Available when characters exist in campaign
- DM can trigger party-wide long rest

## User Experience Improvements

### Player Short Rest
1. Click "Short Rest" button
2. See dialog with what will be restored
3. Confirm → Roll hit die + CON mod
4. Get toast: "Rolled 1d8 + 2 = 7 HP. Current HP: 25/30"

### Player Long Rest
1. Click "Long Rest" button
2. See comprehensive list of restorations
3. Confirm → Everything restored
4. Get toast: "Fully restored! HP, resources, death saves, and actions reset."

### DM Party Long Rest
1. Click "Long Rest (Entire Party)" in Party tab
2. See confirmation with affected character count
3. Confirm → All characters processed
4. Get toast: "Party Long Rest Complete. 4 characters fully restored. All effects and conditions cleared."

## Benefits

### For Players
- Convenient rest mechanics
- Clear feedback on what's restored
- Proper D&D 5e rules implementation
- No manual tracking needed

### For DMs
- Quick party management
- Time-saving bulk operations
- Automatic cleanup of combat effects
- One click to prepare for next session

### For the System
- Consistent state management
- Proper resource tracking
- Clean encounter transitions
- Reduced manual database manipulation

## Future Enhancements

### Potential Additions
- **Hit Dice Pool**: Track individual hit dice (current/max)
- **Spell Slot Tracking**: Visual representation of spell slots
- **Custom Class Features**: Configurable short-rest recharge abilities
- **Rest Interruptions**: Combat encounter during rest
- **Variant Rest Rules**: Gritty Realism (week-long rest)
- **Rest Activity**: Downtime activities during rest

### Known Limitations
- Resources are flexible JSONB but not class-specific
- No spell slot tracking (would need separate table)
- Short rest only rolls one hit die (could allow multiple)
- No validation of rest requirements (time, safety, etc.)
- Party rest doesn't account for individual character restrictions

## Testing Checklist

### Player Rest Testing
- ✅ Short rest heals correct amount (1d8 + CON for Rogue)
- ✅ Long rest restores HP to max
- ✅ Long rest clears death saves
- ✅ Long rest restores resources
- ✅ Temp HP removed on both rests

### DM Party Rest Testing
- ✅ All characters restored simultaneously
- ✅ Effects cleared from active encounters
- ✅ Conditions cleared from active encounters  
- ✅ Proper feedback message
- ✅ No errors with 0 characters

### Edge Cases
- ✅ Character at full HP can still rest
- ✅ Character with no resources handles gracefully
- ✅ Multiple encounters in same campaign handled
- ✅ Rest during active combat (allowed)
