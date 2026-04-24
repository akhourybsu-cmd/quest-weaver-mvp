import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import type { RulesHealthResponse } from "@/lib/rulesApi/types";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

type ScreenStatus = { name: string; status: "Connected" | "Failed" | "Pending"; sample?: string; error?: string; latency_ms?: number };

const SCREEN_PROBES: Array<{ name: string; run: () => Promise<{ sample?: string }> }> = [
  { name: "Spell Library", run: async () => {
      const r = await rulesApiService.getSpells({ limit: 1 });
      return { sample: r.items[0]?.name };
    } },
  { name: "Bestiary", run: async () => {
      const r = await rulesApiService.getCreatures({ query: "goblin", limit: 1 });
      return { sample: r.items[0]?.name };
    } },
  { name: "Conditions", run: async () => {
      const r = await rulesApiService.getConditions();
      return { sample: r.items[0]?.name };
    } },
  { name: "Rules", run: async () => {
      const r = await rulesApiService.getRules();
      return { sample: r.items[0]?.name };
    } },
  { name: "Classes", run: async () => {
      const r = await rulesApiService.getClasses();
      return { sample: r.items[0]?.name };
    } },
  { name: "Species", run: async () => {
      const r = await rulesApiService.getSpecies();
      return { sample: r.items[0]?.name };
    } },
  { name: "Backgrounds", run: async () => {
      const r = await rulesApiService.getBackgrounds();
      return { sample: r.items[0]?.name };
    } },
  { name: "Feats", run: async () => {
      const r = await rulesApiService.getFeats();
      return { sample: r.items[0]?.name };
    } },
  { name: "Equipment", run: async () => {
      const r = await rulesApiService.getEquipment({ limit: 1 });
      return { sample: r.items[0]?.name };
    } },
  { name: "Magic Items", run: async () => {
      const r = await rulesApiService.getMagicItems({ limit: 1 });
      return { sample: r.items[0]?.name };
    } },
  { name: "Encounter Builder (live monster search)", run: async () => {
      const r = await rulesApiService.getCreatures({ query: "dragon", limit: 1 });
      return { sample: r.items[0]?.name };
    } },
  { name: "Encounter Builder — API monster add (snapshot + source metadata)", run: async () => {
      // Smoke-test the adapter shape: confirm a creature item carries the fields we
      // need to build a self-contained combat snapshot AND traceable source metadata.
      const r = await rulesApiService.getCreatures({ query: "goblin", limit: 1 });
      const it = r.items[0];
      if (!it) throw new Error("No creature returned");
      const n = (it.normalized_json ?? {}) as any;
      const hp = typeof n.hp === "number" ? n.hp : n.hit_points;
      const ac = typeof n.ac === "number" ? n.ac : n.armor_class;
      const hasSnapshot = Boolean(it.name) && hp != null && ac != null;
      const hasSourceMeta = Boolean(it.source_api && it.key);
      if (!hasSnapshot) throw new Error("Combat snapshot incomplete (missing hp/ac/name)");
      if (!hasSourceMeta) throw new Error("Source metadata incomplete (missing source_api/key)");
      return { sample: `${it.name} · AC ${ac} · HP ${hp} · src ${it.source_api}` };
    } },
];

export default function RulesApiHealthCheck() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [data, setData] = useState<RulesHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screens, setScreens] = useState<ScreenStatus[]>([]);

  const run = async () => {
    setLoading(true);
    setError(null);
    setScreens(SCREEN_PROBES.map((p) => ({ name: p.name, status: "Pending" })));
    try {
      const r = await rulesApiService.testApiHealth();
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
    // Probe each screen in parallel.
    const results = await Promise.all(
      SCREEN_PROBES.map(async (p): Promise<ScreenStatus> => {
        const t = Date.now();
        try {
          const out = await p.run();
          return { name: p.name, status: "Connected", sample: out.sample, latency_ms: Date.now() - t };
        } catch (e) {
          return { name: p.name, status: "Failed", error: e instanceof Error ? e.message : String(e), latency_ms: Date.now() - t };
        }
      }),
    );
    setScreens(results);
  };

  useEffect(() => {
    if (isAdmin) run();
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Admin only</h1>
        <p className="text-muted-foreground">The Rules API Health Check is restricted to administrators.</p>
        <Button onClick={() => navigate("/")}>Go home</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Rules API Health Check</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Live status of the Open5e v2 primary API and the D&amp;D 5e SRD fallback API. Quest Weaver
            includes an open 5e SRD reference powered by free public rules APIs. This does not include
            every official D&amp;D book, subclass, monster, spell, item, or setting.
          </p>
        </div>
        <Button onClick={run} disabled={loading} variant="outline">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Re-test
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Health check failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Summary
                <Badge variant={data.summary.startsWith("All") ? "default" : "secondary"}>
                  {data.summary}
                </Badge>
              </CardTitle>
              <CardDescription>
                Checked at {new Date(data.checked_at).toLocaleString()} · Cache rows: {data.cache_count}
              </CardDescription>
            </CardHeader>
          </Card>

          {screens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Screen verification</CardTitle>
                <CardDescription>End-to-end smoke test for each Phase 1/2 reference screen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {screens.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-3 text-sm border-b last:border-b-0 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {s.status === "Connected" ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> :
                       s.status === "Pending" ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> :
                       <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                      <span className="font-medium">{s.name}</span>
                      {s.sample && <span className="text-xs text-muted-foreground truncate">· {s.sample}</span>}
                      {s.error && <span className="text-xs text-destructive truncate">· {s.error}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {typeof s.latency_ms === "number" && <Badge variant="outline" className="text-[10px]">{s.latency_ms} ms</Badge>}
                      <Badge variant={s.status === "Connected" ? "default" : s.status === "Pending" ? "secondary" : "destructive"} className="text-[10px]">
                        {s.status === "Connected" ? "connected" : s.status === "Pending" ? "checking…" : "failed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3">
            {data.checks.map((c) => (
              <Card key={c.name}>
                <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.status === "Connected" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.url}</div>
                      {c.sample && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Sample: <span className="font-mono">{c.sample}</span>
                        </div>
                      )}
                      {c.error && (
                        <div className="text-xs text-destructive mt-1">Error: {c.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{c.latency_ms} ms</Badge>
                    <Badge variant={c.status === "Connected" ? "default" : "destructive"}>{c.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}