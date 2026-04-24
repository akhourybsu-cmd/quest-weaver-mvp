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

export default function RulesApiHealthCheck() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [data, setData] = useState<RulesHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await rulesApiService.testApiHealth();
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
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