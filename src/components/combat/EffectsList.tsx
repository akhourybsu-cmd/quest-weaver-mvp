import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

interface Effect {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  ticks_at: string;
  end_round: number | null;
  start_round: number;
  affected_character?: { name: string };
}

interface EffectsListProps {
  encounterId: string;
}

const EffectsList = ({ encounterId }: EffectsListProps) => {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchEffects();
    fetchEncounterRound();

    const channel = supabase
      .channel('effects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'effects',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchEffects()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'encounters',
          filter: `id=eq.${encounterId}`,
        },
        () => fetchEncounterRound()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchEffects = async () => {
    const { data, error} = await supabase
      .from("effects")
      .select(`
        id,
        name,
        description,
        source,
        ticks_at,
        end_round,
        start_round,
        affected_character:characters!character_id (name)
      `)
      .eq("encounter_id", encounterId)
      .eq("requires_concentration", false);

    if (error) {
      console.error("Error fetching effects:", error);
      return;
    }

    setEffects(data || []);
  };

  const fetchEncounterRound = async () => {
    const { data } = await supabase
      .from("encounters")
      .select("current_round")
      .eq("id", encounterId)
      .single();

    if (data) setCurrentRound(data.current_round);
  };

  const removeEffect = async (id: string) => {
    const { error } = await supabase
      .from("effects")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error removing effect",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (effects.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Active Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 space-y-2">
        {effects.map((effect) => (
          <div
            key={effect.id}
            className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{effect.name}</div>
                {effect.end_round && (
                  <Badge variant="secondary" className="text-xs">
                    {effect.end_round - currentRound} rounds left
                  </Badge>
                )}
              </div>
              {effect.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {effect.description}
                </div>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {effect.affected_character?.name && (
                  <Badge variant="outline" className="text-xs">
                    {effect.affected_character.name}
                  </Badge>
                )}
                {effect.source && (
                  <Badge variant="outline" className="text-xs">
                    Source: {effect.source}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Ticks: {effect.ticks_at}
                </Badge>
                {effect.end_round && (
                  <Badge variant="outline" className="text-xs">
                    Ends: Round {effect.end_round}
                  </Badge>
                )}
              </div>
              {effect.end_round && (
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, ((effect.end_round - currentRound) / (effect.end_round - effect.start_round)) * 100))}%` 
                    }}
                  />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeEffect(effect.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EffectsList;
