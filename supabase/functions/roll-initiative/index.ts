import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { InitiativeSchema, validateRequest } from '../_shared/validation.ts';

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

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.combat);
    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetAt, corsHeaders);
    }
    const body = await req.json();
    const validation = validateRequest(InitiativeSchema, body, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }

    const { encounterId, characterIds } = validation.data;

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
      return new Response(JSON.stringify({ error: 'Only DM can roll initiative' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch characters
    const { data: characters, error: charError } = await supabase
      .from('characters')
      .select('id, name, initiative_bonus, dex_save, passive_perception')
      .in('id', characterIds);

    if (charError || !characters) {
      throw new Error('Characters not found');
    }

    // Roll initiative for each character with stable tie-breaking
    const initiativeEntries = characters.map((char, index) => {
      const roll = Math.floor(Math.random() * 20) + 1;
      // Use initiative_bonus directly - no fallback to dex_save
      const initiativeBonus = char.initiative_bonus ?? 0;
      const total = roll + initiativeBonus;

      return {
        encounter_id: encounterId,
        character_id: char.id,
        initiative_roll: total,
        dex_modifier: initiativeBonus,
        passive_perception: char.passive_perception || 10,
        is_current_turn: false,
        // Stable tie-breaker: original fetch order as last resort
        order_tiebreak: index,
      };
    });

    // Sort by initiative (desc), then dex mod (desc), then passive perception (desc), then stable order
    initiativeEntries.sort((a, b) => {
      if (b.initiative_roll !== a.initiative_roll) return b.initiative_roll - a.initiative_roll;
      if (b.dex_modifier !== a.dex_modifier) return b.dex_modifier - a.dex_modifier;
      if (b.passive_perception !== a.passive_perception) return b.passive_perception - a.passive_perception;
      return a.order_tiebreak - b.order_tiebreak;
    });

    // Mark first as current turn
    if (initiativeEntries.length > 0) {
      initiativeEntries[0].is_current_turn = true;
    }

    // Clear existing initiative
    await supabase.from('initiative').delete().eq('encounter_id', encounterId);

    // Insert new initiative
    const { error: insertError } = await supabase
      .from('initiative')
      .insert(initiativeEntries);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, initiative: initiativeEntries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in roll-initiative:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});