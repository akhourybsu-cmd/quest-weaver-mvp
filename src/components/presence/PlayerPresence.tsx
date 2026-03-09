import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Users, Hand } from "lucide-react";

interface Player {
  id: string;
  userId: string;
  isOnline: boolean;
  needsRuling: boolean;
}

interface PlayerPresenceProps {
  campaignId: string;
  currentUserId: string;
  isDM: boolean;
  characterId?: string;
}

const PlayerPresence = ({ campaignId, currentUserId, isDM, characterId }: PlayerPresenceProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [needsRuling, setNeedsRuling] = useState(false);

  useEffect(() => {
    const loadPresence = async () => {
      const { data } = await supabase
        .from("player_presence")
        .select("*")
        .eq("campaign_id", campaignId);

      if (data) {
        setPlayers(
          data.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            isOnline: p.is_online,
            needsRuling: p.needs_ruling,
          }))
        );

        const myPresence = data.find((p: any) => p.user_id === currentUserId);
        if (myPresence) {
          setNeedsRuling(myPresence.needs_ruling);
        }
      }
    };

    loadPresence();

    const channel = supabase
      .channel(`presence:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_presence",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadPresence()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, currentUserId]);

  const toggleRaiseHand = async () => {
    try {
      const newRulingState = !needsRuling;
      
      await supabase
        .from("player_presence")
        .upsert({
          campaign_id: campaignId,
          user_id: currentUserId,
          character_id: characterId || null,
          needs_ruling: newRulingState,
          is_online: false, // Not necessarily online, just raising hand
        }, { 
          onConflict: 'campaign_id,user_id',
          ignoreDuplicates: false
        });

      toast({
        title: newRulingState ? "Hand Raised" : "Hand Lowered",
        description: newRulingState ? "DM will be notified" : "Request cancelled"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ruling request",
        variant: "destructive"
      });
    }
  };

  const onlinePlayers = players.filter((p) => p.isOnline);
  const playersNeedingRulings = players.filter((p) => p.needsRuling);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Player Presence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {onlinePlayers.length} online
          </Badge>
          {playersNeedingRulings.length > 0 && isDM && (
            <Badge variant="destructive" className="text-xs">
              {playersNeedingRulings.length} need ruling
            </Badge>
          )}
        </div>

        {!isDM && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    variant={needsRuling ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleRaiseHand}
                    disabled={!characterId}
                    className="w-full"
                  >
                    <Hand className="w-4 h-4 mr-2" />
                    {needsRuling ? "Lower Hand" : "Raise Hand (Need Ruling)"}
                  </Button>
                </span>
              </TooltipTrigger>
              {!characterId && (
                <TooltipContent>
                  <p>Assign a character to this campaign first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerPresence;
