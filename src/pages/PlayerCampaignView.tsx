import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/hooks/usePlayer";
import { PlayerNavigation } from "@/components/player/PlayerNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerQuestTracker } from "@/components/player/PlayerQuestTracker";
import { PlayerNPCDirectory } from "@/components/player/PlayerNPCDirectory";
import { PlayerLocationsView } from "@/components/player/PlayerLocationsView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Swords, Loader2 } from "lucide-react";

export default function PlayerCampaignView() {
  const { campaignCode } = useParams();
  const navigate = useNavigate();
  const { player, loading: playerLoading } = usePlayer();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'live' | 'paused' | 'offline'>('offline');

  useEffect(() => {
    if (!campaignCode) return;
    loadCampaign();
  }, [campaignCode]);

  const loadCampaign = async () => {
    const { data } = await supabase
      .from("campaigns")
      .select(`
        *,
        campaign_sessions!campaigns_live_session_id_fkey(status)
      `)
      .eq("code", campaignCode)
      .single();

    setCampaign(data);
    
    // Check session status
    if (data?.live_session_id && data.campaign_sessions) {
      const status = data.campaign_sessions.status;
      if (status === 'live' || status === 'paused') {
        setSessionStatus(status);
      } else {
        setSessionStatus('offline');
      }
    } else {
      setSessionStatus('offline');
    }
    
    setLoading(false);
  };

  const handleJoinSession = () => {
    if (sessionStatus === 'live' || sessionStatus === 'paused') {
      navigate(`/session/player?campaign=${campaignCode}`);
    } else {
      navigate(`/player/waiting?campaign=${campaignCode}`);
    }
  };

  if (playerLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!player) {
    return <Navigate to="/" replace />;
  }

  if (!campaign) {
    return <div className="p-8 text-center">Campaign not found</div>;
  }

  const getStatusBadge = () => {
    if (sessionStatus === 'live') {
      return <Badge className="bg-green-500 hover:bg-green-600">🔴 Live</Badge>;
    } else if (sessionStatus === 'paused') {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏸️ Paused</Badge>;
    }
    return <Badge variant="outline">Offline</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex">
      <PlayerNavigation playerId={player.id} />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/player/${player.id}`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-cinzel font-bold text-foreground">
                  {campaign.name}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Campaign Code: <span className="font-mono font-semibold">{campaignCode}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                {sessionStatus !== 'offline' && (
                  <Button onClick={handleJoinSession}>
                    <Swords className="w-4 h-4 mr-2" />
                    Join Session
                  </Button>
                )}
              </div>
            </div>
          </div>
      
      <Tabs defaultValue="quests">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="mt-4">
          <PlayerQuestTracker campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="npcs" className="mt-4">
          <PlayerNPCDirectory campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <PlayerLocationsView campaignId={campaign.id} />
        </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">Campaign notes view coming soon</div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}