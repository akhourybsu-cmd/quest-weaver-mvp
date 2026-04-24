import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import type { NormalizedRulesItem, RulesDetailResponse } from "@/lib/rulesApi/types";
import { ReferenceShell, SourceLabel } from "@/components/reference/ReferenceShell";
import { Statblock } from "@/components/reference/Statblock";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MonsterDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<NormalizedRulesItem | null>(null);
  const [meta, setMeta] = useState<{ source: RulesDetailResponse["source"] | null; fromCache?: boolean; fallbackUsed?: boolean }>({ source: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    setError(null);
    rulesApiService
      .getCreatureByKeyOrSlug(slug)
      .then((r) => {
        if (!alive) return;
        setItem(r.item);
        setMeta({ source: r.source, fromCache: r.from_cache, fallbackUsed: r.fallback_used });
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  return (
    <div className="container max-w-3xl py-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reference/bestiary"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Bestiary</Link>
        </Button>
        <SourceLabel source={meta.source} fromCache={meta.fromCache} fallbackUsed={meta.fallbackUsed} />
      </div>

      {loading && <ReferenceShell title="Loading…" description="" source={null} loading error={null}>{null}</ReferenceShell>}
      {error && (
        <div className="text-sm text-destructive border border-destructive/50 rounded p-3">
          Could not load creature: {error}
        </div>
      )}
      {!loading && !error && item && <Statblock item={item} />}
    </div>
  );
}