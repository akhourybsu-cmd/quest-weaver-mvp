/**
 * Phase 4 — Source-aware rules ingestion providers.
 *
 * This module defines the provider interface used by the sync-rules-source
 * edge function and ships the Open5eProvider implementation.
 *
 * Scope (Phase 4):
 *   - Writes ONLY to the cache/library layer: `public.rules_cache`.
 *   - Does NOT touch builder tables (srd_*), the Character Builder, or
 *     campaign-source settings.
 *   - Only ingests sources allowed by the registry (Phase 2 rules_sources
 *     legal kill-switch). Disabled sources are refused.
 *
 * Each provider exposes `sync(contentType, opts)` which yields normalized
 * cache rows and reports counts so the calling function can persist a single
 * `import_batches` row.
 */

// deno-lint-ignore-file no-explicit-any

export type ContentType =
  | "spells"
  | "monsters"
  | "magic-items"
  | "conditions"
  | "backgrounds"
  | "feats"
  | "races"
  | "classes"
  | "weapons"
  | "armor"
  | "sections";

export interface CacheRow {
  source_api: "open5e_v2" | "open5e_v1" | "dnd5eapi_2014";
  source_url: string;
  content_type: string;
  content_key: string;
  content_slug: string | null;
  content_name: string;
  ruleset_version: string | null;
  source_document: string | null;
  raw_json: unknown;
  normalized_json: unknown;
  license_type: string | null;
}

export interface SyncResult {
  imported: number;
  skipped: number;
  errorCount: number;
  errors: Array<{ at: string; message: string }>;
}

export interface SyncOptions {
  /** Hard cap on rows pulled this run (safety). Default 5000. */
  maxRows?: number;
  /** Page size for paginated providers. Default 100. */
  pageSize?: number;
  /** Persist a batch of cache rows. Returns rows upserted. */
  persist: (rows: CacheRow[]) => Promise<{ upserted: number }>;
  /** Logger; defaults to console.log. */
  log?: (msg: string) => void;
}

