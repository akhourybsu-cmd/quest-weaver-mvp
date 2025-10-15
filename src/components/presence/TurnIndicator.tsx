import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Dices } from "lucide-react";

interface TurnIndicatorProps {
  encounterId: string;
  campaignId: string;
}

interface TurnInfo {
  characterName: string | null;
  monsterName: string | null;
  isPlayer: boolean;
  awaitingSaves: Array<{
    characterName: string;
    saveType: string;
  }>;
}

export const TurnIndicator = ({ encounterId, campaignId }: TurnIndicatorProps) => {
  const [turnInfo, setTurnInfo] = useState<TurnInfo>({
    characterName: null,
    monsterName: null,
    isPlayer: false,
    awaitingSaves: [],
  });

  useEffect(() => {
    fetchTurnInfo();

    const initiativeChannel = supabase
      .channel(`turn-indicator:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchTurnInfo()
      )
      .subscribe();

    const savesChannel = supabase
      .channel(`save-prompts:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'save_prompts',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchTurnInfo()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(initiativeChannel);
      supabase.removeChannel(savesChannel);
    };
  }, [encounterId]);

  const fetchTurnInfo = async () => {
    // Get current turn
    const { data: currentInit } = await supabase
      .from("initiative")
      .select(`
        combatant_id,
        combatant_type,
        characters:combatant_id(name),
        encounter_monsters:combatant_id(display_name)
      `)
      .eq("encounter_id", encounterId)
      .eq("is_current_turn", true)
      .maybeSingle();

    // Get active save prompts
    const { data: savePrompts } = await supabase
      .from("save_prompts")
      .select("target_character_ids, ability, description")
      .eq("encounter_id", encounterId)
      .eq("status", "active");

    const awaitingSaves: Array<{ characterName: string; saveType: string }> = [];

    if (savePrompts) {
      for (const prompt of savePrompts) {
        if (prompt.target_character_ids) {
          const { data: chars } = await supabase
            .from("characters")
            .select("name")
            .in("id", prompt.target_character_ids);

          chars?.forEach((char) => {
            awaitingSaves.push({
              characterName: char.name,
              saveType: prompt.ability.toUpperCase(),
            });
          });
        }
      }
    }

    setTurnInfo({
      characterName: currentInit?.combatant_type === 'character' ? (currentInit as any).characters?.name : null,
      monsterName: currentInit?.combatant_type === 'monster' ? (currentInit as any).encounter_monsters?.display_name : null,
      isPlayer: currentInit?.combatant_type === 'character',
      awaitingSaves,
    });
  };

  if (!turnInfo.characterName && !turnInfo.monsterName && turnInfo.awaitingSaves.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Current Turn */}
          {(turnInfo.characterName || turnInfo.monsterName) && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Current Turn:</span>
              <Badge variant={turnInfo.isPlayer ? "default" : "secondary"}>
                {turnInfo.isPlayer && <User className="w-3 h-3 mr-1" />}
                {turnInfo.characterName || turnInfo.monsterName}
              </Badge>
            </div>
          )}

          {/* Awaiting Saves */}
          {turnInfo.awaitingSaves.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Dices className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Awaiting Saves:</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-6">
                {turnInfo.awaitingSaves.map((save, idx) => (
                  <Badge key={idx} variant="outline" className="border-orange-500/50 text-orange-600 dark:text-orange-400">
                    {save.characterName} ({save.saveType})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
