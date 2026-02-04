// Document Import Helpers - Entity-specific import logic with FK resolution
import { supabase } from '@/integrations/supabase/client';
import {
  ExtractedNPC,
  ExtractedLocation,
  ExtractedItem,
  ExtractedFaction,
  ExtractedLore,
  ExtractedQuest,
  generateSlug,
} from '@/lib/documentImportSchema';

// Helper to resolve a name to an ID via case-insensitive lookup
async function resolveNameToId(
  table: 'factions' | 'locations',
  campaignId: string,
  name: string | undefined
): Promise<string | null> {
  if (!name) return null;

  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('campaign_id', campaignId)
    .ilike('name', name)
    .limit(1)
    .maybeSingle();

  return data?.id || null;
}

// Import NPC with FK resolution for faction_id and location_id
export async function importNPC(
  campaignId: string,
  npc: ExtractedNPC
): Promise<void> {
  // Resolve faction_id by name
  const factionId = await resolveNameToId('factions', campaignId, npc.faction);

  // Resolve location_id by name
  const locationId = await resolveNameToId('locations', campaignId, npc.location);

  await supabase.from('npcs').insert({
    campaign_id: campaignId,
    name: npc.name,
    role: npc.role || null,
    description: npc.description || null,
    location: npc.location || null, // Keep text for display
    location_id: locationId, // FK reference
    faction_id: factionId, // FK reference
    alignment: npc.alignment || null,
    pronouns: npc.pronouns || null,
    tags: npc.tags || [],
    player_visible: false,
  });
}

// Import Location and return pending parent link if applicable
export interface PendingParentLink {
  id: string;
  parentName: string;
}

export async function importLocation(
  campaignId: string,
  location: ExtractedLocation
): Promise<PendingParentLink | null> {
  const { data: insertedLoc } = await supabase
    .from('locations')
    .insert({
      campaign_id: campaignId,
      name: location.name,
      location_type: location.location_type || null,
      description: location.description || null,
      tags: location.tags || [],
      discovered: false,
    })
    .select('id')
    .single();

  // Return pending link for second pass if parent_location exists
  if (location.parent_location && insertedLoc) {
    return {
      id: insertedLoc.id,
      parentName: location.parent_location,
    };
  }

  return null;
}

// Second pass: resolve parent location IDs
export async function resolveLocationParents(
  campaignId: string,
  pendingLinks: PendingParentLink[]
): Promise<void> {
  for (const pending of pendingLinks) {
    const parentId = await resolveNameToId('locations', campaignId, pending.parentName);

    if (parentId) {
      await supabase
        .from('locations')
        .update({ parent_location_id: parentId })
        .eq('id', pending.id);
    }
  }
}

// Import Faction
export async function importFaction(
  campaignId: string,
  faction: ExtractedFaction
): Promise<void> {
  await supabase.from('factions').insert({
    campaign_id: campaignId,
    name: faction.name,
    description: faction.description || null,
    motto: faction.motto || null,
    influence_score: faction.influence_score || 50,
    tags: faction.tags || [],
  });
}

// Import Item with is_magical stored in properties
export async function importItem(
  campaignId: string,
  item: ExtractedItem
): Promise<void> {
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
}

// Import Lore
export async function importLore(
  campaignId: string,
  lore: ExtractedLore
): Promise<void> {
  await supabase.from('lore_pages').insert({
    campaign_id: campaignId,
    title: lore.title,
    slug: generateSlug(lore.title),
    content_md: lore.content,
    excerpt: lore.excerpt || lore.content.substring(0, 200),
    category: lore.category || 'other',
    era: lore.era || null,
    tags: lore.tags || [],
    visibility: 'DM',
  });
}

// Parse reward text to extract GP and XP values
function parseRewards(rewardsText: string | undefined): { gp: number | null; xp: number | null } {
  if (!rewardsText) return { gp: null, xp: null };

  let gp: number | null = null;
  let xp: number | null = null;

  const gpMatch = rewardsText.match(/(\d+)\s*(?:gp|gold)/i);
  const xpMatch = rewardsText.match(/(\d+)\s*(?:xp|experience)/i);

  if (gpMatch) gp = parseInt(gpMatch[1], 10);
  if (xpMatch) xp = parseInt(xpMatch[1], 10);

  return { gp, xp };
}

// Import Quest with objectives as quest_steps
export async function importQuest(
  campaignId: string,
  quest: ExtractedQuest
): Promise<void> {
  // Parse rewards text
  const { gp: rewardGp, xp: rewardXp } = parseRewards(quest.rewards);

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
}
