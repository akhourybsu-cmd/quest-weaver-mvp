/**
 * Spell Casting Validation per D&D 5E Rules
 * Handles bonus action restrictions, concentration, and components
 */

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  material_description?: string;
  material_cost?: number;
  consumed?: boolean;
}

export interface CastingContext {
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  concentrating: boolean;
  concentrationSpell?: string;
  hasLeveledSpellThisTurn: boolean;
  leveledSpellWasBonusAction: boolean;
  hasFocus: boolean;
  hasComponentPouch: boolean;
  hasFreeSomaticHand: boolean;
  inventory: { name: string; quantity: number; value_gp?: number }[];
  goldGp: number;
}

export interface ValidationResult {
  canCast: boolean;
  blockers: string[];
  warnings: string[];
  willBreakConcentration: boolean;
}

/**
 * Validate if a spell can be cast given the current context
 */
export function validateSpellCast(
  spell: {
    level: number;
    casting_time: string;
    components: SpellComponents;
    concentration?: boolean;
  },
  context: CastingContext
): ValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let willBreakConcentration = false;

  // Check action economy
  const isAction = spell.casting_time.toLowerCase().includes('action') && 
                   !spell.casting_time.toLowerCase().includes('bonus');
  const isBonusAction = spell.casting_time.toLowerCase().includes('bonus action');
  const isReaction = spell.casting_time.toLowerCase().includes('reaction');

  if (isAction && context.actionUsed) {
    blockers.push('You have already used your action this turn');
  }

  if (isBonusAction && context.bonusActionUsed) {
    blockers.push('You have already used your bonus action this turn');
  }

  if (isReaction && context.reactionUsed) {
    blockers.push('You have already used your reaction this round');
  }

  // RAW: Bonus action spell restriction
  // If you cast a leveled spell as a bonus action, you can only cast cantrips with action this turn
  if (spell.level > 0 && isBonusAction && context.hasLeveledSpellThisTurn) {
    blockers.push('You can only cast one leveled spell per turn (bonus action restriction)');
  }

  if (context.leveledSpellWasBonusAction && spell.level > 0 && isAction) {
    blockers.push('After casting a bonus action spell, you can only cast cantrips with your action');
  }

  // Check concentration
  if (spell.concentration) {
    if (context.concentrating) {
      willBreakConcentration = true;
      warnings.push(`Casting this spell will end concentration on ${context.concentrationSpell || 'your current spell'}`);
    }
  }

  // Check components
  if (spell.components.verbal) {
    // Could add silenced condition check here
  }

  if (spell.components.somatic && !context.hasFreeSomaticHand) {
    // Exception: If you have a focus or material component in hand, that hand can perform somatic
    if (!spell.components.material && !context.hasFocus) {
      blockers.push('You need a free hand to perform somatic components');
    }
  }

  if (spell.components.material) {
    const cost = spell.components.material_cost || 0;
    
    if (cost === 0) {
      // Non-costly material: need focus or component pouch
      if (!context.hasFocus && !context.hasComponentPouch) {
        blockers.push('You need a spellcasting focus or component pouch for material components');
      }
    } else {
      // Costly material: must have specific item or enough gold
      const description = spell.components.material_description || '';
      
      // Check if we have enough gold to cover the cost
      if (context.goldGp < cost) {
        blockers.push(
          `Insufficient funds for material component: ${description} (need ${cost} gp, have ${context.goldGp} gp)${spell.components.consumed ? ' - consumed' : ''}`
        );
      } else {
        // Check if material is consumed
        if (spell.components.consumed) {
          warnings.push(`This spell will consume ${cost} gp worth of materials: ${description}`);
        } else {
          warnings.push(`Requires ${cost} gp worth of materials: ${description} (not consumed)`);
        }
      }
    }
  }

  return {
    canCast: blockers.length === 0,
    blockers,
    warnings,
    willBreakConcentration,
  };
}

/**
 * Check if War Caster feat allows somatic components with weapons/shields
 */
export function hasWarCasterFeat(character: any): boolean {
  // Would check character.feats array for War Caster
  return false; // Placeholder
}

/**
 * Parse spell level from slot selection
 */
export function getSpellLevel(baseLevel: number, slotLevel: number): number {
  return Math.max(baseLevel, slotLevel);
}
