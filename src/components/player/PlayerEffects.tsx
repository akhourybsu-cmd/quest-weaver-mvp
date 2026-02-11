import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Clock, Skull } from "lucide-react";
import { CONDITION_TOOLTIPS } from "@/lib/conditionTooltips";

interface Effect {
  id: string;
  name: string;
  description: string;
  end_round: number | null;
  requires_concentration: boolean;
  source: string;
}

interface Condition {
  id: string;
  condition: string;
  ends_at_round: number | null;
}

interface PlayerEffectsProps {
  characterId: string;
  encounterId?: string | null;
}

export function PlayerEffects({ characterId, encounterId }: PlayerEffectsProps) {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);

  useEffect(() => {
    fetchEffects();
    if (encounterId) {
      fetchConditions();
    }

    const effectsChannel = supabase
      .channel(`player-effects:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'effects',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchEffects()
      )
      .subscribe();

    let conditionsChannel: any = null;
    if (encounterId) {
      conditionsChannel = supabase
        .channel(`player-conditions:${characterId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'character_conditions',
            filter: `character_id=eq.${characterId}`,
          },
          () => fetchConditions()
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(effectsChannel);
      if (conditionsChannel) {
        supabase.removeChannel(conditionsChannel);
      }
    };
  }, [characterId, encounterId]);

  const fetchEffects = async () => {
    const { data } = await supabase
      .from("effects")
      .select("*")
      .eq("character_id", characterId);

    if (data) {
      setEffects(data);
    }
  };

  const fetchConditions = async () => {
    if (!encounterId) return;

    const { data } = await supabase
      .from("character_conditions")
      .select("*")
      .eq("character_id", characterId)
      .eq("encounter_id", encounterId);

    if (data) {
      setConditions(data);
    }
  };

  const concentrationEffect = effects.find(e => e.requires_concentration);

  if (effects.length === 0 && conditions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Active Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Concentration Banner */}
        {concentrationEffect && (
          <div className="p-3 bg-primary/10 border-2 border-primary rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-primary">Concentrating</span>
                  <Badge variant="outline" className="text-xs">
                    {concentrationEffect.name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Don't forget to make Constitution saves if you take damage!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conditions */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            {conditions.map((condition) => (
              <div
                key={condition.id}
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold capitalize">{condition.condition}</span>
                    {condition.ends_at_round && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs text-muted-foreground">
                          Until round {condition.ends_at_round}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other Effects */}
        {effects.filter(e => !e.requires_concentration).length > 0 && (
          <div className="space-y-2">
            {effects
              .filter(e => !e.requires_concentration)
              .map((effect) => (
                <div
                  key={effect.id}
                  className="p-3 bg-muted/30 border border-border rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{effect.name}</div>
                      {effect.source && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {effect.source}
                        </p>
                      )}
                      {effect.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {effect.description}
                        </p>
                      )}
                      {effect.end_round && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs text-muted-foreground">
                            Until round {effect.end_round}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
