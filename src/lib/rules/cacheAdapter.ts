/**
 * Rules Library cache read adapter + compatibility mapper (Phase 5 / "P7").
 *
 * CANONICAL CACHE CONVENTION (decided):
 *   - content_type : singular domain type — spell, creature, magic_item, class,
 *                    background, feat, condition, rule, species, equipment
 *   - content_key  : raw stable slug (e.g. "fireball"), NEVER type-prefixed
 *   - source identity comes from source_api → registry source_key + ruleset /
 *     ruleset_version / license metadata, NOT from the key string
 *
 * COMPATIBILITY: rules_cache currently holds rows written by TWO paths with
 * different schemes, and we must read both WITHOUT mutating stored rows:
 *   - rules-api (read path)      : singular content_type, raw-slug content_key
 *   - sync-rules-source (Phase 4): plural content_type ("spells"), prefixed
 *                                  content_key ("spells:fireball")
 * Both paths store content_slug UNPREFIXED, so we key canonical identity on
 * content_slug and translate content_type via an alias table. This module only
 * READS and maps — it never deletes or rewrites rows (impact can be previewed
 * before any future migration).
 */
import { supabase } from "@/integrations/supabase/client";
import { getRulesSource, type RulesSourceDef } from "@/lib/rules/sources";

export type CanonicalContentType =
  | "spell"
  | "creature"
  | "magic_item"
  | "condition"
  | "background"
  | "feat"
  | "species"
  | "class"
  | "equipment"
  | "rule";

export const CANONICAL_CONTENT_TYPES: readonly CanonicalContentType[] = [
  "spell", "creature", "magic_item", "condition", "background",
  "feat", "species", "class", "equipment", "rule",
] as const;

const CONTENT_TYPE_LABEL: Record<CanonicalContentType, string> = {
  spell: "Spell",
  creature: "Creature",
  magic_item: "Magic Item",
  condition: "Condition",
  background: "Background",
  feat: "Feat",
  species: "Species",
  class: "Class",
  equipment: "Equipment",
  rule: "Rule",
};

export function contentTypeLabel(t: CanonicalContentType): string {
  return CONTENT_TYPE_LABEL[t] ?? t;
}

/**
 * Map any stored content_type (plural Phase-4 or singular rules-api) to canonical.
 * Returns null for unrecognized values (surfaced rather than silently dropped).
 */
const TYPE_ALIASES: Record<string, CanonicalContentType> = {
  // sync-rules-source (plural / Open5e endpoint names)
  spells: "spell",
  monsters: "creature",
  "magic-items": "magic_item",
  magicitems: "magic_item",
  conditions: "condition",
  backgrounds: "background",
  feats: "feat",
  races: "species",
  classes: "class",
  weapons: "equipment",
  armor: "equipment",
  equipment: "equipment",
  sections: "rule",
  rules: "rule",
  // rules-api (already singular) — passthrough
  spell: "spell",
  creature: "creature",
  magic_item: "magic_item",
  condition: "condition",
  background: "background",
  feat: "feat",
  species: "species",
  class: "class",
  rule: "rule",
};

export function toCanonicalType(stored: string): CanonicalContentType | null {
  return TYPE_ALIASES[String(stored).toLowerCase().trim()] ?? null;
}

/** Reverse: canonical → every stored content_type value that maps to it. */
const STORED_FOR_CANONICAL: Record<CanonicalContentType, string[]> = (() => {
  const m = {} as Record<CanonicalContentType, string[]>;
  for (const t of CANONICAL_CONTENT_TYPES) m[t] = [];
  for (const [stored, canon] of Object.entries(TYPE_ALIASES)) m[canon].push(stored);
  return m;
})();

/** source_api (rules_cache column) → registry source_key. */
export function sourceApiToSourceKey(api: string): string {
  if (api === "dnd5eapi_2014") return "dnd5eapi-2014";
  return "open5e"; // open5e_v2 | open5e_v1
}

/** registry source_key → source_api values that can appear in rules_cache. */
function sourceApisForSourceKey(sourceKey: string): string[] {
  if (sourceKey === "dnd5eapi-2014") return ["dnd5eapi_2014"];
  if (sourceKey === "open5e") return ["open5e_v2", "open5e_v1"];
  return [];
}

// ── Canonical entity exposed to the UI ────────────────────────────────────
export interface CanonicalEntity {
  id: string;                 // `${contentType}:${key}:${sourceApi}`
  contentType: CanonicalContentType;
  key: string;                // raw slug (content_slug)
  name: string;
  sourceApi: string;
  sourceKey: string;
  source: RulesSourceDef | undefined;
  sourceName: string;
  ruleset: string | null;
  rulesetVersion: string | null;
  license: string | null;
  sourceDocument: string | null;
  shortDescription: string;
  fullDescription: string;
  raw: unknown;
  normalized: Record<string, unknown>;
  lastSyncedAt: string;
}

type RulesCacheRow = {
  content_key: string;
  content_name: string;
  content_slug: string | null;
  content_type: string;
  source_api: string;
  source_document: string | null;
  ruleset_version: string | null;
  license_type: string | null;
  raw_json: unknown;
  normalized_json: unknown;
  last_synced_at: string;
};

function extractDescription(json: unknown, raw: unknown): string {
  const j = (json ?? {}) as Record<string, unknown>;
  const r = (raw ?? {}) as Record<string, unknown>;
  const d =
    (j.full_description as string) ??
    (j.desc as string) ?? (j.description as string) ?? (j.text as string) ??
    (r.desc as string) ?? (r.description as string) ?? (r.text as string) ?? "";
  if (Array.isArray(d)) return (d as string[]).join("\n\n");
  return typeof d === "string" ? d : "";
}

