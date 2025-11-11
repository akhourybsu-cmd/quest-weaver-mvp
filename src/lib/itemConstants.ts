// Comprehensive D&D 5E item constants and types

export const ITEM_CATEGORIES = [
  "Wondrous Item",
  "Ring",
  "Rod",
  "Staff",
  "Wand",
  "Ammunition",
  "Adventuring Gear",
  "Tool",
  "Musical Instrument",
  "Poison",
  "Potion",
  "Scroll",
  "Tattoo",
  "Vehicle",
  "Other"
] as const;

export const WEAPON_CATEGORIES = [
  "Simple Melee",
  "Simple Ranged",
  "Martial Melee",
  "Martial Ranged"
] as const;

export const ARMOR_CATEGORIES = [
  "Light",
  "Medium",
  "Heavy",
  "Shield"
] as const;

export const MATERIALS = [
  "Standard",
  "Silvered",
  "Adamantine",
  "Mithral",
  "Cold Iron",
  "Wood",
  "Stone",
  "Crystal"
] as const;

export const ACTIVATION_TIMES = [
  "Action",
  "Bonus Action",
  "Reaction",
  "1 Minute",
  "10 Minutes",
  "1 Hour",
  "No Action"
] as const;

export const CONSUMABLE_SUBTYPES = [
  "Potion",
  "Scroll",
  "Poison",
  "Oil",
  "Alchemical",
  "Bomb",
  "Food/Drink",
  "Single-use Ammunition"
] as const;

export const POISON_TYPES = [
  "Injury",
  "Ingested",
  "Inhaled",
  "Contact"
] as const;

export const ATTUNEMENT_CLASSES = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard"
] as const;

export const WEAPON_SUBTYPES = {
  "Simple Melee": ["Club", "Dagger", "Greatclub", "Handaxe", "Javelin", "Light Hammer", "Mace", "Quarterstaff", "Sickle", "Spear"],
  "Simple Ranged": ["Light Crossbow", "Dart", "Shortbow", "Sling"],
  "Martial Melee": ["Battleaxe", "Flail", "Glaive", "Greataxe", "Greatsword", "Halberd", "Lance", "Longsword", "Maul", "Morningstar", "Pike", "Rapier", "Scimitar", "Shortsword", "Trident", "War Pick", "Warhammer", "Whip"],
  "Martial Ranged": ["Blowgun", "Hand Crossbow", "Heavy Crossbow", "Longbow", "Net"]
};

export const ARMOR_SUBTYPES = {
  "Light": ["Padded", "Leather", "Studded Leather"],
  "Medium": ["Hide", "Chain Shirt", "Scale Mail", "Breastplate", "Half Plate"],
  "Heavy": ["Ring Mail", "Chain Mail", "Splint", "Plate"],
  "Shield": ["Shield"]
};

export const CONTROLLED_TAGS = [
  "melee",
  "ranged",
  "finesse",
  "versatile",
  "heavy",
  "light",
  "two-handed",
  "ammunition",
  "loading",
  "reach",
  "thrown",
  "special",
  "consumable",
  "magical",
  "cursed",
  "rare",
  "quest-item",
  "container"
] as const;

export const VISIBILITY_OPTIONS = [
  "draft",
  "dm-only",
  "published-campaign",
  "published-library"
] as const;

export const RULESET_OPTIONS = [
  "2014",
  "2024",
  "homebrew"
] as const;

export interface Currency {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
}

export interface AttunementPrereq {
  classes?: string[];
  races?: string[];
  alignments?: string[];
  minLevel?: number;
  minAbilities?: { [key: string]: number };
  customText?: string;
}

export interface SpellGrant {
  spellName: string;
  uses?: number;
  period?: "day" | "short-rest" | "long-rest" | "dawn" | "dusk";
  level?: number;
  scaling?: boolean;
  activationTime?: string;
}

export interface PoisonData {
  type: typeof POISON_TYPES[number];
  onset?: string;
  duration?: string;
  saveDC?: number;
  saveType?: string;
  onFailEffect?: string;
  onSaveEffect?: string;
}

export interface ScrollData {
  spell: string;
  level: number;
  classRestriction?: string[];
  requiresCheck?: boolean;
  checkDC?: number;
}

export interface CraftingData {
  ingredients?: string[];
  craftingTime?: string;
  tools?: string[];
  cost?: number;
}
