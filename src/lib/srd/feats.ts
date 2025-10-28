import { supabase } from "@/integrations/supabase/client";

export type SrdFeat = {
  id: string;
  name: string;
  description: string;
  prerequisites: any;
  ability_increases: any;
  grants: any;
};

export const FeatsSRD = {
  async getAll(): Promise<SrdFeat[]> {
    const { data, error } = await supabase
      .from("srd_feats")
      .select("*")
      .order("name");
    
    if (error) throw error;
    return (data || []) as unknown as SrdFeat[];
  },

  async getById(id: string): Promise<SrdFeat | null> {
    const { data, error } = await supabase
      .from("srd_feats")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data as unknown as SrdFeat;
  },

  async getEligibleFeats(
    level: number,
    abilityScores: Record<string, number>,
    characterFeats: string[]
  ): Promise<SrdFeat[]> {
    const allFeats = await this.getAll();
    
    return allFeats.filter(feat => {
      // Already has this feat
      if (characterFeats.includes(feat.id)) return false;
      
      // Check level requirement
      if (feat.prerequisites?.min_level && level < Number(feat.prerequisites.min_level)) {
        return false;
      }
      
      // Check ability score requirements
      if (feat.prerequisites?.min_ability_scores) {
        for (const [ability, minScore] of Object.entries(feat.prerequisites.min_ability_scores)) {
          if ((abilityScores[ability.toUpperCase()] || 10) < Number(minScore)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
};
