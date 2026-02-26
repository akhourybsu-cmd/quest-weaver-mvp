import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Heart, Shield, Sword, Users } from "lucide-react";
import { ThemedLoading } from "@/components/ui/themed-loading";
import { TurnIndicator } from "@/components/presence/TurnIndicator";
import CombatLog from "@/components/combat/CombatLog";

interface InitiativeEntry {
  id: string;
  combatant_id: string;
  combatant_type: string;
  initiative_roll: number;
  is_current_turn: boolean;
  character?: { name: string; class: string; level: number };
  monster?: { display_name: string; ac: number; hp_current: number; hp_max: number };
}

interface Encounter {
  id: string;
  name: string;
  current_round: number;
  status: string;
}

const SessionSpectator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignCode = searchParams.get("campaign");
  const { toast } = useToast();

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [initiative, setInitiative] = useState<InitiativeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignCode) {
      navigate("/campaign-hub");
      return;
    }

    fetchCampaignData();
  }, [campaignCode]);

  useEffect(() => {
    if (!encounter) return;

    const initiativeChannel = supabase
      .channel(`spectator-initiative:${encounter.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative',
          filter: `encounter_id=eq.${encounter.id}`,
        },
        () => fetchInitiative()
      )
      .subscribe();

    const encounterChannel = supabase
      .channel(`spectator-encounter:${encounter.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'encounters',
          filter: `id=eq.${encounter.id}`,
        },
        () => fetchCampaignData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(initiativeChannel);
      supabase.removeChannel(encounterChannel);
    };
  }, [encounter?.id]);

  const fetchCampaignData = async () => {
    // Get campaign by code
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("code", campaignCode);

    if (campaignError || !campaigns || campaigns.length === 0) {
      toast({
        title: "Campaign not found",
        description: "Invalid campaign code",
        variant: "destructive",
      });
      navigate("/campaign-hub");
      return;
    }

    setCampaignId(campaigns[0].id);

    // Get active encounter
    const { data: activeEncounter } = await supabase
      .from("encounters")
      .select("id, name, current_round, status")
      .eq("campaign_id", campaigns[0].id)
      .in("status", ["active", "paused"])
      .maybeSingle();

    if (!activeEncounter) {
      setLoading(false);
      return;
    }

    setEncounter(activeEncounter);
    await fetchInitiative(activeEncounter.id);
    setLoading(false);
  };

  const fetchInitiative = async (encounterId?: string) => {
    const targetEncounterId = encounterId || encounter?.id;
    if (!targetEncounterId) return;

    const { data } = await supabase
      .from("initiative")
      .select(`
        id,
        combatant_id,
        combatant_type,
        initiative_roll,
        is_current_turn,
        characters:combatant_id(name, class, level),
        encounter_monsters:combatant_id(display_name, ac, hp_current, hp_max)
      `)
      .eq("encounter_id", targetEncounterId)
      .order("initiative_roll", { ascending: false })
      .order("dex_modifier", { ascending: false });

    setInitiative((data as any) || []);
  };

  const getHPPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getHPColor = (percentage: number) => {
    if (percentage > 50) return "bg-status-buff";
    if (percentage > 25) return "bg-status-warning";
    return "bg-status-hp";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ThemedLoading message="Loading spectator view..." />
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Spectator Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No active encounter in this campaign.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
          <h1 className="text-3xl font-cinzel font-bold flex items-center gap-2">
              <Eye className="w-8 h-8 text-brass" />
              Spectator View
            </h1>
            <p className="text-muted-foreground mt-1">Campaign: {campaignCode}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Round {encounter.current_round}
          </Badge>
        </div>

        <h2 className="text-xl font-semibold text-muted-foreground">{encounter.name}</h2>
      </div>

      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-2">
        {/* Left Column - Initiative Order */}
        <div className="space-y-4">
          {campaignId && (
            <TurnIndicator encounterId={encounter.id} campaignId={campaignId} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sword className="w-5 h-5" />
                Initiative Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {initiative.map((entry) => {
                const isCharacter = entry.combatant_type === 'character';
                const char = (entry as any).characters;
                const monster = (entry as any).encounter_monsters;

                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      entry.is_current_turn
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isCharacter ? "default" : "secondary"}>
                            {entry.initiative_roll}
                          </Badge>
                          <span className="font-semibold text-lg">
                            {isCharacter ? char?.name : monster?.display_name}
                          </span>
                        </div>
                        {isCharacter && char && (
                          <p className="text-sm text-muted-foreground">
                            Level {char.level} {char.class}
                          </p>
                        )}
                        {!isCharacter && monster && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Shield className="w-4 h-4" />
                              <span>AC {monster.ac}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Heart className="w-4 h-4" />
                                <span>HP</span>
                              </div>
                              <Progress
                                value={getHPPercentage(monster.hp_current, monster.hp_max)}
                                className={`h-2 ${getHPColor(getHPPercentage(monster.hp_current, monster.hp_max))}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {initiative.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No combatants in initiative</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Combat Log */}
        <div>
          <CombatLog encounterId={encounter.id} />
        </div>
      </div>
    </div>
  );
};

export default SessionSpectator;
