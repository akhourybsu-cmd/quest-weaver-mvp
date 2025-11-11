/**
 * Costly Material Component Validation (PHB 203)
 * "If a cost is indicated for a component, a character must have that specific component 
 * before he or she can cast the spell."
 * 
 * NOTE: Full inventory validation will be enabled once the new inventory system is populated
 */

import { supabase } from "@/integrations/supabase/client";

export interface CostlyComponentCheck {
  canCast: boolean;
  hasComponent: boolean;
  hasGold: boolean;
  componentName: string;
  cost: number;
  consumed: boolean;
  reason?: string;
}

/**
 * Check if character has the required costly component in inventory
 * Temporarily simplified until inventory system is fully populated
 */
export async function validateCostlyComponent(
  characterId: string,
  materialDescription: string,
  requiredCost: number,
  consumed: boolean
): Promise<CostlyComponentCheck> {
  // Check if character has enough gold as minimum requirement
  const { data: character } = await supabase
    .from('characters')
    .select('resources')
    .eq('id', characterId)
    .single();

  const resources = character?.resources as any;
  const goldGp = typeof resources === 'object' && resources !== null ? (resources.gold_gp || 0) : 0;
  const hasGold = goldGp >= requiredCost;

  // For now, we check gold only - future versions will check actual inventory
  if (!hasGold) {
    return {
      canCast: false,
      hasComponent: false,
      hasGold: false,
      componentName: materialDescription,
      cost: requiredCost,
      consumed,
      reason: `Missing required component: ${materialDescription} (${requiredCost} gp value). You need ${requiredCost} gp.`,
    };
  }

  // Has gold - warn that actual component should be in inventory per RAW
  return {
    canCast: true,
    hasComponent: true, // Assuming they can buy it with their gold
    hasGold: true,
    componentName: materialDescription,
    cost: requiredCost,
    consumed,
  };
}

/**
 * Consume a costly component - deducts gold for now
 * Future versions will consume actual inventory items
 */
export async function consumeCostlyComponent(
  characterId: string,
  materialDescription: string,
  requiredCost: number
): Promise<void> {
  const { data: character } = await supabase
    .from('characters')
    .select('resources')
    .eq('id', characterId)
    .single();

  if (!character) return;

  const resources = character.resources as any;
  const currentGold = typeof resources === 'object' && resources !== null ? (resources.gold_gp || 0) : 0;

  await supabase
    .from('characters')
    .update({
      resources: {
        ...(typeof resources === 'object' ? resources : {}),
        gold_gp: currentGold - requiredCost,
      },
    })
    .eq('id', characterId);
}
