import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/hooks/usePlayer";
import { PlayerPageLayout } from "@/components/player/PlayerPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
import { ArrowLeft, Swords, Loader2, User, ScrollText, Users, MapPin, Flag, BookOpen, Clock, NotebookPen, BookMarked } from "lucide-react";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";
import { SessionKioskContainer } from "@/components/session/SessionKioskContainer";
import { PlayerJournal } from "@/components/player/PlayerJournal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MobileTabPicker } from "@/components/ui/MobileTabPicker";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PlayerCampaignView() {
  const { campaignCode } = useParams();
  const navigate = useNavigate();
  const { player, loading: playerLoading } = usePlayer();
  const { userId } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'live' | 'paused' | 'offline'>('offline');
  const [character, setCharacter] = useState<any>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [kioskOpen, setKioskOpen] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quests");
  const isMobile = useIsMobile();

  const tabOptions = [
    { value: "quests", label: "Quests", icon: ScrollText },
    { value: "npcs", label: "NPCs", icon: Users },
    { value: "locations", label: "Locations", icon: MapPin },
    { value: "factions", label: "Factions", icon: Flag },
    { value: "lore", label: "Lore", icon: BookOpen },
    { value: "timeline", label: "Timeline", icon: Clock },
    { value: "notes", label: "Notes", icon: NotebookPen },
    { value: "journal", label: "Journal", icon: BookMarked },
  ];

  useEffect(() => {
    if (!campaignCode) return;
    loadCampaign();
    if (userId) loadCharacter();
  }, [campaignCode, userId]);

  // Real-time session status listener
  useEffect(() => {
    if (!campaign?.id) return;

    const channel = supabase
      .channel(`pcv-session:${campaign.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'campaigns',
        filter: `id=eq.${campaign.id}`,
      }, async (payload: any) => {
        const newLiveId = payload.new.live_session_id;
        if (newLiveId) {
          const { data: sess } = await supabase
            .from('campaign_sessions').select('status')
            .eq('id', newLiveId).maybeSingle();
          const s = sess?.status;
          if (s === 'live' || s === 'paused') {
            setSessionStatus(s);
            toast({ title: "🔴 Session is Live!", description: "The DM has started a session." });
          }
        } else {
          setSessionStatus('offline');
          toast({ title: "Session Ended", description: "The session has concluded." });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [campaign?.id]);

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
      if (!userId) return;

      const { data: rpcRows } = await supabase
        .rpc('find_campaign_by_code', { p_code: campaignCode });
      const campaignData = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      if (!campaignData) return;

      const { data, error } = await supabase
        .from('characters')
        .select('id, name, class, level, portrait_url, subclass_id, srd_subclasses(name)')
        .eq('campaign_id', campaignData.id)
        .eq('user_id', userId)
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
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/player/${player.id}/characters/${character.id}`)}
                title="View character sheet"
              >
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

        {/* Tab bar */}
        {isMobile ? (
          <div className="sticky z-30 bg-background/95 backdrop-blur py-2 mt-3" style={{ top: "calc(var(--demo-bar-offset, 0px) + 3.25rem)" }}>
            <MobileTabPicker value={activeTab} onValueChange={setActiveTab} options={tabOptions} />
          </div>
        ) : (
          <div className="relative flex items-center gap-0.5 overflow-x-auto scrollbar-hide mt-3 border-b border-brass/20">
            {tabOptions.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setActiveTab(t.value)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-cinzel tracking-wide whitespace-nowrap shrink-0 transition-colors",
                    active ? "text-brass" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {active && (
                    <motion.div
                      layoutId="campaignTabIndicator"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-brass shadow-[0_0_8px_hsl(var(--brass)/0.5)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Animated tab content */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "quests" && <PlayerQuestTracker campaignId={campaign.id} />}
              {activeTab === "npcs" && <PlayerNPCDirectory campaignId={campaign.id} />}
              {activeTab === "locations" && <PlayerLocationsView campaignId={campaign.id} />}
              {activeTab === "factions" && <PlayerFactionsView campaignId={campaign.id} />}
              {activeTab === "lore" && <PlayerLoreView campaignId={campaign.id} />}
              {activeTab === "timeline" && <PlayerTimelineView campaignId={campaign.id} />}
              {activeTab === "notes" && player && <PlayerNotesView playerId={player.id} campaignId={campaign.id} />}
              {activeTab === "journal" && (
                character?.id ? (
                  <PlayerJournal campaignId={campaign.id} characterId={character.id} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="font-cinzel text-lg mb-1">No Character Assigned</p>
                    <p className="text-sm">Assign a character to this campaign to start journaling.</p>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
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
