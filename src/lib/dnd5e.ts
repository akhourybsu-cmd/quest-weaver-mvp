// D&D 5E Character Creation Utilities

type SaveType = "str_save" | "dex_save" | "con_save" | "int_save" | "wis_save" | "cha_save";

export const DND_CLASSES = [
  { value: "Barbarian", hitDie: 12, saves: ["str_save", "con_save"] as SaveType[] },
  { value: "Bard", hitDie: 8, saves: ["dex_save", "cha_save"] as SaveType[] },
  { value: "Cleric", hitDie: 8, saves: ["wis_save", "cha_save"] as SaveType[] },
  { value: "Druid", hitDie: 8, saves: ["int_save", "wis_save"] as SaveType[] },
  { value: "Fighter", hitDie: 10, saves: ["str_save", "con_save"] as SaveType[] },
  { value: "Monk", hitDie: 8, saves: ["str_save", "dex_save"] as SaveType[] },
  { value: "Paladin", hitDie: 10, saves: ["wis_save", "cha_save"] as SaveType[] },
  { value: "Ranger", hitDie: 10, saves: ["str_save", "dex_save"] as SaveType[] },
  { value: "Rogue", hitDie: 8, saves: ["dex_save", "int_save"] as SaveType[] },
  { value: "Sorcerer", hitDie: 6, saves: ["con_save", "cha_save"] as SaveType[] },
  { value: "Warlock", hitDie: 8, saves: ["wis_save", "cha_save"] as SaveType[] },
  { value: "Wizard", hitDie: 6, saves: ["int_save", "wis_save"] as SaveType[] },
];

export const ABILITY_SCORES = [
  { key: "strength", label: "Strength (STR)", save: "str_save" },
  { key: "dexterity", label: "Dexterity (DEX)", save: "dex_save" },
  { key: "constitution", label: "Constitution (CON)", save: "con_save" },
  { key: "intelligence", label: "Intelligence (INT)", save: "int_save" },
  { key: "wisdom", label: "Wisdom (WIS)", save: "wis_save" },
  { key: "charisma", label: "Charisma (CHA)", save: "cha_save" },
] as const;

/**
 * Calculate ability modifier per D&D 5E rules
 * Formula: (score - 10) / 2, rounded down
 */
export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

/**
 * Calculate proficiency bonus based on character level (D&D 5E)
 * Level 1-4: +2
 * Level 5-8: +3
 * Level 9-12: +4
 * Level 13-16: +5
 * Level 17-20: +6
 */
export const calculateProficiencyBonus = (level: number): number => {
  return Math.floor((level - 1) / 4) + 2;
};

/**
 * Calculate maximum HP for a character at first level
 * At level 1: Max hit die + CON modifier
 */
export const calculateLevel1HP = (className: string, conScore: number): number => {
  const classData = DND_CLASSES.find(c => c.value === className);
  if (!classData) return 8; // Default fallback
  
  const conModifier = calculateModifier(conScore);
  return classData.hitDie + conModifier;
};

/**
 * Calculate Armor Class
 * Base AC = 10 + DEX modifier (unarmored)
 */
export const calculateBaseAC = (dexScore: number): number => {
  return 10 + calculateModifier(dexScore);
};

/**
 * Calculate saving throw modifier
 * If proficient: ability modifier + proficiency bonus
 * If not proficient: ability modifier only
 */
export const calculateSavingThrow = (
  abilityScore: number,
  isProficient: boolean,
  level: number
): number => {
  const abilityMod = calculateModifier(abilityScore);
  const profBonus = isProficient ? calculateProficiencyBonus(level) : 0;
  return abilityMod + profBonus;
};

/**
 * Validate ability score is within D&D 5E bounds (1-20 for standard play)
 */
export const isValidAbilityScore = (score: number): boolean => {
  return score >= 1 && score <= 20;
};

/**
 * Standard array for point buy: [15, 14, 13, 12, 10, 8]
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/**
 * Get class information
 */
export const getClassData = (className: string) => {
  return DND_CLASSES.find(c => c.value === className);
};
