/**
 * THE RECKONING - Demo Campaign Seed
 * A complete mid-tier campaign showcasing all Quest Weaver features
 */

// Import fantasy images
import npcShadowSorceress from "@/assets/demo/npc-shadow-sorceress.png";
import npcArchivist from "@/assets/demo/npc-archivist.png";
import npcRogue from "@/assets/demo/npc-rogue.png";
import npcPaladin from "@/assets/demo/npc-paladin.png";
import npcDragon from "@/assets/demo/npc-dragon.png";
import locArchive from "@/assets/demo/loc-archive.png";
import locShadowQuarter from "@/assets/demo/loc-shadow-quarter.png";
import locDragonLair from "@/assets/demo/loc-dragon-lair.png";
import locBarracks from "@/assets/demo/loc-barracks.png";
import locRitualChamber from "@/assets/demo/loc-ritual-chamber.png";
import factionShadowCult from "@/assets/demo/faction-shadow-cult.png";
import factionThieves from "@/assets/demo/faction-thieves.png";
import factionSilverShield from "@/assets/demo/faction-silver-shield.png";

export interface DemoCampaign {
  id: string;
  name: string;
  system: string;
  created_at: string;
  quests: DemoQuest[];
  npcs: DemoNPC[];
  locations: DemoLocation[];
  factions: DemoFaction[];
  monsters: DemoMonster[];
  items: DemoItem[];
  sessions: DemoSession[];
  timeline: DemoTimelineEvent[];
  notes: DemoNote[];
  lore: DemoLorePage[];
  encounters: DemoEncounter[];
}

export interface DemoLorePage {
  id: string;
  title: string;
  category: "history" | "region" | "magic" | "myth" | "faction" | "other";
  content: string;
  show_on_timeline: boolean;
  image_url?: string;
}

export interface DemoEncounter {
  id: string;
  name: string;
  description: string;
  difficulty: "trivial" | "easy" | "medium" | "hard" | "deadly";
  status: "planned" | "active" | "completed";
  monsters: { name: string; count: number; cr: number }[];
  location_id?: string;
}

export interface DemoQuest {
  id: string;
  title: string;
  arc: string;
  status: "hook" | "active" | "complete" | "failed";
  description: string;
  objectives: { id: string; text: string; complete: boolean }[];
  npcs: string[];
  locations: string[];
  rewards: { xp: number; gp: number; items: string[] };
  visibility: "dm" | "shared";
}

export interface DemoNPC {
  id: string;
  name: string;
  pronouns: string;
  role_title: string;
  public_bio: string;
  gm_notes: string;
  secrets: string;
  portrait_url?: string;
  location_id: string;
  faction_id?: string;
  tags: string[];
  disposition: number; // -100 to 100
}

export interface DemoLocation {
  id: string;
  name: string;
  region: string;
  terrain: string;
  description: string;
  hooks: string[];
  npcIds: string[];
  factionIds: string[];
  image_url?: string;
}

export interface DemoFaction {
  id: string;
  name: string;
  description: string;
  motto: string;
  influence_score: number;
  tags: string[];
  goals: string[];
  reputation: number; // -100 to 100
  banner_url?: string;
}

export interface DemoMonster {
  id: string;
  name: string;
  cr: number;
  type: string;
  size: string;
  hp: number;
  ac: number;
  environment: string;
  traits: string[];
}

export interface DemoItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  attunement: boolean;
  properties: Record<string, any>;
}

export interface DemoSession {
  id: string;
  title: string;
  session_number: number;
  date: string;
  location: string;
  notes?: string;
  status: "upcoming" | "past";
}

export interface DemoTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "combat" | "quest" | "social" | "political";
  session?: number;
}

export interface DemoNote {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
}

