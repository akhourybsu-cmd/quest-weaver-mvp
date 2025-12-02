// Document Import Schema and Types

export interface ExtractedNPC {
  name: string;
  role?: string;
  description?: string;
  location?: string;
  faction?: string;
  alignment?: string;
  pronouns?: string;
  tags?: string[];
}

export interface ExtractedLocation {
  name: string;
  location_type?: string;
  description?: string;
  parent_location?: string;
  tags?: string[];
}

export interface ExtractedItem {
  name: string;
  type?: string;
  rarity?: string;
  description?: string;
  is_magical?: boolean;
  properties?: Record<string, any>;
  tags?: string[];
}

export interface ExtractedFaction {
  name: string;
  description?: string;
  motto?: string;
  influence_score?: number;
  tags?: string[];
}

export interface ExtractedLore {
  title: string;
  category: 'history' | 'myth' | 'magic' | 'region' | 'deity' | 'other';
  content: string;
  excerpt?: string;
  era?: string;
  tags?: string[];
}

export interface ExtractedQuest {
  title: string;
  description?: string;
  objectives?: string[];
  rewards?: string;
  difficulty?: string;
  quest_type?: string;
  tags?: string[];
}

export interface ExtractedEntities {
  npcs: ExtractedNPC[];
  locations: ExtractedLocation[];
  items: ExtractedItem[];
  factions: ExtractedFaction[];
  lore: ExtractedLore[];
  quests: ExtractedQuest[];
}

export interface SelectableEntity<T> {
  entity: T;
  selected: boolean;
  id: string;
  type: keyof ExtractedEntities;
  confidence?: number;
  duplicate?: boolean;
}

export type EntityCategory = keyof ExtractedEntities;

export const ENTITY_LABELS: Record<EntityCategory, string> = {
  npcs: 'NPCs',
  locations: 'Locations',
  items: 'Items',
  factions: 'Factions',
  lore: 'Lore',
  quests: 'Quests',
};

export const ENTITY_ICONS: Record<EntityCategory, string> = {
  npcs: 'Users',
  locations: 'MapPin',
  items: 'Package',
  factions: 'Crown',
  lore: 'BookOpen',
  quests: 'Scroll',
};

// Validation functions
export function validateExtractedEntities(data: unknown): ExtractedEntities {
  const defaultResult: ExtractedEntities = {
    npcs: [],
    locations: [],
    items: [],
    factions: [],
    lore: [],
    quests: [],
  };

  if (!data || typeof data !== 'object') {
    return defaultResult;
  }

  const parsed = data as Record<string, unknown>;

  return {
    npcs: Array.isArray(parsed.npcs) ? parsed.npcs.filter(isValidNPC) : [],
    locations: Array.isArray(parsed.locations) ? parsed.locations.filter(isValidLocation) : [],
    items: Array.isArray(parsed.items) ? parsed.items.filter(isValidItem) : [],
    factions: Array.isArray(parsed.factions) ? parsed.factions.filter(isValidFaction) : [],
    lore: Array.isArray(parsed.lore) ? parsed.lore.filter(isValidLore) : [],
    quests: Array.isArray(parsed.quests) ? parsed.quests.filter(isValidQuest) : [],
  };
}

function isValidNPC(obj: unknown): obj is ExtractedNPC {
  return typeof obj === 'object' && obj !== null && typeof (obj as any).name === 'string';
}

function isValidLocation(obj: unknown): obj is ExtractedLocation {
  return typeof obj === 'object' && obj !== null && typeof (obj as any).name === 'string';
}

function isValidItem(obj: unknown): obj is ExtractedItem {
  return typeof obj === 'object' && obj !== null && typeof (obj as any).name === 'string';
}

function isValidFaction(obj: unknown): obj is ExtractedFaction {
  return typeof obj === 'object' && obj !== null && typeof (obj as any).name === 'string';
}

function isValidLore(obj: unknown): obj is ExtractedLore {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).title === 'string' &&
    typeof (obj as any).content === 'string'
  );
}

function isValidQuest(obj: unknown): obj is ExtractedQuest {
  return typeof obj === 'object' && obj !== null && typeof (obj as any).title === 'string';
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
