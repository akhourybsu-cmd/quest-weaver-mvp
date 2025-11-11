/**
 * D&D 5E Spell Upcasting and Scaling Engine
 * Handles damage, healing, duration, and target scaling per RAW
 */

export type ScalingType = 'per_slot' | 'per_two_slots' | 'fixed_increase' | 'none';

export interface SpellScaling {
  type: ScalingType;
  value: string; // e.g., '+1d8', '+1 target', '+10 minutes'
  description?: string;
}

export interface ScaledSpellEffect {
  originalValue: string;
  scaledValue: string;
  slotLevel: number;
  baseLevel: number;
  description: string;
}

/**
 * Calculate how many times to apply scaling
 */
function getScalingMultiplier(
  baseLevel: number,
  castLevel: number,
  scalingType: ScalingType
): number {
  if (castLevel <= baseLevel) return 0;
  
  const levelDiff = castLevel - baseLevel;
  
  switch (scalingType) {
    case 'per_slot':
      return levelDiff;
    case 'per_two_slots':
      return Math.floor(levelDiff / 2);
    case 'fixed_increase':
      return 1; // Only applies once if upcast at all
    case 'none':
      return 0;
    default:
      return 0;
  }
}

/**
 * Parse dice notation and scale it
 */
function scaleDiceNotation(notation: string, multiplier: number): string {
  // Match patterns like "1d8", "2d6", "3d10"
  const match = notation.match(/^(\d+)d(\d+)$/);
  if (!match) return notation;
  
  const [_, numDice, dieSize] = match;
  const newNumDice = parseInt(numDice) + multiplier;
  return `${newNumDice}d${dieSize}`;
}

/**
 * Parse and scale numeric values (e.g., targets, duration)
 */
function scaleNumericValue(value: string, multiplier: number): string {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return value;
  
  const [_, num, suffix] = match;
  const newNum = parseInt(num) + multiplier;
  return `${newNum}${suffix}`;
}

/**
 * Scale a spell effect based on slot level used
 */
export function scaleSpellEffect(
  baseLevel: number,
  castLevel: number,
  scaling: SpellScaling,
  baseValue: string
): ScaledSpellEffect {
  const multiplier = getScalingMultiplier(baseLevel, castLevel, scaling.type);
  
  if (multiplier === 0) {
    return {
      originalValue: baseValue,
      scaledValue: baseValue,
      slotLevel: castLevel,
      baseLevel,
      description: `Cast at level ${castLevel} (no scaling)`,
    };
  }
  
  let scaledValue = baseValue;
  let description = '';
  
  // Parse the scaling value to determine what to scale
  if (scaling.value.includes('d')) {
    // Dice scaling (e.g., "+1d8" per slot)
    const diceMatch = scaling.value.match(/\+?(\d+)d(\d+)/);
    if (diceMatch) {
      const additionalDice = parseInt(diceMatch[1]) * multiplier;
      const dieSize = diceMatch[2];
      
      // Add to base damage
      const baseMatch = baseValue.match(/^(\d+)d(\d+)(.*)$/);
      if (baseMatch) {
        const [_, baseDice, baseDie, modifier] = baseMatch;
        const newDice = parseInt(baseDice) + additionalDice;
        scaledValue = `${newDice}d${baseDie}${modifier}`;
        description = `+${additionalDice}d${dieSize} (upcast ${multiplier} level${multiplier > 1 ? 's' : ''})`;
      }
    }
  } else if (scaling.value.includes('target')) {
    // Target scaling (e.g., "+1 target" per slot)
    const targetMatch = scaling.value.match(/\+?(\d+)\s*target/);
    if (targetMatch) {
      const additionalTargets = parseInt(targetMatch[1]) * multiplier;
      description = `+${additionalTargets} target${additionalTargets > 1 ? 's' : ''} (upcast ${multiplier} level${multiplier > 1 ? 's' : ''})`;
    }
  } else if (scaling.value.match(/\d+\s*(minute|hour|round)/)) {
    // Duration scaling
    const durationMatch = scaling.value.match(/\+?(\d+)\s*(minute|hour|round)/);
    if (durationMatch) {
      const additionalTime = parseInt(durationMatch[1]) * multiplier;
      const unit = durationMatch[2];
      description = `+${additionalTime} ${unit}${additionalTime > 1 ? 's' : ''} (upcast ${multiplier} level${multiplier > 1 ? 's' : ''})`;
    }
  }
  
  return {
    originalValue: baseValue,
    scaledValue,
    slotLevel: castLevel,
    baseLevel,
    description: description || scaling.description || `Upcast to level ${castLevel}`,
  };
}

