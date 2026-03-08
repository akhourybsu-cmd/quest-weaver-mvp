import { calculateModifier, DND_CLASSES } from "@/lib/dnd5e";

/**
 * Shared HP calculation for wizard review panels.
 * Computes total max HP from level 1 + all level-up choices.
 * 
 * BUG FIX: Now properly handles multiclass HP calculation by accepting
 * an optional classesWithLevels array for accurate multiclass HP.
 */
export function computeTotalHP(
  className: string | undefined,
  level: number,
  conScore: number,
  levelChoices: Record<number, any> | any[] | undefined,
  abilityBonuses?: Record<string, number>,
  classesWithLevels?: Array<{ className: string; level: number; isPrimary?: boolean }>
): number {
  // Apply ancestry CON bonus
  let effectiveCon = conScore;
  if (abilityBonuses) {
    const conBonus = abilityBonuses['con'] || abilityBonuses['CON'] || abilityBonuses['Con'] || 0;
    effectiveCon += conBonus;
  }
  const conMod = calculateModifier(effectiveCon);
  
  // Single class case (or primary class for display)
  const classData = DND_CLASSES.find(c => c.value === className);
  const hitDie = classData?.hitDie || 8;
  
  // Level 1: max hit die + CON mod (always uses primary class hit die)
  let maxHP = hitDie + conMod;
  
  // BUG FIX: For multiclass, each class level uses its own hit die
  if (classesWithLevels && classesWithLevels.length > 1) {
    // Skip level 1 of primary class (already counted above)
    let totalProcessed = 1;
    for (const cls of classesWithLevels) {
      const clsData = DND_CLASSES.find(c => c.value === cls.className);
      const clsHitDie = clsData?.hitDie || 8;
      const startLvl = cls.isPrimary ? 2 : 1;
      for (let lvl = startLvl; lvl <= cls.level; lvl++) {
        const lcKey = totalProcessed + 1;
        const lc = levelChoices && typeof levelChoices === 'object' && !Array.isArray(levelChoices)
          ? levelChoices[lcKey]
          : undefined;
        const hpRoll = lc?.hpRoll ?? (Math.floor(clsHitDie / 2) + 1);
        maxHP += hpRoll + conMod;
        totalProcessed++;
      }
    }
  } else {
    // Single class: levels 2+ use level choices if available, otherwise average
    if (level > 1 && levelChoices && typeof levelChoices === 'object' && !Array.isArray(levelChoices)) {
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
  }
  
  // BUG FIX: Minimum HP should be 1, not 1 per level
  return Math.max(maxHP, 1);
}
