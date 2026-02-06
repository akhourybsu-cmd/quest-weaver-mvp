import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/hooks/usePlayer";
import { PlayerPageLayout } from "@/components/player/PlayerPageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerQuestTracker } from "@/components/player/PlayerQuestTracker";
import { PlayerNPCDirectory } from "@/components/player/PlayerNPCDirectory";
import { PlayerLocationsView } from "@/components/player/PlayerLocationsView";
import { PlayerNotesView } from "@/components/player/PlayerNotesView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Swords, Loader2, User, Shield } from "lucide-react";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";

export default function PlayerCampaignView() {
  const { campaignCode } = useParams();
  const navigate = useNavigate();
  const { player, loading: playerLoading } = usePlayer();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'live' | 'paused' | 'offline'>('offline');
  const [character, setCharacter] = useState<any>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  useEffect(() => {
    if (!campaignCode) return;
    loadCampaign();
    loadCharacter();
  }, [campaignCode]);

  const loadCampaign = async () => {
    const { data } = await supabase
      .from("campaigns")
      .select(`*, campaign_sessions!campaigns_live_session_id_fkey(status)`)
      .eq("code", campaignCode)
      .single();

    setCampaign(data);

    if (data?.live_session_id && data.campaign_sessions) {
      const status = data.campaign_sessions.status;
      setSessionStatus(status === 'live' || status === 'paused' ? status : 'offline');
    } else {
      setSessionStatus('offline');
    }

    setLoading(false);
  };

  const loadCharacter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: campaignData } = await supabase
        .from('campaigns').select('id').eq('code', campaignCode).single();
      if (!campaignData) return;

      const { data, error } = await supabase
        .from('characters')
        .select('id, name, class, level, portrait_url')
        .eq('campaign_id', campaignData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCharacter(data);
    } catch (error) {
      console.error('Error loading character:', error);
    }
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

  if (!player) return <Navigate to="/" replace />;
  if (!campaign) return <div className="p-8 text-center">Campaign not found</div>;

  const getStatusBadge = () => {
    if (sessionStatus === 'live') return <Badge className="bg-green-500 hover:bg-green-600">🔴 Live</Badge>;
    if (sessionStatus === 'paused') return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏸️ Paused</Badge>;
    return <Badge variant="outline">Offline</Badge>;
  };

  return (
    <PlayerPageLayout playerId={player.id} mobileTitle={campaign.name}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/player/${player.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-cinzel font-bold text-foreground">
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

        <Card className="mb-6 rounded-2xl shadow-xl border-brass/30">
          <CardHeader>
            <CardTitle className="font-cinzel text-xl">Your Character</CardTitle>
          </CardHeader>
          <CardContent>
            {character ? (
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-brass/30">
                  <AvatarImage src={character.portrait_url} />
                  <AvatarFallback className="bg-brass/10 text-brass font-cinzel text-xl">
                    {character.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{character.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Level {character.level} {character.class}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowCharacterSelect(true)}>
                  Change Character
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  You haven't assigned a character to this campaign yet
                </p>
                <Button onClick={() => setShowCharacterSelect(true)}>
                  <User className="w-4 h-4 mr-2" />
                  Select Character
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
            {player && <PlayerNotesView playerId={player.id} campaignId={campaign.id} />}
          </TabsContent>
        </Tabs>
      </div>

      {campaign && (
        <CharacterSelectionDialog
          open={showCharacterSelect}
          campaignId={campaign.id}
          onComplete={() => {
            setShowCharacterSelect(false);
            loadCharacter();
          }}
          onCancel={() => setShowCharacterSelect(false)}
        />
      )}
    </PlayerPageLayout>
  );
}
