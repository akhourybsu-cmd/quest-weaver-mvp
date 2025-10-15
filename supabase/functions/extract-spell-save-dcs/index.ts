import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpellSaveDC {
  dc: number;
  ability: string;
  source: string;
}

// Common ability score abbreviations and full names
const abilityMap: { [key: string]: string } = {
  'str': 'Strength',
  'dex': 'Dexterity',
  'con': 'Constitution',
  'int': 'Intelligence',
  'wis': 'Wisdom',
  'cha': 'Charisma',
  'strength': 'Strength',
  'dexterity': 'Dexterity',
  'constitution': 'Constitution',
  'intelligence': 'Intelligence',
  'wisdom': 'Wisdom',
  'charisma': 'Charisma',
};

function extractSpellSaveDCs(monster: any): SpellSaveDC[] {
  const dcs: SpellSaveDC[] = [];
  const seenCombinations = new Set<string>();

  // Regex patterns to match various DC formats
  const patterns = [
    /DC\s+(\d+)\s+(\w+)\s+saving throw/gi,
    /(\w+)\s+saving throw\s+\(DC\s+(\d+)\)/gi,
    /spell save DC\s+(\d+)/gi,
    /DC\s+(\d+)\s+(\w+)\s+save/gi,
  ];

  const searchableFields = [
    ...(monster.traits || []),
    ...(monster.actions || []),
    ...(monster.reactions || []),
    ...(monster.legendary_actions || []),
  ];

  searchableFields.forEach((field: any) => {
    const text = `${field.name || ''} ${field.desc || field.description || ''}`;
    const source = field.name || 'Unknown';

    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      
      matches.forEach(match => {
        let dc: number;
        let ability = '';

        if (pattern.source.includes('spell save DC')) {
          // Pattern: "spell save DC 15"
          dc = parseInt(match[1]);
          // Try to find ability in surrounding text
          const abilityMatch = text.match(/(\w+)\s+spell save DC/i);
          if (abilityMatch && abilityMap[abilityMatch[1].toLowerCase()]) {
            ability = abilityMap[abilityMatch[1].toLowerCase()];
          }
        } else if (match[1] && isNaN(parseInt(match[1]))) {
          // Pattern: "Dexterity saving throw (DC 15)" or "DC 15 Dexterity saving throw"
          const abilityRaw = match[1].toLowerCase();
          ability = abilityMap[abilityRaw] || match[1];
          dc = parseInt(match[2]);
        } else {
          // Pattern: "DC 15 Wisdom saving throw"
          dc = parseInt(match[1]);
          const abilityRaw = match[2].toLowerCase();
          ability = abilityMap[abilityRaw] || match[2];
        }

        if (dc && !isNaN(dc)) {
          const key = `${dc}-${ability}-${source}`;
          if (!seenCombinations.has(key)) {
            dcs.push({
              dc,
              ability: ability || 'Unknown',
              source,
            });
            seenCombinations.add(key);
          }
        }
      });
    });
  });

  return dcs;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Fetching all monsters from catalog...');
    
    const { data: monsters, error: fetchError } = await supabase
      .from('monster_catalog')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Processing ${monsters?.length || 0} monsters...`);

    let processed = 0;
    let updated = 0;

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < (monsters?.length || 0); i += batchSize) {
      const batch = monsters!.slice(i, i + batchSize);
      
      const updates = batch.map(monster => {
        const spellSaveDCs = extractSpellSaveDCs(monster);
        processed++;

        if (spellSaveDCs.length > 0) {
          updated++;
        }

        return {
          id: monster.id,
          spell_save_dc_summary: spellSaveDCs,
        };
      });

      const { error: updateError } = await supabase
        .from('monster_catalog')
        .upsert(updates);

      if (updateError) {
        console.error('Batch update error:', updateError);
        throw updateError;
      }

      console.log(`Processed batch ${i / batchSize + 1}, total: ${processed}/${monsters!.length}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        updated,
        message: `Processed ${processed} monsters, updated ${updated} with spell save DCs`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting spell save DCs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
