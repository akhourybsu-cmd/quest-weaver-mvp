import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      encounterId,
      ability,
      dc,
      description,
      targetScope,
      customTargetIds,
      advantageMode,
      halfOnSuccess,
      expiresAt
    } = await req.json()

    // Verify user is DM for this encounter's campaign
    const { data: encounter } = await supabaseClient
      .from('encounters')
      .select('campaign_id, campaigns(dm_user_id)')
      .eq('id', encounterId)
      .single()

    if (!encounter || encounter.campaigns.dm_user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden - not DM' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Compute target list using helper function
    const { data: targetIds, error: targetsError } = await supabaseClient
      .rpc('compute_save_prompt_targets', {
        _encounter_id: encounterId,
        _target_scope: targetScope,
        _target_character_ids: targetScope === 'custom' ? customTargetIds : null,
      })

    if (targetsError) {
      console.error('Error computing targets:', targetsError)
      return new Response(JSON.stringify({ error: 'Failed to compute targets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const targetCount = targetIds?.length || 0

    // Create save prompt with computed targets
    const { data: prompt, error: insertError } = await supabaseClient
      .from('save_prompts')
      .insert({
        encounter_id: encounterId,
        ability,
        dc,
        description,
        target_scope: targetScope,
        advantage_mode: advantageMode || 'normal',
        half_on_success: halfOnSuccess || false,
        target_character_ids: targetIds,
        expected_responses: targetCount,
        received_responses: 0,
        expires_at: expiresAt || null,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating save prompt:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Save prompt created: ${prompt.id}, targeting ${targetCount} characters`)

    return new Response(JSON.stringify({ 
      prompt,
      targetCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error in create-save-prompt:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})