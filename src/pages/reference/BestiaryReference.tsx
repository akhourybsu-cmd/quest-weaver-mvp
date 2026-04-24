import { useState } from "react";
import { Link } from "react-router-dom";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesQuery } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Bestiary / Monster Library — query-driven against the rules-api edge function.
 * No direct API calls; results are normalized and cached server-side.
 */
export default function BestiaryReference() {
  const [q, setQ] = useState("");
  const { items, meta, loading, error } = useRulesQuery({
    query: q,
    loader: (query) => rulesApiService.getCreatures({ query: query || undefined, limit: 50 }),
  });

  return (
    <ReferenceShell
      title="Bestiary"
      description="Search SRD/open-license creatures. Tap any result for the full statblock."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && items.length === 0}
      count={items.length}
      toolbar={
        <Input
          placeholder="Search creatures (e.g. goblin, dragon, beholder)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
      }
    >
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((m) => {
          const n = m.normalized_json as any;
          return (
            <Link key={m.key} to={`/reference/bestiary/${encodeURIComponent(m.slug || m.key)}`}>
              <Card className="p-3 hover:bg-accent/30 transition-colors h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground capitalize truncate">
                      {n?.size || "—"} {n?.type || "creature"}{n?.alignment ? ` · ${n.alignment}` : ""}
                    </div>
                  </div>
                  {(n?.cr ?? n?.challenge_rating) !== undefined && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      CR {String(n.cr ?? n.challenge_rating)}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                  {n?.ac !== undefined && <span>AC {n.ac}</span>}
                  {n?.hp !== undefined && <span>HP {n.hp}</span>}
                  {m.source_document && <span className="ml-auto truncate">{m.source_document}</span>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </ReferenceShell>
  );
}