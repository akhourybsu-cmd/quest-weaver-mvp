import { calculateModifier, DND_CLASSES } from "@/lib/dnd5e";

/**
 * Shared HP calculation for wizard review panels.
 * Computes total max HP from level 1 + all level-up choices.
 */
export function computeTotalHP(
  className: string | undefined,
  level: number,
  conScore: number,
  levelChoices: Record<number, any> | any[] | undefined,
  abilityBonuses?: Record<string, number>
): number {
  const classData = DND_CLASSES.find(c => c.value === className);
  const hitDie = classData?.hitDie || 8;
  
  // Apply ancestry CON bonus
  let effectiveCon = conScore;
  if (abilityBonuses) {
    const conBonus = abilityBonuses['con'] || abilityBonuses['CON'] || abilityBonuses['Con'] || 0;
    effectiveCon += conBonus;
  }
  const conMod = calculateModifier(effectiveCon);
  
  // Level 1: max hit die + CON mod
  let maxHP = hitDie + conMod;
  
  // Levels 2+: use level choices if available, otherwise average
  if (level > 1 && levelChoices && typeof levelChoices === 'object' && !Array.isArray(levelChoices)) {
    // Record keyed by level number
    for (let lvl = 2; lvl <= level; lvl++) {
      const lc = levelChoices[lvl];
      const hpRoll = lc?.hpRoll ?? (Math.floor(hitDie / 2) + 1);
      maxHP += hpRoll + conMod;
    }
  } else if (level > 1) {
    // Fallback: use average for all levels
    for (let lvl = 2; lvl <= level; lvl++) {
      maxHP += (Math.floor(hitDie / 2) + 1) + conMod;
    }
  }
  
  return Math.max(maxHP, level); // minimum 1 HP per level
}
