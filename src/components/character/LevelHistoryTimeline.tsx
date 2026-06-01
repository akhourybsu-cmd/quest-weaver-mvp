import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Sparkles } from "lucide-react";

interface HistoryRow {
  id: string;
  class_id: string;
  className: string;
  previous_level: number;
  new_level: number;
  hp_gained: number;
  leveled_at: string | null;
  choices_made: any;
  features_gained: any;
}

interface Props {
  characterId: string;
}

/**
 * Per-class level-up timeline read straight from `character_level_history`.
 * Most recent first. Each entry shows the per-class transition
 * (e.g. "Wizard 2 → 3"), HP gained, and a short list of choices/features.
 */
export function LevelHistoryTimeline({ characterId }: Props) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("character_level_history")
        .select(
          `id, class_id, previous_level, new_level, hp_gained, leveled_at,
           choices_made, features_gained,
           srd_classes:class_id ( name )`,
        )
        .eq("character_id", characterId)
        .order("leveled_at", { ascending: false, nullsFirst: false });
      if (cancelled) return;
      if (error) {
        console.error("[LevelHistoryTimeline] load error", error);
        setRows([]);
      } else {
        setRows(
          (data || []).map((r: any) => ({
            id: r.id,
            class_id: r.class_id,
            className: r.srd_classes?.name ?? "Unknown",
            previous_level: r.previous_level,
            new_level: r.new_level,
            hp_gained: r.hp_gained,
            leveled_at: r.leveled_at,
            choices_made: r.choices_made,
            features_gained: r.features_gained,
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif">
          <History className="h-5 w-5" />
          Level History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No level-ups recorded yet. The first level-up after creation will
            appear here.
          </p>
        ) : (
          <ol className="relative border-l border-primary/30 ml-2 space-y-5">
            {rows.map((r) => {
              const choices = (r.choices_made || {}) as Record<string, any>;
              const features = Array.isArray(r.features_gained)
                ? (r.features_gained as Array<{ id: string; name: string }>)
                : [];
              const summary: string[] = [];
              if (choices.asi_or_feat === "asi") {
                const bumps = Object.entries(choices.ability_increases || {})
                  .filter(([, v]) => Number(v) > 0)
                  .map(([k, v]) => `${k} +${v}`)
                  .join(", ");
                if (bumps) summary.push(bumps);
              } else if (choices.asi_or_feat === "feat" && choices.feat_id) {
                summary.push("Feat chosen");
              }
              if (choices.subclass_id) summary.push("Subclass chosen");
              if (Array.isArray(choices.new_spells) && choices.new_spells.length)
                summary.push(`+${choices.new_spells.length} spells`);
              if (Array.isArray(choices.new_cantrips) && choices.new_cantrips.length)
                summary.push(`+${choices.new_cantrips.length} cantrips`);
              return (
                <li key={r.id} className="ml-4">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="font-serif text-base">
                      <span className="font-semibold">{r.className}</span>{" "}
                      <span className="text-muted-foreground">{r.previous_level}</span>
                      <span className="mx-1.5 text-primary">→</span>
                      <span className="font-semibold">{r.new_level}</span>
                    </p>
                    {r.leveled_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.leveled_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="outline">+{r.hp_gained} HP</Badge>
                    {summary.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                  {features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {features.map((f) => (
                        <span
                          key={f.id}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <Sparkles className="h-3 w-3" />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}