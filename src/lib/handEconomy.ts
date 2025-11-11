/**
 * Hand Economy Tracking for Somatic Components (PHB 203)
 * Tracks what's in each hand and validates somatic component casting
 */

import { supabase } from "@/integrations/supabase/client";

export type HandItem = 
  | { type: 'weapon'; name: string; properties: string[] }
  | { type: 'shield'; name: string }
  | { type: 'focus'; name: string; focusTypes: string[] }
  | { type: 'free' }
  | { type: 'other'; name: string };

export interface HandState {
  left: HandItem;
  right: HandItem;
}

/**
 * Parse equipped item strings into HandItem objects
 */
export function parseHandItem(itemString: string | null): HandItem {
  if (!itemString || itemString === 'free' || itemString === '') {
    return { type: 'free' };
  }

  // Try to determine item type from name
  const lower = itemString.toLowerCase();

  if (lower.includes('shield')) {
    return { type: 'shield', name: itemString };
  }

  if (lower.includes('focus') || lower.includes('wand') || lower.includes('staff') || 
      lower.includes('orb') || lower.includes('holy symbol') || lower.includes('druidic focus')) {
    return { 
      type: 'focus', 
      name: itemString,
      focusTypes: ['arcane', 'holy', 'druidic'].filter(t => lower.includes(t)),
    };
  }

  // Check for weapon keywords
  if (lower.includes('sword') || lower.includes('axe') || lower.includes('dagger') || 
      lower.includes('mace') || lower.includes('bow') || lower.includes('crossbow') ||
      lower.includes('spear') || lower.includes('hammer')) {
    return { 
      type: 'weapon', 
      name: itemString,
      properties: lower.includes('two-handed') || lower.includes('two handed') ? ['two-handed'] : [],
    };
  }

  return { type: 'other', name: itemString };
}

/**
 * Get current hand state for a character
 * Temporarily returns free hands until column is populated
 */
export async function getHandState(characterId: string): Promise<HandState> {
  // Types will update after migration - using any temporarily
  const { data: character }: any = await supabase
    .from('characters')
    .select('left_hand_item, right_hand_item')
    .eq('id', characterId)
    .single();

  if (!character) {
    return {
      left: { type: 'free' },
      right: { type: 'free' },
    };
  }

  return {
    left: parseHandItem(character.left_hand_item),
    right: parseHandItem(character.right_hand_item),
  };
}

/**
 * Update what's in a character's hands
 */
export async function updateHandState(
  characterId: string,
  handState: { left?: string | null; right?: string | null }
): Promise<void> {
  const updates: any = {};
  if (handState.left !== undefined) updates.left_hand_item = handState.left;
  if (handState.right !== undefined) updates.right_hand_item = handState.right;

  await supabase
    .from('characters')
    .update(updates)
    .eq('id', characterId);
}

/**
 * Check if character has a free hand for somatic components
 * RAW: "If a spell requires a somatic component, the caster must have free use of at least one hand" (PHB 203)
 * Special case: "A spellcaster must have a hand free to access a spell's material components... 
 * but it can be the same hand that he or she uses to perform somatic components" (PHB 203)
 */
export function hasFreeSomaticHand(
  handState: HandState,
  hasMaterialComponent: boolean,
  hasFocus: boolean
): boolean {
  // If spell has material component, the hand holding the focus/component can do somatic
  if (hasMaterialComponent) {
    if (handState.left.type === 'focus' || handState.right.type === 'focus') {
      return true; // Focus hand can do somatic for spells with material components
    }
    if (handState.left.type === 'free' || handState.right.type === 'free') {
      return true; // Can use component pouch with free hand
    }
  }

  // For spells without material component, need a truly free hand
  return handState.left.type === 'free' || handState.right.type === 'free';
}

/**
 * Check if character has War Caster feat
 * War Caster allows: "You can perform the somatic components of spells even when you have 
 * weapons or a shield in one or both hands." (PHB 170)
 */
export async function hasWarCasterFeat(characterId: string): Promise<boolean> {
  // Check character_feats table
  const { data: feats } = await supabase
    .from('character_feats')
    .select('feat_id, feats(name)')
    .eq('character_id', characterId);

  if (feats) {
    for (const feat of feats) {
      const featData = feat.feats as any;
      if (featData?.name === 'War Caster') {
        return true;
      }
    }
  }

  // Also check character_features table for backwards compatibility
  const { data: features } = await supabase
    .from('character_features')
    .select('name')
    .eq('character_id', characterId)
    .ilike('name', '%War Caster%');

  return (features?.length || 0) > 0;
}

/**
 * Validate somatic component casting with full RAW logic
 */
export async function validateSomaticComponents(
  characterId: string,
  hasMaterialComponent: boolean
): Promise<{ canCast: boolean; reason?: string }> {
  const handState = await getHandState(characterId);
  const hasWarCaster = await hasWarCasterFeat(characterId);

  // War Caster bypasses all hand restrictions
  if (hasWarCaster) {
    return { canCast: true };
  }

  // Check if we have a focus in hand
  const hasFocus = handState.left.type === 'focus' || handState.right.type === 'focus';

  // Validate hand availability
  const hasFreHand = hasFreeSomaticHand(handState, hasMaterialComponent, hasFocus);

  if (!hasFreHand) {
    // Determine what's blocking
    const leftItem = handState.left.type !== 'free' ? handState.left.type : null;
    const rightItem = handState.right.type !== 'free' ? handState.right.type : null;

    if (leftItem && rightItem) {
      return {
        canCast: false,
        reason: `Both hands occupied (${leftItem} + ${rightItem}). Need a free hand for somatic components (or War Caster feat).`,
      };
    }

    return {
      canCast: false,
      reason: `No free hand for somatic components. Consider the War Caster feat.`,
    };
  }

  return { canCast: true };
}
