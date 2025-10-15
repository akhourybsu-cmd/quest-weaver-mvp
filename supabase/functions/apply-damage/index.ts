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

    const { characterId, amount, damageType, encounterId, currentRound, sourceName, abilityName } = await req.json();

    // Validate DM authority
    const { data: encounter } = await supabase
      .from('encounters')
      .select('campaign_id')
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
      return new Response(JSON.stringify({ error: 'Only DM can apply damage' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch character data
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (charError || !character) {
      throw new Error('Character not found');
    }

    // Apply damage using 5e rules
    let damageSteps: string[] = [];
    let finalDamage = amount;

    // Check immunity
    if (character.immunities?.includes(damageType)) {
      damageSteps.push(`Immune to ${damageType} damage`);
      finalDamage = 0;
    } else {
      // Check resistance/vulnerability (exclusive)
      if (character.resistances?.includes(damageType)) {
        finalDamage = Math.floor(finalDamage / 2);
        damageSteps.push(`Resistant to ${damageType}: ${amount} → ${finalDamage}`);
      } else if (character.vulnerabilities?.includes(damageType)) {
        finalDamage = finalDamage * 2;
        damageSteps.push(`Vulnerable to ${damageType}: ${amount} → ${finalDamage}`);
      }
    }

    // Apply to temp HP first
    let tempHPDamage = 0;
    let hpDamage = 0;

    if (finalDamage > 0 && character.temp_hp > 0) {
      tempHPDamage = Math.min(finalDamage, character.temp_hp);
      finalDamage -= tempHPDamage;
      damageSteps.push(`Temp HP absorbed ${tempHPDamage} damage`);
    }

    // Remaining damage to HP
    if (finalDamage > 0) {
      hpDamage = finalDamage;
      damageSteps.push(`${hpDamage} damage to HP`);
    }

    const newTempHP = Math.max(0, character.temp_hp - tempHPDamage);
    const newHP = Math.max(0, character.current_hp - hpDamage);

    // Update character
    const { error: updateError } = await supabase
      .from('characters')
      .update({
        current_hp: newHP,
        temp_hp: newTempHP,
        updated_at: new Date().toISOString(),
      })
      .eq('id', characterId);

    if (updateError) throw updateError;

    // Log to combat log with proper format: (Attacker) uses (Ability) against (Target) for (X Damage)
    let damageMessage: string;
    const source = sourceName || 'Unknown';
    const ability = abilityName || 'Attack';
    
    if (hpDamage > 0) {
      damageMessage = `${source} uses ${ability} against ${character.name} for ${hpDamage} ${damageType} damage`;
    } else if (finalDamage === 0 && character.immunities?.includes(damageType)) {
      damageMessage = `${source} uses ${ability} against ${character.name} — immune to ${damageType} damage`;
    } else {
      damageMessage = `${source} uses ${ability} against ${character.name} for ${amount} ${damageType} damage`;
    }
    
    await supabase.from('combat_log').insert({
      encounter_id: encounterId,
      character_id: characterId,
      round: currentRound,
      action_type: 'damage',
      message: damageMessage,
      amount: hpDamage,
      details: { steps: damageSteps, type: damageType, source, ability },
    });

    // Check for concentration
    if (hpDamage > 0) {
      const { data: concentrationEffects } = await supabase
        .from('effects')
        .select('id, name')
        .eq('concentrating_character_id', characterId)
        .eq('encounter_id', encounterId)
        .eq('requires_concentration', true);

      const concentrationDC = Math.max(10, Math.floor(hpDamage / 2));

      return new Response(
        JSON.stringify({
          success: true,
          newHP,
          newTempHP,
          damageSteps,
          concentrationCheck: concentrationEffects && concentrationEffects.length > 0
            ? { required: true, dc: concentrationDC, effects: concentrationEffects }
            : { required: false },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, newHP, newTempHP, damageSteps }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apply-damage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});