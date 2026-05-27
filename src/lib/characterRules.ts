// D&D 5e Character Rules Engine
import { calculateModifier, calculateProficiencyBonus } from "./dnd5e";

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CharacterData {
  level: number;
  classData: {
    hit_die: number;
    saving_throws: string[];
    spellcasting_ability?: string;
  };
  abilityScores: AbilityScores;
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    saves: string[];
    skills: { name: string; proficient: boolean; expertise: boolean }[];
  };
  equipment: {
    armor?: { base_ac: number; dex_cap?: number };
    shield?: boolean;
  };
}

/**
 * Calculate maximum HP for a character
 * Level 1: Max hit die + CON mod
 * Higher levels: Previous + (avg or rolled) + CON mod per level
 */
export const calculateMaxHP = (
  level: number,
  hitDie: number,
  conScore: number,
  hitDiceRolls?: number[]
): number => {
  const conMod = calculateModifier(conScore);
  
  // Level 1: max hit die + CON mod
  let hp = hitDie + conMod;
  
  // Higher levels
  for (let i = 2; i <= level; i++) {
    if (hitDiceRolls && hitDiceRolls[i - 2]) {
      hp += hitDiceRolls[i - 2] + conMod;
    } else {
      // Use average (hit die / 2 + 1)
      hp += Math.floor(hitDie / 2) + 1 + conMod;
    }
  }
  
  return Math.max(hp, level); // Min 1 HP per level
};

/**
 * Calculate Armor Class given DEX score, optional equipped armor, and optional shield.
 * armor.dex_cap: undefined = light (full DEX), number = medium (capped), null = heavy (no DEX)
 */
export const calculateAC = (
  dexScore: number,
  armor?: { base_ac: number; dex_cap?: number | null },
  shield?: boolean
): number => {
  const dexMod = calculateModifier(dexScore);
  let ac = 10;

  if (armor) {
    ac = armor.base_ac;
    if (armor.dex_cap === null) {
      // Heavy armor: no DEX bonus regardless of modifier
      ac += 0;
    } else if (armor.dex_cap !== undefined) {
      // Medium armor: DEX bonus capped
      ac += Math.min(dexMod, armor.dex_cap);
    } else {
      // Light armor: full DEX bonus
      ac += dexMod;
    }
  } else {
    // Unarmored: 10 + DEX mod (class-specific unarmored defense handled by callers)
    ac = 10 + dexMod;
  }

  if (shield) {
    ac += 2;
  }

  return ac;
};

/**
 * Calculate spell save DC
 * Formula: 8 + proficiency bonus + spellcasting ability modifier
 */
export const calculateSpellSaveDC = (
  level: number,
  abilityScore: number
): number => {
  const profBonus = calculateProficiencyBonus(level);
  const abilityMod = calculateModifier(abilityScore);
  return 8 + profBonus + abilityMod;
};

/**
 * Calculate spell attack modifier
 * Formula: proficiency bonus + spellcasting ability modifier
 */
export const calculateSpellAttackMod = (
  level: number,
  abilityScore: number
): number => {
  const profBonus = calculateProficiencyBonus(level);
  const abilityMod = calculateModifier(abilityScore);
  return profBonus + abilityMod;
};

/**
 * Calculate passive perception
 * Formula: 10 + Perception modifier + proficiency (if proficient)
 */
export const calculatePassivePerception = (
  wisScore: number,
  isProficient: boolean,
  level: number
): number => {
  const wisMod = calculateModifier(wisScore);
  const profBonus = isProficient ? calculateProficiencyBonus(level) : 0;
  return 10 + wisMod + profBonus;
};

/**
 * Calculate skill modifier
 * Formula: ability modifier + proficiency (if proficient) + expertise (if expertise)
 */
export const calculateSkillModifier = (
  abilityScore: number,
  proficient: boolean,
  expertise: boolean,
  level: number
): number => {
  const abilityMod = calculateModifier(abilityScore);
  const profBonus = calculateProficiencyBonus(level);
  
  let modifier = abilityMod;
  if (proficient) {
    modifier += profBonus;
  }
  if (expertise) {
    modifier += profBonus; // Expertise doubles proficiency
  }
  
  return modifier;
};

/**
 * Calculate save modifier
 * Formula: ability modifier + proficiency (if proficient)
 */
export const calculateSaveModifier = (
  abilityScore: number,
  isProficient: boolean,
  level: number
): number => {
  const abilityMod = calculateModifier(abilityScore);
  const profBonus = isProficient ? calculateProficiencyBonus(level) : 0;
  return abilityMod + profBonus;
};

/**
 * Calculate attack bonus for a weapon
 * Formula: proficiency bonus + ability modifier
 */
