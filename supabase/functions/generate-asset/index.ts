 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 type AssetType = 'npc' | 'location' | 'faction' | 'item' | 'quest' | 'lore';
 
 const SYSTEM_PROMPT = `You are the Quest Weaver Campaign Asset Generator. Generate D&D 5e campaign assets that are consistent with the provided campaign canon.
 
 RULES:
 1. NEVER modify locked_fields - they are immutable canon
 2. DO NOT contradict existing campaign lore (NPCs, factions, locations, history)
 3. If a conflict is detected, adjust your output to fit canon and report it in consistency_checks
 4. Make reasonable assumptions that fit the campaign's tone and themes
 5. Keep outputs game-usable: actionable hooks, clear motivations, playable secrets
 6. Reference existing entities by exact name when creating relationships
 7. DO NOT invent new world primitives (new planes, magic systems, metals) unless explicitly requested
 8. For array fields like plot_hooks or quest_hooks, generate 3-5 entries
 9. Keep descriptions concise but evocative (2-3 sentences max per field)
 10. Only fill fields that are empty - respect the existing_fields values
 
 OUTPUT: Return only valid JSON matching the schema. No markdown. No commentary outside the JSON structure.`;
 
 function buildAssetPrompt(assetType: AssetType): string {
   const schemas: Record<AssetType, string> = {
     npc: `Generate an NPC with these fields:
 - role: string (their occupation or role in the world)
 - appearance: string (physical description, clothing, notable features)
 - personality: string (demeanor, quirks, how they interact)
 - voice_quirks: string (speech patterns, accent, verbal tics)
 - background: string (their history and how they got here)
 - goals: string (what they want to achieve)
 - fears: string (what they're afraid of)
 - secrets: string (hidden information about them)
 - plot_hooks: string[] (3-5 ways PCs might interact with them)
 - stat_suggestion: { level_or_cr: string, archetype: string }`,
     
     location: `Generate a Location with these fields:
 - sensory_description: string (sights, sounds, smells, atmosphere)
 - purpose: string (what this place is used for)
 - history: string (brief history of the location)
 - atmosphere: string (mood, feeling, tone of the place)
 - dangers: string (hazards, threats, obstacles)
 - secrets: string (hidden areas, buried treasures, dark pasts)
 - adventure_hooks: string[] (3-5 plot hooks for this location)`,
     
     faction: `Generate a Faction with these fields:
 - motto: string (their rallying cry or principle)
 - public_goal: string (what they claim to want)
 - true_goal: string (what they actually want)
 - leadership: string (who runs the faction)
 - ranks: string (hierarchy structure)
 - recruitment_method: string (how they gain new members)
 - allies: string (friendly factions/entities)
 - enemies: string (opposing factions/entities)
 - territory: string (where they operate)
 - resources: string (what assets they control)
 - methods: string (how they achieve their goals)
 - weakness: string (their vulnerabilities)
 - quest_hooks: string[] (3 quest ideas involving this faction)
 - rumors: string[] (3 rumors about this faction)`,
     
     item: `Generate a Magic Item with these fields:
 - description: string (physical description)
 - properties: string (magical properties and effects)
 - attunement_required: boolean
 - lore_history: string (origin story)
 - creator: string (who made it)
 - quirks: string (unusual behaviors or side effects)`,
     
     quest: `Generate a Quest with these fields:
 - description: string (overview of the quest)
 - objectives: string[] (specific goals to complete)
 - rewards: string (what the party gains)
 - difficulty: string (easy/medium/hard/deadly)
 - key_npcs: string[] (important characters involved)
 - key_locations: string[] (important places)
 - complications: string[] (things that can go wrong)
 - twists: string[] (surprise revelations)`,
     
     lore: `Generate Lore content with these fields:
 - content: string (the main lore text, 2-4 paragraphs)
 - significance: string (why this matters to the world)
 - connections: string[] (related entities/events)
 - mysteries: string[] (unanswered questions)
 - plot_seeds: string[] (adventure ideas stemming from this lore)`
   };
   
   return schemas[assetType];
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { asset_type, user_prompt, existing_fields, locked_fields, campaign_context } = await req.json();
     
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Build context summary for AI
     const contextSummary = buildContextSummary(campaign_context);
     const assetSchema = buildAssetPrompt(asset_type);
     
     const userMessage = `
 ASSET TYPE: ${asset_type}
 
 USER REQUEST: ${user_prompt || "Fill in empty fields with appropriate content that fits the campaign."}
 
 EXISTING FIELDS (preserve these exactly):
 ${JSON.stringify(existing_fields, null, 2)}
 
 LOCKED FIELDS (do not modify these):
 ${JSON.stringify(locked_fields)}
 
 CAMPAIGN CONTEXT:
 ${contextSummary}
 
 SCHEMA FOR ${asset_type.toUpperCase()}:
 ${assetSchema}
 
 Generate content for empty fields only. Return JSON with this exact structure:
 {
   "filled_fields": { /* only the fields you're filling */ },
   "assumptions": [ /* list of assumptions you made */ ],
   "consistency_checks": [
     { "check": "description", "result": "pass|adjusted|potential_conflict", "details": "explanation" }
   ],
   "followup_questions": [ /* only if absolutely necessary */ ]
 }`;
 
     console.log("Calling AI gateway for asset generation:", asset_type);
     
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: SYSTEM_PROMPT },
           { role: "user", content: userMessage },
         ],
         temperature: 0.7,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(
           JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (response.status === 402) {
         return new Response(
           JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
           { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error(`AI gateway error: ${response.status}`);
     }
 
     const data = await response.json();
     const content = data.choices?.[0]?.message?.content;
     
     if (!content) {
       throw new Error("No content in AI response");
     }
 
     // Parse and validate the response
     let parsed;
     try {
       // Clean potential markdown code blocks
       const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
       parsed = JSON.parse(cleanContent);
     } catch (e) {
       console.error("Failed to parse AI response:", content);
       throw new Error("Invalid JSON response from AI");
     }
 
     // Validate structure
     if (!parsed.filled_fields) {
       parsed.filled_fields = {};
     }
     if (!parsed.assumptions) {
       parsed.assumptions = [];
     }
     if (!parsed.consistency_checks) {
       parsed.consistency_checks = [];
     }
 
     console.log("Successfully generated asset content:", Object.keys(parsed.filled_fields));
 
     return new Response(JSON.stringify(parsed), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("generate-asset error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
 
 function buildContextSummary(context: any): string {
   if (!context) return "No campaign context provided.";
   
   const parts: string[] = [];
   
   if (context.tone) {
     parts.push(`Campaign Tone: ${context.tone}`);
   }
   
   if (context.themes?.length) {
     parts.push(`Themes: ${context.themes.join(", ")}`);
   }
   
   if (context.pitch_text) {
     parts.push(`Campaign Summary: ${context.pitch_text}`);
   }
   
   if (context.canon_entities) {
     const { npcs, factions, locations, lore_pages } = context.canon_entities;
     
     if (npcs?.length) {
       const npcList = npcs.slice(0, 10).map((n: any) => 
         `${n.name}${n.role ? ` (${n.role})` : ''}${n.location ? ` at ${n.location}` : ''}`
       ).join("; ");
       parts.push(`Known NPCs: ${npcList}`);
     }
     
     if (factions?.length) {
       const factionList = factions.slice(0, 10).map((f: any) => 
         `${f.name}${f.description ? `: ${f.description.slice(0, 50)}...` : ''}`
       ).join("; ");
       parts.push(`Known Factions: ${factionList}`);
     }
     
     if (locations?.length) {
       const locationList = locations.slice(0, 10).map((l: any) => 
         `${l.name}${l.type ? ` (${l.type})` : ''}${l.parent ? ` in ${l.parent}` : ''}`
       ).join("; ");
       parts.push(`Known Locations: ${locationList}`);
     }
     
     if (lore_pages?.length) {
       const loreList = lore_pages.slice(0, 5).map((l: any) => 
         `${l.title} [${l.category}]`
       ).join("; ");
       parts.push(`Lore Entries: ${loreList}`);
     }
   }
   
   if (context.recent_sessions?.length) {
     const sessionList = context.recent_sessions.slice(0, 3).map((s: any) => 
       `${s.name}${s.notes ? `: ${s.notes.slice(0, 100)}...` : ''}`
     ).join("; ");
     parts.push(`Recent Sessions: ${sessionList}`);
   }
   
   return parts.join("\n\n") || "No campaign context provided.";
 }