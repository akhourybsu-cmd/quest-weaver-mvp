 import { AssetType } from "./campaignContextBuilder";
 
 export interface FieldSchema {
   key: string;
   label: string;
   type: 'string' | 'text' | 'array' | 'object' | 'boolean';
   required?: boolean;
 }
 
 export const ASSET_FIELD_SCHEMAS: Record<AssetType, FieldSchema[]> = {
   npc: [
     { key: 'name', label: 'Name', type: 'string', required: true },
     { key: 'pronouns', label: 'Pronouns', type: 'string' },
     { key: 'role', label: 'Role/Title', type: 'string' },
     { key: 'appearance', label: 'Appearance', type: 'text' },
     { key: 'personality', label: 'Personality', type: 'text' },
     { key: 'voice_quirks', label: 'Voice & Mannerisms', type: 'text' },
     { key: 'background', label: 'Background', type: 'text' },
     { key: 'goals', label: 'Goals', type: 'text' },
     { key: 'fears', label: 'Fears', type: 'text' },
     { key: 'secrets', label: 'Secrets', type: 'text' },
     { key: 'plot_hooks', label: 'Plot Hooks', type: 'array' },
     { key: 'stat_suggestion', label: 'Stat Suggestion', type: 'object' },
   ],
   
   location: [
     { key: 'name', label: 'Name', type: 'string', required: true },
     { key: 'description', label: 'Description', type: 'text' },
     { key: 'sensory_description', label: 'Sensory Description', type: 'text' },
     { key: 'purpose', label: 'Purpose', type: 'text' },
     { key: 'history', label: 'History', type: 'text' },
     { key: 'atmosphere', label: 'Atmosphere', type: 'text' },
     { key: 'dangers', label: 'Dangers', type: 'text' },
     { key: 'secrets', label: 'Secrets', type: 'text' },
     { key: 'adventure_hooks', label: 'Adventure Hooks', type: 'array' },
   ],
   
   faction: [
     { key: 'name', label: 'Name', type: 'string', required: true },
     { key: 'description', label: 'Description', type: 'text' },
     { key: 'motto', label: 'Motto', type: 'string' },
     { key: 'public_goal', label: 'Public Goal', type: 'text' },
     { key: 'true_goal', label: 'True Goal', type: 'text' },
     { key: 'leadership', label: 'Leadership', type: 'text' },
     { key: 'ranks', label: 'Ranks', type: 'text' },
     { key: 'recruitment_method', label: 'Recruitment', type: 'text' },
     { key: 'allies', label: 'Allies', type: 'text' },
     { key: 'enemies', label: 'Enemies', type: 'text' },
     { key: 'territory', label: 'Territory', type: 'text' },
     { key: 'resources', label: 'Resources', type: 'text' },
     { key: 'methods', label: 'Methods', type: 'text' },
     { key: 'weakness', label: 'Weakness', type: 'text' },
     { key: 'quest_hooks', label: 'Quest Hooks', type: 'array' },
     { key: 'rumors', label: 'Rumors', type: 'array' },
     { key: 'goals', label: 'Goals', type: 'array' },
   ],
   
   item: [
     { key: 'name', label: 'Name', type: 'string', required: true },
     { key: 'description', label: 'Description', type: 'text' },
     { key: 'properties', label: 'Properties', type: 'text' },
     { key: 'attunement_required', label: 'Attunement Required', type: 'boolean' },
     { key: 'lore_history', label: 'Lore/History', type: 'text' },
     { key: 'creator', label: 'Creator', type: 'string' },
     { key: 'quirks', label: 'Quirks', type: 'text' },
   ],
   
   quest: [
     { key: 'title', label: 'Title', type: 'string', required: true },
     { key: 'description', label: 'Description', type: 'text' },
     { key: 'objectives', label: 'Objectives', type: 'array' },
     { key: 'rewards', label: 'Rewards', type: 'text' },
     { key: 'difficulty', label: 'Difficulty', type: 'string' },
     { key: 'key_npcs', label: 'Key NPCs', type: 'array' },
     { key: 'key_locations', label: 'Key Locations', type: 'array' },
     { key: 'complications', label: 'Complications', type: 'array' },
     { key: 'twists', label: 'Twists', type: 'array' },
   ],
   
   lore: [
     { key: 'title', label: 'Title', type: 'string', required: true },
     { key: 'content', label: 'Content', type: 'text' },
     { key: 'significance', label: 'Significance', type: 'text' },
     { key: 'connections', label: 'Connections', type: 'array' },
     { key: 'mysteries', label: 'Mysteries', type: 'array' },
     { key: 'plot_seeds', label: 'Plot Seeds', type: 'array' },
   ],
 };
 
 /**
  * Gets the list of field keys that have non-empty values
  */
 export function getFilledFieldKeys(values: Record<string, any>): string[] {
   return Object.entries(values)
     .filter(([_, value]) => {
       if (value === null || value === undefined) return false;
       if (typeof value === 'string') return value.trim().length > 0;
       if (Array.isArray(value)) return value.length > 0;
       if (typeof value === 'object') return Object.keys(value).length > 0;
       return true;
     })
     .map(([key]) => key);
 }
 
 /**
  * Validates and sanitizes AI-generated field values
  */
 export function sanitizeGeneratedFields(
   fields: Record<string, any>,
   assetType: AssetType
 ): Record<string, any> {
   const schema = ASSET_FIELD_SCHEMAS[assetType];
   const sanitized: Record<string, any> = {};
   
   for (const [key, value] of Object.entries(fields)) {
     const fieldSchema = schema.find(f => f.key === key);
     
     if (!fieldSchema) {
       // Allow unknown fields but sanitize them
       sanitized[key] = typeof value === 'string' 
         ? removeMarkdownFormatting(value) 
         : value;
       continue;
     }
     
     switch (fieldSchema.type) {
       case 'string':
         sanitized[key] = typeof value === 'string' 
           ? removeMarkdownFormatting(value).slice(0, 500) 
           : String(value).slice(0, 500);
         break;
       case 'text':
         sanitized[key] = typeof value === 'string' 
           ? removeMarkdownFormatting(value).slice(0, 2000) 
           : String(value).slice(0, 2000);
         break;
       case 'array':
         sanitized[key] = Array.isArray(value) 
           ? value.map(v => typeof v === 'string' ? removeMarkdownFormatting(v) : v).slice(0, 10)
           : [value];
         break;
       case 'boolean':
         sanitized[key] = Boolean(value);
         break;
       case 'object':
         sanitized[key] = typeof value === 'object' ? value : {};
         break;
       default:
         sanitized[key] = value;
     }
   }
   
   return sanitized;
 }
 
 function removeMarkdownFormatting(text: string): string {
   return text
     .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
     .replace(/\*(.+?)\*/g, '$1')       // Italic
     .replace(/__(.+?)__/g, '$1')       // Bold
     .replace(/_(.+?)_/g, '$1')         // Italic
     .replace(/~~(.+?)~~/g, '$1')       // Strikethrough
     .replace(/`(.+?)`/g, '$1')         // Code
     .replace(/#{1,6}\s+/g, '')         // Headers
     .replace(/^\s*[-*+]\s+/gm, '')     // List markers
     .replace(/^\s*\d+\.\s+/gm, '')     // Numbered lists
     .trim();
 }