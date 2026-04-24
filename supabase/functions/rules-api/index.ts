import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OPEN5E_V2 = "https://api.open5e.com/v2";
const DND5E_API = "https://www.dnd5eapi.co/api/2014";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type ContentType =
  | "creature"
  | "spell"
  | "condition"
  | "rule"
  | "class"
  | "species"
  | "background"
  | "feat"
  | "equipment"
  | "magic_item"
  | "search";

interface NormalizedItem {
  id: string;
  key: string;
  slug: string | null;
  name: string;
  content_type: ContentType;
  source_api: "open5e_v2" | "dnd5eapi_2014";
  source_document: string | null;
  ruleset_version: string | null;
  license_type: string;
  short_description: string;
  full_description: string;
  tags: string[];
  raw_json: unknown;
  normalized_json: Record<string, unknown>;
  last_fetched_at: string;
}

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(message: string, status = 500, extra: Record<string, unknown> = {}) {
  return ok({ error: message, ...extra }, status);
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<{ ok: boolean; status: number; data?: any; error?: string; ms: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal });
    const ms = Date.now() - start;
    if (!r.ok) return { ok: false, status: r.status, error: `HTTP ${r.status}`, ms };
    const data = await r.json();
    return { ok: true, status: r.status, data, ms };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e), ms: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

