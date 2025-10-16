// D&D 5E Spellcasting Rules and Progression

export interface SpellcastingInfo {
  progression: 'full' | 'half' | 'third' | 'pact' | null;
  ability: 'int' | 'wis' | 'cha' | null;
  cantripsKnown: number;
  spellsKnown: number | null; // null means prepared caster
  spellsPrepared: number | null;
  isPreparedCaster: boolean;
}

// Cantrips known by class and level
const CANTRIPS_KNOWN: Record<string, Record<number, number>> = {
  'Bard': { 1: 2, 4: 3, 10: 4 },
  'Cleric': { 1: 3, 4: 4, 10: 5 },
  'Druid': { 1: 2, 4: 3, 10: 4 },
  'Sorcerer': { 1: 4, 4: 5, 10: 6 },
  'Warlock': { 1: 2, 4: 3, 10: 4 },
  'Wizard': { 1: 3, 4: 4, 10: 5 },
};

// Spells known for known-spells casters
const SPELLS_KNOWN: Record<string, Record<number, number>> = {
  'Bard': { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22 },
  'Sorcerer': { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
  'Ranger': { 1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
  'Warlock': { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15 },
};

/**
 * Get spellcasting information for a class at a given level
 */
export const getSpellcastingInfo = (className: string, level: number, spellcastingAbility: string | null): SpellcastingInfo => {
  const defaultInfo: SpellcastingInfo = {
    progression: null,
    ability: null,
    cantripsKnown: 0,
    spellsKnown: null,
    spellsPrepared: null,
    isPreparedCaster: false,
  };

  if (!spellcastingAbility) {
    return defaultInfo;
  }

  const ability = spellcastingAbility as 'int' | 'wis' | 'cha';

  // Full casters
  if (['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(className)) {
    const cantrips = getCantripsKnown(className, level);
    const isPrepared = ['Cleric', 'Druid', 'Wizard'].includes(className);
    
    return {
      progression: 'full',
      ability,
      cantripsKnown: cantrips,
      spellsKnown: isPrepared ? null : getSpellsKnown(className, level),
      spellsPrepared: isPrepared ? null : null, // Will be calculated from ability mod + level
      isPreparedCaster: isPrepared,
    };
  }

  // Half casters
  if (['Paladin', 'Ranger'].includes(className)) {
    return {
      progression: 'half',
      ability,
      cantripsKnown: 0,
      spellsKnown: className === 'Ranger' ? getSpellsKnown(className, level) : null,
      spellsPrepared: className === 'Paladin' ? null : null,
      isPreparedCaster: className === 'Paladin',
    };
  }

  // Third casters
  if (['Eldritch Knight', 'Arcane Trickster'].includes(className)) {
    return {
      progression: 'third',
      ability: 'int',
      cantripsKnown: level >= 3 ? (level >= 10 ? 3 : 2) : 0,
      spellsKnown: level >= 3 ? Math.min(3 + Math.floor((level - 3) / 2), 13) : 0,
      spellsPrepared: null,
      isPreparedCaster: false,
    };
  }

  // Warlock (pact magic)
  if (className === 'Warlock') {
    return {
      progression: 'pact',
      ability: 'cha',
      cantripsKnown: getCantripsKnown(className, level),
      spellsKnown: getSpellsKnown(className, level),
      spellsPrepared: null,
      isPreparedCaster: false,
    };
  }

  return defaultInfo;
};

/**
 * Get number of cantrips known at a level
 */
const getCantripsKnown = (className: string, level: number): number => {
  const table = CANTRIPS_KNOWN[className];
  if (!table) return 0;

  const levels = Object.keys(table).map(Number).sort((a, b) => a - b);
  for (let i = levels.length - 1; i >= 0; i--) {
    if (level >= levels[i]) {
      return table[levels[i]];
    }
  }
  return 0;
};

/**
 * Get number of spells known at a level (for known-spells casters)
 */
const getSpellsKnown = (className: string, level: number): number => {
  const table = SPELLS_KNOWN[className];
  if (!table) return 0;
  return table[level] || 0;
};

/**
 * Calculate number of spells that can be prepared (for prepared casters)
 * Formula: spellcasting ability modifier + character level (minimum 1)
 */
export const calculatePreparedSpells = (level: number, abilityModifier: number): number => {
  return Math.max(1, abilityModifier + level);
};

/**
 * Get spell slots for a class at a given level
 * Returns array [1st-level slots, 2nd-level, ..., 9th-level]
 */
export const getSpellSlots = (className: string, level: number): number[] => {
  // Full casters
  if (['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(className)) {
    return getFullCasterSlots(level);
  }

  // Half casters
  if (['Paladin', 'Ranger'].includes(className)) {
    return getHalfCasterSlots(level);
  }

  // Third casters
  if (['Eldritch Knight', 'Arcane Trickster'].includes(className)) {
    return getThirdCasterSlots(level);
  }

  // Warlock (pact magic)
  if (className === 'Warlock') {
    return getWarlockSlots(level);
  }

  return [0, 0, 0, 0, 0, 0, 0, 0, 0];
};

const getFullCasterSlots = (level: number): number[] => {
  const slots: Record<number, number[]> = {
    1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };
  return slots[level] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
};

const getHalfCasterSlots = (level: number): number[] => {
  if (level < 2) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const effectiveLevel = Math.ceil(level / 2);
  return getFullCasterSlots(effectiveLevel);
};

const getThirdCasterSlots = (level: number): number[] => {
  if (level < 3) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const effectiveLevel = Math.ceil(level / 3);
  return getFullCasterSlots(effectiveLevel);
};

const getWarlockSlots = (level: number): number[] => {
  const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (level === 0) return slots;
  
  // Warlock gets pact magic slots
  const slotLevel = Math.min(Math.ceil(level / 2), 5) - 1;
  const numSlots = level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1;
  
  slots[slotLevel] = numSlots;
  return slots;
};
