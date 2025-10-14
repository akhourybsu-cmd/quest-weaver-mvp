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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { monsters } = await req.json();

    if (!Array.isArray(monsters) || monsters.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid monsters array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert monsters in batches
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < monsters.length; i += batchSize) {
      const batch = monsters.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('monster_catalog')
        .upsert(batch, { onConflict: 'name' });

      if (error) {
        console.error('Batch import error:', error);
        throw error;
      }

      imported += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported,
        message: `Successfully imported ${imported} monsters`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error importing monsters:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
