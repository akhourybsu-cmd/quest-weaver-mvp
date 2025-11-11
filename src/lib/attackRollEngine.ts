/**
 * D&D 5E Attack Roll Engine
 * Handles advantage/disadvantage, critical hits, and cover mechanics
 */

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';
export type CoverType = 'none' | 'half' | 'three_quarters' | 'full';

export interface AttackRollContext {
  attackBonus: number;
  targetAC: number;
  advantageMode: AdvantageMode;
  cover: CoverType;
  criticalRange?: number; // For expanded crit ranges (e.g., Champion)
}

export interface AttackRollResult {
  roll1: number;
  roll2: number | null;
  chosenRoll: number;
  totalWithBonus: number;
  targetACWithCover: number;
  isHit: boolean;
  isCritical: boolean;
  isCriticalMiss: boolean;
  description: string;
}

/**
 * Roll a d20 attack with full 5E rules
 */
export function rollAttack(ctx: AttackRollContext): AttackRollResult {
  const critRange = ctx.criticalRange || 20;
  
  // Roll first d20
  const roll1 = Math.floor(Math.random() * 20) + 1;
  let roll2: number | null = null;
  
  // Roll second d20 if advantage or disadvantage
  if (ctx.advantageMode !== 'normal') {
    roll2 = Math.floor(Math.random() * 20) + 1;
  }
  
  // Choose the roll based on advantage/disadvantage
  let chosenRoll = roll1;
  if (roll2 !== null) {
    if (ctx.advantageMode === 'advantage') {
      chosenRoll = Math.max(roll1, roll2);
    } else if (ctx.advantageMode === 'disadvantage') {
      chosenRoll = Math.min(roll1, roll2);
    }
  }
  
  // Calculate cover AC bonus
  let coverBonus = 0;
  if (ctx.cover === 'half') coverBonus = 2;
  else if (ctx.cover === 'three_quarters') coverBonus = 5;
  else if (ctx.cover === 'full') {
    // Full cover: cannot be targeted
    return {
      roll1,
      roll2,
      chosenRoll,
      totalWithBonus: 0,
      targetACWithCover: ctx.targetAC + coverBonus,
      isHit: false,
      isCritical: false,
      isCriticalMiss: false,
      description: "Target has full cover and cannot be targeted directly",
    };
  }
  
  const totalWithBonus = chosenRoll + ctx.attackBonus;
  const targetACWithCover = ctx.targetAC + coverBonus;
  
  // Check for critical hit (natural 20 or within expanded range)
  const isCritical = chosenRoll >= critRange;
  
  // Check for critical miss (natural 1)
  const isCriticalMiss = chosenRoll === 1;
  
  // Determine hit/miss (nat 20 always hits, nat 1 always misses)
  let isHit: boolean;
  if (isCritical) {
    isHit = true;
  } else if (isCriticalMiss) {
    isHit = false;
  } else {
    isHit = totalWithBonus >= targetACWithCover;
  }
  
  // Build description
  let description = '';
  if (roll2 !== null) {
    description = `Rolled ${roll1} and ${roll2}, `;
    if (ctx.advantageMode === 'advantage') {
      description += `kept ${chosenRoll} (advantage). `;
    } else {
      description += `kept ${chosenRoll} (disadvantage). `;
    }
  } else {
    description = `Rolled ${chosenRoll}. `;
  }
  
  description += `Total: ${totalWithBonus} vs AC ${targetACWithCover}`;
  if (coverBonus > 0) {
    description += ` (${ctx.cover} cover +${coverBonus})`;
  }
  
  if (isCritical) {
    description += ' — CRITICAL HIT!';
  } else if (isCriticalMiss) {
    description += ' — Critical Miss';
  } else if (isHit) {
    description += ' — Hit';
  } else {
    description += ' — Miss';
  }
  
  return {
    roll1,
    roll2,
    chosenRoll,
    totalWithBonus,
    targetACWithCover,
    isHit,
    isCritical,
    isCriticalMiss,
    description,
  };
}

/**
 * Roll damage dice with optional critical hit doubling
 * Per RAW: Double the dice rolled, not the modifiers
 */
export function rollDamage(
  diceNotation: string,
  modifier: number,
  isCritical: boolean
): { total: number; breakdown: string } {
  const match = diceNotation.match(/(\d+)d(\d+)/);
  if (!match) {
    return { total: modifier, breakdown: `${modifier}` };
  }
  
  let numDice = parseInt(match[1]);
  const dieSize = parseInt(match[2]);
  
  // Double dice on crit (not modifiers)
  if (isCritical) {
    numDice *= 2;
  }
  
  const rolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * dieSize) + 1);
  }
  
  const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = diceTotal + modifier;
  
  let breakdown = `${rolls.join(' + ')}`;
  if (modifier !== 0) {
    breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  breakdown += ` = ${total}`;
  
  if (isCritical) {
    breakdown = `CRIT! ${diceNotation} × 2: ${breakdown}`;
  }
  
  return { total, breakdown };
}

/**
 * Calculate effective AC with cover bonus
 */
export function calculateEffectiveAC(baseAC: number, cover: CoverType): number {
  if (cover === 'half') return baseAC + 2;
  if (cover === 'three_quarters') return baseAC + 5;
  if (cover === 'full') return Infinity; // Cannot be targeted
  return baseAC;
}

/**
 * Determine if advantage and disadvantage cancel out
 * RAW: Any number of sources of advantage/disadvantage result in either adv, dis, or normal (they cancel)
 */
export function resolveAdvantageMode(
  hasAdvantage: boolean,
  hasDisadvantage: boolean
): AdvantageMode {
  if (hasAdvantage && hasDisadvantage) return 'normal';
  if (hasAdvantage) return 'advantage';
  if (hasDisadvantage) return 'disadvantage';
  return 'normal';
}
