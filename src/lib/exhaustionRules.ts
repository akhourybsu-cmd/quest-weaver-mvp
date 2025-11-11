/**
 * D&D 5E Exhaustion System (PHB 291)
 * Six levels of cumulative penalties
 */

export interface ExhaustionEffect {
  level: number;
  description: string;
  penalties: {
    abilityChecks?: 'disadvantage';
    speedHalved?: boolean;
    attacksAndSaves?: 'disadvantage';
    hpMaxHalved?: boolean;
    speedZero?: boolean;
    death?: boolean;
  };
}

export const EXHAUSTION_LEVELS: ExhaustionEffect[] = [
  {
    level: 0,
    description: 'No exhaustion',
    penalties: {},
  },
  {
    level: 1,
    description: 'Disadvantage on ability checks',
    penalties: {
      abilityChecks: 'disadvantage',
    },
  },
  {
    level: 2,
    description: 'Speed halved',
    penalties: {
      abilityChecks: 'disadvantage',
      speedHalved: true,
    },
  },
  {
    level: 3,
    description: 'Disadvantage on attack rolls and saving throws',
    penalties: {
      abilityChecks: 'disadvantage',
      speedHalved: true,
      attacksAndSaves: 'disadvantage',
    },
  },
  {
    level: 4,
    description: 'Hit point maximum halved',
    penalties: {
      abilityChecks: 'disadvantage',
      speedHalved: true,
      attacksAndSaves: 'disadvantage',
      hpMaxHalved: true,
    },
  },
  {
    level: 5,
    description: 'Speed reduced to 0',
    penalties: {
      abilityChecks: 'disadvantage',
      speedZero: true,
      attacksAndSaves: 'disadvantage',
      hpMaxHalved: true,
    },
  },
  {
    level: 6,
    description: 'Death',
    penalties: {
      death: true,
    },
  },
];

/**
 * Get exhaustion effects for a given level
 */
export function getExhaustionEffects(level: number): ExhaustionEffect {
  const clamped = Math.max(0, Math.min(6, level));
  return EXHAUSTION_LEVELS[clamped];
}

/**
 * Apply exhaustion penalties to rolls
 */
export function applyExhaustionToRoll(
  rollType: 'ability_check' | 'attack' | 'saving_throw',
  exhaustionLevel: number,
  baseAdvantage: boolean = false
): { hasDisadvantage: boolean; advantage: boolean } {
  const effects = getExhaustionEffects(exhaustionLevel);

  let hasDisadvantage = false;

  if (rollType === 'ability_check' && effects.penalties.abilityChecks) {
    hasDisadvantage = true;
  }

  if ((rollType === 'attack' || rollType === 'saving_throw') && effects.penalties.attacksAndSaves) {
    hasDisadvantage = true;
  }

  // RAW: Advantage and disadvantage cancel
  const advantage = hasDisadvantage ? false : baseAdvantage;

  return { hasDisadvantage, advantage };
}

/**
 * Calculate modified speed based on exhaustion
 */
export function getModifiedSpeed(baseSpeed: number, exhaustionLevel: number): number {
  const effects = getExhaustionEffects(exhaustionLevel);

  if (effects.penalties.speedZero) {
    return 0;
  }

  if (effects.penalties.speedHalved) {
    return Math.floor(baseSpeed / 2);
  }

  return baseSpeed;
}

/**
 * Calculate modified max HP based on exhaustion
 */
export function getModifiedMaxHP(baseMaxHP: number, exhaustionLevel: number): number {
  const effects = getExhaustionEffects(exhaustionLevel);

  if (effects.penalties.hpMaxHalved) {
    return Math.floor(baseMaxHP / 2);
  }

  return baseMaxHP;
}

/**
 * Check if character dies from exhaustion level 6
 */
export function isDyingFromExhaustion(exhaustionLevel: number): boolean {
  return exhaustionLevel >= 6;
}

/**
 * Long rest reduces exhaustion by 1 level (PHB 186)
 */
export function reduceExhaustionOnLongRest(currentLevel: number): number {
  return Math.max(0, currentLevel - 1);
}
