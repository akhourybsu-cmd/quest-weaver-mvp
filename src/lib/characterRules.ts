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
 * Calculate Armor Class
 */
export const calculateAC = (
  dexScore: number,
  armor?: { base_ac: number; dex_cap?: number },
  shield?: boolean
): number => {
  const dexMod = calculateModifier(dexScore);
  let ac = 10;
  
  if (armor) {
    ac = armor.base_ac;
    if (armor.dex_cap !== undefined) {
      ac += Math.min(dexMod, armor.dex_cap);
    } else if (armor.dex_cap === null) {
      // Heavy armor, no dex bonus
      ac += 0;
    } else {
      // Light armor, full dex bonus
      ac += dexMod;
    }
  } else {
    // Unarmored: 10 + DEX mod
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
  
  return { valid: totalPoints === 27, pointsUsed: totalPoints };
};

/**
 * Standard array values
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

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