export interface RulesProvider {
  /** Stable identifier matching rules_sources.key */
  sourceKey: string;
  /** Human label */
  providerName: string;
  /** Sync one content type. Streams cache rows in batches via opts.persist. */
  sync(contentType: ContentType, opts: SyncOptions): Promise<SyncResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Open5eProvider — uses Open5e v2 (https://api.open5e.com) and the registered
// `open5e` source_key. Content is filtered to SRD documents on the upstream
// side where possible; un-licensed/non-open content is never imported.
// ─────────────────────────────────────────────────────────────────────────────

const OPEN5E_BASE = "https://api.open5e.com";

/** Map our ContentType → Open5e v2 endpoint path. */
const OPEN5E_ENDPOINTS: Record<ContentType, string> = {
  spells: "/v2/spells/",
  monsters: "/v1/monsters/", // v1 has richer monster shape; SRD-filterable
  "magic-items": "/v1/magicitems/",
  conditions: "/v2/conditions/",
  backgrounds: "/v2/backgrounds/",
  feats: "/v2/feats/",
  races: "/v2/races/",
  classes: "/v2/classes/",
  weapons: "/v2/weapons/",
  armor: "/v2/armor/",
  sections: "/v1/sections/",
};

function isV2(endpoint: string): boolean {
  return endpoint.startsWith("/v2/");
}

function open5eUrl(endpoint: string, pageSize: number): string {
  const sep = endpoint.includes("?") ? "&" : "?";
  // v1 supports document__slug=5esrd to filter to the SRD only.
  const srdFilter = isV2(endpoint) ? "" : "&document__slug=5esrd";
  return `${OPEN5E_BASE}${endpoint}${sep}format=json&limit=${pageSize}${srdFilter}`;
}

/** Best-effort license detection from an upstream record. */
function detectLicense(raw: any): string | null {
  const doc = raw?.document__license_url ?? raw?.document?.license_url ?? null;
  if (typeof doc === "string") {
    if (doc.includes("creativecommons.org")) return "CC-BY-4.0";
    if (doc.toLowerCase().includes("ogl")) return "OGL-1.0a";
  }
  // v2 typically returns `document` slug only; assume mixed open license.
  return "OGL-1.0a / CC-BY-4.0";
}

function detectDocumentSlug(raw: any): string | null {
  return (
    raw?.document__slug ??
    raw?.document?.key ??
    raw?.document ??
    null
  );
}

/** Pick a stable key for an upstream record. */
function pickKey(raw: any, contentType: ContentType): string | null {
  const k = raw?.key ?? raw?.slug ?? raw?.url ?? raw?.name;
  if (!k) return null;
  return `${contentType}:${String(k).toLowerCase().trim()}`;
}

export const Open5eProvider: RulesProvider = {
  sourceKey: "open5e",
  providerName: "open5e",

  async sync(contentType, opts) {
    const log = opts.log ?? ((m: string) => console.log(m));
    const pageSize = opts.pageSize ?? 100;
    const maxRows = opts.maxRows ?? 5000;
    const endpoint = OPEN5E_ENDPOINTS[contentType];
    if (!endpoint) {
      return {
        imported: 0,
        skipped: 0,
        errorCount: 1,
        errors: [{ at: "init", message: `Unsupported content type: ${contentType}` }],
      };
    }

    const result: SyncResult = { imported: 0, skipped: 0, errorCount: 0, errors: [] };
    let nextUrl: string | null = open5eUrl(endpoint, pageSize);
    let fetched = 0;
    const batchBuf: CacheRow[] = [];
    const BATCH_FLUSH = 100;

    const flush = async () => {
      if (batchBuf.length === 0) return;
      try {
        const { upserted } = await opts.persist(batchBuf.splice(0, batchBuf.length));
        result.imported += upserted;
      } catch (e: any) {
        result.errorCount += 1;
        result.errors.push({ at: "persist", message: e?.message ?? String(e) });
      }
    };

    while (nextUrl && fetched < maxRows) {
      log(`open5e: GET ${nextUrl}`);
      let resp: Response;
      try {
        resp = await fetch(nextUrl);
      } catch (e: any) {
        result.errorCount += 1;
        result.errors.push({ at: "fetch", message: e?.message ?? String(e) });
        break;
      }
      if (!resp.ok) {
        result.errorCount += 1;
        result.errors.push({
          at: "fetch",
          message: `HTTP ${resp.status} ${resp.statusText} at ${nextUrl}`,
        });
        break;
      }
      const data: any = await resp.json();
      const results: any[] = Array.isArray(data?.results) ? data.results : [];

      for (const raw of results) {
        if (fetched >= maxRows) break;
        const key = pickKey(raw, contentType);
        if (!key) {
          result.skipped += 1;
          continue;
        }
        const docSlug = detectDocumentSlug(raw);
        // For v2 endpoints we don't filter upstream — only ingest known-SRD or
        // open documents; skip anything that looks proprietary.
        if (docSlug && /tob|deepmagic|kobold-press-proprietary/i.test(String(docSlug))) {
          result.skipped += 1;
          continue;
        }
        const name = raw?.name ?? raw?.title ?? key;
        batchBuf.push({
          source_api: "open5e_v2",
          source_url: nextUrl,
          content_type: contentType,
          content_key: key,
          content_slug: raw?.slug ?? raw?.key ?? null,
          content_name: String(name),
          ruleset_version: "open5e",
          source_document: docSlug ? String(docSlug) : null,
          raw_json: raw,
          normalized_json: raw, // Phase 4: identity transform; later phases normalize.
          license_type: detectLicense(raw),
        });
        fetched += 1;
        if (batchBuf.length >= BATCH_FLUSH) {
          await flush();
        }
      }

      nextUrl = typeof data?.next === "string" ? data.next : null;
      // Politeness delay
      if (nextUrl) await new Promise((r) => setTimeout(r, 100));
    }

    await flush();
    log(
      `open5e: ${contentType} done — imported=${result.imported} skipped=${result.skipped} errors=${result.errorCount}`,
    );
    return result;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dnd5eApiProvider — uses the 5e-bits D&D 5e SRD API (https://www.dnd5eapi.co,
// 2014 / SRD 5.1, OGL-1.0a) under the registered `dnd5eapi-2014` source_key.
//
// Unlike Open5e, the 5e-bits list endpoints return only {index,name,url} stubs,
// so full content requires an N+1 detail fetch per item. We bound concurrency and
// respect maxRows. Writes use the SAME row scheme as Open5eProvider (plural
// content_type, "type:slug" content_key, raw content_slug) so the read adapter
// (src/lib/rules/cacheAdapter.ts) treats both sources uniformly.
// ─────────────────────────────────────────────────────────────────────────────

const DND5E_HOST = "https://www.dnd5eapi.co";
const DND5E_BASE = `${DND5E_HOST}/api/2014`;

/** ContentType → 5e-bits endpoint path. Types absent here are unsupported
 *  (weapons/armor are an equipment subset; sections aren't cleanly mappable). */
const DND5E_PATHS: Partial<Record<ContentType, string>> = {
  spells: "spells",
  monsters: "monsters",
  "magic-items": "magic-items",
  conditions: "conditions",
  backgrounds: "backgrounds",
  feats: "feats",
  races: "races",
  classes: "classes",
};

function normalizeDnd5e(contentType: ContentType, path: string, item: any): CacheRow {
  const index = String(item?.index ?? item?.url ?? item?.name ?? "").toLowerCase();
  const desc = Array.isArray(item?.desc) ? item.desc.join("\n\n") : (item?.desc ?? "");
  return {
    source_api: "dnd5eapi_2014",
    source_url: `${DND5E_BASE}/${path}/${index}`,
    content_type: contentType,
    content_key: `${contentType}:${index}`,
    content_slug: index,
    content_name: String(item?.name ?? index),
    ruleset_version: "2014",
    source_document: "srd-5.1",
    raw_json: item,
    normalized_json: { ...item, full_description: typeof desc === "string" ? desc : JSON.stringify(desc) },
    license_type: "OGL-1.0a",
  };
}

export const Dnd5eApiProvider: RulesProvider = {
  sourceKey: "dnd5eapi-2014",
  providerName: "dnd5eapi",

  async sync(contentType, opts) {
    const log = opts.log ?? ((m: string) => console.log(m));
    const maxRows = opts.maxRows ?? 5000;
    const path = DND5E_PATHS[contentType];
    const result: SyncResult = { imported: 0, skipped: 0, errorCount: 0, errors: [] };
    if (!path) {
      result.errorCount = 1;
      result.errors.push({ at: "init", message: `dnd5eapi does not support content type: ${contentType}` });
      return result;
    }

    // 1) Fetch the index list (single request, no pagination).
    let list: any;
    try {
      const r = await fetch(`${DND5E_BASE}/${path}`);
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      list = await r.json();
    } catch (e: any) {
      result.errorCount += 1;
      result.errors.push({ at: "list", message: e?.message ?? String(e) });
      return result;
    }
    const stubs: any[] = (Array.isArray(list?.results) ? list.results : []).slice(0, maxRows);

    // 2) Detail fetch with bounded concurrency, persisting in batches.
    const CONCURRENCY = 8;
    const buf: CacheRow[] = [];
    const flush = async () => {
      if (!buf.length) return;
      try {
        const { upserted } = await opts.persist(buf.splice(0, buf.length));
        result.imported += upserted;
      } catch (e: any) {
        result.errorCount += 1;
        result.errors.push({ at: "persist", message: e?.message ?? String(e) });
      }
    };

    for (let i = 0; i < stubs.length; i += CONCURRENCY) {
      const slice = stubs.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(
        slice.map(async (st) => {
          const url = st?.url ? `${DND5E_HOST}${st.url}` : `${DND5E_BASE}/${path}/${st?.index}`;
          const dr = await fetch(url);
          if (!dr.ok) throw new Error(`HTTP ${dr.status} at ${url}`);
          return normalizeDnd5e(contentType, path, await dr.json());
        }),
      );
      for (const s of settled) {
        if (s.status === "fulfilled") buf.push(s.value);
        else {
          result.errorCount += 1;
          result.errors.push({ at: "detail", message: (s.reason as any)?.message ?? String(s.reason) });
        }
      }
      if (buf.length >= 100) await flush();
      await new Promise((r) => setTimeout(r, 100)); // politeness
    }
    await flush();
    log(`dnd5eapi: ${contentType} done — imported=${result.imported} errors=${result.errorCount}`);
    return result;
  },
};

/** Resolve a provider implementation by source_key. */
export function getProvider(sourceKey: string): RulesProvider | null {
  if (sourceKey === "open5e") return Open5eProvider;
  if (sourceKey === "dnd5eapi-2014") return Dnd5eApiProvider;
  return null;
}