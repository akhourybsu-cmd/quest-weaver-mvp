import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Swords, User, Skull } from "lucide-react";

interface InitiativeEntry {
  id: string;
  combatant_id: string;
  combatant_name: string;
  combatant_type: 'character' | 'monster';
  initiative_roll: number;
  is_current_turn: boolean;
  combatant_stats?: {
    current_hp?: number;
    max_hp?: number;
  };
}

interface PlayerInitiativeDisplayProps {
  encounterId: string;
  characterId: string;
}

export function PlayerInitiativeDisplay({ encounterId, characterId }: PlayerInitiativeDisplayProps) {
  const [initiative, setInitiative] = useState<InitiativeEntry[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  useEffect(() => {
    fetchInitiative();
    fetchRound();

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
        () => fetchRound()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(initiativeChannel);
      supabase.removeChannel(encounterChannel);
    };
  }, [encounterId]);

  const fetchInitiative = async () => {
    const { data: initData } = await supabase
      .from("initiative")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("initiative_roll", { ascending: false })
      .order("dex_modifier", { ascending: false })
      .order("passive_perception", { ascending: false });

    if (!initData) return;

    // Fetch full character and monster data
    const enriched = await Promise.all(
      initData.map(async (entry) => {
        let stats = null;
        let name = "Unknown";

        if (entry.combatant_type === "character") {
          const { data: char } = await supabase
            .from("characters")
            .select("name, current_hp, max_hp")
            .eq("id", entry.combatant_id)
            .single();
          
          if (char) {
            name = char.name;
            stats = { current_hp: char.current_hp, max_hp: char.max_hp };
          }
        } else if (entry.combatant_type === "monster") {
          const { data: monster } = await supabase
            .from("encounter_monsters")
            .select("display_name, hp_current, hp_max, is_visible_to_players")
            .eq("id", entry.combatant_id)
            .single();

          // Only show monsters that are visible to players
          if (monster && monster.is_visible_to_players) {
            name = monster.display_name;
            stats = { current_hp: monster.hp_current, max_hp: monster.hp_max };
          } else if (!monster?.is_visible_to_players) {
            // Hide this entry from players
            return null;
          }
        }

        return {
          id: entry.id,
          combatant_id: entry.combatant_id,
          combatant_name: name,
          combatant_type: entry.combatant_type as 'character' | 'monster',
          initiative_roll: entry.initiative_roll,
          is_current_turn: entry.is_current_turn,
          combatant_stats: stats,
        } as InitiativeEntry;
      })
    );

    setInitiative(enriched.filter((e): e is InitiativeEntry => e !== null));
  };

  const fetchRound = async () => {
    const { data } = await supabase
      .from("encounters")
      .select("current_round")
      .eq("id", encounterId)
      .single();

    if (data) setCurrentRound(data.current_round);
  };

  const isMyTurn = initiative.find(
    (entry) => entry.combatant_id === characterId && entry.is_current_turn
  );

  if (initiative.length === 0) {
    return null;
  }

  return (
    <Card className={isMyTurn ? "border-primary shadow-lg" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Initiative Order
          </CardTitle>
          <Badge variant="secondary">Round {currentRound}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {initiative.map((entry) => {
          const isMe = entry.combatant_id === characterId;
          const isCurrent = entry.is_current_turn;
          
          return (
            <div
              key={entry.id}
              className={`rounded-lg p-3 border-2 transition-all ${
                isCurrent
                  ? "bg-primary/10 border-primary shadow-md"
                  : "bg-muted/30 border-transparent"
              } ${isMe ? "ring-2 ring-accent/50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-lg font-bold w-10 justify-center shrink-0">
                  {entry.initiative_roll}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-2">
                    {entry.combatant_type === 'character' ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Skull className="w-4 h-4 text-destructive" />
                    )}
                    <span className="truncate">{entry.combatant_name}</span>
                    {isMe && <Badge variant="outline" className="ml-auto">You</Badge>}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-primary mt-1 font-medium">
                      ▶ Current Turn
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
