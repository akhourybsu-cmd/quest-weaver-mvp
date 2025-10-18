import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, Heart, Swords, AlertCircle } from "lucide-react";
import { PlayerCombatActions } from "./PlayerCombatActions";
import { PlayerEffects } from "./PlayerEffects";

interface PlayerCombatViewProps {
  characterId: string;
  characterName: string;
  encounterId: string;
  isMyTurn: boolean;
}

export function PlayerCombatView({
  characterId,
  characterName,
  encounterId,
  isMyTurn,
}: PlayerCombatViewProps) {
  const [initiative, setInitiative] = useState<any[]>([]);
  const [combatLog, setCombatLog] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

  useEffect(() => {
    fetchInitiative();
    fetchCombatLog();
    fetchConditions();
    fetchCurrentRound();

    // Real-time subscriptions
    const initiativeChannel = supabase
      .channel(`player-initiative:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchInitiative()
      )
      .subscribe();

    const logChannel = supabase
      .channel(`player-combat-log:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'combat_log',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchCombatLog()
      )
      .subscribe();

    const conditionsChannel = supabase
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

    const encounterChannel = supabase
      .channel(`player-encounter:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'encounters',
          filter: `id=eq.${encounterId}`,
        },
        () => fetchCurrentRound()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(initiativeChannel);
      supabase.removeChannel(logChannel);
      supabase.removeChannel(conditionsChannel);
      supabase.removeChannel(encounterChannel);
    };
  }, [encounterId, characterId]);

  const fetchInitiative = async () => {
    const { data } = await supabase
      .from("initiative")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("initiative_roll", { ascending: false })
      .order("dex_modifier", { ascending: false });

    if (!data) return;

    // Fetch names and stats for each combatant
    const entries = await Promise.all(
      data.map(async (init) => {
        if (init.combatant_type === 'character') {
          const { data: char } = await supabase
            .from('characters')
            .select('name, ac, current_hp, max_hp')
            .eq('id', init.combatant_id)
            .single();

          return {
            id: init.id,
            combatant_id: init.combatant_id,
            combatant_name: char?.name || "Unknown",
            combatant_type: 'character',
            initiative_roll: init.initiative_roll,
            is_current_turn: init.is_current_turn,
            combatant_stats: char ? {
              ac: char.ac,
              hp_current: char.current_hp,
              hp_max: char.max_hp,
            } : undefined
          };
        } else {
          const { data: monster } = await supabase
            .from('encounter_monsters')
            .select('display_name, ac, hp_current, hp_max, is_hp_visible_to_players')
            .eq('id', init.combatant_id)
            .single();

          return {
            id: init.id,
            combatant_id: init.combatant_id,
            combatant_name: monster?.display_name || "Unknown",
            combatant_type: 'monster',
            initiative_roll: init.initiative_roll,
            is_current_turn: init.is_current_turn,
            combatant_stats: (monster && monster.is_hp_visible_to_players) ? {
              ac: monster.ac,
              hp_current: monster.hp_current,
              hp_max: monster.hp_max,
            } : { ac: monster?.ac }
          };
        }
      })
    );

    setInitiative(entries);
  };

  const fetchCombatLog = async () => {
    try {
      const result = await supabase
        .from("combat_log")
        .select("id, round, message, action_type, created_at")
        .eq("encounter_id", encounterId)
        .eq("is_visible_to_players", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (result.data) {
        setCombatLog(result.data);
      }
    } catch (error) {
      console.error("Error fetching combat log:", error);
    }
  };

  const fetchConditions = async () => {
    const { data } = await supabase
      .from("character_conditions")
      .select("id, condition, ends_at_round")
      .eq("character_id", characterId)
      .eq("encounter_id", encounterId);

    if (data) {
      setConditions(data);
    }
  };

  const fetchCurrentRound = async () => {
    const { data } = await supabase
      .from("encounters")
      .select("current_round")
      .eq("id", encounterId)
      .single();

    if (data) setCurrentRound(data.current_round);
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "damage":
        return "text-status-hp";
      case "healing":
        return "text-status-buff";
      case "save":
        return "text-secondary";
      case "effect_applied":
        return "text-primary";
      case "round_start":
        return "text-primary font-semibold";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Combat
          </CardTitle>
          <Badge variant="secondary">Round {currentRound}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="initiative" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="initiative">Initiative</TabsTrigger>
            <TabsTrigger value="log">Battle Log</TabsTrigger>
            <TabsTrigger value="conditions">
              Conditions
              {conditions.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {conditions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="initiative" className="mt-4 space-y-2">
            {isMyTurn && (
              <div className="mb-4">
                <PlayerCombatActions
                  characterId={characterId}
                  encounterId={encounterId}
                  isMyTurn={isMyTurn}
                />
              </div>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {initiative.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg p-3 border-2 transition-all ${
                      entry.is_current_turn
                        ? "bg-primary/10 border-primary shadow-lg"
                        : "bg-muted/50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="secondary" className="text-lg font-bold w-10 justify-center">
                          {entry.initiative_roll}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {entry.combatant_name}
                            <Badge variant={entry.combatant_type === 'character' ? 'default' : 'secondary'} className="text-xs">
                              {entry.combatant_type === 'character' ? 'PC' : 'NPC'}
                            </Badge>
                            {entry.is_current_turn && (
                              <Badge variant="default" className="text-xs">
                                Current Turn
                              </Badge>
                            )}
                          </div>
                          {entry.combatant_stats && (
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                AC {entry.combatant_stats.ac}
                              </span>
                              {entry.combatant_stats.hp_current !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {entry.combatant_stats.hp_current}/{entry.combatant_stats.hp_max}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {combatLog.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No combat actions yet
                  </div>
                ) : (
                  combatLog.map((entry) => (
                    <div key={entry.id} className="text-sm border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">
                        [Round {entry.round}]
                      </span>{" "}
                      <span className={getActionColor(entry.action_type)}>
                        {entry.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conditions" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {conditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No active conditions
                  </div>
                ) : (
                  conditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="font-medium capitalize">
                          {condition.condition.replace(/_/g, ' ')}
                        </span>
                        {condition.ends_at_round && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            Until Round {condition.ends_at_round}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="mt-4">
              <PlayerEffects
                characterId={characterId}
                encounterId={encounterId}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
