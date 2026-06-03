/**
 * "Add to…" actions from the Rules Library (Phase 5 / item 5a, 5b).
 *
 * Scope: additive, no migration, no builder-schema changes.
 *   - addCreatureToEncounter → encounter_monsters (already supports API monsters)
 *   - addItemToCharacter     → character_equipment (free-form item_ref + data JSONB)
 *
 * Spell→character is intentionally NOT here: character_spells.spell_id is a NOT
 * NULL FK to srd_spells and 5+ readers use inner joins, so it needs a dedicated,
 * migration + read-path change (tracked separately as 5c).
 */
import { supabase } from "@/integrations/supabase/client";
import type { CanonicalEntity } from "./cacheAdapter";

export interface TargetOption {
  id: string;
  name: string;
}

/** Characters owned by the current user (optionally scoped to a campaign). */
export async function listMyCharacters(campaignId?: string): Promise<TargetOption[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase.from("characters").select("id,name").eq("user_id", user.id);
  if (campaignId) q = q.eq("campaign_id", campaignId);
  const { data, error } = await q.order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id as string, name: (c.name as string) ?? "Unnamed" }));
}

/** Encounters in a campaign (DM-managed; RLS enforces access). */
export async function listCampaignEncounters(campaignId: string): Promise<TargetOption[]> {
  const { data, error } = await supabase
    .from("encounters")
    .select("id,name")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((e) => ({ id: e.id as string, name: (e.name as string) ?? "Untitled encounter" }));
}

/** Insert a library item into a character's equipment (free-form, source-stamped). */
export async function addItemToCharacter(entity: CanonicalEntity, characterId: string): Promise<void> {
  const { error } = await supabase.from("character_equipment").insert({
    character_id: characterId,
    item_ref: entity.name,
    qty: 1,
    equipped: false,
    data: {
      from_library: true,
      source_key: entity.sourceKey,
      source_api: entity.sourceApi,
      content_type: entity.contentType,
      content_key: entity.key,
      license: entity.license,
      normalized: entity.normalized,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (error) throw error;
}

function abilityScore(n: Record<string, unknown>, full: string, abbr: string): number {
  const v = (n[full] ?? n[abbr]) as number | undefined;
  return typeof v === "number" ? v : 10;
}

/**
 * Insert a library creature into an encounter, mirroring the field mapping used
 * by MonsterLibraryDialog.addApiMonsterToEncounter (source_type='api', nullable
 * source_monster_id, source_* metadata + JSONB stat snapshot).
 */
export async function addCreatureToEncounter(entity: CanonicalEntity, encounterId: string): Promise<void> {
  const n = (entity.normalized ?? {}) as Record<string, any>;
  const abilities = {
    str: abilityScore(n, "strength", "str"),
    dex: abilityScore(n, "dexterity", "dex"),
    con: abilityScore(n, "constitution", "con"),
    int: abilityScore(n, "intelligence", "int"),
    wis: abilityScore(n, "wisdom", "wis"),
    cha: abilityScore(n, "charisma", "cha"),
  };
  const ac =
    typeof n.ac === "number" ? n.ac
    : typeof n.armor_class === "number" ? n.armor_class
    : Array.isArray(n.armor_class) ? (n.armor_class[0]?.value ?? 10)
    : 10;
  const hp = typeof n.hp === "number" ? n.hp : (typeof n.hit_points === "number" ? n.hit_points : 1);
  const dexMod = Math.floor((abilities.dex - 10) / 2);

  const { error } = await supabase.from("encounter_monsters").insert({
    encounter_id: encounterId,
    source_type: "api",
    source_monster_id: null,
    imported_from_rules_api: true,
    source_api: entity.sourceApi,
    source_key: entity.key,
    source_slug: entity.key,
    source_document: entity.sourceDocument,
    source_url: null,
    name: entity.name,
    display_name: entity.name,
    type: String(n.type?.name ?? n.type ?? "creature"),
    size: String(n.size?.name ?? n.size ?? "medium").toLowerCase(),
    ac,
    hp_max: hp,
    hp_current: hp,
    abilities,
    actions: n.actions ?? [],
    traits: n.traits ?? n.special_abilities ?? [],
    reactions: n.reactions ?? [],
    legendary_actions: n.legendary_actions ?? [],
    initiative: 0,
    initiative_bonus: dexMod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (error) throw error;
}
