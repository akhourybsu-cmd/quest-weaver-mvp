/**
 * Phase 4 — sync-rules-source
 *
 * Admin-gated endpoint that runs a source provider for a single
 * (source_key, content_type) pair, persists rows into `rules_cache`, and logs
 * the run as a single row in `import_batches`.
 *
 * Body: { source_key: string, content_type: string, max_rows?: number }
 *
 * Constraints:
 *  - source_key must exist in `rules_sources` AND have is_enabled=true
 *    (Phase 2 legal kill-switch).
 *  - Writes ONLY to `rules_cache`. Never touches srd_* builder tables.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { getProvider, type ContentType, type CacheRow } from "../_shared/rulesProviders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CONTENT: ReadonlySet<ContentType> = new Set<ContentType>([
  "spells",
  "monsters",
  "magic-items",
  "conditions",
  "backgrounds",
  "feats",
  "races",
  "classes",
  "weapons",
  "armor",
  "sections",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Auth: admin only ────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;
  const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || isAdmin !== true) return json({ error: "Forbidden: admin only" }, 403);

  // ── Validate input ──────────────────────────────────────────────────────
  let body: { source_key?: string; content_type?: string; max_rows?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const sourceKey = String(body.source_key ?? "").trim();
  const contentType = String(body.content_type ?? "").trim() as ContentType;
  const maxRows = Number.isFinite(body.max_rows) ? Math.max(1, Math.min(50_000, Number(body.max_rows))) : 5000;
  if (!sourceKey || !contentType) {
    return json({ error: "source_key and content_type are required" }, 400);
  }
  if (!ALLOWED_CONTENT.has(contentType)) {
    return json({ error: `Unsupported content_type: ${contentType}` }, 400);
  }

  // ── Service client (registry check + writes) ────────────────────────────
  const svc = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Verify the source is registered AND enabled (Phase 2 legal kill-switch).
  const { data: src, error: srcErr } = await svc
    .from("rules_sources")
    .select("key,is_enabled,provider")
    .eq("key", sourceKey)
    .maybeSingle();
  if (srcErr) return json({ error: `Registry lookup failed: ${srcErr.message}` }, 500);
  if (!src) return json({ error: `Unknown source_key: ${sourceKey}` }, 404);
  if (!src.is_enabled) {
    return json({ error: `Source is disabled by the registry: ${sourceKey}` }, 409);
  }

  const provider = getProvider(sourceKey);
  if (!provider) {
    return json({ error: `No provider implementation for ${sourceKey}` }, 501);
  }

  // ── Open an import_batches row ─────────────────────────────────────────
  const { data: batch, error: batchErr } = await svc
    .from("import_batches")
    .insert({
      source_key: sourceKey,
      provider: provider.providerName,
      content_type: contentType,
      status: "running",
      params: { max_rows: maxRows },
      triggered_by: userId,
    })
    .select("id")
    .single();
  if (batchErr || !batch) {
    return json({ error: `Could not open batch: ${batchErr?.message}` }, 500);
  }
  const batchId = batch.id as string;

  // ── Run provider, streaming to rules_cache ─────────────────────────────
  const persist = async (rows: CacheRow[]): Promise<{ upserted: number }> => {
    if (rows.length === 0) return { upserted: 0 };
    const { error } = await svc
      .from("rules_cache")
      .upsert(rows, { onConflict: "source_api,content_type,content_key" });
    if (error) throw new Error(error.message);
    return { upserted: rows.length };
  };

  let result;
  try {
    result = await provider.sync(contentType, { maxRows, persist, log: console.log });
  } catch (e: any) {
    await svc
      .from("import_batches")
      .update({
        status: "failed",
        error_count: 1,
        errors: [{ at: "provider", message: e?.message ?? String(e) }],
        finished_at: new Date().toISOString(),
      })
      .eq("id", batchId);
    return json({ error: e?.message ?? "Provider crashed", batch_id: batchId }, 500);
  }

  const status =
    result.errorCount === 0
      ? "succeeded"
      : result.imported > 0
        ? "partial"
        : "failed";

  await svc
    .from("import_batches")
    .update({
      status,
      imported: result.imported,
      skipped: result.skipped,
      error_count: result.errorCount,
      errors: result.errors,
      finished_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  return json({
    success: status !== "failed",
    batch_id: batchId,
    status,
    ...result,
  });
});