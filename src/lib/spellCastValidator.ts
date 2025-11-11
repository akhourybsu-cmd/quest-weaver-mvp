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
  hasWarCaster: boolean;
  inventory: { name: string; quantity: number; value_gp?: number }[];
  goldGp: number;
  characterId: string;
  isRitual?: boolean;
}

export interface ValidationResult {
  canCast: boolean;
  blockers: string[];
  warnings: string[];
  willBreakConcentration: boolean;
  requiresComponentConsumption?: boolean;
  componentToConsume?: { description: string; cost: number };
}

/**
 * Validate if a spell can be cast given the current context
 */
export async function validateSpellCast(
  spell: {
    level: number;
    casting_time: string;
    components: SpellComponents;
    concentration?: boolean;
    ritual?: boolean;
  },
  context: CastingContext
): Promise<ValidationResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let willBreakConcentration = false;
  let requiresComponentConsumption = false;
  let componentToConsume: { description: string; cost: number } | undefined;

  // Skip action economy checks for ritual casting
  if (!context.isRitual) {
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
  }

  // Check concentration
  if (spell.concentration) {
    if (context.concentrating) {
      willBreakConcentration = true;
      warnings.push(`Casting this spell will end concentration on ${context.concentrationSpell || 'your current spell'}`);
    }
  }

  // Check verbal components (could check for silenced condition)
  if (spell.components.verbal) {
    // Future: check for silenced condition
  }

  // Check somatic components with hand economy
  if (spell.components.somatic) {
    // War Caster feat bypasses hand requirements
    if (context.hasWarCaster) {
      warnings.push('War Caster: casting with occupied hands');
    } else {
      // Exception: If you have a focus or material component in hand, that hand can perform somatic
      const canUseFocusHand = spell.components.material && (context.hasFocus || context.hasComponentPouch);
      
      if (!canUseFocusHand && !context.hasFreeSomaticHand) {
        blockers.push('You need a free hand to perform somatic components (or War Caster feat)');
      }
    }
  }

  // Check material components
  if (spell.components.material) {
    const cost = spell.components.material_cost || 0;
    
    if (cost === 0) {
      // Non-costly material: need focus or component pouch
      if (!context.hasFocus && !context.hasComponentPouch) {
        blockers.push('You need a spellcasting focus or component pouch for material components');
      }
    } else {
      // Costly material: RAW requires specific component in inventory
      const description = spell.components.material_description || 'costly material component';
      
      // We'll need to validate this asynchronously in the calling code
      // For now, just check gold as minimum requirement
      if (context.goldGp < cost) {
        blockers.push(
          `Insufficient resources for ${description} (need ${cost} gp value, have ${context.goldGp} gp)`
        );
      } else {
        if (spell.components.consumed) {
          warnings.push(`⚠️ RAW: This spell requires AND CONSUMES ${description} worth ${cost} gp. Ensure you have the actual component in inventory.`);
          requiresComponentConsumption = true;
          componentToConsume = { description, cost };
        } else {
          warnings.push(`Requires ${description} worth ${cost} gp (not consumed, but must be in inventory per RAW)`);
        }
      }
    }
  }

  return {
    canCast: blockers.length === 0,
    blockers,
    warnings,
    willBreakConcentration,
    requiresComponentConsumption,
    componentToConsume,
  };
}

/**
 * Parse spell level from slot selection
 */
export function getSpellLevel(baseLevel: number, slotLevel: number): number {
  return Math.max(baseLevel, slotLevel);
}

/**
 * Validate ritual casting
 * RAW: "The ritual version of a spell takes 10 minutes longer to cast than normal. 
 * It also doesn't expend a spell slot." (PHB 201-202)
 */
export function canCastAsRitual(
  spell: { ritual?: boolean; level: number },
  hasRitualCasting: boolean,
  isWizard: boolean,
  isPrepared: boolean,
  isInSpellbook: boolean
): { canRitual: boolean; reason?: string } {
  if (!spell.ritual) {
    return { canRitual: false, reason: 'This spell does not have the ritual tag' };
  }

  if (!hasRitualCasting) {
    return { canRitual: false, reason: 'You do not have the Ritual Casting feature' };
  }

  // Wizards can ritual cast from spellbook without preparing
  if (isWizard && isInSpellbook) {
    return { canRitual: true };
  }

  // Other classes must have it prepared/known
  if (!isPrepared) {
    return { canRitual: false, reason: 'You must have this spell prepared to cast it as a ritual' };
  }

  return { canRitual: true };
}