// ---------- Normalizers ----------
function shortDesc(s: unknown, max = 240): string {
  if (typeof s !== "string") return "";
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

function normalizeOpen5eV2(content_type: ContentType, item: any): NormalizedItem {
  const key = item.key ?? item.slug ?? item.url ?? item.name;
  const desc = item.desc ?? item.description ?? item.text ?? "";
  return {
    id: String(key),
    key: String(key),
    slug: item.key ?? item.slug ?? null,
    name: item.name ?? "Unknown",
    content_type,
    source_api: "open5e_v2",
    source_document: item.document?.key ?? item.document?.title ?? null,
    ruleset_version: "5e SRD",
    license_type: "OGL/CC-BY-4.0 (Open5e)",
    short_description: shortDesc(desc),
    full_description: typeof desc === "string" ? desc : JSON.stringify(desc),
    tags: [item.type, item.size, item.school].filter(Boolean) as string[],
    raw_json: item,
    normalized_json: { ...item },
    last_fetched_at: new Date().toISOString(),
  };
}

function normalizeDnd5eApi(content_type: ContentType, item: any): NormalizedItem {
  const key = item.index ?? item.url ?? item.name;
  const desc = Array.isArray(item.desc) ? item.desc.join("\n\n") : (item.desc ?? "");
  return {
    id: String(key),
    key: String(key),
    slug: item.index ?? null,
    name: item.name ?? "Unknown",
    content_type,
    source_api: "dnd5eapi_2014",
    source_document: "5e SRD 5.1",
    ruleset_version: "2014",
    license_type: "OGL 1.0a",
    short_description: shortDesc(desc),
    full_description: desc,
    tags: [],
    raw_json: item,
    normalized_json: { ...item },
    last_fetched_at: new Date().toISOString(),
  };
}

// ---------- Endpoint maps ----------
const OPEN5E_PATHS: Partial<Record<ContentType, string>> = {
  creature: "creatures",
  spell: "spells",
  condition: "conditions",
  rule: "rules",
  class: "classes",
  species: "species",
  background: "backgrounds",
  feat: "feats",
  equipment: "equipment",
  magic_item: "magicitems",
};

const DND5E_PATHS: Partial<Record<ContentType, string>> = {
  creature: "monsters",
  spell: "spells",
  condition: "conditions",
  rule: "rules",
  class: "classes",
  species: "races",
  background: "backgrounds",
  feat: "feats",
  equipment: "equipment",
  magic_item: "magic-items",
};

// ---------- Cache helpers ----------
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

async function readCache(content_type: ContentType, content_key: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("rules_cache")
    .select("*")
    .eq("content_type", content_type)
    .eq("content_key", content_key)
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function writeCache(item: NormalizedItem, source_url: string) {
  const supabase = getSupabase();
  await supabase.from("rules_cache").upsert(
    {
      source_api: item.source_api,
      source_url,
      content_type: item.content_type,
      content_key: item.key,
      content_slug: item.slug,
      content_name: item.name,
      ruleset_version: item.ruleset_version,
      source_document: item.source_document,
      raw_json: item.raw_json,
      normalized_json: item.normalized_json,
      last_synced_at: item.last_fetched_at,
    },
    { onConflict: "source_api,content_type,content_key" },
  );
}

function isFresh(row: any): boolean {
  if (!row?.last_synced_at) return false;
  return Date.now() - new Date(row.last_synced_at).getTime() < CACHE_TTL_MS;
}

function rowToNormalized(row: any): NormalizedItem {
  return {
    id: row.content_key,
    key: row.content_key,
    slug: row.content_slug,
    name: row.content_name,
    content_type: row.content_type,
    source_api: row.source_api,
    source_document: row.source_document,
    ruleset_version: row.ruleset_version,
    license_type: row.source_api === "open5e_v2"
      ? "OGL/CC-BY-4.0 (Open5e)"
      : "OGL 1.0a",
    short_description: shortDesc((row.normalized_json as any)?.desc ?? (row.normalized_json as any)?.description ?? ""),
    full_description: String(
      (row.normalized_json as any)?.desc ??
        (row.normalized_json as any)?.description ??
        "",
    ),
    tags: [],
    raw_json: row.raw_json,
    normalized_json: row.normalized_json,
    last_fetched_at: row.last_synced_at,
  };
}

// ---------- Action handlers ----------
async function handleList(content_type: ContentType, query: string | null, limit: number) {
  const open5ePath = OPEN5E_PATHS[content_type];
  const dnd5Path = DND5E_PATHS[content_type];
  if (!open5ePath && !dnd5Path) return fail(`Unsupported content_type: ${content_type}`, 400);

  // Try Open5e v2 first
  if (open5ePath) {
    const qs = new URLSearchParams();
    qs.set("page_size", String(Math.min(limit, 100)));
    if (query) qs.set("name__icontains", query);
    const url = `${OPEN5E_V2}/${open5ePath}/?${qs.toString()}`;
    const r = await fetchJson(url);
    if (r.ok && Array.isArray(r.data?.results)) {
      const items = r.data.results.map((x: any) => normalizeOpen5eV2(content_type, x));
      // best-effort cache (don't await per-item)
      Promise.allSettled(items.map((it: NormalizedItem) => writeCache(it, url))).catch(() => {});
      return ok({ items, source: "open5e_v2", count: items.length, latency_ms: r.ms, fallback_used: false });
    }
  }

  // Fallback: dnd5eapi
  if (dnd5Path) {
    const url = `${DND5E_API}/${dnd5Path}`;
    const r = await fetchJson(url);
    if (r.ok && Array.isArray(r.data?.results)) {
      let results = r.data.results;
      if (query) {
        const q = query.toLowerCase();
        results = results.filter((x: any) => x.name?.toLowerCase().includes(q));
      }
      results = results.slice(0, limit);
      const items = results.map((x: any) => normalizeDnd5eApi(content_type, x));
      return ok({ items, source: "dnd5eapi_2014", count: items.length, latency_ms: r.ms, fallback_used: true });
    }
    return fail(`Both APIs failed for ${content_type}`, 502, { source: "fallback_failed" });
  }

  return fail(`No fallback for ${content_type}`, 502);
}

async function handleSearch(query: string, limit: number) {
  const url = `${OPEN5E_V2}/search/?query=${encodeURIComponent(query)}&page_size=${Math.min(limit, 50)}`;
  const r = await fetchJson(url);
  if (r.ok && Array.isArray(r.data?.results)) {
    return ok({
      items: r.data.results,
      source: "open5e_v2",
      count: r.data.results.length,
      latency_ms: r.ms,
      fallback_used: false,
    });
  }
  return fail("Open5e search failed", 502, { latency_ms: r.ms, error_detail: r.error });
}

async function handleDetail(content_type: ContentType, key: string) {
  // 1. Cache
  const cached = await readCache(content_type, key);
  if (cached && isFresh(cached)) {
    return ok({ item: rowToNormalized(cached), source: cached.source_api, fallback_used: false, from_cache: true });
  }

  // 2. Open5e v2
  const open5ePath = OPEN5E_PATHS[content_type];
  if (open5ePath) {
    const url = `${OPEN5E_V2}/${open5ePath}/${encodeURIComponent(key)}/`;
    const r = await fetchJson(url);
    if (r.ok && r.data) {
      const item = normalizeOpen5eV2(content_type, r.data);
      await writeCache(item, url);
      return ok({ item, source: "open5e_v2", fallback_used: false, from_cache: false, latency_ms: r.ms });
    }
  }

  // 3. Fallback dnd5eapi
  const dnd5Path = DND5E_PATHS[content_type];
  if (dnd5Path) {
    const url = `${DND5E_API}/${dnd5Path}/${encodeURIComponent(key)}`;
    const r = await fetchJson(url);
    if (r.ok && r.data) {
      const item = normalizeDnd5eApi(content_type, r.data);
      await writeCache(item, url);
      return ok({ item, source: "dnd5eapi_2014", fallback_used: true, from_cache: false, latency_ms: r.ms });
    }
  }

  // 4. Stale cache as last resort
  if (cached) {
    return ok({ item: rowToNormalized(cached), source: cached.source_api, fallback_used: true, from_cache: true, stale: true });
  }

  return fail(`Not found: ${content_type}/${key}`, 404);
}

async function handleHealth() {
  const checks: Array<{ name: string; url: string; status: string; latency_ms: number; sample?: string; error?: string }> = [];

  const tests: Array<[string, string, (d: any) => string | undefined]> = [
    ["Open5e search", `${OPEN5E_V2}/search/?query=goblin&page_size=1`, (d) => d?.results?.[0]?.name],
    ["Open5e creatures", `${OPEN5E_V2}/creatures/?name__icontains=goblin&page_size=1`, (d) => d?.results?.[0]?.name],
    ["Open5e spells", `${OPEN5E_V2}/spells/?page_size=1`, (d) => d?.results?.[0]?.name],
    ["Open5e conditions", `${OPEN5E_V2}/conditions/?page_size=1`, (d) => d?.results?.[0]?.name],
    ["Open5e rules", `${OPEN5E_V2}/rules/?page_size=1`, (d) => d?.results?.[0]?.name],
    ["dnd5eapi monsters (fallback)", `${DND5E_API}/monsters`, (d) => d?.results?.[0]?.name],
    ["dnd5eapi spells (fallback)", `${DND5E_API}/spells`, (d) => d?.results?.[0]?.name],
    ["dnd5eapi conditions (fallback)", `${DND5E_API}/conditions`, (d) => d?.results?.[0]?.name],
  ];

  await Promise.all(
    tests.map(async ([name, url, pick]) => {
      const r = await fetchJson(url, 6000);
      checks.push({
        name,
        url,
        status: r.ok ? "Connected" : "Failed",
        latency_ms: r.ms,
        sample: r.ok ? pick(r.data) : undefined,
        error: r.ok ? undefined : r.error,
      });
    }),
  );

  // Cache stats
  const supabase = getSupabase();
  const { count: cacheCount } = await supabase
    .from("rules_cache")
    .select("*", { count: "exact", head: true });

  return ok({
    checked_at: new Date().toISOString(),
    checks,
    cache_count: cacheCount ?? 0,
    summary: checks.every((c) => c.status === "Connected")
      ? "All systems operational"
      : checks.some((c) => c.status === "Connected" && c.name.startsWith("Open5e"))
      ? "Connected"
      : "Connected with fallback",
  });
}

// ---------- Router ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";
    const content_type = (url.searchParams.get("content_type") ?? "") as ContentType;
    const query = url.searchParams.get("query");
    const key = url.searchParams.get("key");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

    if (action === "health") return await handleHealth();
    if (action === "search") {
      if (!query) return fail("query required", 400);
      return await handleSearch(query, limit);
    }
    if (action === "detail") {
      if (!content_type || !key) return fail("content_type and key required", 400);
      return await handleDetail(content_type, key);
    }
    if (action === "list") {
      if (!content_type) return fail("content_type required", 400);
      return await handleList(content_type, query, limit);
    }
    return fail(`Unknown action: ${action}`, 400);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unknown error", 500);
  }
});