import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, Heart, Swords, AlertCircle, Sparkles, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CONDITION_TOOLTIPS } from "@/lib/conditionTooltips";
import { PlayerCombatActions } from "./PlayerCombatActions";
import { PlayerEffects } from "./PlayerEffects";

interface PlayerCombatViewProps {
  characterId: string;
  characterName: string;
  encounterId: string;
  isMyTurn: boolean;
}

function getHPColor(current: number, max: number) {
  const pct = max > 0 ? current / max : 0;
  if (pct > 0.5) return "bg-status-buff";
  if (pct > 0.25) return "bg-status-warning";
  return "bg-status-hp";
}

function getActionIcon(type: string) {
  switch (type) {
    case "damage": return <Swords className="w-3 h-3 text-status-hp shrink-0" />;
    case "healing": return <Heart className="w-3 h-3 text-status-buff shrink-0" />;
    case "save": return <Shield className="w-3 h-3 text-secondary shrink-0" />;
    case "effect_applied": return <Sparkles className="w-3 h-3 text-primary shrink-0" />;
    default: return null;
  }
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

    const initiativeChannel = supabase
      .channel(`player-initiative:${encounterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'initiative', filter: `encounter_id=eq.${encounterId}` },
        () => fetchInitiative()
      )
      .subscribe();

    const logChannel = supabase
      .channel(`player-combat-log:${encounterId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'combat_log', filter: `encounter_id=eq.${encounterId}` },
        () => fetchCombatLog()
      )
      .subscribe();

    const conditionsChannel = supabase
      .channel(`player-conditions:${characterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'character_conditions', filter: `character_id=eq.${characterId}` },
        () => fetchConditions()
      )
      .subscribe();

    const encounterChannel = supabase
      .channel(`player-encounter:${encounterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'encounters', filter: `id=eq.${encounterId}` },
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
            combatant_name: char?.name || "",
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
            combatant_name: monster?.display_name || "",
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
      case "damage": return "text-status-hp";
      case "healing": return "text-status-buff";
      case "save": return "text-secondary";
      case "effect_applied": return "text-primary";
      case "round_start": return "text-brand-brass font-semibold font-cinzel";
      default: return "text-foreground";
    }
  };

  return (
    <Card className="fantasy-border-ornaments">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-cinzel tracking-wide text-brand-brass">
            <Swords className="w-5 h-5" />
            Combat
          </CardTitle>
          <Badge variant="secondary" className="border-brand-brass/30 font-cinzel text-xs">
            Round {currentRound}
          </Badge>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-brass/50 to-transparent mt-2" />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="initiative" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="initiative" className="font-cinzel text-xs">Initiative</TabsTrigger>
            <TabsTrigger value="log" className="font-cinzel text-xs">Battle Log</TabsTrigger>
            <TabsTrigger value="conditions" className="font-cinzel text-xs">
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

            <ScrollArea className="h-[300px] sm:h-[400px]">
              <div className="space-y-2 pr-2 sm:pr-4">
                {initiative.map((entry, index) => {
                  const hpCurrent = entry.combatant_stats?.hp_current;
                  const hpMax = entry.combatant_stats?.hp_max;
                  const hasHP = hpCurrent !== undefined && hpMax !== undefined && hpMax > 0;

                  return (
                    <div
                      key={entry.id}
                      className={`rounded-lg p-3 border-2 transition-all hover:border-brand-brass/50 animate-fade-in ${
                        entry.is_current_turn
                          ? "bg-primary/10 border-primary shadow-lg"
                          : "bg-muted/50 border-transparent"
                      }`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge variant="secondary" className="text-lg font-bold w-10 justify-center shrink-0 border-brand-brass/20">
                            {entry.initiative_roll}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold flex items-center gap-2 min-w-0">
                              {entry.combatant_name ? (
                                <span className="truncate">{entry.combatant_name}</span>
                              ) : (
                                <span className="truncate italic text-muted-foreground flex items-center gap-1">
                                  <HelpCircle className="w-3 h-3 shrink-0" />
                                  Unidentified
                                </span>
                              )}
                              <Badge variant={entry.combatant_type === 'character' ? 'default' : 'secondary'} className="text-xs shrink-0">
                                {entry.combatant_type === 'character' ? 'PC' : 'NPC'}
                              </Badge>
                              {entry.is_current_turn && (
                                <Badge variant="default" className="text-xs shrink-0">
                                  Current Turn
                                </Badge>
                              )}
                            </div>
                            {entry.combatant_stats && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 shrink-0">
                                  <Shield className="w-3 h-3" />
                                  AC {entry.combatant_stats.ac}
                                </span>
                                {hasHP && (
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Heart className="w-3 h-3 shrink-0" />
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                                      <div
                                        className={`h-full rounded-full transition-all ${getHPColor(hpCurrent!, hpMax!)}`}
                                        style={{ width: `${Math.min(100, (hpCurrent! / hpMax!) * 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] shrink-0">{hpCurrent}/{hpMax}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <div className="space-y-2 pr-2 sm:pr-4">
                {combatLog.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No combat actions yet
                  </div>
                ) : (
                  combatLog.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="text-sm border-b border-brand-brass/10 pb-2 animate-fade-in flex items-start gap-2"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      {getActionIcon(entry.action_type)}
                      <div className="min-w-0">
                        {entry.action_type === 'round_start' ? (
                          <Badge variant="outline" className="text-[10px] border-brand-brass/30 text-brand-brass font-cinzel">
                            Round {entry.round}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px] mr-1">R{entry.round}</span>
                        )}
                        {entry.action_type !== 'round_start' && (
                          <span className={getActionColor(entry.action_type)}>
                            {entry.message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conditions" className="mt-4">
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <TooltipProvider>
                <div className="space-y-2 pr-2 sm:pr-4">
                  {conditions.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No active conditions
                    </div>
                  ) : (
                    conditions.map((condition, index) => {
                      const tooltipInfo = CONDITION_TOOLTIPS[condition.condition];
                      return (
                        <Tooltip key={condition.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 cursor-help animate-fade-in"
                              style={{ animationDelay: `${index * 60}ms` }}
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                <span className="font-medium capitalize truncate">
                                  {condition.condition.replace(/_/g, ' ')}
                                </span>
                                {condition.ends_at_round && (
                                  <Badge variant="outline" className="ml-auto text-xs shrink-0 border-brand-brass/30">
                                    Until Round {condition.ends_at_round}
                                  </Badge>
                                )}
                              </div>
                              {tooltipInfo && (
                                <div className="mt-2 sm:hidden">
                                  <p className="text-xs text-muted-foreground">{tooltipInfo.description}</p>
                                  <ul className="mt-1 space-y-0.5">
                                    {tooltipInfo.effects.map((effect, i) => (
                                      <li key={i} className="text-xs text-destructive/80 flex items-start gap-1">
                                        <span className="shrink-0 mt-0.5">•</span>
                                        {effect}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {tooltipInfo && (
                            <TooltipContent side="left" className="max-w-xs hidden sm:block">
                              <p className="font-semibold mb-1">{tooltipInfo.name}</p>
                              <p className="text-xs text-muted-foreground mb-2">{tooltipInfo.description}</p>
                              <ul className="space-y-0.5">
                                {tooltipInfo.effects.map((effect, i) => (
                                  <li key={i} className="text-xs flex items-start gap-1">
                                    <span className="shrink-0 mt-0.5">•</span>
                                    {effect}
                                  </li>
                                ))}
                              </ul>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })
                  )}
                </div>
              </TooltipProvider>
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
