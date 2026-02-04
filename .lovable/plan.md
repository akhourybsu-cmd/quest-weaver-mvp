

# AI Document Import - Entity Linking Fixes

## Summary

The AI document import feature successfully extracts entities but has several gaps in properly linking them to related database tables. This plan addresses all identified issues to ensure entities are properly connected.

---

## Issues to Fix

### 1. NPCs: Link faction_id and location_id

**Problem**: NPC's `faction` and `location` are extracted as text but not resolved to foreign keys.

**Solution**: After importing factions and locations, resolve NPC references:

```typescript
case 'npcs': {
  const npc = entity as ExtractedNPC;
  
  // Resolve faction_id by name if faction text is provided
  let factionId: string | null = null;
  if (npc.faction) {
    const { data: matchedFaction } = await supabase
      .from('factions')
      .select('id')
      .eq('campaign_id', campaignId)
      .ilike('name', npc.faction)
      .limit(1)
      .single();
    factionId = matchedFaction?.id || null;
  }
  
  // Resolve location_id by name if location text is provided
  let locationId: string | null = null;
  if (npc.location) {
    const { data: matchedLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('campaign_id', campaignId)
      .ilike('name', npc.location)
      .limit(1)
      .single();
    locationId = matchedLocation?.id || null;
  }
  
  await supabase.from('npcs').insert({
    campaign_id: campaignId,
    name: npc.name,
    role: npc.role || null,
    description: npc.description || null,
    location: npc.location || null,  // Keep text for display
    location_id: locationId,          // Add FK reference
    faction_id: factionId,            // Add FK reference
    alignment: npc.alignment || null,
    pronouns: npc.pronouns || null,
    tags: npc.tags || [],
    player_visible: false,
  });
  break;
}
```

---

### 2. Locations: Link parent_location_id

**Problem**: Location's `parent_location` text is not resolved to `parent_location_id` FK.

**Solution**: Implement two-pass import for locations:

```typescript
case 'locations': {
  const loc = entity as ExtractedLocation;
  
  // First pass: Insert without parent
  const { data: insertedLoc } = await supabase
    .from('locations')
    .insert({
      campaign_id: campaignId,
      name: loc.name,
      location_type: loc.location_type || null,
      description: loc.description || null,
      tags: loc.tags || [],
      discovered: false,
    })
    .select('id')
    .single();
  
  // Store for second pass parent resolution
  if (loc.parent_location && insertedLoc) {
    pendingParentLinks.push({
      id: insertedLoc.id,
      parentName: loc.parent_location
    });
  }
  break;
}

// After all locations imported, resolve parent links:
for (const pending of pendingParentLinks) {
  const { data: parentLoc } = await supabase
    .from('locations')
    .select('id')
    .eq('campaign_id', campaignId)
    .ilike('name', pending.parentName)
    .limit(1)
    .single();
  
  if (parentLoc) {
    await supabase
      .from('locations')
      .update({ parent_location_id: parentLoc.id })
      .eq('id', pending.id);
  }
}
```

---

### 3. Quests: Import objectives as quest_steps

**Problem**: `objectives[]` and `rewards` are extracted but not imported.

**Solution**: Create quest_steps from objectives:

```typescript
case 'quests': {
  const quest = entity as ExtractedQuest;
  
  // Parse rewards text to extract values
  let rewardGp: number | null = null;
  let rewardXp: number | null = null;
  if (quest.rewards) {
    const gpMatch = quest.rewards.match(/(\d+)\s*(?:gp|gold)/i);
    const xpMatch = quest.rewards.match(/(\d+)\s*(?:xp|experience)/i);
    if (gpMatch) rewardGp = parseInt(gpMatch[1]);
    if (xpMatch) rewardXp = parseInt(xpMatch[1]);
  }
  
  const { data: insertedQuest } = await supabase
    .from('quests')
    .insert({
      campaign_id: campaignId,
      title: quest.title,
      description: quest.description || null,
      difficulty: quest.difficulty || null,
      quest_type: quest.quest_type || null,
      tags: quest.tags || [],
      player_visible: false,
      status: 'not_started',
      reward_gp: rewardGp,
      reward_xp: rewardXp,
    })
    .select('id')
    .single();
  
  // Create quest_steps from objectives
  if (insertedQuest && quest.objectives?.length) {
    const steps = quest.objectives.map((obj, index) => ({
      quest_id: insertedQuest.id,
      description: obj,
      step_order: index + 1,
      is_completed: false,
    }));
    
    await supabase.from('quest_steps').insert(steps);
  }
  break;
}
```

---

### 4. Items: Store is_magical in properties

**Problem**: `is_magical` boolean is extracted but not stored.

**Solution**: Include in properties JSON:

```typescript
case 'items': {
  const item = entity as ExtractedItem;
  
  // Merge is_magical into properties
  const properties = {
    ...(item.properties || {}),
    is_magical: item.is_magical || false,
  };
  
  await supabase.from('items').insert({
    campaign_id: campaignId,
    name: item.name,
    type: item.type || null,
    rarity: item.rarity || 'common',
    description: item.description || null,
    properties: properties,
    tags: item.tags || [],
  });
  break;
}
```

---

## Implementation Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDocumentImport.ts` | Update `importEntity()` function with FK resolution logic |

### Import Order (Already Correct)

The current import order is already optimal for resolving references:
1. **Locations** - Import first (needed by NPCs)
2. **Factions** - Import second (needed by NPCs)
3. **NPCs** - Can now resolve location_id and faction_id
4. **Items** - No dependencies
5. **Lore** - No dependencies
6. **Quests** - Import with objectives → quest_steps

### Edge Cases to Handle

1. **Name matching**: Use `ilike` for case-insensitive matching
2. **Multiple matches**: Take first match (`.limit(1)`)
3. **No match found**: Leave FK as null, keep text reference
4. **Circular references**: Parent location may not exist yet

---

## Technical Implementation

The `importEntity()` function in `useDocumentImport.ts` will be refactored to:

1. Accept an optional `context` parameter with previously imported entity IDs
2. Perform name-based lookups to resolve foreign keys
3. Handle the two-pass location parent resolution
4. Create quest_steps entries for quest objectives
5. Parse reward strings to extract GP/XP values

---

## Testing Checklist

After implementation:
1. Upload a document with NPCs that reference locations and factions by name
2. Verify NPCs have `faction_id` and `location_id` populated correctly
3. Verify locations with parent references have `parent_location_id` set
4. Verify quest objectives create corresponding `quest_steps` entries
5. Verify quest rewards are parsed into `reward_gp` and `reward_xp`
6. Verify items with `is_magical: true` have that stored in properties
7. Test with non-matching references (should not error, just leave FK null)

