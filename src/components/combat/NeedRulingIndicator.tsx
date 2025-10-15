import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PlayerNeedingRuling {
  character_id: string;
  character_name: string;
  user_id: string;
}

interface NeedRulingIndicatorProps {
  campaignId: string;
}

export function NeedRulingIndicator({ campaignId }: NeedRulingIndicatorProps) {
  const [playersNeedingRuling, setPlayersNeedingRuling] = useState<PlayerNeedingRuling[]>([]);

  useEffect(() => {
    fetchPlayersNeedingRuling();

    const channel = supabase
      .channel(`ruling-requests-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_presence',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchPlayersNeedingRuling()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchPlayersNeedingRuling = async () => {
    const { data } = await supabase
      .from('player_presence')
      .select(`
        user_id,
        character_id,
        characters (
          name
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('needs_ruling', true);

    if (data) {
      setPlayersNeedingRuling(
        data.map((p) => ({
          character_id: p.character_id,
          character_name: (p.characters as any)?.name || 'Unknown',
          user_id: p.user_id,
        }))
      );
    }
  };

  const clearRulingRequest = async (characterId: string) => {
    await supabase
      .from('player_presence')
      .update({ needs_ruling: false })
      .eq('character_id', characterId)
      .eq('campaign_id', campaignId);
  };

  if (playersNeedingRuling.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="destructive" size="sm" className="relative">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Ruling Needed
          <Badge 
            variant="secondary" 
            className="ml-2 bg-white text-destructive h-5 w-5 p-0 flex items-center justify-center"
          >
            {playersNeedingRuling.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Players Needing Ruling</h4>
          <div className="space-y-2">
            {playersNeedingRuling.map((player) => (
              <div
                key={player.character_id}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <span className="font-medium text-sm">{player.character_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearRulingRequest(player.character_id)}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
