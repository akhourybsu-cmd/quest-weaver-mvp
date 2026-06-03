import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Library, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Loader2, CircleSlash } from "lucide-react";
import { RULES_SOURCES, sourceLabel } from "@/lib/rules/sources";
import {
  listRecentImportBatches,
  getBuilderSpellCountsBySource,
  type ImportBatchRow,
  type ImportBatchStatus,
} from "@/lib/rules/rulesSourcesDb";

const STATUS_STYLE: Record<ImportBatchStatus, { icon: typeof CheckCircle2; cls: string }> = {
  succeeded: { icon: CheckCircle2, cls: "text-emerald-600 border-emerald-500/40" },
  partial:   { icon: AlertCircle,  cls: "text-amber-600 border-amber-500/40" },
  failed:    { icon: AlertCircle,  cls: "text-destructive border-destructive/40" },
  running:   { icon: Loader2,      cls: "text-blue-600 border-blue-500/40" },
  pending:   { icon: CircleSlash,  cls: "text-muted-foreground border-border" },
};

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

const RulesSourcesPanel = () => {
  const [batches, setBatches] = useState<ImportBatchRow[]>([]);
  const [spellCounts, setSpellCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Counts and batches read from Phase 2 tables. If the migration hasn't
      // been applied yet, surface a friendly message instead of crashing.
      const [counts, recent] = await Promise.all([
        getBuilderSpellCountsBySource().catch(() => ({})),
        listRecentImportBatches(15).catch((e) => {
          throw e;
        }),
      ]);
      setSpellCounts(counts);
      setBatches(recent);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load import history — has the Phase 2 migration been applied?"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Rules Sources &amp; Imports
            </CardTitle>
            <CardDescription>
              Source registry, live source labels, and import/sync history (read-only)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/attribution">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-4 w-4" />
                Attribution
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Registry ── */}
        <div>
          <h3 className="text-xs font-cinzel uppercase tracking-widest text-muted-foreground mb-2">
            Registered sources
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-1.5 pr-3 font-medium">Source</th>
                  <th className="py-1.5 pr-3 font-medium">Ruleset</th>
                  <th className="py-1.5 pr-3 font-medium">License</th>
                  <th className="py-1.5 pr-3 font-medium">Status</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Builder spells</th>
                </tr>
              </thead>
              <tbody>
                {[...RULES_SOURCES]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s) => (
                    <tr key={s.key} className="border-b border-border/40">
                      <td className="py-1.5 pr-3">
                        <span className="font-medium">{s.name}</span>
                        {s.isOfficial && (
                          <Badge className="ml-2 text-[9px]" style={{ backgroundColor: "hsl(var(--brass) / 0.85)", color: "#000" }}>
                            SRD
                          </Badge>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {s.ruleset}{s.version ? ` · v${s.version}` : ""}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{s.license}</td>
                      <td className="py-1.5 pr-3">
                        {s.isEnabled ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">enabled</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">disabled</Badge>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {spellCounts[s.key] ?? 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Surface any unlabelled / unexpected source keys present in data */}
          {Object.keys(spellCounts)
            .filter((k) => !RULES_SOURCES.some((s) => s.key === k))
            .map((k) => (
              <p key={k} className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {spellCounts[k]} spell(s) with unregistered source <code className="px-1 bg-muted rounded">{k}</code> — review.
              </p>
            ))}
        </div>

        {/* ── Import history ── */}
        <div>
          <h3 className="text-xs font-cinzel uppercase tracking-widest text-muted-foreground mb-2">
            Recent imports
          </h3>

          {error ? (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading import history…
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No imports recorded yet. Run an SRD import above to populate this log.
            </p>
          ) : (
            <div className="space-y-1.5">
              {batches.map((b) => {
                const style = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
                const Icon = style.icon;
                return (
                  <div key={b.id} className="flex items-center gap-3 text-sm border border-border/40 rounded-md px-3 py-2">
                    <Badge variant="outline" className={`gap-1 text-[10px] shrink-0 ${style.cls}`}>
                      <Icon className={`h-3 w-3 ${b.status === "running" ? "animate-spin" : ""}`} />
                      {b.status}
                    </Badge>
                    <span className="font-medium shrink-0">{sourceLabel(b.source_key)}</span>
                    <span className="text-muted-foreground shrink-0">
                      {b.content_type ?? "all"}
                    </span>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {b.imported} imported · {b.skipped} skipped · {b.error_count} err
                    </span>
                    <span className="text-muted-foreground text-xs ml-auto shrink-0">
                      {fmtTime(b.finished_at ?? b.started_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RulesSourcesPanel;
