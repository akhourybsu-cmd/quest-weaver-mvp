import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Database, Globe, HardDrive } from "lucide-react";
import type { RulesListResponse } from "@/lib/rulesApi/types";

/** Shared shell + status pill for every Phase 2 reference screen. */

interface SourceLabelProps {
  source: RulesListResponse["source"] | "seed_fallback" | null;
  fromCache?: boolean;
  fallbackUsed?: boolean;
}

export function SourceLabel({ source, fromCache, fallbackUsed }: SourceLabelProps) {
  if (!source) return null;
  if (source === "seed_fallback") {
    return (
      <Badge variant="outline" className="gap-1">
        <Database className="w-3 h-3" /> Local SRD seed (fallback)
      </Badge>
    );
  }
  if (fromCache) {
    return (
      <Badge variant="secondary" className="gap-1">
        <HardDrive className="w-3 h-3" /> Cached {source === "open5e_v2" ? "Open5e" : "SRD API"}
      </Badge>
    );
  }
  if (fallbackUsed || source === "dnd5eapi_2014") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Globe className="w-3 h-3" /> Fallback SRD API
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="gap-1">
      <Globe className="w-3 h-3" /> Live Open5e
    </Badge>
  );
}

export function ReferenceShell({
  title,
  description,
  source,
  fromCache,
  fallbackUsed,
  loading,
  error,
  empty,
  count,
  toolbar,
  children,
}: {
  title: string;
  description: string;
  source: SourceLabelProps["source"];
  fromCache?: boolean;
  fallbackUsed?: boolean;
  loading: boolean;
  error: string | null;
  empty?: boolean;
  count?: number;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container max-w-5xl py-6 space-y-4">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{description}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SourceLabel source={source} fromCache={fromCache} fallbackUsed={fallbackUsed} />
            {typeof count === "number" && (
              <Badge variant="outline">{count} entries</Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Open 5e SRD reference. Quest Weaver does not include every official D&amp;D book, subclass,
          monster, spell, item, or setting.
        </p>
        {toolbar}
      </header>

      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-destructive">
              Rules reference is temporarily unavailable.
            </div>
            <div className="text-muted-foreground">Your campaign data is safe. {error}</div>
          </div>
        </Card>
      )}

      {loading && (
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!loading && !error && empty && (
        <Card className="p-8 text-center text-muted-foreground">
          No SRD/open-license result found. You can create this as homebrew content from the
          campaign manager.
        </Card>
      )}

      {!loading && !error && !empty && children}
    </div>
  );
}