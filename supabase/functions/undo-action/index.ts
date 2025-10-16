import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { UndoActionSchema, validateRequest } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const validation = validateRequest(UndoActionSchema, body, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }

    const { encounterId, logEntryId } = validation.data;

    // Validate DM authority
    const { data: encounter, error: encounterError } = await supabaseClient
      .from('encounters')
      .select('campaign_id')
      .eq('id', encounterId)
      .single();

    if (encounterError || !encounter) {
      return new Response(JSON.stringify({ error: 'Encounter not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('dm_user_id')
      .eq('id', encounter.campaign_id)
      .single();

    if (campaignError || !campaign || campaign.dm_user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Only DM can undo actions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the log entry to undo
    const { data: logEntry, error: logError } = await supabaseClient
      .from('combat_log')
      .select('*')
      .eq('id', logEntryId)
      .single();

    if (logError || !logEntry) {
      return new Response(JSON.stringify({ error: 'Log entry not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Undoing action:', logEntry.action_type);

    // Reverse the action based on type
    if (logEntry.action_type === 'damage' && logEntry.character_id && logEntry.amount) {
      // Restore HP
      const { data: character } = await supabaseClient
        .from('characters')
        .select('current_hp, max_hp')
        .eq('id', logEntry.character_id)
        .single();

      if (character) {
        const restoredHP = Math.min(character.max_hp, character.current_hp + logEntry.amount);
        await supabaseClient
          .from('characters')
          .update({ current_hp: restoredHP })
          .eq('id', logEntry.character_id);
      }
    } else if (logEntry.action_type === 'healing' && logEntry.character_id && logEntry.amount) {
      // Remove HP
      const { data: character } = await supabaseClient
        .from('characters')
        .select('current_hp')
        .eq('id', logEntry.character_id)
        .single();

      if (character) {
        const reducedHP = Math.max(0, character.current_hp - logEntry.amount);
        await supabaseClient
          .from('characters')
          .update({ current_hp: reducedHP })
          .eq('id', logEntry.character_id);
      }
    } else if (logEntry.action_type === 'effect_applied' && logEntry.details?.effectId) {
      // Remove the effect
      await supabaseClient
        .from('effects')
        .delete()
        .eq('id', logEntry.details.effectId);
    } else {
      return new Response(JSON.stringify({ error: 'Cannot undo this action type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete the log entry
    await supabaseClient
      .from('combat_log')
      .delete()
      .eq('id', logEntryId);

    // Add an undo log entry
    await supabaseClient.from('combat_log').insert({
      encounter_id: encounterId,
      round: logEntry.round,
      action_type: 'undo',
      message: `Undid: ${logEntry.message}`,
      details: { originalEntry: logEntry },
    });

    return new Response(
      JSON.stringify({ success: true, undoneAction: logEntry.action_type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in undo-action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
