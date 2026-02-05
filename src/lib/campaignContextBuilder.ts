 import { supabase } from "@/integrations/supabase/client";
 
 export type AssetType = 'npc' | 'location' | 'faction' | 'item' | 'quest' | 'lore';
 
 export interface CanonNPC {
   name: string;
   role?: string;
   location?: string;
 }
 
 export interface CanonFaction {
   name: string;
   description?: string;
 }
 
 export interface CanonLocation {
   name: string;
   type?: string;
   parent?: string;
 }
 
 export interface CanonLore {
   title: string;
   category: string;
   excerpt?: string;
 }
 
 export interface SessionSummary {
   name: string;
   notes?: string;
 }
 
 export interface CampaignContextPack {
   campaign_id: string;
   tone?: string;
   themes?: string[];
   pitch_text?: string;
   canon_entities: {
     npcs: CanonNPC[];
     factions: CanonFaction[];
     locations: CanonLocation[];
     lore_pages: CanonLore[];
   };
   recent_sessions?: SessionSummary[];
 }
 
 const MAX_ENTITIES_PER_TYPE = 20;
 
 export async function buildCampaignContext(
   campaignId: string,
   assetType: AssetType,
   currentEntityName?: string
 ): Promise<CampaignContextPack> {
   // Fetch all data in parallel
   const [pitchResult, npcsResult, factionsResult, locationsResult, loreResult, sessionsResult] = await Promise.all([
     // Campaign pitch for tone/themes
     supabase
       .from("campaign_pitch")
       .select("tone, themes, pitch_text")
       .eq("campaign_id", campaignId)
       .maybeSingle(),
     
     // NPCs
     supabase
       .from("npcs")
       .select("name, role_title, location_id, locations:location_id(name)")
       .eq("campaign_id", campaignId)
       .order("updated_at", { ascending: false })
       .limit(MAX_ENTITIES_PER_TYPE),
     
     // Factions
     supabase
       .from("factions")
       .select("name, description")
       .eq("campaign_id", campaignId)
       .order("updated_at", { ascending: false })
       .limit(MAX_ENTITIES_PER_TYPE),
     
     // Locations
     supabase
       .from("locations")
       .select("name, location_type, parent_location_id, parent:parent_location_id(name)")
       .eq("campaign_id", campaignId)
       .order("updated_at", { ascending: false })
       .limit(MAX_ENTITIES_PER_TYPE),
     
     // Lore pages
     supabase
       .from("lore_pages")
       .select("title, category, content_md")
       .eq("campaign_id", campaignId)
       .order("updated_at", { ascending: false })
       .limit(MAX_ENTITIES_PER_TYPE),
     
     // Recent sessions
     supabase
       .from("campaign_sessions")
       .select("name, session_notes")
       .eq("campaign_id", campaignId)
       .eq("status", "ended")
       .order("ended_at", { ascending: false })
       .limit(3),
   ]);
 
   // Build NPC list, excluding current entity if editing
   const npcs: CanonNPC[] = (npcsResult.data || [])
     .filter((npc: any) => !currentEntityName || npc.name.toLowerCase() !== currentEntityName.toLowerCase())
     .map((npc: any) => ({
       name: npc.name,
       role: npc.role_title || undefined,
       location: (npc.locations as any)?.name || undefined,
     }));
 
   // Build faction list
   const factions: CanonFaction[] = (factionsResult.data || [])
     .filter((f: any) => !currentEntityName || f.name.toLowerCase() !== currentEntityName.toLowerCase())
     .map((f: any) => ({
       name: f.name,
       description: f.description?.slice(0, 100) || undefined,
     }));
 
   // Build location list
   const locations: CanonLocation[] = (locationsResult.data || [])
     .filter((l: any) => !currentEntityName || l.name.toLowerCase() !== currentEntityName.toLowerCase())
     .map((l: any) => ({
       name: l.name,
       type: l.location_type || undefined,
       parent: (l.parent as any)?.name || undefined,
     }));
 
   // Build lore list with excerpts
   const lore_pages: CanonLore[] = (loreResult.data || [])
     .filter((l: any) => !currentEntityName || l.title.toLowerCase() !== currentEntityName.toLowerCase())
     .map((l: any) => ({
       title: l.title,
       category: l.category,
       excerpt: l.content_md?.slice(0, 150) || undefined,
     }));
 
   // Build session summaries
   const recent_sessions: SessionSummary[] = (sessionsResult.data || []).map((s: any) => ({
     name: s.name || "Unnamed Session",
     notes: s.session_notes?.slice(0, 200) || undefined,
   }));
 
   const pitch = pitchResult.data;
 
   return {
     campaign_id: campaignId,
     tone: pitch?.tone || undefined,
     themes: pitch?.themes || undefined,
     pitch_text: pitch?.pitch_text || undefined,
     canon_entities: {
       npcs,
       factions,
       locations,
       lore_pages,
     },
     recent_sessions: recent_sessions.length > 0 ? recent_sessions : undefined,
   };
 }