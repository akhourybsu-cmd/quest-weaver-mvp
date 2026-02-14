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

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  Upload,
} from "lucide-react";
import { CampaignManagerLayout } from "@/components/campaign/CampaignManagerLayout";
import { CommandPalette, useCommandPalette } from "@/components/campaign/CommandPalette";
import { QuickCaptureModal } from "@/components/notes/QuickCaptureModal";
import { NewCampaignDialog } from "@/components/campaign/NewCampaignDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteCampaignDialog } from "@/components/campaign/DeleteCampaignDialog";
import { SessionTimer } from "@/components/campaign/SessionTimer";
import { SessionControl } from "@/components/campaign/SessionControl";
import { resilientChannel } from "@/lib/realtime";
import { DocumentImportDialog } from "@/components/campaign/DocumentImportDialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InspectorPanel } from "@/components/campaign/InspectorPanel";

// Lazy-loaded tab components for code splitting
const OverviewTab = lazy(() => import("@/components/campaign/tabs/OverviewTabUpdated").then(m => ({ default: m.OverviewTab })));
const QuestsTab = lazy(() => import("@/components/campaign/tabs/QuestsTabUpdated").then(m => ({ default: m.QuestsTab })));
const SessionTab = lazy(() => import("@/components/campaign/tabs/SessionTab").then(m => ({ default: m.SessionTab })));
const SessionsTab = lazy(() => import("@/components/campaign/tabs/SessionsTab").then(m => ({ default: m.SessionsTab })));
const NPCsTab = lazy(() => import("@/components/campaign/tabs/NPCsTab").then(m => ({ default: m.NPCsTab })));
const LocationsTab = lazy(() => import("@/components/campaign/tabs/LocationsTab").then(m => ({ default: m.LocationsTab })));
const FactionsTab = lazy(() => import("@/components/campaign/tabs/FactionsTab").then(m => ({ default: m.FactionsTab })));
const BestiaryTab = lazy(() => import("@/components/campaign/tabs/BestiaryTab").then(m => ({ default: m.BestiaryTab })));
const ItemVaultTab = lazy(() => import("@/components/campaign/tabs/ItemVaultTab").then(m => ({ default: m.ItemVaultTab })));
const EncountersTab = lazy(() => import("@/components/campaign/tabs/EncountersTab").then(m => ({ default: m.EncountersTab })));
const NotesTab = lazy(() => import("@/components/campaign/tabs/NotesTab").then(m => ({ default: m.NotesTab })));
const TimelineTab = lazy(() => import("@/components/campaign/tabs/TimelineTab").then(m => ({ default: m.TimelineTab })));
const LoreTab = lazy(() => import("@/components/campaign/tabs/LoreTab").then(m => ({ default: m.LoreTab })));
const LiveSessionTab = lazy(() => import("@/components/campaign/tabs/LiveSessionTab").then(m => ({ default: m.LiveSessionTab })));
const PartyTab = lazy(() => import("@/components/campaign/tabs/PartyTab").then(m => ({ default: m.PartyTab })));

const TabFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

interface Campaign {
  id: string;
  name: string;
  code: string;
  dm_user_id: string;
  live_session_id: string | null;
  banner_url: string | null;
}