export const RECKONING_SEED: DemoCampaign = {
  id: "demo-reckoning",
  name: "The Reckoning",
  system: "D&D 5e (2014)",
  created_at: new Date().toISOString(),
  
  quests: [
    {
      id: "quest-1",
      title: "The Shadowgate Conspiracy",
      arc: "Act II: Shadows Rising",
      status: "active",
      description: "A cult of shadow sorcerers plots to tear open a portal to the Shadowfell beneath the capital. The party must infiltrate their hideout and stop the ritual before midnight.",
      objectives: [
        { id: "obj-1", text: "Investigate the Shadow Quarter murders", complete: true },
        { id: "obj-2", text: "Locate the cult's hideout beneath the old temple", complete: true },
        { id: "obj-3", text: "Infiltrate the ritual chamber", complete: false },
        { id: "obj-4", text: "Disrupt the Shadowgate ritual", complete: false },
      ],
      npcs: ["npc-1", "npc-4"],
      locations: ["loc-2", "loc-5"],
      rewards: { xp: 2500, gp: 750, items: ["item-2", "item-4"] },
      visibility: "shared",
    },
    {
      id: "quest-2",
      title: "The Stolen Grimoire",
      arc: "Act II: Shadows Rising",
      status: "active",
      description: "An ancient spellbook containing forbidden shadow magic was stolen from the Grand Archive. It must be recovered before it falls into the wrong hands.",
      objectives: [
        { id: "obj-5", text: "Question the Archive guards", complete: true },
        { id: "obj-6", text: "Track the thieves through the sewers", complete: false },
        { id: "obj-7", text: "Recover the Grimoire of Shadows", complete: false },
      ],
      npcs: ["npc-2", "npc-3"],
      locations: ["loc-1", "loc-4"],
      rewards: { xp: 1800, gp: 500, items: ["item-1"] },
      visibility: "shared",
    },
    {
      id: "quest-3",
      title: "Dragon's Tribute",
      arc: "Act I: The Awakening",
      status: "complete",
      description: "The red dragon Scorathax demanded tribute from the mountain villages. The party negotiated peace and drove the dragon from its lair.",
      objectives: [
        { id: "obj-8", text: "Meet with village elders", complete: true },
        { id: "obj-9", text: "Locate Scorathax's lair", complete: true },
        { id: "obj-10", text: "Confront the dragon", complete: true },
      ],
      npcs: ["npc-5"],
      locations: ["loc-3"],
      rewards: { xp: 5000, gp: 12000, items: ["item-3", "item-5"] },
      visibility: "shared",
    },
  ],

  npcs: [
    {
      id: "npc-1",
      name: "Cassandra Nightwhisper",
      pronouns: "she/her",
      role_title: "Shadow Cult Leader",
      public_bio: "A mysterious figure in dark robes, rarely seen in daylight. Whispers suggest she commands dark powers.",
      gm_notes: "Level 12 Shadow Sorcerer. Former court wizard who turned to dark magic after being exiled. Seeks revenge against the crown.",
      secrets: "She is actually the twin sister of the Queen, presumed dead 20 years ago. The ritual is her attempt to resurrect her murdered husband from the Shadowfell.",
      portrait_url: npcShadowSorceress,
      location_id: "loc-2",
      faction_id: "faction-1",
      tags: ["Villain", "Spellcaster", "Tragic"],
      disposition: -75,
    },
    {
      id: "npc-2",
      name: "Archivist Theron Vale",
      pronouns: "he/him",
      role_title: "Master Archivist",
      public_bio: "An elderly human scholar who has dedicated his life to preserving ancient knowledge in the Grand Archive.",
      gm_notes: "Level 5 Wizard (Divination). Has photographic memory. Knows more than he lets on about the Grimoire's contents.",
      secrets: "He secretly made a copy of key pages from the Grimoire before it was stolen. Will share this if the party earns his trust.",
      portrait_url: npcArchivist,
      location_id: "loc-1",
      tags: ["Ally", "Knowledge", "Cautious"],
      disposition: 45,
    },
    {
      id: "npc-3",
      name: "Rook",
      pronouns: "they/them",
      role_title: "Thieves' Guild Contact",
      public_bio: "A hooded figure who knows every secret in the Shadow Quarter. For the right price, they'll share what they know.",
      gm_notes: "Level 8 Rogue (Arcane Trickster). Actually works for the Veiled Hand faction as a double agent.",
      secrets: "Knows the exact location of the cult hideout and can provide a map for 500gp or a favor.",
      portrait_url: npcRogue,
      location_id: "loc-2",
      faction_id: "faction-2",
      tags: ["Neutral", "Informant", "Opportunist"],
      disposition: 0,
    },
    {
      id: "npc-4",
      name: "Captain Elara Stormwind",
      pronouns: "she/her",
      role_title: "City Watch Captain",
      public_bio: "A stern but fair paladin who leads the capital's elite guard. She takes the recent murders very seriously.",
      gm_notes: "Level 10 Paladin (Devotion). Secretly investigating corruption within the city watch. Suspects a mole feeding info to the cult.",
      secrets: "Her lieutenant is the cult informant. She's gathering evidence to expose them.",
      portrait_url: npcPaladin,
      location_id: "loc-4",
      faction_id: "faction-3",
      tags: ["Ally", "Lawful", "Determined"],
      disposition: 60,
    },
    {
      id: "npc-5",
      name: "Scorathax the Burning",
      pronouns: "he/him",
      role_title: "Adult Red Dragon",
      public_bio: "A fearsome red dragon who once terrorized the northern villages, now driven from his lair.",
      gm_notes: "Standard Adult Red Dragon stats. Currently licking his wounds in a cave further north. May return for revenge.",
      secrets: "He was actually guarding an ancient artifact in his hoard that the cult needs for their ritual. They orchestrated his removal.",
      portrait_url: npcDragon,
      location_id: "loc-3",
      tags: ["Defeated", "Dragon", "Prideful"],
      disposition: -90,
    },
  ],

  locations: [
    {
      id: "loc-1",
      name: "Grand Archive",
      region: "Capital District",
      terrain: "Urban",
      description: "A towering marble edifice housing thousands of tomes, scrolls, and artifacts. The largest repository of knowledge in the realm.",
      hooks: ["Strange shadowy figures seen near the restricted section at night", "Ancient prophecies mention a 'Grimoire of Shadows'"],
      npcIds: ["npc-2"],
      factionIds: ["faction-3"],
      image_url: locArchive,
    },
    {
      id: "loc-2",
      name: "Shadow Quarter",
      region: "Capital Undercity",
      terrain: "Urban",
      description: "A maze of narrow alleys, abandoned warehouses, and hidden passages. The city watch rarely patrols here.",
      hooks: ["Locals whisper of disappearances and strange lights", "The old Raven Temple has been sealed for decades"],
      npcIds: ["npc-1", "npc-3"],
      factionIds: ["faction-1", "faction-2"],
      image_url: locShadowQuarter,
    },
    {
      id: "loc-3",
      name: "Scorathax's Lair (Crimson Peak)",
      region: "Northern Mountains",
      terrain: "Mountain",
      description: "A volcanic cave system filled with scorched tunnels and a massive hoard chamber. Recently abandoned.",
      hooks: ["Dragon tracks lead further north", "Unusual magical residue detected in the deepest chamber"],
      npcIds: ["npc-5"],
      factionIds: [],
      image_url: locDragonLair,
    },
    {
      id: "loc-4",
      name: "City Watch Headquarters",
      region: "Capital District",
      terrain: "Urban",
      description: "A fortified barracks and training ground for the capital's defenders. The main command center for law enforcement.",
      hooks: ["Increased patrols around the Shadow Quarter", "Captain Stormwind has posted a bounty for information"],
      npcIds: ["npc-4"],
      factionIds: ["faction-3"],
      image_url: locBarracks,
    },
    {
      id: "loc-5",
      name: "Ritual Chamber (Beneath Old Raven Temple)",
      region: "Shadow Quarter Depths",
      terrain: "Underground",
      description: "A vast circular chamber carved from black stone. Shadowy glyphs pulse on the walls. A massive portal frame dominates the center.",
      hooks: ["The ritual requires three components: dragon blood, the Grimoire, and a celestial alignment", "Cult members patrol in shifts"],
      npcIds: ["npc-1"],
      factionIds: ["faction-1"],
      image_url: locRitualChamber,
    },
  ],

  factions: [
    {
      id: "faction-1",
      name: "Cult of the Shadow Gate",
      description: "A secret society of shadow sorcerers seeking to merge the Material Plane with the Shadowfell.",
      motto: "In darkness, we find truth",
      influence_score: 35,
      tags: ["Villain", "Secretive", "Magical"],
      goals: ["Open the Shadowgate portal", "Resurrect fallen members from the Shadowfell", "Overthrow the crown"],
      reputation: -80,
      banner_url: factionShadowCult,
    },
    {
      id: "faction-2",
      name: "The Veiled Hand",
      description: "A thieves' guild that controls the Shadow Quarter's black market. They maintain a delicate balance of power.",
      motto: "See all, steal nothing... unless the price is right",
      influence_score: 55,
      tags: ["Neutral", "Criminal", "Connected"],
      goals: ["Maintain control of Shadow Quarter", "Profit from chaos without causing it", "Keep the cult's activities contained"],
      reputation: 20,
      banner_url: factionThieves,
    },
    {
      id: "faction-3",
      name: "Order of the Silver Shield",
      description: "The capital's elite guard and peacekeeping force. Paladins and veteran soldiers dedicated to protecting the realm.",
      motto: "Ever vigilant, forever just",
      influence_score: 70,
      tags: ["Ally", "Lawful", "Military"],
      goals: ["Stop the Shadow Quarter murders", "Root out corruption", "Prevent the ritual"],
      reputation: 75,
      banner_url: factionSilverShield,
    },
  ],

  monsters: [
    {
      id: "monster-1",
      name: "Shadow Cultist",
      cr: 3,
      type: "Humanoid",
      size: "Medium",
      hp: 44,
      ac: 13,
      environment: "Urban",
      traits: ["Shadow Step", "Spell Casting"],
    },
    {
      id: "monster-2",
      name: "Shadow Demon",
      cr: 4,
      type: "Fiend",
      size: "Medium",
      hp: 66,
      ac: 13,
      environment: "Any",
      traits: ["Incorporeal Movement", "Shadow Stealth"],
    },
    {
      id: "monster-3",
      name: "Scorathax (Adult Red Dragon)",
      cr: 17,
      type: "Dragon",
      size: "Huge",
      hp: 256,
      ac: 19,
      environment: "Mountain",
      traits: ["Legendary Resistance", "Fire Breath", "Frightful Presence"],
    },
  ],

  items: [
    {
      id: "item-1",
      name: "Grimoire of Shadows",
      type: "Wondrous Item",
      rarity: "Very Rare",
      description: "An ancient spellbook bound in black leather with silver clasps. Contains forbidden shadow magic and necromantic rituals.",
      attunement: true,
      properties: { spellbook: true, curses: ["Whispers dark thoughts"], benefits: ["+2 to shadow spell attack rolls"] },
    },
    {
      id: "item-2",
      name: "Amulet of Shadowshield",
      type: "Wondrous Item",
      rarity: "Rare",
      description: "A dark crystal pendant that pulses with shadow energy. Provides protection against necrotic damage.",
      attunement: true,
      properties: { resistance: ["necrotic"], charges: 3, recharge: "dawn" },
    },
    {
      id: "item-3",
      name: "Dragon Scale Mail +1",
      type: "Armor",
      rarity: "Very Rare",
      description: "Gleaming red-scaled armor forged from Scorathax's shed scales. Provides fire resistance.",
      attunement: true,
      properties: { ac_bonus: 1, resistance: ["fire"] },
    },
    {
      id: "item-4",
      name: "Dagger of Shadowstrike",
      type: "Weapon",
      rarity: "Rare",
      description: "A black-bladed dagger that seems to absorb light. Deals extra necrotic damage and allows teleportation.",
      attunement: true,
      properties: { damage_bonus: "1d6 necrotic", special: "Shadow Step (30ft, bonus action, 3/day)" },
    },
    {
      id: "item-5",
      name: "Ring of Fire Resistance",
      type: "Ring",
      rarity: "Rare",
      description: "A gold ring set with a ruby that flickers with inner flame. Grants resistance to fire damage.",
      attunement: true,
      properties: { resistance: ["fire"] },
    },
  ],

  sessions: [
    {
      id: "session-1",
      title: "Session 15: The Ritual Chamber",
      session_number: 15,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Online",
      status: "upcoming",
    },
    {
      id: "session-2",
      title: "Session 14: Into the Shadows",
      session_number: 14,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Online",
      notes: "Party discovered the cult hideout. Epic battle with shadow demons. Rogue nearly died but stabilized.",
      status: "past",
    },
    {
      id: "session-3",
      title: "Session 13: The Archive Heist",
      session_number: 13,
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Online",
      notes: "Investigated the Grimoire theft. Made ally with Archivist Vale. Obtained crucial information from Rook.",
      status: "past",
    },
  ],

  timeline: [
    {
      id: "timeline-1",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: "Battle of the Shadow Depths",
      description: "The party fought through waves of shadow demons to reach the cult hideout entrance.",
      type: "combat",
      session: 14,
    },
    {
      id: "timeline-2",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      title: "Alliance with the Veiled Hand",
      description: "Successfully negotiated information exchange with Rook, gaining crucial intel about the cult.",
      type: "social",
      session: 13,
    },
    {
      id: "timeline-3",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      title: "Scorathax Defeated",
      description: "Epic confrontation at Crimson Peak. Dragon driven from lair. Party claimed significant treasure.",
      type: "combat",
      session: 8,
    },
  ],

  notes: [
    {
      id: "note-1",
      title: "Cassandra's True Identity",
      content_markdown: "**MAJOR SECRET**: Cassandra Nightwhisper is actually Princess Cassandra Lightbringer, twin sister of Queen Arianna. She was presumed dead 20 years ago in a tragic accident.\n\nIn truth, she faked her death after her husband (a foreign dignitary) was assassinated by political rivals. Driven mad by grief, she turned to shadow magic to resurrect him.\n\nThe Shadowgate ritual is her final attempt to pull his soul from the Shadowfell.",
      visibility: "DM_ONLY",
      tags: ["Secret", "Plot Twist", "NPC"],
      is_pinned: true,
    },
    {
      id: "note-2",
      title: "Session 15 Prep: Final Confrontation",
      content_markdown: "## Encounter Design\n\n- Cassandra (12th-level Shadow Sorcerer)\n- 4× Shadow Cultists\n- 2× Shadow Demons (summoned mid-fight)\n- Ritual progress: 75% complete when party arrives\n\n## Key Points\n\n1. Portal is partially open—shadows seeping through\n2. Cassandra will monologue if given chance (reveal identity)\n3. Disrupting ritual requires either:\n   - Destroying 3 ritual focuses (DC 18 Arcana)\n   - Defeating Cassandra before completion\n4. If ritual completes: massive explosion, Shadowfell creatures pour through\n\n## Treasure\n\n- Amulet of Shadowshield\n- Dagger of Shadowstrike  \n- 2,500 gp in cult coffers",
      visibility: "DM_ONLY",
      tags: ["Session Prep", "Combat", "Loot"],
      is_pinned: true,
    },
    {
      id: "note-3",
      title: "Quest: The Shadowgate Conspiracy",
      content_markdown: "A dangerous cult plots to tear open a portal to the Shadowfell. We must stop them before midnight.\n\n**Current Status**: Located cult hideout beneath old Raven Temple\n\n**Next Steps**:\n- Infiltrate ritual chamber\n- Disrupt the Shadowgate ritual\n- Confront Cassandra Nightwhisper\n\n**Rewards**: 2,500 XP, 750 GP, magical items",
      visibility: "SHARED",
      tags: ["Quest", "Active"],
      is_pinned: false,
    },
  ],

  lore: [
    {
      id: "lore-1",
      title: "The Shadowfell Incursion of 847",
      category: "history",
      content: "Two centuries ago, the Shadowfell nearly consumed the realm. A cult of shadow worshippers opened a massive portal beneath the old capital, unleashing waves of shadow creatures upon the land.\n\nThe Silver Shield Order, led by the legendary paladin Aldric Lightbringer, managed to close the portal at great cost. Aldric sacrificed himself to seal the rift, and the old capital was abandoned—now known as the Shadow Quarter.\n\nHistorians note that the current cult activity mirrors the events of 847. The Grimoire of Shadows, believed destroyed in that conflict, has resurfaced.",
      show_on_timeline: true,
      image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop",
    },
    {
      id: "lore-2",
      title: "The Northern Mountains",
      category: "region",
      content: "The Northern Mountains form a natural barrier between the civilized lands and the frozen wastes beyond. Home to dwarven strongholds, dragon lairs, and ancient ruins.\n\n**Key Locations:**\n- Crimson Peak: Former lair of Scorathax the Burning\n- Ironhold: Primary dwarven trade city\n- The Frost Gate: Ancient passage to the frozen north\n\n**Notable Features:**\n- Rich in precious metals and gemstones\n- Volcanic activity near Crimson Peak\n- Dangerous wildlife including wyverns and frost giants",
      show_on_timeline: false,
      image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
    },
    {
      id: "lore-3",
      title: "Shadow Magic and the Shadowfell",
      category: "magic",
      content: "Shadow magic draws power from the Shadowfell, a dark reflection of the Material Plane. Those who wield it risk corruption and madness.\n\n**Properties of Shadow Magic:**\n- Drains color and light from surroundings\n- Can create semi-real illusions from shadowstuff\n- Allows passage between the planes at thin points\n- Requires emotional darkness to fuel (grief, rage, despair)\n\n**The Shadowfell:**\n- Mirror of the Material Plane, but twisted and dark\n- Home to shadow creatures, undead, and the Raven Queen\n- Time flows differently—hours can be years\n- Those who die there become shadows themselves",
      show_on_timeline: false,
      image_url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&fit=crop",
    },
    {
      id: "lore-4",
      title: "The Legend of Aldric Lightbringer",
      category: "myth",
      content: "Aldric Lightbringer was the greatest paladin of his age, founder of the Silver Shield Order and savior of the realm. His sacrifice to close the Shadowgate in 847 is commemorated every year on the Day of Silver Light.\n\n**The Legend Says:**\n- His sword, Dawn's Edge, still burns with holy fire in the ruins\n- His spirit guards the sealed portal to this day\n- Those of his bloodline carry a spark of divine light\n\n**The Truth:**\n- Queen Arianna is his direct descendant\n- The seal is weakening after 200 years\n- Dawn's Edge may be the only weapon that can permanently destroy the Shadowgate",
      show_on_timeline: true,
    },
  ],

  encounters: [
    {
      id: "encounter-1",
      name: "Ritual Chamber Showdown",
      description: "The final confrontation with Cassandra Nightwhisper and her cult. The party must stop the Shadowgate ritual before completion.",
      difficulty: "deadly",
      status: "planned",
      monsters: [
        { name: "Cassandra (Shadow Sorcerer)", count: 1, cr: 12 },
        { name: "Shadow Cultist", count: 4, cr: 3 },
        { name: "Shadow Demon", count: 2, cr: 4 },
      ],
      location_id: "loc-5",
    },
    {
      id: "encounter-2",
      name: "Sewer Ambush",
      description: "While tracking the Grimoire thieves through the sewers, the party is ambushed by cult scouts.",
      difficulty: "medium",
      status: "planned",
      monsters: [
        { name: "Shadow Cultist", count: 3, cr: 3 },
        { name: "Giant Rat", count: 6, cr: 0.125 },
      ],
      location_id: "loc-2",
    },
    {
      id: "encounter-3",
      name: "Shadow Depths Battle",
      description: "The party fought through waves of shadow demons guarding the entrance to the cult hideout.",
      difficulty: "hard",
      status: "completed",
      monsters: [
        { name: "Shadow Demon", count: 4, cr: 4 },
        { name: "Shadow", count: 6, cr: 0.5 },
      ],
      location_id: "loc-2",
    },
  ],
};
