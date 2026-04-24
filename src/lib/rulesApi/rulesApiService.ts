import { supabase } from "@/integrations/supabase/client";
import type {
  NormalizedRulesItem,
  RulesContentType,
  RulesDetailResponse,
  RulesHealthResponse,
  RulesListResponse,
} from "./types";

/**
 * Centralized client for the 5e SRD / Open 5e Rules Reference.
 *
 * Calls the `rules-api` edge function which:
 *   1. Tries Open5e v2 first (https://api.open5e.com/v2/)
 *   2. Falls back to D&D 5e SRD API (https://www.dnd5eapi.co/api/2014/)
 *   3. Caches normalized results in `rules_cache`
 *
 * No API key required. No D&D Beyond data. SRD/open-license content only.
 */

async function invoke<T>(params: Record<string, string | number | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const { data, error } = await supabase.functions.invoke(`rules-api?${qs.toString()}`, {
    method: "GET",
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

async function listByType(
  content_type: RulesContentType,
  query?: string,
  limit = 50,
): Promise<RulesListResponse> {
  return invoke<RulesListResponse>({ action: "list", content_type, query, limit });
}

async function detail(content_type: RulesContentType, key: string): Promise<RulesDetailResponse> {
  return invoke<RulesDetailResponse>({ action: "detail", content_type, key });
}

export const rulesApiService = {
  searchCompendium: (query: string, limit = 50) =>
    invoke<RulesListResponse>({ action: "search", query, limit }),

  getCreatures: (filters?: { query?: string; limit?: number }) =>
    listByType("creature", filters?.query, filters?.limit),
  getCreatureByKeyOrSlug: (keyOrSlug: string) => detail("creature", keyOrSlug),

  getSpells: (filters?: { query?: string; limit?: number }) =>
    listByType("spell", filters?.query, filters?.limit),
  getSpellByKeyOrSlug: (keyOrSlug: string) => detail("spell", keyOrSlug),

  getConditions: () => listByType("condition", undefined, 100),
  getRules: () => listByType("rule", undefined, 100),
  getClasses: () => listByType("class"),
  getSpecies: () => listByType("species"),
  getBackgrounds: () => listByType("background"),
  getFeats: () => listByType("feat"),
  getEquipment: (filters?: { query?: string; limit?: number }) =>
    listByType("equipment", filters?.query, filters?.limit),
  getMagicItems: (filters?: { query?: string; limit?: number }) =>
    listByType("magic_item", filters?.query, filters?.limit),

  testApiHealth: () => invoke<RulesHealthResponse>({ action: "health" }),

  /** Read the most recent cached copy directly (fast path; no external call). */
  async readCache(content_type: RulesContentType, key: string): Promise<NormalizedRulesItem | null> {
    const { data } = await supabase
      .from("rules_cache")
      .select("*")
      .eq("content_type", content_type)
      .eq("content_key", key)
      .order("last_synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.content_key,
      key: data.content_key,
      slug: data.content_slug,
      name: data.content_name,
      content_type: data.content_type as RulesContentType,
      source_api: data.source_api as any,
      source_document: data.source_document,
      ruleset_version: data.ruleset_version,
      license_type: data.source_api === "open5e_v2" ? "OGL/CC-BY-4.0 (Open5e)" : "OGL 1.0a",
      short_description: "",
      full_description: "",
      tags: [],
      raw_json: data.raw_json,
      normalized_json: (data.normalized_json as Record<string, unknown>) ?? {},
      last_fetched_at: data.last_synced_at,
    };
  },
};

export type { NormalizedRulesItem, RulesListResponse, RulesDetailResponse, RulesHealthResponse } from "./types";