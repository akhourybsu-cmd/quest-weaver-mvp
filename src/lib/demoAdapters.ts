/**
 * Demo Data Adapters
 * Transform RECKONING_SEED data into formats expected by tab components
 */

import { DemoCampaign } from "@/data/demoSeeds";

export function adaptDemoQuests(demoCampaign: DemoCampaign) {
  return demoCampaign.quests.map(q => ({
    id: q.id,
    title: q.title,
    arc: q.arc,
    status: q.status === "hook" ? "not_started" : q.status === "complete" ? "completed" : "in_progress",
    description: q.description,
    visibility: q.visibility,
    rewardXP: q.rewards.xp,
    rewardGP: q.rewards.gp,
    npc: q.npcs[0] ? demoCampaign.npcs.find(npc => npc.id === q.npcs[0]) : null,
    location: q.locations[0] ? demoCampaign.locations.find(loc => loc.id === q.locations[0]) : null,
    noteCount: 0,
    steps: q.objectives.map((obj, idx) => ({
      id: obj.id,
      description: obj.text,
      objectiveType: "standard",
      progressMax: 1,
      progressCurrent: obj.complete ? 1 : 0,
      step_order: idx,
    })),
  }));
}

export function adaptDemoNPCs(demoCampaign: DemoCampaign) {
  return demoCampaign.npcs.map(npc => ({
    id: npc.id,
    name: npc.name,
    pronouns: npc.pronouns,
    role_title: npc.role_title,
    public_bio: npc.public_bio,
    gm_notes: npc.gm_notes,
    secrets: npc.secrets,
    portrait_url: npc.portrait_url,
    location_id: npc.location_id,
    faction_id: npc.faction_id,
    tags: npc.tags,
    disposition: npc.disposition,
    campaign_id: demoCampaign.id,
  }));
}

export function adaptDemoLocations(demoCampaign: DemoCampaign) {
  return demoCampaign.locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    description: loc.description,
    location_type: loc.terrain,
    tags: [loc.terrain, loc.region],
    parent_location_id: null,
    path: null,
    details: {
      region: loc.region,
      terrain: loc.terrain,
      hooks: loc.hooks,
      npcIds: loc.npcIds,
      factionIds: loc.factionIds,
    },
    campaign_id: demoCampaign.id,
  }));
}

export function adaptDemoFactions(demoCampaign: DemoCampaign) {
  return demoCampaign.factions.map(faction => ({
    id: faction.id,
    name: faction.name,
    description: faction.description,
    motto: faction.motto,
    influence_score: faction.influence_score,
    tags: faction.tags,
    goals: faction.goals,
    reputation: faction.reputation,
    campaign_id: demoCampaign.id,
  }));
}

export function adaptDemoMonsters(demoCampaign: DemoCampaign) {
  return demoCampaign.monsters.map(monster => ({
    id: monster.id,
    name: monster.name,
    cr: monster.cr,
    type: monster.type,
    size: monster.size,
    hp_avg: monster.hp,
    ac: monster.ac,
  }));
}

export function adaptDemoItems(demoCampaign: DemoCampaign) {
  return demoCampaign.items.map(item => ({
    id: item.id,
    name: item.name,
    item_type: item.type,
    rarity: item.rarity,
    description: item.description,
    requires_attunement: item.attunement,
    properties: item.properties,
    campaign_id: demoCampaign.id,
  }));
}

export function adaptDemoSessions(demoCampaign: DemoCampaign) {
  return demoCampaign.sessions.map(session => ({
    id: session.id,
    title: session.title,
    session_number: session.session_number,
    started_at: session.date,
    location: session.location,
    notes: session.notes,
    status: session.status === "upcoming" ? "scheduled" : "ended",
    campaign_id: demoCampaign.id,
  }));
}

export function adaptDemoTimeline(demoCampaign: DemoCampaign) {
  return demoCampaign.timeline.map(event => ({
    id: event.id,
    event_date: event.date,
    title: event.title,
    description: event.description,
    event_type: event.type,
    session_number: event.session,
    campaign_id: demoCampaign.id,
  }));
}

export function adaptDemoNotes(demoCampaign: DemoCampaign) {
  return demoCampaign.notes.map(note => ({
    id: note.id,
    title: note.title,
    content_markdown: note.content_markdown,
    visibility: note.visibility,
    tags: note.tags,
    is_pinned: note.is_pinned,
    campaign_id: demoCampaign.id,
  }));
}

export function getDemoCampaignStats(demoCampaign: DemoCampaign) {
  const activeQuests = demoCampaign.quests.filter(q => q.status === "active").length;
  const completedQuests = demoCampaign.quests.filter(q => q.status === "complete").length;
  const nextSession = demoCampaign.sessions.find(s => s.status === "upcoming")?.date || null;

  return {
    activeQuests,
    completedQuests,
    partyMembers: 4, // Mock party count for demo
    nextSession,
  };
}