function rawKey(row: RulesCacheRow): string {
  if (row.content_slug) return row.content_slug;
  // Fall back to stripping a "<stored-type>:" prefix from content_key.
  const prefix = `${row.content_type}:`;
  return row.content_key.startsWith(prefix)
    ? row.content_key.slice(prefix.length)
    : row.content_key;
}

export function normalizeCacheRow(row: RulesCacheRow): CanonicalEntity | null {
  const contentType = toCanonicalType(row.content_type);
  if (!contentType) return null; // unrecognized type — caller can report
  const key = rawKey(row);
  const sourceKey = sourceApiToSourceKey(row.source_api);
  const source = getRulesSource(sourceKey);
  const full = extractDescription(row.normalized_json, row.raw_json);
  const flat = full.replace(/\s+/g, " ").trim();
  return {
    id: `${contentType}:${key}:${row.source_api}`,
    contentType,
    key,
    name: row.content_name,
    sourceApi: row.source_api,
    sourceKey,
    source,
    sourceName: source?.name ?? sourceKey,
    ruleset: source?.ruleset ?? null,
    rulesetVersion: row.ruleset_version,
    license: row.license_type ?? source?.license ?? null,
    sourceDocument: row.source_document,
    shortDescription: flat.length > 240 ? flat.slice(0, 239) + "…" : flat,
    fullDescription: full,
    raw: row.raw_json,
    normalized: (row.normalized_json ?? {}) as Record<string, unknown>,
    lastSyncedAt: row.last_synced_at,
  };
}

const SELECT_COLS =
  "content_key,content_name,content_slug,content_type,source_api,source_document,ruleset_version,license_type,raw_json,normalized_json,last_synced_at";

export interface LibraryQuery {
  query?: string;
  contentType?: CanonicalContentType;
  sourceKey?: string;
  ruleset?: string;
  limit?: number;
}

/** De-duplicate entities that exist under both schemes; keep the freshest. */
function dedupe(entities: CanonicalEntity[]): CanonicalEntity[] {
  const byId = new Map<string, CanonicalEntity>();
  for (const e of entities) {
    const prev = byId.get(e.id);
    if (!prev || e.lastSyncedAt > prev.lastSyncedAt) byId.set(e.id, e);
  }
  return Array.from(byId.values());
}

export async function searchLibrary(opts: LibraryQuery = {}): Promise<CanonicalEntity[]> {
  const limit = opts.limit ?? 200;
  let q = supabase.from("rules_cache").select(SELECT_COLS).limit(limit * 2); // headroom for dedupe

  if (opts.contentType) {
    q = q.in("content_type", STORED_FOR_CANONICAL[opts.contentType]);
  }
  if (opts.query && opts.query.trim()) {
    q = q.ilike("content_name", `%${opts.query.trim()}%`);
  }

  // Source / ruleset filters resolve to source_api candidates.
  let sourceApis: string[] | null = null;
  if (opts.sourceKey) {
    sourceApis = sourceApisForSourceKey(opts.sourceKey);
  } else if (opts.ruleset) {
    // Every registry source whose ruleset matches → its source_api values.
    const apis = new Set<string>();
    for (const sk of ["open5e", "dnd5eapi-2014"]) {
      const def = getRulesSource(sk);
      if (def && def.ruleset === opts.ruleset) sourceApisForSourceKey(sk).forEach((a) => apis.add(a));
    }
    sourceApis = Array.from(apis);
  }
  if (sourceApis) {
    if (sourceApis.length === 0) return []; // filter can't match anything in cache
    q = q.in("source_api", sourceApis);
  }

  q = q.order("content_name", { ascending: true });

  const { data, error } = await q;
  if (error) throw error;

  const mapped = (data as RulesCacheRow[])
    .map(normalizeCacheRow)
    .filter((e): e is CanonicalEntity => e !== null);
  return dedupe(mapped).slice(0, limit);
}

export async function getLibraryEntity(
  contentType: CanonicalContentType,
  key: string
): Promise<CanonicalEntity | null> {
  const { data, error } = await supabase
    .from("rules_cache")
    .select(SELECT_COLS)
    .in("content_type", STORED_FOR_CANONICAL[contentType])
    .eq("content_slug", key)
    .order("last_synced_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  const mapped = (data as RulesCacheRow[])
    .map(normalizeCacheRow)
    .filter((e): e is CanonicalEntity => e !== null);
  return mapped[0] ?? null;
}

export interface LibraryFacets {
  total: number;
  byType: Partial<Record<CanonicalContentType, number>>;
  bySource: Record<string, number>;   // source_key → count
  byRuleset: Record<string, number>;  // ruleset → count
  unmappedTypes: Record<string, number>; // stored content_type with no canonical mapping
}

/** Lightweight facet counts for the filter sidebar (two small columns). */
export async function getLibraryFacets(): Promise<LibraryFacets> {
  const { data, error } = await supabase
    .from("rules_cache")
    .select("content_type,source_api");
  if (error) throw error;

  const facets: LibraryFacets = { total: 0, byType: {}, bySource: {}, byRuleset: {}, unmappedTypes: {} };
  for (const row of (data ?? []) as Array<{ content_type: string; source_api: string }>) {
    facets.total++;
    const canon = toCanonicalType(row.content_type);
    if (canon) facets.byType[canon] = (facets.byType[canon] ?? 0) + 1;
    else facets.unmappedTypes[row.content_type] = (facets.unmappedTypes[row.content_type] ?? 0) + 1;
    const sk = sourceApiToSourceKey(row.source_api);
    facets.bySource[sk] = (facets.bySource[sk] ?? 0) + 1;
    const ruleset = getRulesSource(sk)?.ruleset ?? "unknown";
    facets.byRuleset[ruleset] = (facets.byRuleset[ruleset] ?? 0) + 1;
  }
  return facets;
}
