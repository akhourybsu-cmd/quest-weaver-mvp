/**
 * Encumbrance Rules (PHB 176)
 * 
 * RAW: If you carry weight in excess of 5 times your Strength score, you are encumbered,
 * which means your speed drops by 10 feet.
 * 
 * If you carry weight in excess of 10 times your Strength score, up to your maximum carrying
 * capacity, you are instead heavily encumbered, which means your speed drops by 20 feet and
 * you have disadvantage on ability checks, attack rolls, and saving throws that use Strength,
 * Dexterity, or Constitution.
 */

export type EncumbranceLevel = 'none' | 'encumbered' | 'heavily_encumbered' | 'overloaded';

export interface EncumbranceStatus {
  level: EncumbranceLevel;
  carriedWeight: number;
  capacity: number;
  encumberedThreshold: number;
  heavilyEncumberedThreshold: number;
  speedPenalty: number;
  hasDisadvantage: boolean;
}

/**
 * Calculate encumbrance status for a character
 * @param strScore Strength ability score
 * @param carriedWeight Total weight carried in pounds
 * @param hasPowerfulBuild Whether character has Powerful Build feature (doubles capacity)
 * @returns Encumbrance status with all thresholds and penalties
 */
export function calculateEncumbrance(
  strScore: number,
  carriedWeight: number,
  hasPowerfulBuild: boolean = false
): EncumbranceStatus {
  // RAW: Carrying capacity = 15 × STR score
  const baseCapacity = strScore * 15;
  const capacity = hasPowerfulBuild ? baseCapacity * 2 : baseCapacity;
  
  // RAW: Encumbered at 5 × STR score
  const encumberedThreshold = hasPowerfulBuild ? strScore * 10 : strScore * 5;
  
  // RAW: Heavily encumbered at 10 × STR score
  const heavilyEncumberedThreshold = hasPowerfulBuild ? strScore * 20 : strScore * 10;

  let level: EncumbranceLevel;
  let speedPenalty = 0;
  let hasDisadvantage = false;

  if (carriedWeight > capacity) {
    level = 'overloaded';
    speedPenalty = 0; // Cannot move
    hasDisadvantage = true;
  } else if (carriedWeight > heavilyEncumberedThreshold) {
    level = 'heavily_encumbered';
    speedPenalty = 20;
    hasDisadvantage = true; // Disadvantage on STR/DEX/CON checks, attacks, saves
  } else if (carriedWeight > encumberedThreshold) {
    level = 'encumbered';
    speedPenalty = 10;
    hasDisadvantage = false;
  } else {
    level = 'none';
    speedPenalty = 0;
    hasDisadvantage = false;
  }

  return {
    level,
    carriedWeight,
    capacity,
    encumberedThreshold,
    heavilyEncumberedThreshold,
    speedPenalty,
    hasDisadvantage,
  };
}

/**
 * Apply encumbrance penalty to movement speed
 * @param baseSpeed Base movement speed
 * @param encumbrance Encumbrance status
 * @returns Modified speed after encumbrance penalties
 */
export function getModifiedSpeed(baseSpeed: number, encumbrance: EncumbranceStatus): number {
  if (encumbrance.level === 'overloaded') {
    return 0; // Cannot move when over capacity
  }
  return Math.max(0, baseSpeed - encumbrance.speedPenalty);
}

/**
 * Check if encumbrance imposes disadvantage on a roll
 * @param encumbrance Encumbrance status
 * @param rollType Type of roll (ability_check, attack, saving_throw)
 * @param ability Ability used for the roll
 * @returns Whether disadvantage applies
 */
export function hasEncumbranceDisadvantage(
  encumbrance: EncumbranceStatus,
  rollType: 'ability_check' | 'attack' | 'saving_throw',
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
): boolean {
  // Only heavily encumbered imposes disadvantage
  if (!encumbrance.hasDisadvantage) return false;

  // Only affects STR, DEX, CON
  if (!['str', 'dex', 'con'].includes(ability)) return false;

  return true;
}

/**
 * Get user-friendly description of encumbrance status
 */
export function getEncumbranceDescription(encumbrance: EncumbranceStatus): string {
  switch (encumbrance.level) {
    case 'none':
      return 'Unencumbered';
    case 'encumbered':
      return `Encumbered (speed -${encumbrance.speedPenalty}ft)`;
    case 'heavily_encumbered':
      return `Heavily Encumbered (speed -${encumbrance.speedPenalty}ft, disadvantage on STR/DEX/CON)`;
    case 'overloaded':
      return 'Overloaded (cannot move)';
    default:
      return 'Unknown';
  }
}

/**
 * Variant Encumbrance (Optional Rule, PHB 176)
 * More granular weight categories
 */
export interface VariantEncumbranceStatus extends EncumbranceStatus {
  isVariant: true;
  speedMultiplier: number;
}

export function calculateVariantEncumbrance(
  strScore: number,
  carriedWeight: number,
  hasPowerfulBuild: boolean = false
): VariantEncumbranceStatus {
  const baseCapacity = strScore * 15;
  const capacity = hasPowerfulBuild ? baseCapacity * 2 : baseCapacity;
  
  const encumberedThreshold = hasPowerfulBuild ? strScore * 10 : strScore * 5;
  const heavilyEncumberedThreshold = hasPowerfulBuild ? strScore * 20 : strScore * 10;

  let level: EncumbranceLevel;
  let speedMultiplier = 1;
  let speedPenalty = 0;
  let hasDisadvantage = false;

  if (carriedWeight > capacity) {
    level = 'overloaded';
    speedMultiplier = 0;
    speedPenalty = 0;
    hasDisadvantage = true;
  } else if (carriedWeight > heavilyEncumberedThreshold) {
    level = 'heavily_encumbered';
    speedMultiplier = 0.5; // Half speed
    hasDisadvantage = true;
  } else if (carriedWeight > encumberedThreshold) {
    level = 'encumbered';
    speedMultiplier = 0.67; // Two-thirds speed
    hasDisadvantage = false;
  } else {
    level = 'none';
    speedMultiplier = 1;
    hasDisadvantage = false;
  }

  return {
    isVariant: true,
    level,
    carriedWeight,
    capacity,
    encumberedThreshold,
    heavilyEncumberedThreshold,
    speedPenalty,
    speedMultiplier,
    hasDisadvantage,
  };
}