export const calculateAttackBonus = (
  level: number,
  abilityScore: number,
  isProficient: boolean
): number => {
  const abilityMod = calculateModifier(abilityScore);
  const profBonus = isProficient ? calculateProficiencyBonus(level) : 0;
  return abilityMod + profBonus;
};

/**
 * Validate point buy (27 points system)
 * Cost: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9
 * valid: true when all scores are in legal range AND total cost does not exceed 27
 * (spending fewer than 27 points is permitted)
 */
export const validatePointBuy = (scores: number[]): { valid: boolean; pointsUsed: number } => {
  const costTable: { [key: number]: number } = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
  };

  let totalPoints = 0;
  for (const score of scores) {
    if (score < 8 || score > 15) {
      return { valid: false, pointsUsed: -1 };
    }
    totalPoints += costTable[score];
  }

  return { valid: totalPoints <= 27, pointsUsed: totalPoints };
};

/**
 * Standard array values
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/**
 * Validate that the six ability scores match the standard array exactly (each value used once).
 * Accepts scores in any order.
 */
export const isValidStandardArray = (scores: number[]): boolean => {
  if (scores.length !== 6) return false;
  const sorted = [...scores].sort((a, b) => b - a);
  const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);
  return sorted.every((v, i) => v === expected[i]);
};

/**
 * SRD armor stats lookup.
 * dex_cap: undefined = light armor (full DEX added)
 * dex_cap: number    = medium armor (DEX capped at this value)
 * dex_cap: null      = heavy armor (no DEX added)
 */
export const ARMOR_STATS: Record<string, { base_ac: number; dex_cap?: number | null }> = {
  // Light armor
  "Padded": { base_ac: 11 },
  "Leather Armor": { base_ac: 11 },
  "Studded Leather": { base_ac: 12 },
  // Medium armor
  "Hide": { base_ac: 12, dex_cap: 2 },
  "Chain Shirt": { base_ac: 13, dex_cap: 2 },
  "Scale Mail": { base_ac: 14, dex_cap: 2 },
  "Breastplate": { base_ac: 14, dex_cap: 2 },
  "Half Plate": { base_ac: 15, dex_cap: 2 },
  // Heavy armor
  "Ring Mail": { base_ac: 14, dex_cap: null },
  "Chain Mail": { base_ac: 16, dex_cap: null },
  "Splint": { base_ac: 17, dex_cap: null },
  "Plate": { base_ac: 18, dex_cap: null },
};

/**
 * Scan a list of equipment items and return the first recognized armor piece and
 * whether a shield is present.
 */
export const detectArmorInItems = (
  items: Array<{ name: string }>
): { armor?: { base_ac: number; dex_cap?: number | null }; shield: boolean } => {
  let detectedArmor: { base_ac: number; dex_cap?: number | null } | undefined;
  let shield = false;

  for (const item of items) {
    const name = item.name.trim();
    if (ARMOR_STATS[name]) {
      if (!detectedArmor || ARMOR_STATS[name].base_ac > detectedArmor.base_ac) {
        detectedArmor = ARMOR_STATS[name];
      }
    }
    if (name === "Shield" || name === "Wooden Shield") {
      shield = true;
    }
  }

  return { armor: detectedArmor, shield };
};

/**
 * Skills list with their associated abilities
 */
export const SKILLS = [
  { name: "Acrobatics", ability: "dex" },
  { name: "Animal Handling", ability: "wis" },
  { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" },
  { name: "Deception", ability: "cha" },
  { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" },
  { name: "Intimidation", ability: "cha" },
  { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" },
  { name: "Stealth", ability: "dex" },
  { name: "Survival", ability: "wis" },
] as const;

// ─── Darkvision parsing ──────────────────────────────────────────────────────

/**
 * Scans an array of character feature rows for a darkvision trait and returns
 * the range in feet. Returns 0 if no darkvision is found.
 *
 * Looks for any feature whose name includes "darkvision" (case-insensitive)
 * and extracts the first number followed by "feet" or "ft" from the name then
 * the description. Falls back to 60 ft (SRD default) if the trait is found but
 * no explicit range is parseable.
 */
export function parseDarkvisionFt(
  features: Array<{ name: string; description?: string | null }>
): number {
  for (const f of features) {
    if (!/darkvision/i.test(f.name)) continue;

    // Try name first (e.g. "Superior Darkvision (120 ft)")
    const nameMatch = f.name.match(/(\d+)\s*(?:feet|ft)/i);
    if (nameMatch) return parseInt(nameMatch[1], 10);

    // Try description (e.g. "…within 60 feet of you…")
    const desc = f.description ?? "";
    const descMatch =
      desc.match(/within\s+(\d+)\s*(?:feet|ft)/i) ??
      desc.match(/(\d+)\s*(?:feet|ft)/i);
    if (descMatch) return parseInt(descMatch[1], 10);

    // Darkvision trait found but range not parseable — SRD default is 60 ft
    return 60;
  }
  return 0;
}
