import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { encounterId } = await req.json();

    // Validate DM authority
    const { data: encounter } = await supabase
      .from('encounters')
      .select('*, campaign_id')
      .eq('id', encounterId)
      .single();

    if (!encounter) {
      return new Response(JSON.stringify({ error: 'Encounter not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('dm_user_id')
      .eq('id', encounter.campaign_id)
      .single();

    if (!campaign || campaign.dm_user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Only DM can advance turn' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentRound = encounter.current_round || 0;

    // Get initiative order
    const { data: initiative } = await supabase
      .from('initiative')
      .select('*, character:characters(name)')
      .eq('encounter_id', encounterId)
      .order('initiative_roll', { ascending: false })
      .order('dex_modifier', { ascending: false })
      .order('passive_perception', { ascending: false });

    if (!initiative || initiative.length === 0) {
      throw new Error('No initiative found');
    }

    const currentIndex = initiative.findIndex((i) => i.is_current_turn);
    const nextIndex = (currentIndex + 1) % initiative.length;
    const isNewRound = nextIndex === 0;
    const newRound = isNewRound ? currentRound + 1 : currentRound;

    // Process end-of-turn effects for current character
    if (currentIndex >= 0) {
      const currentCharacterId = initiative[currentIndex].character_id;
      
      // Apply end-of-turn damage
      const { data: endEffects } = await supabase
        .from('effects')
        .select('*')
        .eq('encounter_id', encounterId)
        .eq('character_id', currentCharacterId)
        .eq('ticks_at', 'end')
        .not('damage_per_tick', 'is', null);

      if (endEffects) {
        for (const effect of endEffects) {
          // Apply damage via apply-damage function (recursive call)
          const damageResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/apply-damage`,
            {
              method: 'POST',
              headers: {
                'Authorization': req.headers.get('Authorization')!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                characterId: currentCharacterId,
                amount: effect.damage_per_tick,
                damageType: effect.damage_type_per_tick,
                encounterId,
                currentRound: newRound,
              }),
            }
          );
          
          await damageResponse.json();
        }
      }

      // Remove expired effects (exclusive end: effect expires when current_round >= end_round)
      const { error: deleteError } = await supabase
        .from('effects')
        .delete()
        .eq('encounter_id', encounterId)
        .not('end_round', 'is', null)
        .lte('end_round', newRound);

      // Remove expired conditions (exclusive end: condition expires when current_round >= ends_at_round)
      await supabase
        .from('character_conditions')
        .delete()
        .eq('encounter_id', encounterId)
        .not('ends_at_round', 'is', null)
        .lte('ends_at_round', newRound);
    }

    // Process start-of-turn effects for next character
    const nextCombatantId = initiative[nextIndex].combatant_id;
    const nextCombatantType = initiative[nextIndex].combatant_type;
    
    // Reset action economy for the next character (only if it's a character, not monster)
    if (nextCombatantType === 'character') {
      await supabase
        .from('characters')
        .update({
          action_used: false,
          bonus_action_used: false,
          reaction_used: false,
        })
        .eq('id', nextCombatantId);
    }
    
    const { data: startEffects } = await supabase
      .from('effects')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('character_id', nextCombatantId)
      .eq('ticks_at', 'start')
      .not('damage_per_tick', 'is', null);

    if (startEffects) {
      for (const effect of startEffects) {
        const damageResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/apply-damage`,
          {
            method: 'POST',
            headers: {
              'Authorization': req.headers.get('Authorization')!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              characterId: nextCombatantId,
              amount: effect.damage_per_tick,
              damageType: effect.damage_type_per_tick,
              encounterId,
              currentRound: newRound,
            }),
          }
        );
        
        await damageResponse.json();
      }
    }

    // Update initiative
    await supabase
      .from('initiative')
      .update({ is_current_turn: false })
      .eq('encounter_id', encounterId);

    await supabase
      .from('initiative')
      .update({ is_current_turn: true })
      .eq('id', initiative[nextIndex].id);

    // Update encounter round if new round
    if (isNewRound) {
      await supabase
        .from('encounters')
        .update({ current_round: newRound })
        .eq('id', encounterId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        newRound,
        isNewRound,
        currentTurn: initiative[nextIndex].character?.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in advance-turn:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});