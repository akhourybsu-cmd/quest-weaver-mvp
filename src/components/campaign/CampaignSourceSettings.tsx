import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { RULES_SOURCES } from "@/lib/rules/sources";
import {
  setCampaignSourceEnabled,
  isSourceEnabledForCampaign,
  useCampaignEnabledSources,
} from "@/lib/rules/campaignSources";

/**
 * DM-facing toggles for which rules sources a campaign uses. Read access is
 * RLS-restricted to campaign members; writes to the campaign's DM.
 *
 * "Unconfigured" (no rows yet) means all sources are enabled — toggling the
 * first source writes explicit rows for every source so the state is unambiguous.
 */
export default function CampaignSourceSettings({
  campaignId,
  onChanged,
}: {
  campaignId: string;
  onChanged?: () => void;
}) {
  const { enabled, loading, refresh } = useCampaignEnabledSources(campaignId);
  const [saving, setSaving] = useState<string | null>(null);

  const sources = [...RULES_SOURCES].filter((s) => s.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const unconfigured = enabled === null;

  const onToggle = async (sourceKey: string, next: boolean) => {
    setSaving(sourceKey);
    try {
      // If unconfigured, materialize explicit rows for all sources first so the
      // campaign's set is unambiguous, then apply this toggle.
      if (unconfigured) {
        await Promise.all(
          sources.map((s) =>
            setCampaignSourceEnabled(campaignId, s.key, s.key === sourceKey ? next : true)
          )
        );
      } else {
        await setCampaignSourceEnabled(campaignId, sourceKey, next);
      }
      refresh();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update source (DM only).");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4" />
          Campaign Rules Sources
        </CardTitle>
        <CardDescription>
          Choose which sources this campaign uses. {unconfigured && "All sources are enabled by default."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => {
              const on = isSourceEnabledForCampaign(enabled, s.key);
              return (
                <div key={s.key} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      {s.isOfficial && (
                        <Badge className="text-[9px]" style={{ backgroundColor: "hsl(var(--brass) / 0.85)", color: "#000" }}>SRD</Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{s.ruleset} · {s.license}</span>
                  </div>
                  <Switch
                    checked={on}
                    disabled={saving === s.key}
                    onCheckedChange={(v) => onToggle(s.key, v)}
                    aria-label={`Toggle ${s.name}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
