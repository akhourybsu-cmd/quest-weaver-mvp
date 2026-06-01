/**
 * Supabase adapter for the LevelUpDb interface consumed by `commitLevelUp`.
 *
 * Translates the pure write-contract calls into actual Supabase queries.
 * Keeps `commitLevelUp` itself free of Supabase imports so it stays
 * unit-testable with the in-memory fake used in levelUp.test.ts.
 */
import { supabase } from "@/integrations/supabase/client";
import type { LevelUpDb } from "./levelUp";

export function createSupabaseLevelUpDb(): LevelUpDb {
  return {
    async insert(table, rows) {
      const { error } = await supabase.from(table as any).insert(rows as any);
      if (error) throw error;
    },
    async update(table, match, values) {
      let q: any = supabase.from(table as any).update(values as any);
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
      const { error } = await q;
      if (error) throw error;
    },
    async upsert(table, rows) {
      const { error } = await supabase.from(table as any).upsert(rows as any);
      if (error) throw error;
    },
    async listSpellSlots(characterId) {
      const { data, error } = await supabase
        .from("character_spell_slots")
        .select("spell_level, max_slots, used_slots, bonus_slots")
        .eq("character_id", characterId);
      if (error) throw error;
      return (data || []).map((r) => ({
        spell_level: r.spell_level,
        max_slots: r.max_slots,
        used_slots: r.used_slots,
        bonus_slots: r.bonus_slots ?? 0,
      }));
    },
  };
}