import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const { action, encounterId, effectData, effectId } = await req.json();

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
      return new Response(JSON.stringify({ error: 'Only DM can manage effects' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      // Check concentration conflicts
      if (effectData.requires_concentration && effectData.concentrating_character_id) {
        // Break existing concentration - delete effects AND conditions
        const { data: concentrationEffects } = await supabase
          .from('effects')
          .select('id')
          .eq('concentrating_character_id', effectData.concentrating_character_id)
          .eq('encounter_id', encounterId)
          .eq('requires_concentration', true);

        if (concentrationEffects && concentrationEffects.length > 0) {
          const effectIds = concentrationEffects.map(e => e.id);
          
          // Delete conditions linked to these effects
          await supabase
            .from('character_conditions')
            .delete()
            .in('source_effect_id', effectIds);
          
          // Delete the effects themselves
          await supabase
            .from('effects')
            .delete()
            .in('id', effectIds);
        }
      }

      // Insert new effect
      const { data, error } = await supabase
        .from('effects')
        .insert(effectData)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, effect: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'delete') {
      // Delete linked conditions first
      await supabase
        .from('character_conditions')
        .delete()
        .eq('source_effect_id', effectId);

      // Delete the effect
      const { error } = await supabase
        .from('effects')
        .delete()
        .eq('id', effectId)
        .eq('encounter_id', encounterId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-effect:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});