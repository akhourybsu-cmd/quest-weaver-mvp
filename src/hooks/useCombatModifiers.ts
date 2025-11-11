import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveAdvantageMode, type AdvantageMode, type CoverType } from '@/lib/attackRollEngine';

interface CombatModifier {
  id: string;
  modifier_type: string;
  source: string;
  expires_at: string;
}

interface ModifierSummary {
  advantageMode: AdvantageMode;
  cover: CoverType;
  sources: {
    advantages: string[];
    disadvantages: string[];
    coverSource?: string;
  };
}

/**
 * Hook to fetch and monitor combat modifiers for a specific actor
 */
export function useCombatModifiers(
  encounterId: string,
  actorId: string,
  actorType: 'character' | 'monster'
): ModifierSummary {
  const [modifiers, setModifiers] = useState<CombatModifier[]>([]);

  useEffect(() => {
    loadModifiers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`modifiers-${actorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combat_modifiers',
          filter: `actor_id=eq.${actorId}`,
        },
        () => {
          loadModifiers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, actorId, actorType]);

  const loadModifiers = async () => {
    const { data } = await supabase
      .from('combat_modifiers')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('actor_id', actorId)
      .eq('actor_type', actorType);

    if (data) {
      setModifiers(data);
    }
  };

  // Calculate summary
  const advantages = modifiers
    .filter(m => m.modifier_type === 'advantage')
    .map(m => m.source);
  
  const disadvantages = modifiers
    .filter(m => m.modifier_type === 'disadvantage')
    .map(m => m.source);

  const coverModifier = modifiers.find(m => m.modifier_type.startsWith('cover_'));
  let cover: CoverType = 'none';
  if (coverModifier) {
    if (coverModifier.modifier_type === 'cover_half') cover = 'half';
    else if (coverModifier.modifier_type === 'cover_three_quarters') cover = 'three_quarters';
    else if (coverModifier.modifier_type === 'cover_full') cover = 'full';
  }

  const advantageMode = resolveAdvantageMode(
    advantages.length > 0,
    disadvantages.length > 0
  );

  return {
    advantageMode,
    cover,
    sources: {
      advantages,
      disadvantages,
      coverSource: coverModifier?.source,
    },
  };
}
