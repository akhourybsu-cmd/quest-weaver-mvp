import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Focus, X } from "lucide-react";

interface Effect {
  id: string;
  name: string;
  source: string;
  start_round: number;
  concentrating_character_id: string;
  concentrating_character?: { name: string };
}

interface ConcentrationTrackerProps {
  encounterId: string;
}

const ConcentrationTracker = ({ encounterId }: ConcentrationTrackerProps) => {
  const [concentrationEffects, setConcentrationEffects] = useState<Effect[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchConcentrationEffects();

    // Use unique channel name per encounter to avoid duplicate handlers
    const channel = supabase
      .channel(`concentration:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'effects',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchConcentrationEffects()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchConcentrationEffects = async () => {
    const { data, error } = await supabase
      .from("effects")
      .select(`
        id,
        name,
        source,
        start_round,
        concentrating_character_id,
        concentrating_character:characters!concentrating_character_id (name)
      `)
      .eq("encounter_id", encounterId)
      .eq("requires_concentration", true);

    if (error) {
      console.error("Error fetching concentration effects:", error);
      return;
    }

    setConcentrationEffects(data || []);
  };

  const breakConcentration = async (effectId: string) => {
    const { error } = await supabase
      .from("effects")
      .delete()
      .eq("id", effectId);

    if (error) {
      toast({
        title: "Error breaking concentration",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Concentration broken",
      });
    }
  };

  if (concentrationEffects.length === 0) return null;

  return (
    <Card className="border-secondary shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Focus className="w-5 h-5" />
          Concentration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {concentrationEffects.map((effect) => (
          <div
            key={effect.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div>
                <div className="font-semibold">{effect.name}</div>
                <div className="text-xs text-muted-foreground">
                  {effect.concentrating_character?.name} • Round {effect.start_round}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => breakConcentration(effect.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ConcentrationTracker;
