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

    const { encounterId, monsters } = await req.json();

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
      return new Response(JSON.stringify({ error: 'Only DM can add monsters' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encounterMonsterEntries = [];

    // Process each monster request
    for (const monsterReq of monsters) {
      const { sourceType, monsterId, quantity = 1, namePrefix } = monsterReq;

      // Fetch monster data from appropriate source
      const table = sourceType === 'catalog' ? 'monster_catalog' : 'monster_homebrew';
      const { data: monsterData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', monsterId)
        .single();

      if (fetchError || !monsterData) {
        console.error(`Monster not found: ${monsterId} in ${table}`);
        continue;
      }

      // Calculate initiative bonus from DEX modifier
      const dexScore = monsterData.abilities?.dex || 10;
      const initiativeBonus = Math.floor((dexScore - 10) / 2);

      // Create multiple instances for quantity
      for (let i = 0; i < quantity; i++) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const initiativeTotal = roll + initiativeBonus;
        
        const suffix = quantity > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
        const displayName = `${namePrefix || monsterData.name}${suffix}`;
        const groupKey = `${monsterData.name}#${Date.now()}`;

        encounterMonsterEntries.push({
          encounter_id: encounterId,
          source_type: sourceType,
          source_monster_id: monsterId,
          display_name: displayName,
          group_key: groupKey,
          name: monsterData.name,
          type: monsterData.type,
          size: monsterData.size,
          ac: monsterData.ac,
          hp_current: monsterData.hp_avg,
          hp_max: monsterData.hp_avg,
          speed: monsterData.speed,
          abilities: monsterData.abilities,
          saves: monsterData.saves || {},
          skills: monsterData.skills || {},
          senses: monsterData.senses || {},
          languages: monsterData.languages,
          resistances: monsterData.resistances || [],
          immunities: monsterData.immunities || [],
          vulnerabilities: monsterData.vulnerabilities || [],
          traits: monsterData.traits || [],
          actions: monsterData.actions || [],
          reactions: monsterData.reactions || [],
          legendary_actions: monsterData.legendary_actions || [],
          initiative: initiativeTotal,
          initiative_bonus: initiativeBonus,
          order_tiebreak: i,
          is_current_turn: false,
        });
      }
    }

    if (encounterMonsterEntries.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid monsters to add' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert all monsters
    const { data: inserted, error: insertError } = await supabase
      .from('encounter_monsters')
      .insert(encounterMonsterEntries)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        monsters: inserted,
        message: `Added ${inserted.length} monster${inserted.length !== 1 ? 's' : ''} to encounter`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in add-monsters-to-encounter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
