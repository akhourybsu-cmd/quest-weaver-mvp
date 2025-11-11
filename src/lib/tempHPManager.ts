/**
 * D&D 5E Temporary Hit Points Manager
 * Enforces RAW rules for temp HP stacking
 */

import { supabase } from "@/integrations/supabase/client";

export interface TempHPChoice {
  current: number;
  new: number;
  source: string;
}

/**
 * RAW: Check if character can receive temp HP
 * "Temporary hit points aren't cumulative. If you have temporary hit points and receive more of them, 
 * you decide whether to keep the ones you have or to gain the new ones." - PHB 198
 * 
 * @returns null if can apply directly, or TempHPChoice if player needs to choose
 */
export async function checkTempHPApplication(
  characterId: string,
  newTempHP: number,
  source: string
): Promise<TempHPChoice | null> {
  const { data: character } = await supabase
    .from('characters')
    .select('temp_hp')
    .eq('id', characterId)
    .single();

  if (!character) {
    throw new Error('Character not found');
  }

  const currentTempHP = character.temp_hp || 0;

  // If no current temp HP, can apply directly
  if (currentTempHP === 0) {
    return null;
  }

  // If has current temp HP, player must choose
  return {
    current: currentTempHP,
    new: newTempHP,
    source,
  };
}

/**
 * Apply temporary HP to a character
 * This should only be called after checkTempHPApplication returns null
 * or player has made their choice
 */
export async function applyTempHP(
  characterId: string,
  amount: number
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ temp_hp: amount })
    .eq('id', characterId);

  if (error) {
    throw error;
  }
}

/**
 * Keep current temp HP (reject new ones)
 */
export async function keepCurrentTempHP(characterId: string): Promise<void> {
  // No-op, just for explicit intent
  return;
}

/**
 * Take new temp HP (replace current ones)
 */
export async function takeNewTempHP(
  characterId: string,
  newAmount: number
): Promise<void> {
  await applyTempHP(characterId, newAmount);
}
