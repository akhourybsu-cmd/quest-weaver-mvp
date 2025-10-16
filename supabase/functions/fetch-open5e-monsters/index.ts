import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Open5eMonster {
  slug: string;
  name: string;
  type: string;
  size: string;
  alignment: string;
  challenge_rating: string;
  armor_class: number | { value: number }[];
  hit_points: number;
  hit_dice: string;
  speed: Record<string, any>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  strength_save?: number;
  dexterity_save?: number;
  constitution_save?: number;
  intelligence_save?: number;
  wisdom_save?: number;
  charisma_save?: number;
  skills?: Record<string, number>;
  senses?: Record<string, any>;
  languages?: string;
  damage_immunities?: string[];
  damage_resistances?: string[];
  damage_vulnerabilities?: string[];
  special_abilities?: any[];
  actions?: any[];
  reactions?: any[];
  legendary_actions?: any[];
  document__slug?: string;
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

    console.log('Fetching SRD monsters from Open5e API...');
    
    let allMonsters: Open5eMonster[] = [];
    let nextUrl = 'https://api.open5e.com/v1/monsters/?format=json&limit=100&document__slug=5esrd';
    
    // Fetch all pages
    while (nextUrl) {
      console.log(`Fetching: ${nextUrl}`);
      const response = await fetch(nextUrl);
      
      if (!response.ok) {
        throw new Error(`Open5e API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      allMonsters = allMonsters.concat(data.results);
      nextUrl = data.next;
      
      // Add a small delay to be respectful to the API
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Fetched ${allMonsters.length} monsters. Processing...`);

    // Transform to our schema
    const transformedMonsters = allMonsters.map(m => {
      const ac = typeof m.armor_class === 'number' 
        ? m.armor_class 
        : Array.isArray(m.armor_class) 
          ? (m.armor_class[0]?.value || m.armor_class[0] || 10)
          : 10;

      const saves: Record<string, number> = {};
      if (m.strength_save !== undefined) saves.str = m.strength_save;
      if (m.dexterity_save !== undefined) saves.dex = m.dexterity_save;
      if (m.constitution_save !== undefined) saves.con = m.constitution_save;
      if (m.intelligence_save !== undefined) saves.int = m.intelligence_save;
      if (m.wisdom_save !== undefined) saves.wis = m.wisdom_save;
      if (m.charisma_save !== undefined) saves.cha = m.charisma_save;

      return {
        slug: m.slug,
        name: m.name,
        type: m.type.toLowerCase(),
        size: m.size.toLowerCase(),
        alignment: m.alignment || null,
        cr: parseFloat(m.challenge_rating) || 0,
        ac,
        hp_avg: m.hit_points,
        hp_formula: m.hit_dice || null,
        speed: m.speed || {},
        abilities: {
          str: m.strength,
          dex: m.dexterity,
          con: m.constitution,
          int: m.intelligence,
          wis: m.wisdom,
          cha: m.charisma,
        },
        saves,
        skills: m.skills || {},
        senses: m.senses || {},
        languages: m.languages || null,
        immunities: m.damage_immunities || [],
        resistances: m.damage_resistances || [],
        vulnerabilities: m.damage_vulnerabilities || [],
        traits: m.special_abilities || [],
        actions: m.actions || [],
        reactions: m.reactions || [],
        legendary_actions: m.legendary_actions || [],
        lair_actions: [],
        proficiency_bonus: 2,
        source: 'Open5e SRD',
      };
    });

    console.log('Inserting into database...');

    // Insert in batches of 50
    const batchSize = 50;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < transformedMonsters.length; i += batchSize) {
      const batch = transformedMonsters.slice(i, i + batchSize);
      
      const { error, count } = await supabase
        .from('monster_catalog')
        .upsert(batch, { 
          onConflict: 'slug',
          count: 'exact'
        });

      if (error) {
        console.error('Batch import error:', error);
        // Continue with next batch
        skipped += batch.length;
      } else {
        imported += (count || batch.length);
      }
    }

    console.log(`Import complete. Imported: ${imported}, Skipped: ${skipped}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported,
        skipped,
        total: allMonsters.length,
        message: `Successfully imported ${imported} monsters from Open5e SRD`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching from Open5e:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
