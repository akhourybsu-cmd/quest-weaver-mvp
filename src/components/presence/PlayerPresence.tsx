import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

const PlayerPresence = ({ campaignId, currentUserId, isDM }: PlayerPresenceProps) => {
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
    const { data: myPresence } = await supabase
      .from("player_presence")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("user_id", currentUserId)
      .single();

    if (myPresence) {
      await supabase
        .from("player_presence")
        .update({ needs_ruling: !needsRuling })
        .eq("id", myPresence.id);
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
          <Button
            variant={needsRuling ? "destructive" : "outline"}
            size="sm"
            onClick={toggleRaiseHand}
            className="w-full"
          >
            <Hand className="w-4 h-4 mr-2" />
            {needsRuling ? "Lower Hand" : "Raise Hand (Need Ruling)"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerPresence;
