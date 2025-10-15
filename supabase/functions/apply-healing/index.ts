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

    const { characterId, amount, encounterId, currentRound, sourceName, abilityName } = await req.json();

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
      return new Response(JSON.stringify({ error: 'Only DM can apply healing' }), {
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

    // Apply healing (cannot exceed max HP)
    const newHP = Math.min(character.max_hp, character.current_hp + amount);
    const actualHealing = newHP - character.current_hp;

    // Update character
    const { error: updateError } = await supabase
      .from('characters')
      .update({
        current_hp: newHP,
        updated_at: new Date().toISOString(),
      })
      .eq('id', characterId);

    if (updateError) throw updateError;

    // Log to combat log with proper format: (Caster) uses (Spell) on (Target) — restores X HP
    const source = sourceName || 'Unknown';
    const ability = abilityName || 'Healing';
    
    await supabase.from('combat_log').insert({
      encounter_id: encounterId,
      character_id: characterId,
      round: currentRound,
      action_type: 'healing',
      message: `${source} uses ${ability} on ${character.name} — restores ${actualHealing} HP`,
      amount: actualHealing,
      details: { source, ability },
    });

    return new Response(
      JSON.stringify({ success: true, newHP, actualHealing }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apply-healing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});