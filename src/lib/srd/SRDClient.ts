import { supabase } from "@/integrations/supabase/client";

export type SrdClass = {
  id: string;
  name: string;
  hit_die: number;
  saving_throws: string[];
  proficiencies: {
    armor?: string[];
    weapons?: string[];
    skills?: { choose: number; from: string[] };
    tools?: { choose: number; from: string[] };
  };
  starting_equipment: any[];
  spellcasting_progression?: string | null;
  spellcasting_ability?: string | null;
};

export type SrdSubclass = {
  id: string;
  class_id: string;
  name: string;
  unlock_level: number;
  features: Array<{ name: string; level: number; description?: string }>;
};

export type SrdAncestry = {
  id: string;
  name: string;
  speed: number;
  size: string;
  ability_bonuses: Array<{ ability: string; bonus: number }>;
  languages: Array<{ name: string }>;
  traits: Array<{ name: string; description?: string }>;
  proficiencies: string[];
  options: any;
};

export type SrdSubAncestry = {
  id: string;
  ancestry_id: string;
  name: string;
  ability_bonuses: Array<{ ability: string; bonus: number }>;
  languages: Array<{ name: string }>;
  traits: Array<{ name: string; description?: string }>;
};

export type SrdBackground = {
  id: string;
  name: string;
  skill_proficiencies: Array<{ name: string }> | { choose?: number; from?: string[] };
  tool_proficiencies: Array<{ name: string }> | { choose?: number; from?: string[] };
  languages: Array<{ name: string }> | { choose?: number; from?: string[] };
  feature: { name: string; description: string } | string;
  equipment: any[];
};

export type SrdSpell = {
  id: string;
  name: string;
  level: number;
  school: { name: string; key: string } | string;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  description: string;
};

export const SRD = {
  async classes(): Promise<SrdClass[]> {
    const { data, error } = await supabase
      .from("srd_classes")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data || []) as SrdClass[];
  },

  async subclasses(classId: string): Promise<SrdSubclass[]> {
    const { data, error } = await supabase
      .from("srd_subclasses")
      .select("*")
      .eq("class_id", classId)
      .order("name");
    if (error) throw error;
    return (data || []) as unknown as SrdSubclass[];
  },

  async ancestries(): Promise<SrdAncestry[]> {
    const { data, error } = await supabase
      .from("srd_ancestries")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data || []) as unknown as SrdAncestry[];
  },

  async subAncestries(ancestryId: string): Promise<SrdSubAncestry[]> {
    const { data, error } = await supabase
      .from("srd_subancestries")
      .select("*")
      .eq("ancestry_id", ancestryId)
      .order("name");
    if (error) throw error;
    return (data || []) as unknown as SrdSubAncestry[];
  },

  async backgrounds(): Promise<SrdBackground[]> {
    const { data, error } = await supabase
      .from("srd_backgrounds")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data || []) as SrdBackground[];
  },

  async spellsByClass(className: string): Promise<SrdSpell[]> {
    const { data, error } = await supabase
      .from("srd_spells")
      .select("*")
      .contains("classes", [className]);
    if (error) throw error;
    return (data || []) as SrdSpell[];
  },

  async allSpells(): Promise<SrdSpell[]> {
    const { data, error } = await supabase
      .from("srd_spells")
      .select("*")
      .order("level", { ascending: true })
      .order("name");
    if (error) throw error;
    return (data || []) as SrdSpell[];
  },

  async weapons() {
    const { data } = await supabase.from("srd_weapons").select("*").order("name");
    return data || [];
  },

  async armor() {
    const { data } = await supabase.from("srd_armor").select("*").order("name");
    return data || [];
  },

  async tools() {
    const { data } = await supabase.from("srd_tools").select("*").order("name");
    return data || [];
  },

  async languages() {
    const { data } = await supabase.from("srd_languages").select("*").order("name");
    return data || [];
  },
};