/**
 * Common spell scaling patterns for RAW spells
 */
export const COMMON_SPELL_SCALING: Record<string, SpellScaling> = {
  // Damage spells
  'magic-missile': {
    type: 'per_slot',
    value: '+1 dart',
    description: 'Creates one additional dart for each slot level above 1st',
  },
  'cure-wounds': {
    type: 'per_slot',
    value: '+1d8',
    description: 'Heals an additional 1d8 HP for each slot level above 1st',
  },
  'fireball': {
    type: 'per_slot',
    value: '+1d6',
    description: 'Deals an additional 1d6 damage for each slot level above 3rd',
  },
  'scorching-ray': {
    type: 'per_slot',
    value: '+1 ray',
    description: 'Creates one additional ray for each slot level above 2nd',
  },
  'spiritual-weapon': {
    type: 'per_two_slots',
    value: '+1d8',
    description: 'Deals an additional 1d8 damage for every two slot levels above 2nd',
  },
  'aid': {
    type: 'per_slot',
    value: '+5 HP',
    description: 'Increases current and maximum HP by an additional 5 for each slot level above 2nd',
  },
  'guiding-bolt': {
    type: 'per_slot',
    value: '+1d6',
    description: 'Deals an additional 1d6 damage for each slot level above 1st',
  },
  'inflict-wounds': {
    type: 'per_slot',
    value: '+1d10',
    description: 'Deals an additional 1d10 damage for each slot level above 1st',
  },
  'healing-word': {
    type: 'per_slot',
    value: '+1d4',
    description: 'Heals an additional 1d4 HP for each slot level above 1st',
  },
};

/**
 * Calculate damage/healing roll with upcasting
 */
export function rollWithUpcasting(
  baseDice: string,
  modifier: number,
  baseLevel: number,
  castLevel: number,
  scaling?: SpellScaling
): { total: number; breakdown: string; scalingInfo: string } {
  if (!scaling || castLevel <= baseLevel) {
    // No upcasting
    const rolls = rollDice(baseDice);
    const total = rolls.reduce((sum, r) => sum + r, 0) + modifier;
    return {
      total,
      breakdown: `${rolls.join(' + ')}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''} = ${total}`,
      scalingInfo: '',
    };
  }
  
  // Calculate scaled dice
  const scaled = scaleSpellEffect(baseLevel, castLevel, scaling, baseDice);
  const rolls = rollDice(scaled.scaledValue);
  const total = rolls.reduce((sum, r) => sum + r, 0) + modifier;
  
  return {
    total,
    breakdown: `${scaled.scaledValue}: ${rolls.join(' + ')}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''} = ${total}`,
    scalingInfo: scaled.description,
  };
}

/**
 * Roll dice from notation
 */
function rollDice(notation: string): number[] {
  const match = notation.match(/(\d+)d(\d+)/);
  if (!match) return [];
  
  const [_, numDice, dieSize] = match;
  const rolls: number[] = [];
  
  for (let i = 0; i < parseInt(numDice); i++) {
    rolls.push(Math.floor(Math.random() * parseInt(dieSize)) + 1);
  }
  
  return rolls;
}

/**
 * Get available slot levels for upcasting a spell
 */
export function getAvailableSlotLevels(
  spellBaseLevel: number,
  maxSlotLevel: number
): number[] {
  const levels: number[] = [];
  for (let i = spellBaseLevel; i <= maxSlotLevel; i++) {
    levels.push(i);
  }
  return levels;
}
