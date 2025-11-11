/**
 * Static Inventory - Scans codebase for features, routes, and components
 */

export interface FeatureMapping {
  featureId: string;
  name: string;
  routes: RouteMapping[];
  components: string[];
  hooks: string[];
  events: EventMapping[];
  menuPaths: string[];
  visibility: ('dm' | 'player' | 'both')[];
}

export interface RouteMapping {
  path: string;
  component: string;
  access: 'dm' | 'player' | 'public' | 'both';
  menuLabel?: string;
}

export interface EventMapping {
  name: string;
  table?: string;
  channel?: string;
  publishers: string[];
  subscribers: string[];
}

export interface AuditInventory {
  routes: RouteMapping[];
  features: FeatureMapping[];
  events: EventMapping[];
  orphanedComponents: string[];
  unlinkedFeatures: string[];
}

/**
 * Core 5e features to audit
 */
export const CORE_FEATURES = [
  {
    id: 'session-sync',
    name: 'Session & Sync',
    patterns: ['campaign.*code', 'presence', 'PlayerPresence', 'player_presence'],
  },
  {
    id: 'initiative',
    name: 'Initiative & Turn Flow',
    patterns: ['initiative', 'InitiativeTracker', 'turn', 'round', 'AdvanceTurn'],
  },
  {
    id: 'hp-death',
    name: 'HP/TempHP & Death Saves',
    patterns: ['hp', 'temp_hp', 'death.*save', 'DeathSave', 'damage', 'healing'],
  },
  {
    id: 'conditions',
    name: 'Conditions & Exhaustion',
    patterns: ['condition', 'exhaustion', 'ConditionsManager', 'character_conditions'],
  },
  {
    id: 'concentration',
    name: 'Concentration & Durations',
    patterns: ['concentration', 'Concentration', 'effect.*duration', 'requires_concentration'],
  },
  {
    id: 'spells-resources',
    name: 'Spells & Resources',
    patterns: ['spell.*slot', 'resource', 'SpellSlot', 'ResourceTracker', 'short.*rest', 'long.*rest'],
  },
  {
    id: 'inventory',
    name: 'Inventory & Attunement',
    patterns: ['inventory', 'item', 'attunement', 'ItemCard', 'grant.*item'],
  },
  {
    id: 'quests',
    name: 'Quests & Objectives',
    patterns: ['quest', 'objective', 'QuestLog', 'QuestTracker'],
  },
  {
    id: 'encounters',
    name: 'Encounters & Bestiary',
    patterns: ['encounter', 'monster', 'MonsterRoster', 'bestiary', 'add.*monster'],
  },
  {
    id: 'party-roster',
    name: 'Party & Player Roster',
    patterns: ['character.*list', 'party', 'inspiration', 'player.*presence'],
  },
  {
    id: 'notes-handouts',
    name: 'Notes & Handouts',
    patterns: ['note', 'handout', 'Handout', 'share.*note', 'dm.*only'],
  },
  {
    id: 'settings-rules',
    name: 'Settings/Rules',
    patterns: ['setting', 'rule', 'xp', 'milestone', 'variant', 'homebrew'],
  },
] as const;

/**
 * Known routes in the app (from App.tsx)
 */
export const APP_ROUTES: RouteMapping[] = [
  { path: '/', component: 'Index', access: 'public', menuLabel: 'Home' },
  { path: '/campaign-hub', component: 'CampaignHub', access: 'dm', menuLabel: 'Campaign Hub' },
  { path: '/demo/:demoId/campaign', component: 'DemoCampaignHub', access: 'public' },
  { path: '/session/dm', component: 'SessionDM', access: 'dm', menuLabel: 'DM Screen' },
  { path: '/session/player', component: 'SessionPlayer', access: 'player', menuLabel: 'Player View' },
  { path: '/session/spectator', component: 'SessionSpectator', access: 'public' },
  { path: '/player-home', component: 'PlayerHome', access: 'player' },
  { path: '/map', component: 'CombatMap', access: 'dm' },
  { path: '/world-map', component: 'WorldMap', access: 'dm' },
  { path: '/timeline', component: 'CampaignTimeline', access: 'dm' },
  { path: '/inventory', component: 'Inventory', access: 'dm' },
  { path: '/notes', component: 'Notes', access: 'dm' },
  { path: '/lore', component: 'Lore', access: 'dm' },
  { path: '/campaign/:campaignId/characters', component: 'CharacterList', access: 'dm' },
  { path: '/campaign/:campaignId/character/:characterId', component: 'CharacterSheetPage', access: 'both' },
];

/**
 * Known realtime events (from grep search)
 */
export const REALTIME_EVENTS: EventMapping[] = [
  {
    name: 'character-changes',
    table: 'characters',
    publishers: ['apply-damage edge function', 'apply-healing edge function', 'SessionDM'],
    subscribers: ['SessionPlayer', 'PlayerCharacterSheet'],
  },
  {
    name: 'spell-slots-changes',
    table: 'character_spell_slots',
    publishers: ['SpellCastDialog', 'RestManager'],
    subscribers: ['SpellSlotTracker', 'SpellCastDialog'],
  },
  {
    name: 'suffocation',
    table: 'characters',
    publishers: ['SuffocationTracker'],
    subscribers: ['SuffocationTracker'],
  },
  {
    name: 'combat-modifiers',
    table: 'combat_modifiers',
    publishers: ['CombatModifierManager'],
    subscribers: ['useCombatModifiers'],
  },
  {
    name: 'campaign-presence',
    channel: 'presence',
    publishers: ['PlayerPresence', 'SessionPlayer'],
    subscribers: ['PresenceBar', 'SessionDM'],
  },
];

/**
 * Build feature inventory by analyzing patterns
 */
export function buildFeatureInventory(): AuditInventory {
  const features: FeatureMapping[] = CORE_FEATURES.map(feature => ({
    featureId: feature.id,
    name: feature.name,
    routes: APP_ROUTES.filter(route => 
      feature.patterns.some(pattern => 
        route.component.toLowerCase().match(pattern.replace('.*', '.*'))
      )
    ),
    components: [], // Would be populated by file scanning
    hooks: [], // Would be populated by file scanning
    events: REALTIME_EVENTS.filter(event =>
      feature.patterns.some(pattern =>
        event.name.toLowerCase().match(pattern.replace('.*', '.*'))
      )
    ),
    menuPaths: [], // Would be populated by menu scanning
    visibility: ['both'],
  }));

  return {
    routes: APP_ROUTES,
    features,
    events: REALTIME_EVENTS,
    orphanedComponents: [],
    unlinkedFeatures: [],
  };
}
