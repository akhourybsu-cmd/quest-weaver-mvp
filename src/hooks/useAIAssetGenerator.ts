 import { useState, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { 
   buildCampaignContext, 
   CampaignContextPack, 
   AssetType 
 } from "@/lib/campaignContextBuilder";
 import { sanitizeGeneratedFields, getFilledFieldKeys } from "@/lib/assetFieldSchemas";
 import { useToast } from "@/hooks/use-toast";
 
 export interface ConsistencyCheck {
   check: string;
   result: 'pass' | 'adjusted' | 'potential_conflict';
   details: string;
 }
 
 export interface GenerationResult {
   filled_fields: Record<string, any>;
   assumptions: string[];
   consistency_checks: ConsistencyCheck[];
   followup_questions?: string[];
 }
 
 interface UseAIAssetGeneratorOptions {
   campaignId: string;
   assetType: AssetType;
 }
 
 interface UseAIAssetGeneratorResult {
   isGenerating: boolean;
   error: string | null;
   lastResult: GenerationResult | null;
   generate: (
     existingFields: Record<string, any>,
     lockedFields: string[],
     userPrompt?: string
   ) => Promise<GenerationResult | null>;
   clearResult: () => void;
 }
 
 export function useAIAssetGenerator({
   campaignId,
   assetType,
 }: UseAIAssetGeneratorOptions): UseAIAssetGeneratorResult {
   const [isGenerating, setIsGenerating] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
   const { toast } = useToast();
 
   const generate = useCallback(async (
     existingFields: Record<string, any>,
     lockedFields: string[],
     userPrompt?: string
   ): Promise<GenerationResult | null> => {
     setIsGenerating(true);
     setError(null);
 
     try {
       // Build campaign context
       const currentEntityName = existingFields.name || existingFields.title || undefined;
       const campaignContext = await buildCampaignContext(
         campaignId, 
         assetType, 
         currentEntityName
       );
 
       // Call the edge function
       const { data, error: fnError } = await supabase.functions.invoke('generate-asset', {
         body: {
           asset_type: assetType,
           user_prompt: userPrompt,
           existing_fields: existingFields,
           locked_fields: lockedFields,
           campaign_context: campaignContext,
         },
       });
 
       if (fnError) {
         throw fnError;
       }
 
       if (data.error) {
         // Handle specific error codes
         if (data.error.includes("Rate limit")) {
           toast({
             title: "Please wait",
             description: "AI is busy, please try again in a moment.",
             variant: "destructive",
           });
           throw new Error(data.error);
         }
         if (data.error.includes("credits")) {
           toast({
             title: "Credits exhausted",
             description: "AI credits have been exhausted.",
             variant: "destructive",
           });
           throw new Error(data.error);
         }
         throw new Error(data.error);
       }
 
       // Sanitize the generated fields
       const sanitizedFields = sanitizeGeneratedFields(data.filled_fields || {}, assetType);
 
       const result: GenerationResult = {
         filled_fields: sanitizedFields,
         assumptions: data.assumptions || [],
         consistency_checks: data.consistency_checks || [],
         followup_questions: data.followup_questions,
       };
 
       setLastResult(result);
       return result;
     } catch (err) {
       const message = err instanceof Error ? err.message : "Failed to generate content";
       setError(message);
       toast({
         title: "Generation failed",
         description: message,
         variant: "destructive",
       });
       return null;
     } finally {
       setIsGenerating(false);
     }
   }, [campaignId, assetType, toast]);
 
   const clearResult = useCallback(() => {
     setLastResult(null);
     setError(null);
   }, []);
 
   return {
     isGenerating,
     error,
     lastResult,
     generate,
     clearResult,
   };
 }
 
 export { type AssetType };