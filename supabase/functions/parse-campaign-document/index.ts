import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `You are an expert D&D campaign content parser. Analyze the following document and extract all campaign-related entities.

For each entity type, extract as many relevant items as you can find. Return a JSON object with these arrays:

1. **npcs** - Non-player characters with:
   - name (required): The NPC's name
   - role: Their role/occupation (e.g., "blacksmith", "king", "innkeeper")
   - description: Physical description and personality
   - location: Where they can be found
   - faction: Any organization they belong to
   - alignment: D&D alignment if mentioned (e.g., "Lawful Good")
   - pronouns: Their pronouns if mentioned
   - tags: Array of relevant tags

2. **locations** - Places with:
   - name (required): The location name
   - location_type: Type of place (e.g., "city", "dungeon", "tavern", "forest")
   - description: What the place looks like, atmosphere
   - parent_location: Larger area this is part of
   - tags: Array of relevant tags

3. **items** - Equipment, treasures, artifacts with:
   - name (required): Item name
   - type: Category (e.g., "weapon", "armor", "potion", "wondrous item")
   - rarity: D&D rarity (common, uncommon, rare, very rare, legendary)
   - description: What it does, how it looks
   - is_magical: Boolean if it's magical
   - properties: Any special properties as key-value pairs
   - tags: Array of relevant tags

4. **factions** - Organizations, guilds, groups with:
   - name (required): Organization name
   - description: What they do, their goals
   - motto: Their motto or slogan if any
   - influence_score: 1-100 how powerful they are
   - tags: Array of relevant tags

5. **lore** - History, myths, world-building with:
   - title (required): A title for this lore entry
   - category (required): One of "history", "myth", "magic", "region", "deity", "other"
   - content (required): The full lore text
   - excerpt: A brief summary
   - era: Time period if relevant
   - tags: Array of relevant tags

6. **quests** - Adventures, missions, plot hooks with:
   - title (required): Quest name
   - description: What the quest involves
   - objectives: Array of objective strings
   - rewards: What completing gives
   - difficulty: "easy", "medium", "hard", "deadly"
   - quest_type: "main", "side", "personal", "faction"
   - tags: Array of relevant tags

IMPORTANT:
- Extract ALL entities you can find, even if some fields are incomplete
- Use context clues to infer missing information
- For ambiguous text, make reasonable D&D-appropriate assumptions
- Return ONLY valid JSON, no markdown or explanations
- If a category has no entries, return an empty array

Document to analyze:
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, filename } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Truncate content if too long (roughly 100k chars for safety)
    const truncatedContent = content.length > 100000 
      ? content.substring(0, 100000) + '\n\n[Document truncated due to length...]'
      : content;

    console.log(`Processing document: ${filename}, length: ${content.length} chars`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an expert D&D content parser. Always respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: EXTRACTION_PROMPT + truncatedContent
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing JSON...');

    // Parse the JSON response (handle potential markdown code blocks)
    let entities;
    try {
      // Remove potential markdown code block wrapper
      let jsonStr = aiContent.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      entities = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiContent);
      throw new Error('AI returned invalid JSON format');
    }

    // Ensure all required arrays exist
    const result = {
      entities: {
        npcs: Array.isArray(entities.npcs) ? entities.npcs : [],
        locations: Array.isArray(entities.locations) ? entities.locations : [],
        items: Array.isArray(entities.items) ? entities.items : [],
        factions: Array.isArray(entities.factions) ? entities.factions : [],
        lore: Array.isArray(entities.lore) ? entities.lore : [],
        quests: Array.isArray(entities.quests) ? entities.quests : [],
      },
    };

    const totalFound = 
      result.entities.npcs.length +
      result.entities.locations.length +
      result.entities.items.length +
      result.entities.factions.length +
      result.entities.lore.length +
      result.entities.quests.length;

    console.log(`Extracted ${totalFound} total entities`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-campaign-document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
