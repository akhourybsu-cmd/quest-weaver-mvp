// D&D 5E Multiclassing Rules

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

// Multiclass prerequisites per 5e PHB
export const MULTICLASS_PREREQUISITES: Record<string, { abilities: Partial<Record<AbilityKey, number>> }> = {
  Barbarian: { abilities: { str: 13 } },
  Bard: { abilities: { cha: 13 } },
  Cleric: { abilities: { wis: 13 } },
  Druid: { abilities: { wis: 13 } },
  Fighter: { abilities: { str: 13 } }, // OR dex 13, handled in validation
  Monk: { abilities: { dex: 13, wis: 13 } },
  Paladin: { abilities: { str: 13, cha: 13 } },
  Ranger: { abilities: { dex: 13, wis: 13 } },
  Rogue: { abilities: { dex: 13 } },
  Sorcerer: { abilities: { cha: 13 } },
  Warlock: { abilities: { cha: 13 } },
  Wizard: { abilities: { int: 13 } },
};

// Fighter can use STR or DEX
export const FIGHTER_ALTERNATIVE_PREREQ = { dex: 13 };

// Proficiencies gained when multiclassing INTO a class (not starting class)
export const MULTICLASS_PROFICIENCIES: Record<string, {
  armor?: string[];
  weapons?: string[];
  tools?: string[];
  skills?: { count: number; options: string[] };
}> = {
  Barbarian: {
    armor: ['shields'],
    weapons: ['simple weapons', 'martial weapons'],
  },
  Bard: {
    armor: ['light armor'],
    weapons: [],
    skills: { count: 1, options: ['any'] },
  },
  Cleric: {
    armor: ['light armor', 'medium armor', 'shields'],
    weapons: [],
  },
  Druid: {
    armor: ['light armor', 'medium armor', 'shields'],
    weapons: [],
  },
  Fighter: {
    armor: ['light armor', 'medium armor', 'shields'],
    weapons: ['simple weapons', 'martial weapons'],
  },
  Monk: {
    armor: [],
    weapons: ['simple weapons', 'shortswords'],
  },
  Paladin: {
    armor: ['light armor', 'medium armor', 'shields'],
    weapons: ['simple weapons', 'martial weapons'],
  },
  Ranger: {
    armor: ['light armor', 'medium armor', 'shields'],
    weapons: ['simple weapons', 'martial weapons'],
    skills: { count: 1, options: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'] },
  },
  Rogue: {
    armor: ['light armor'],
    weapons: ['hand crossbows', 'longswords', 'rapiers', 'shortswords'],
    tools: ["thieves' tools"],
    skills: { count: 1, options: ['any'] },
  },
  Sorcerer: {
    armor: [],
    weapons: [],
  },
  Warlock: {
    armor: ['light armor'],
    weapons: ['simple weapons'],
  },
  Wizard: {
    armor: [],
    weapons: [],
  },
};

// Multiclass spellcasting slot calculation
export const FULL_CASTERS = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'];
export const HALF_CASTERS = ['Paladin', 'Ranger'];
export const THIRD_CASTERS = ['Eldritch Knight', 'Arcane Trickster']; // Fighter/Rogue subclasses

/**
 * Check if a character meets multiclass prerequisites for a class
 */
export function meetsMulticlassPrerequisites(
  className: string,
  abilityScores: Record<AbilityKey, number>
): { meets: boolean; missing: string[] } {
  const prereqs = MULTICLASS_PREREQUISITES[className];
  if (!prereqs) return { meets: true, missing: [] };

  const missing: string[] = [];
  
  // Special case for Fighter - can use STR OR DEX
  if (className === 'Fighter') {
    const meetsStr = abilityScores.str >= 13;
    const meetsDex = abilityScores.dex >= 13;
    if (!meetsStr && !meetsDex) {
      missing.push('Strength 13 or Dexterity 13');
    }
    return { meets: missing.length === 0, missing };
  }

  // Standard prerequisites
  for (const [ability, minScore] of Object.entries(prereqs.abilities)) {
    const score = abilityScores[ability as AbilityKey] || 0;
    if (score < minScore) {
      const abilityName = ability.charAt(0).toUpperCase() + ability.slice(1);
      missing.push(`${abilityName} ${minScore}`);
    }
  }

  return { meets: missing.length === 0, missing };
}

/**
 * Check if character can leave their current class (must meet prereqs of current class too)
 */
export function canLeaveClass(
  currentClass: string,
  abilityScores: Record<AbilityKey, number>
): { canLeave: boolean; reason?: string } {
  const result = meetsMulticlassPrerequisites(currentClass, abilityScores);
  if (!result.meets) {
    return {
      canLeave: false,
      reason: `Must meet ${currentClass} prerequisites to multiclass: ${result.missing.join(', ')}`,
    };
  }
  return { canLeave: true };
}

/**
 * Get proficiencies gained from multiclassing into a class
 */
export function getMulticlassProficiencies(className: string) {
  return MULTICLASS_PROFICIENCIES[className] || { armor: [], weapons: [] };
}

/**
 * Calculate multiclass spellcaster level for spell slot determination
 */
export function calculateMulticlassSpellcasterLevel(
  classes: Array<{ className: string; level: number; subclass?: string }>
): number {
  let spellcasterLevel = 0;

  for (const cls of classes) {
    if (FULL_CASTERS.includes(cls.className)) {
      spellcasterLevel += cls.level;
    } else if (HALF_CASTERS.includes(cls.className)) {
      // Only counts if level 2+
      if (cls.level >= 2) {
        spellcasterLevel += Math.floor(cls.level / 2);
      }
    } else if (cls.className === 'Fighter' && cls.subclass === 'Eldritch Knight') {
      // Only counts if level 3+
      if (cls.level >= 3) {
        spellcasterLevel += Math.floor(cls.level / 3);
      }
    } else if (cls.className === 'Rogue' && cls.subclass === 'Arcane Trickster') {
      // Only counts if level 3+
      if (cls.level >= 3) {
        spellcasterLevel += Math.floor(cls.level / 3);
      }
    }
  }

  return spellcasterLevel;
}

/**
 * Get spell slots for a given multiclass spellcaster level
 */
export function getMulticlassSpellSlots(spellcasterLevel: number): Record<number, number> {
  const slotTable: Record<number, Record<number, number>> = {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
    6: { 1: 4, 2: 3, 3: 3 },
    7: { 1: 4, 2: 3, 3: 3, 4: 1 },
    8: { 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
  };

  return slotTable[spellcasterLevel] || {};
}
