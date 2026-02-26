import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/hooks/usePlayer";
import { PlayerPageLayout } from "@/components/player/PlayerPageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerQuestTracker } from "@/components/player/PlayerQuestTracker";
import { PlayerNPCDirectory } from "@/components/player/PlayerNPCDirectory";
import { PlayerLocationsView } from "@/components/player/PlayerLocationsView";
import { PlayerFactionsView } from "@/components/player/PlayerFactionsView";
import { PlayerLoreView } from "@/components/player/PlayerLoreView";
import { PlayerTimelineView } from "@/components/player/PlayerTimelineView";
import { PlayerNotesView } from "@/components/player/PlayerNotesView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Swords, Loader2, User } from "lucide-react";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";
import { SessionKioskContainer } from "@/components/session/SessionKioskContainer";
import { PlayerJournal } from "@/components/player/PlayerJournal";

export default function PlayerCampaignView() {
  const { campaignCode } = useParams();
  const navigate = useNavigate();
  const { player, loading: playerLoading } = usePlayer();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'live' | 'paused' | 'offline'>('offline');
  const [character, setCharacter] = useState<any>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [kioskOpen, setKioskOpen] = useState(false);

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
        .select('id, name, class, level, portrait_url, subclass_id, srd_subclasses(name)')
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
      setKioskOpen(true);
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
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
        {/* Row 1: Back · Campaign Name · Status · Join */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/player/${player.id}`)}
            className="shrink-0 h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <h1 className="text-xl md:text-2xl font-cinzel font-bold text-foreground truncate flex-1 min-w-0">
            {campaign.name}
          </h1>

          <span className="font-mono text-xs text-muted-foreground hidden sm:inline shrink-0">
            {campaignCode}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge()}
            {sessionStatus !== 'offline' && (
              <Button size="sm" onClick={handleJoinSession}>
                <Swords className="w-3.5 h-3.5 mr-1.5" />
                Join Session
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Character strip */}
        <div className="flex items-center gap-3 mt-2 pb-2.5 border-b border-border/50">
          {character ? (
            <>
              <Avatar className="w-10 h-10 border-2 border-brass/40 shrink-0 rounded-full overflow-hidden">
                <AvatarImage src={character.portrait_url} className="object-cover object-top" />
                <AvatarFallback className="bg-brass/10 text-brass font-cinzel text-sm">
                  {character.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-sm leading-tight truncate">{character.name}</span>
                <span className="text-muted-foreground text-xs leading-tight">
                  Lv{character.level} {character.class}
                  {(character as any).srd_subclasses?.name && (
                    <span className="text-brass ml-1">· {(character as any).srd_subclasses.name}</span>
                  )}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 shrink-0 text-muted-foreground"
                onClick={() => setShowCharacterSelect(true)}
              >
                Change
              </Button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground text-xs flex-1">No character assigned</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 shrink-0"
                onClick={() => setShowCharacterSelect(true)}
              >
                + Select
              </Button>
            </>
          )}
        </div>

        <Tabs defaultValue="quests" className="mt-3">
          <TabsList className="w-full flex overflow-x-auto justify-start gap-1">
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="npcs">NPCs</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="factions">Factions</TabsTrigger>
            <TabsTrigger value="lore">Lore</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
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
          <TabsContent value="factions" className="mt-4">
            <PlayerFactionsView campaignId={campaign.id} />
          </TabsContent>
          <TabsContent value="lore" className="mt-4">
            <PlayerLoreView campaignId={campaign.id} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <PlayerTimelineView campaignId={campaign.id} />
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

      {campaign && (
        <SessionKioskContainer
          campaignId={campaign.id}
          campaignCode={campaignCode || ''}
          sessionStatus={sessionStatus}
          requestOpen={kioskOpen}
          onRequestOpenHandled={() => setKioskOpen(false)}
          onSessionEnded={() => {
            setSessionStatus('offline');
          }}
        />
      )}
    </PlayerPageLayout>
  );
}