const CampaignHub = () => {
  // Safeguard: This component should NEVER be used for demo routes
  if (window.location.pathname.includes('/demo/')) {
    throw new Error('CampaignHub should never be used for demo routes');
  }

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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBannerUpload, setShowBannerUpload] = useState(false);
  const [playerData, setPlayerData] = useState<{ count: number; players: any[] }>({ count: 0, players: [] });
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0);
  // Track which tabs have been visited for deferred rendering
  const visitedTabsRef = useRef<Set<string>>(new Set(["overview"]));

  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();

  // Track visited tabs to enable deferred rendering
  const handleTabChange = useCallback((tab: string) => {
    visitedTabsRef.current.add(tab);
    setActiveTab(tab);
  }, []);

  // Check if a tab should render (visited at least once)
  const shouldRenderTab = useCallback((tab: string) => {
    return activeTab === tab || visitedTabsRef.current.has(tab);
  }, [activeTab]);

  // Initial user + campaigns fetch (runs once)
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initUser();
    fetchCampaigns();
  }, []);

  // Live session check when campaign changes
  useEffect(() => {
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
        fetchCampaigns(); // Update sidebar live indicators
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_sessions',
        filter: `campaign_id=eq.${activeCampaign.id}`,
      }, () => {
        fetchLiveSession();
        fetchSessionCount();
        setSessionRefreshTrigger(prev => prev + 1);
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
        .eq("campaign_id", activeCampaign.id)
        .eq("status", "ended");

      setSessionCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch session count:", error);
    }
  };

  const fetchLiveSession = async () => {
    if (!activeCampaign) return;

    // First get the campaign to check live_session_id
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('live_session_id')
      .eq('id', activeCampaign.id)
      .single();

    if (!campaign?.live_session_id) {
      setLiveSession(null);
      return;
    }

    // Then fetch the specific session by ID
    const { data: session } = await supabase
      .from('campaign_sessions')
      .select('*')
      .eq('id', campaign.live_session_id)
      .single();

    if (session && ['live', 'paused'].includes(session.status)) {
      setLiveSession(session);
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
      handleTabChange('session');
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
      handleTabChange('overview');
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

  const handleBannerUpload = async (url: string) => {
    if (!activeCampaign) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ banner_url: url })
        .eq('id', activeCampaign.id);
      
      if (error) throw error;
      
      // Update local state
      setActiveCampaign({ ...activeCampaign, banner_url: url });
      setCampaigns(campaigns.map(c => 
        c.id === activeCampaign.id ? { ...c, banner_url: url } : c
      ));
      
      toast({
        title: "Banner updated!",
        description: "Your campaign banner has been set",
      });
      setShowBannerUpload(false);
    } catch (error: any) {
      toast({
        title: "Failed to update banner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Removed handleQuestSelect - quests now use QuestDetailDialog directly

  const handleQuickAdd = (type: string) => {
    if (type === "quest") {
      handleTabChange("quests");
      // Signal the Quests tab to open the creation dialog once it is active.
      window.dispatchEvent(new CustomEvent("qw:create-quest"));
    }
  };

  const commandActions = useMemo(() => [
    {
      id: "create-quest",
      label: "Create Quest",
      icon: <Scroll className="w-4 h-4" />,
      group: "Create",
      onSelect: () => {
        handleTabChange("quests");
        toast({
          title: "Opening Quests",
          description: "Navigate to the Quests tab to create a new quest",
        });
      },
    },
    {
      id: "create-npc",
      label: "Create NPC",
      icon: <Users className="w-4 h-4" />,
      group: "Create",
      onSelect: () => {
        handleTabChange("npcs");
        toast({
          title: "Opening NPCs",
          description: "Navigate to the NPCs tab to create a new NPC",
        });
      },
    },
    {
      id: "create-location",
      label: "Create Location",
      icon: <MapPin className="w-4 h-4" />,
      group: "Create",
      onSelect: () => {
        handleTabChange("locations");
        toast({
          title: "Opening Locations",
          description: "Navigate to the Locations tab to create a new location",
        });
      },
    },
    {
      id: "create-item",
      label: "Create Item",
      icon: <Package className="w-4 h-4" />,
      group: "Create",
      onSelect: () => {
        handleTabChange("items");
        toast({
          title: "Opening Item Vault",
          description: "Navigate to the Item Vault tab to create a new item",
        });
      },
    },
    {
      id: "nav-quests",
      label: "Go to Quests",
      icon: <Scroll className="w-4 h-4" />,
      group: "Navigate",
      onSelect: () => handleTabChange("quests"),
    },
    {
      id: "nav-overview",
      label: "Go to Overview",
      icon: <Shield className="w-4 h-4" />,
      group: "Navigate",
      onSelect: () => handleTabChange("overview"),
    },
  ], [handleTabChange, toast]);

  const formattedCampaigns = useMemo(() => (campaigns || []).map((c) => ({
    id: c.id,
    name: c.name,
    system: "5e",
    isLive: activeCampaign?.id === c.id && liveSession !== null && ['live', 'paused'].includes(liveSession?.status),
  })), [campaigns, activeCampaign?.id, liveSession]);

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
      <>
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
        <NewCampaignDialog 
          open={showNewCampaignDialog} 
          onOpenChange={setShowNewCampaignDialog}
          onSuccess={fetchCampaigns}
        />
      </>
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
        inspectorContent={null}
      >
        {/* Header Bar with optional banner image */}
        <header className="sticky top-0 z-20 border-b border-brass/20 bg-obsidian px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.4)] relative overflow-hidden">
        {/* Background banner image with fade effect */}
          {activeCampaign?.banner_url && (
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute right-0 top-0 bottom-0 w-1/2 opacity-60"
                style={{ 
                  backgroundImage: `url(${activeCampaign.banner_url})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-obsidian from-40% via-obsidian/80 via-70% to-transparent" />
            </div>
          )}
          <div className="flex items-center justify-between mb-1 relative z-10">
          {/* Breadcrumb - subtle inline */}
            <span className="hidden sm:inline text-xs text-brass/60">
              <a href="/" className="hover:text-brass transition-colors">Home</a>
              <span className="mx-1.5">›</span>
              <span className="text-brass/80">Campaign Manager</span>
            </span>

            <div className="flex items-center gap-2 sm:gap-3 bg-obsidian/70 backdrop-blur-sm rounded-lg px-2 py-1">
              {activeCampaign && <SessionControl campaignId={activeCampaign.id} />}
              <Button
                variant="ghost"
                size="sm"
                className="text-brass hover:text-ink h-8 px-2 sm:px-3"
                onClick={() => setPaletteOpen(true)}
              >
                <Sword className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Quick Command</span>
                <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 text-xs bg-brass/10 border border-brass/20 rounded">
                  ⌘K
                </kbd>
              </Button>
              <Button onClick={handleInvitePlayers} variant="outline" size="sm" className="hidden sm:flex">
                <Users className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <Button onClick={handleInvitePlayers} variant="outline" size="icon" className="sm:hidden h-8 w-8">
                <Users className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleInvitePlayers()}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Join Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBannerUpload(true)}>
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Set Banner Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Content (AI)
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

          {/* Campaign name and badges - responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 relative z-10">
            <h1 className="text-base sm:text-xl font-cinzel font-bold text-ink truncate">{activeCampaign?.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-brass/30 text-brass text-xs">
                5e
              </Badge>
              <Badge variant="outline" className="border-brass/30 text-brass text-xs hidden sm:inline-flex">
                Milestone
              </Badge>
              <Badge variant="outline" className="border-brass/30 text-brass text-xs">
                {sessionCount} Sess.
              </Badge>
              <Badge variant="outline" className="border-brass/30 text-brass text-xs">
                <Users className="w-3 h-3 mr-1" />
                {playerData.count}
              </Badge>
            </div>
            <div className="flex-1 hidden sm:block" />
            {/* Player avatars - horizontal scroll on mobile */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border border-brass/30 shrink-0">
                <AvatarFallback className="text-xs bg-arcanePurple/20 text-ink">DM</AvatarFallback>
              </Avatar>
              {(playerData?.players || []).slice(0, 4).map((char, idx) => {
                const initials = char.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <Avatar key={char.id} className="w-6 h-6 sm:w-7 sm:h-7 border border-green-500/50 shrink-0">
                    <AvatarFallback className="text-xs bg-green-500/20 text-ink">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
              {playerData.count > 4 && (
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border border-brass/30 shrink-0">
                  <AvatarFallback className="text-xs bg-brass/20 text-ink">
                    +{playerData.count - 4}
                  </AvatarFallback>
                </Avatar>
              )}
              {playerData.count === 0 && (
                <span className="text-xs sm:text-sm text-muted-foreground ml-2 whitespace-nowrap">No players yet</span>
              )}
            </div>
          </div>

        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            {/* Desktop: Scrollable tab bar with gradient hints */}
            <div className="border-b border-brass/20 px-3 sm:px-4 md:px-6 bg-obsidian sticky top-0 z-20 hidden md:block shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              <div className="relative">
                {/* Left fade */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
                {/* Right fade */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="bg-transparent border-0 h-auto p-0 inline-flex min-w-max gap-0">
                    {/* Core */}
                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="quests" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Quests
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Sessions
                    </TabsTrigger>
                    <TabsTrigger value="party" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Party
                    </TabsTrigger>
                    {/* Divider */}
                    <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                    {/* World */}
                    <TabsTrigger value="npcs" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      NPCs
                    </TabsTrigger>
                    <TabsTrigger value="locations" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Locations
                    </TabsTrigger>
                    <TabsTrigger value="lore" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Lore
                    </TabsTrigger>
                    <TabsTrigger value="factions" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Factions
                    </TabsTrigger>
                    {/* Divider */}
                    <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                    {/* Combat */}
                    <TabsTrigger value="bestiary" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Bestiary
                    </TabsTrigger>
                    <TabsTrigger value="encounters" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Encounters
                    </TabsTrigger>
                    {/* Divider */}
                    <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                    {/* Assets */}
                    <TabsTrigger value="items" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Item Vault
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">
                      Notes
                    </TabsTrigger>
                    {liveSession && (
                      <TabsTrigger
                        value="session"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple rounded-none px-4 py-3 whitespace-nowrap text-red-500 font-semibold"
                      >
                        🔴 Live Session
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
              </div>
            </div>

            {/* Mobile: Grouped dropdown navigation */}
            <div className="border-b border-brass/20 px-3 py-2 bg-obsidian sticky top-0 z-20 md:hidden shadow-sm">
              <Select value={activeTab} onValueChange={handleTabChange}>
                <SelectTrigger className="bg-card/50 border-brass/30 font-cinzel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">📋 Overview</SelectItem>
                  <SelectItem value="quests">📜 Quests</SelectItem>
                  <SelectItem value="sessions">📅 Sessions</SelectItem>
                  <SelectItem value="party">👥 Party</SelectItem>
                  <SelectItem value="npcs">👥 NPCs</SelectItem>
                  <SelectItem value="locations">📍 Locations</SelectItem>
                  <SelectItem value="lore">📖 Lore</SelectItem>
                  <SelectItem value="factions">🏰 Factions</SelectItem>
                  <SelectItem value="bestiary">🔥 Bestiary</SelectItem>
                  <SelectItem value="encounters">⚔️ Encounters</SelectItem>
                  <SelectItem value="items">📦 Item Vault</SelectItem>
                  <SelectItem value="timeline">⏳ Timeline</SelectItem>
                  <SelectItem value="notes">📝 Notes</SelectItem>
                  {liveSession && (
                    <SelectItem value="session">🔴 Live Session</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 p-3 sm:p-4 md:p-6">
              <TabsContent value="overview" className="mt-0 h-full">
                <Suspense fallback={<TabFallback />}>
                  {activeCampaign ? (
                    <OverviewTab 
                      campaignId={activeCampaign.id} 
                      campaignCode={activeCampaign.code}
                      onQuickAdd={handleQuickAdd}
                      onReviewSessionPack={() => handleTabChange("sessions")}
                      onNavigateTab={(tab) => handleTabChange(tab)}
                      refreshTrigger={sessionRefreshTrigger}
                    />
                  ) : <TabFallback />}
                </Suspense>
              </TabsContent>
              {shouldRenderTab("quests") && (
                <TabsContent value="quests" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <QuestsTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("sessions") && (
                <TabsContent value="sessions" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <SessionsTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("party") && (
                <TabsContent value="party" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <PartyTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("npcs") && (
                <TabsContent value="npcs" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <NPCsTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("locations") && (
                <TabsContent value="locations" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <LocationsTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("lore") && (
                <TabsContent value="lore" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <LoreTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("factions") && (
                <TabsContent value="factions" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <FactionsTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("bestiary") && (
                <TabsContent value="bestiary" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    <BestiaryTab campaignId={activeCampaign?.id} />
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("encounters") && (
                <TabsContent value="encounters" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? (
                      <EncountersTab 
                        campaignId={activeCampaign.id}
                        liveSessionId={liveSession?.id}
                        onLaunchEncounter={(encounterId) => {
                          if (!liveSession) {
                            handleStartSession().then(() => {
                              handleTabChange("session");
                            });
                          } else {
                            handleTabChange("session");
                          }
                        }}
                      />
                    ) : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("items") && (
                <TabsContent value="items" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <ItemVaultTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("timeline") && (
                <TabsContent value="timeline" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign ? <TimelineTab campaignId={activeCampaign.id} /> : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {shouldRenderTab("notes") && (
                <TabsContent value="notes" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    {activeCampaign && currentUserId ? (
                      <NotesTab campaignId={activeCampaign.id} userId={currentUserId} />
                    ) : <TabFallback />}
                  </Suspense>
                </TabsContent>
              )}
              {liveSession && activeCampaign && currentUserId && shouldRenderTab("session") && (
                <TabsContent value="session" className="mt-0 h-full">
                  <Suspense fallback={<TabFallback />}>
                    <LiveSessionTab
                      campaignId={activeCampaign.id}
                      sessionId={liveSession.id}
                      currentUserId={currentUserId}
                    />
                  </Suspense>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </CampaignManagerLayout>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={commandActions} />
      
      {activeCampaign && currentUserId && (
        <QuickCaptureModal 
          campaignId={activeCampaign.id}
          userId={currentUserId}
          isDM={true}
        />
      )}

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

      {activeCampaign && (
        <DocumentImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          campaignId={activeCampaign.id}
        />
      )}

      {/* Banner Image Upload Dialog */}
      {activeCampaign && showBannerUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-brass/30 rounded-lg p-6 max-w-md w-full mx-4 fantasy-border-brass">
            <h3 className="font-cinzel text-lg font-bold mb-4">Set Campaign Banner</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image to display in the campaign header. The image will fade in from the right.
            </p>
            <ImageUpload
              currentImageUrl={activeCampaign.banner_url}
              onImageUploaded={(url) => {
                if (url) {
                  handleBannerUpload(url);
                }
              }}
              bucket="maps"
              path={`${activeCampaign.id}/banners`}
              aspectRatio="landscape"
              label="Banner Image"
            />
            <div className="flex justify-end gap-2 mt-4">
              {activeCampaign.banner_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await supabase
                      .from('campaigns')
                      .update({ banner_url: null })
                      .eq('id', activeCampaign.id);
                    setActiveCampaign({ ...activeCampaign, banner_url: null });
                    setCampaigns(campaigns.map(c => 
                      c.id === activeCampaign.id ? { ...c, banner_url: null } : c
                    ));
                    setShowBannerUpload(false);
                    toast({ title: "Banner removed" });
                  }}
                  className="text-destructive"
                >
                  Remove Banner
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowBannerUpload(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignHub;
