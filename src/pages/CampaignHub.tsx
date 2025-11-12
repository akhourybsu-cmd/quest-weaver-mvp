/**
 * CAMPAIGN MANAGER - ASSET INTEGRATION SUMMARY
 * 
 * This Campaign Manager route integrates existing components and assets across all tabs:
 * 
 * ASSET PLACEMENT:
 * ✓ Overview Tab: Uses lucide-react icons (Clock, Scroll, Users, TrendingUp, MapPin, Package)
 * ✓ Quests Tab: Custom QuestsTab component with Kanban/List views, Badge components, Progress bars
 * ✓ Sessions Tab: Calendar/Clock/MapPin icons, date formatting with date-fns
 * ✓ NPCs Tab: Integrates EnhancedNPCDirectory component from /components/npcs
 * ✓ Locations Tab: MapPin/Users/Flag icons, terrain-based color system
 * ✓ Factions Tab: Integrates FactionDirectory component from /components/factions  
 * ✓ Bestiary Tab: Flame/Heart/Shield icons, CR slider, type/environment filters
 * ✓ Item Vault Tab: Integrates DMItemVault component from /components/inventory
 * ✓ Timeline Tab: Calendar/Sword/Scroll/Users/Crown icons, vertical timeline with date-fns
 * ✓ Notes Tab: Integrates NotesBoard component from /components/notes
 * 
 * DESIGN SYSTEM:
 * - All cards use: rounded-2xl, shadow-xl, border-brass/20, bg-card/50
 * - Typography: Cinzel for headings (font-cinzel), Inter for UI (default)
 * - Colors: obsidian (bg), arcanePurple (accents), brass (borders), dragonRed (alerts), ink (text)
 * - Icons: lucide-react only, tinted with brass/arcanePurple/dragonRed per context
 * 
 * COMPONENT REUSE:
 * - shadcn/ui: Card, Button, Badge, Input, ScrollArea, Tabs, Slider, Select, Separator
 * - Existing features: EnhancedNPCDirectory, FactionDirectory, DMItemVault, NotesBoard
 * - Date handling: date-fns for consistent formatting
 * 
 * ADDING NEW ASSETS:
 * - Images: Place in /public or /src/assets, reference with import or public path
 * - Icons: Use lucide-react icons only for consistency
 * - Components: Create in /components/campaign/tabs or reuse existing
 * - Styling: Always use semantic tokens (--brass, --arcanePurple, etc.) from index.css
 * 
 * NO ORPHANED ASSETS: All existing campaign-related components are now integrated into tabs.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Shield,
  Users,
  MoreVertical,
  Settings,
  Copy,
  FileDown,
  Sword,
  Scroll,
  Calendar,
  MapPin,
  Crown,
  Package,
  Flame,
  BookOpen,
  Clock,
  FileText,
  Pause,
  Trash2,
} from "lucide-react";
import { CampaignManagerLayout } from "@/components/campaign/CampaignManagerLayout";
import { CommandPalette, useCommandPalette } from "@/components/campaign/CommandPalette";
import { NewCampaignDialog } from "@/components/campaign/NewCampaignDialog";
import { OverviewTab } from "@/components/campaign/tabs/OverviewTabUpdated";
import { QuestsTab } from "@/components/campaign/tabs/QuestsTabUpdated";
import { SessionTab } from "@/components/campaign/tabs/SessionTab";
import { SessionsTab } from "@/components/campaign/tabs/SessionsTab";
import { NPCsTab } from "@/components/campaign/tabs/NPCsTab";
import { LocationsTab } from "@/components/campaign/tabs/LocationsTab";
import { FactionsTab } from "@/components/campaign/tabs/FactionsTab";
import { BestiaryTab } from "@/components/campaign/tabs/BestiaryTab";
import { ItemVaultTab } from "@/components/campaign/tabs/ItemVaultTab";
import { NotesTab } from "@/components/campaign/tabs/NotesTab";
import { TimelineTab } from "@/components/campaign/tabs/TimelineTab";
import { InspectorPanel } from "@/components/campaign/InspectorPanel";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LiveSessionTab } from "@/components/campaign/tabs/LiveSessionTab";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteCampaignDialog } from "@/components/campaign/DeleteCampaignDialog";
import { SessionTimer } from "@/components/campaign/SessionTimer";
import { resilientChannel } from "@/lib/realtime";

interface Campaign {
  id: string;
  name: string;
  code: string;
  dm_user_id: string;
}

const CampaignHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const campaignIdParam = searchParams.get("campaign");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playerData, setPlayerData] = useState<{ count: number; players: any[] }>({ count: 0, players: [] });
  const [sessionCount, setSessionCount] = useState(0);

  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    initUser();
    fetchCampaigns();
    
    // Check for live session when active campaign changes
    if (activeCampaign) {
      fetchLiveSession();
    }
  }, [activeCampaign]);

  useEffect(() => {
    if (!activeCampaign) return;

    // Fetch initial player data and session count
    fetchPlayerData();
    fetchSessionCount();

    // Subscribe to real-time updates using resilient channel
    const channel = resilientChannel(supabase, `campaign:${activeCampaign.id}`);
    
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaigns',
        filter: `id=eq.${activeCampaign.id}`,
      }, () => {
        fetchLiveSession();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaign_sessions',
      }, () => {
        fetchLiveSession();
        fetchSessionCount();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `campaign_id=eq.${activeCampaign.id}`,
      }, () => {
        fetchPlayerData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCampaign]);

  const fetchPlayerData = async () => {
    if (!activeCampaign) return;

    try {
      const { data: characters, count } = await supabase
        .from("characters")
        .select("*, user_id", { count: "exact" })
        .eq("campaign_id", activeCampaign.id)
        .not("user_id", "is", null);

      setPlayerData({
        count: count || 0,
        players: characters || [],
      });
    } catch (error) {
      console.error("Failed to fetch player data:", error);
    }
  };

  const fetchSessionCount = async () => {
    if (!activeCampaign) return;

    try {
      const { count } = await supabase
        .from("campaign_sessions")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", activeCampaign.id);

      setSessionCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch session count:", error);
    }
  };

  const fetchLiveSession = async () => {
    if (!activeCampaign) return;

    const { data } = await supabase
      .from('campaigns')
      .select('live_session_id, campaign_sessions(*)')
      .eq('id', activeCampaign.id)
      .single();

    if (data?.live_session_id && data.campaign_sessions && ['live', 'paused'].includes(data.campaign_sessions.status)) {
      setLiveSession(data.campaign_sessions);
      if (activeTab !== 'session') {
        setActiveTab('session');
      }
    } else {
      setLiveSession(null);
    }
  };

  useEffect(() => {
    if (campaignIdParam && campaigns.length > 0) {
      const campaign = campaigns.find((c) => c.id === campaignIdParam);
      if (campaign) {
        setActiveCampaign(campaign);
      }
    } else if (campaigns.length > 0 && !activeCampaign) {
      setActiveCampaign(campaigns[0]);
    }
  }, [campaignIdParam, campaigns]);

  const fetchCampaigns = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("dm_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading campaigns",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign) {
      setActiveCampaign(campaign);
      navigate(`/campaign-hub?campaign=${id}`);
    }
  };

  const handleNewCampaign = () => {
    setShowNewCampaignDialog(true);
  };

  const handleStartSession = async () => {
    if (!activeCampaign) return;
    
    setLoading(true);
    try {
      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('campaign_sessions')
        .insert({
          campaign_id: activeCampaign.id,
          status: 'live',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (sessionError) throw sessionError;
      
      // Update campaign with live_session_id
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ live_session_id: session.id })
        .eq('id', activeCampaign.id);
      
      if (campaignError) throw campaignError;
      
      toast({
        title: 'Session started!',
        description: 'Players can now join',
      });
      
      // Switch to session tab
      setActiveTab('session');
      await fetchLiveSession();
    } catch (error: any) {
      toast({
        title: 'Failed to start session',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSession = async () => {
    if (!activeCampaign || !liveSession) return;

    try {
      await supabase
        .from('campaign_sessions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
        })
        .eq('id', liveSession.id);

      toast({
        title: 'Session paused',
        description: 'The session is now paused',
      });

      await fetchLiveSession();
    } catch (error: any) {
      toast({
        title: 'Error pausing session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResumeSession = async () => {
    if (!activeCampaign || !liveSession) return;

    try {
      // Calculate paused duration
      const pausedAt = liveSession.paused_at ? new Date(liveSession.paused_at).getTime() : Date.now();
      const now = Date.now();
      const additionalPausedSeconds = Math.floor((now - pausedAt) / 1000);
      const totalPausedSeconds = (liveSession.paused_duration_seconds || 0) + additionalPausedSeconds;

      await supabase
        .from('campaign_sessions')
        .update({
          status: 'live',
          paused_at: null,
          paused_duration_seconds: totalPausedSeconds,
        })
        .eq('id', liveSession.id);

      toast({
        title: 'Session resumed',
        description: 'The session is now live again',
      });

      await fetchLiveSession();
    } catch (error: any) {
      toast({
        title: 'Error resuming session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEndSession = async () => {
    if (!activeCampaign || !liveSession) return;

    try {
      // Calculate final paused duration if currently paused
      let finalPausedSeconds = liveSession.paused_duration_seconds || 0;
      if (liveSession.status === 'paused' && liveSession.paused_at) {
        const pausedAt = new Date(liveSession.paused_at).getTime();
        const now = Date.now();
        const additionalPausedSeconds = Math.floor((now - pausedAt) / 1000);
        finalPausedSeconds += additionalPausedSeconds;
      }

      // Update session status
      await supabase
        .from('campaign_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          paused_duration_seconds: finalPausedSeconds,
        })
        .eq('id', liveSession.id);

      // Clear campaign's live_session_id
      await supabase.from('campaigns').update({ live_session_id: null }).eq('id', activeCampaign.id);

      toast({
        title: 'Session ended',
        description: 'Players have been notified',
      });
      
      setLiveSession(null);
      setActiveTab('overview');
    } catch (error: any) {
      toast({
        title: 'Error ending session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleInvitePlayers = () => {
    if (activeCampaign) {
      navigator.clipboard.writeText(activeCampaign.code);
      toast({
        title: "Join code copied!",
        description: `Share ${activeCampaign.code} with your players`,
      });
    }
  };

  const handleQuestSelect = (quest: any) => {
    setSelectedEntity({ type: "quest", data: quest });
    setInspectorOpen(true);
  };

  const handleQuickAdd = (type: string) => {
    if (type === "quest") {
      setActiveTab("quests");
    }
  };

  const commandActions = [
    {
      id: "create-quest",
      label: "Create Quest",
      icon: <Scroll className="w-4 h-4" />,
      group: "Create",
      onSelect: () => console.log("Create quest"),
    },
    {
      id: "create-npc",
      label: "Create NPC",
      icon: <Users className="w-4 h-4" />,
      group: "Create",
      onSelect: () => console.log("Create NPC"),
    },
    {
      id: "create-location",
      label: "Create Location",
      icon: <MapPin className="w-4 h-4" />,
      group: "Create",
      onSelect: () => console.log("Create location"),
    },
    {
      id: "create-item",
      label: "Create Item",
      icon: <Package className="w-4 h-4" />,
      group: "Create",
      onSelect: () => console.log("Create item"),
    },
    {
      id: "nav-quests",
      label: "Go to Quests",
      icon: <Scroll className="w-4 h-4" />,
      group: "Navigate",
      onSelect: () => setActiveTab("quests"),
    },
    {
      id: "nav-overview",
      label: "Go to Overview",
      icon: <Shield className="w-4 h-4" />,
      group: "Navigate",
      onSelect: () => setActiveTab("overview"),
    },
  ];

  const formattedCampaigns = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    system: "5e",
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian text-ink">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-arcanePurple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-cinzel">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian text-ink p-4">
        <div className="text-center max-w-md space-y-4">
          <Sword className="w-16 h-16 text-arcanePurple mx-auto" />
          <h1 className="text-3xl font-cinzel font-bold">No Campaigns Yet</h1>
          <p className="text-brass">Create your first campaign to begin your adventure</p>
          <Button onClick={handleNewCampaign} size="lg" className="mt-4">
            Create Campaign
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CampaignManagerLayout
        campaigns={formattedCampaigns}
        activeCampaignId={activeCampaign?.id || null}
        onCampaignSelect={handleCampaignSelect}
        onNewCampaign={handleNewCampaign}
        onImport={() => console.log("Import")}
        onArchive={() => console.log("Archive")}
        inspectorOpen={inspectorOpen}
        onInspectorClose={() => setInspectorOpen(false)}
        inspectorContent={
          selectedEntity?.type === "quest" ? (
            <InspectorPanel
              title={selectedEntity.data.title}
              description={selectedEntity.data.arc}
              onClose={() => setInspectorOpen(false)}
              actions={
                <>
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </>
              }
            >
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Badge className="mt-1 capitalize">{selectedEntity.data.status}</Badge>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    defaultValue="A mysterious tome has gone missing from the Grand Library..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Objectives</Label>
                  <div className="space-y-2 mt-2">
                    {selectedEntity.data.objectives.map((obj: any) => (
                      <div key={obj.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={obj.complete} readOnly />
                        <span className={obj.complete ? "line-through text-muted-foreground" : ""}>
                          {obj.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>NPCs</Label>
                  <div className="mt-2 space-y-1">
                    {selectedEntity.data.npcs.map((npc: string) => (
                      <div key={npc} className="text-sm flex items-center gap-2">
                        <Users className="w-3 h-3 text-brass" />
                        {npc}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Rewards</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>{selectedEntity.data.rewards.xp} XP</div>
                    <div>{selectedEntity.data.rewards.gp} GP</div>
                    {selectedEntity.data.rewards.items.map((item: string) => (
                      <div key={item}>• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </InspectorPanel>
          ) : null
        }
      >
        {/* Header Bar */}
        <header className="sticky top-0 z-10 border-b border-brass/20 bg-obsidian/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-brass hover:text-ink">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-brass/50" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-ink">Campaign Manager</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-2">
              {liveSession && (
                <>
                  {liveSession.status === 'live' && (
                    <Badge variant="outline" className="border-red-500/50 text-red-500 animate-pulse">
                      🔴 Session Live
                    </Badge>
                  )}
                  {liveSession.status === 'paused' && (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                      ⏸️ Session Paused
                    </Badge>
                  )}
                  <SessionTimer
                    startedAt={liveSession.started_at}
                    pausedAt={liveSession.paused_at}
                    pausedDuration={liveSession.paused_duration_seconds}
                    status={liveSession.status}
                  />
                  {liveSession.status === 'live' && (
                    <Button onClick={handlePauseSession} variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {liveSession.status === 'paused' && (
                    <Button onClick={handleResumeSession} variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={handleEndSession} variant="destructive" size="sm">
                    End Session
                  </Button>
                </>
              )}
              {!liveSession && (
                <Button onClick={handleStartSession} size="sm" disabled={loading}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              )}
              <Button onClick={handleInvitePlayers} variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleInvitePlayers()}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Join Code
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-cinzel font-bold text-ink">{activeCampaign?.name}</h1>
            <Badge variant="outline" className="border-brass/30 text-brass">
              5e
            </Badge>
            <Badge variant="outline" className="border-brass/30 text-brass">
              Milestone
            </Badge>
            <Badge variant="outline" className="border-brass/30 text-brass">
              {sessionCount} Session{sessionCount !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="border-brass/30 text-brass">
              <Users className="w-3 h-3 mr-1" />
              {playerData.count} Player{playerData.count !== 1 ? 's' : ''}
            </Badge>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <Avatar className="w-7 h-7 border border-brass/30">
                <AvatarFallback className="text-xs bg-arcanePurple/20 text-ink">DM</AvatarFallback>
              </Avatar>
              {playerData.players.slice(0, 4).map((char, idx) => {
                const initials = char.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <Avatar key={char.id} className="w-7 h-7 border border-green-500/50">
                    <AvatarFallback className="text-xs bg-green-500/20 text-ink">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
              {playerData.count > 4 && (
                <Avatar className="w-7 h-7 border border-brass/30">
                  <AvatarFallback className="text-xs bg-brass/20 text-ink">
                    +{playerData.count - 4}
                  </AvatarFallback>
                </Avatar>
              )}
              {playerData.count === 0 && (
                <span className="text-sm text-muted-foreground ml-2">No players yet</span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-brass hover:text-ink"
              onClick={() => setPaletteOpen(true)}
            >
              <Sword className="w-4 h-4 mr-1" />
              Quick Command
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-brass/10 border border-brass/20 rounded">
                ⌘K
              </kbd>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-brass/20 px-6 bg-obsidian/50 sticky top-0 z-10">
              <TabsList className="bg-transparent border-0 h-auto p-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="quests"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Quests
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="npcs"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  NPCs
                </TabsTrigger>
                <TabsTrigger
                  value="locations"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Locations
                </TabsTrigger>
                <TabsTrigger
                  value="factions"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Factions
                </TabsTrigger>
                <TabsTrigger
                  value="bestiary"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Bestiary
                </TabsTrigger>
                <TabsTrigger
                  value="items"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Item Vault
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3"
                >
                  Notes
                </TabsTrigger>
                {liveSession && (
                  <TabsTrigger
                    value="session"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3 text-red-500 font-semibold"
                  >
                    🔴 Live Session
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 p-6">
              <TabsContent value="overview" className="mt-0 h-full">
                {activeCampaign ? (
                  <OverviewTab campaignId={activeCampaign.id} onQuickAdd={handleQuickAdd} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="quests" className="mt-0 h-full">
                {activeCampaign ? (
                  <QuestsTab campaignId={activeCampaign.id} onQuestSelect={handleQuestSelect} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="sessions" className="mt-0 h-full">
                {activeCampaign ? (
                  <SessionsTab campaignId={activeCampaign.id} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="npcs" className="mt-0 h-full">
                {activeCampaign ? (
                  <NPCsTab campaignId={activeCampaign.id} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="locations" className="mt-0 h-full">
                {activeCampaign ? (
                  <LocationsTab campaignId={activeCampaign.id} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="factions" className="mt-0 h-full">
                {activeCampaign ? (
                  <FactionsTab campaignId={activeCampaign.id} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="bestiary" className="mt-0 h-full">
                <BestiaryTab />
              </TabsContent>
              <TabsContent value="items" className="mt-0 h-full">
                {activeCampaign ? (
                  <ItemVaultTab campaignId={activeCampaign.id} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="timeline" className="mt-0 h-full">
                {activeCampaign ? (
                  <TimelineTab campaignId={activeCampaign.id} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="notes" className="mt-0 h-full">
                {activeCampaign && currentUserId ? (
                  <NotesTab campaignId={activeCampaign.id} userId={currentUserId} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </TabsContent>
              {liveSession && activeCampaign && currentUserId && (
                <TabsContent value="session" className="mt-0 h-full">
                  <LiveSessionTab
                    campaignId={activeCampaign.id}
                    sessionId={liveSession.id}
                    currentUserId={currentUserId}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </CampaignManagerLayout>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={commandActions} />
      
      <NewCampaignDialog 
        open={showNewCampaignDialog} 
        onOpenChange={setShowNewCampaignDialog}
        onSuccess={fetchCampaigns}
      />

      <DeleteCampaignDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        campaign={activeCampaign}
        onSuccess={() => {
          fetchCampaigns();
          setActiveCampaign(null);
          navigate('/campaign-hub');
        }}
      />
    </>
  );
};

export default CampaignHub;
