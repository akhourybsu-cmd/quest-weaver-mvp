import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { SaveResultSchema, validateRequest } from '../_shared/validation.ts';

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

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.standard);
    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetAt, corsHeaders);
    }

    const body = await req.json();
    const validation = validateRequest(SaveResultSchema, body, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }

    const {
      savePromptId,
      characterId,
      roll,
      modifier
    } = validation.data;

    // Verify user owns this character OR is DM
    const { data: character } = await supabaseClient
      .from('characters')
      .select('user_id, campaign_id, campaigns(dm_user_id)')
      .eq('id', characterId)
      .single()

    if (!character || (character.user_id !== user.id && character.campaigns.dm_user_id !== user.id)) {
      return new Response(JSON.stringify({ error: 'Forbidden - not your character' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get save prompt details
    const { data: prompt } = await supabaseClient
      .from('save_prompts')
      .select('dc, status, half_on_success')
      .eq('id', savePromptId)
      .single()

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Save prompt not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Don't allow results for resolved/expired prompts
    if (prompt.status !== 'active') {
      return new Response(JSON.stringify({ error: 'This save prompt is no longer active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const total = roll + modifier
    const success = total >= prompt.dc

    // Insert result - trigger will auto-increment and potentially auto-resolve
    const { data: result, error: insertError } = await supabaseClient
      .from('save_results')
      .insert({
        save_prompt_id: savePromptId,
        character_id: characterId,
        roll,
        modifier,
        total,
        success,
      })
      .select()
      .single()

    if (insertError) {
      // Check if it's a unique constraint violation (duplicate submission)
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'You have already submitted a result for this save' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.error('Error recording save result:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Save result recorded: ${characterId} rolled ${total} vs DC ${prompt.dc} - ${success ? 'SUCCESS' : 'FAIL'}`)

    // TODO: If half_on_success is true and damage is configured, call apply-damage here

    return new Response(JSON.stringify({ 
      result,
      success,
      autoResolved: false // Will be determined by trigger
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error in record-save-result:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})