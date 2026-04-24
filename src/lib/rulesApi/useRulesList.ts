import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NormalizedRulesItem, RulesListResponse } from "./types";

/**
 * API-first loader with seed-table fallback.
 * Tries rulesApiService.{loader}(); on failure or empty result, falls back to a Supabase srd_* table
 * mapped through `seedAdapter`. Used by Phase 2 reference screens.
 */
export function useRulesList(opts: {
  loader: () => Promise<RulesListResponse>;
  seedTable?: "srd_classes" | "srd_backgrounds" | "srd_ancestries" | "srd_feats";
  seedAdapter?: (rows: any[]) => NormalizedRulesItem[];
}) {
  const { loader, seedTable, seedAdapter } = opts;
  const [items, setItems] = useState<NormalizedRulesItem[]>([]);
  const [meta, setMeta] = useState<{ source: RulesListResponse["source"] | "seed_fallback" | null; fromCache?: boolean; fallbackUsed?: boolean }>({ source: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await loader();
        if (!alive) return;
        if (r.items?.length) {
          setItems(r.items);
          setMeta({ source: r.source, fromCache: r.from_cache, fallbackUsed: r.fallback_used });
          setLoading(false);
          return;
        }
        throw new Error("API returned no results");
      } catch (e) {
        // Try seed fallback
        if (seedTable && seedAdapter) {
          try {
            const { data } = await supabase.from(seedTable).select("*");
            if (alive && data?.length) {
              setItems(seedAdapter(data));
              setMeta({ source: "seed_fallback" });
              setLoading(false);
              return;
            }
          } catch { /* fall through */ }
        }
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, meta, loading, error };
}

/**
 * Query-driven loader. Re-runs whenever `query` changes (debounced by caller).
 * Used by screens with a server-side search box (Bestiary, Equipment, Magic Items).
 */
export function useRulesQuery(opts: {
  query: string;
  loader: (query: string) => Promise<RulesListResponse>;
  enabled?: boolean;
}) {
  const { query, loader, enabled = true } = opts;
  const [items, setItems] = useState<NormalizedRulesItem[]>([]);
  const [meta, setMeta] = useState<{ source: RulesListResponse["source"] | null; fromCache?: boolean; fallbackUsed?: boolean }>({ source: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const r = await loader(query);
        if (!alive) return;
        setItems(r.items ?? []);
        setMeta({ source: r.source, fromCache: r.from_cache, fallbackUsed: r.fallback_used });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, enabled]);

  return { items, meta, loading, error };
}