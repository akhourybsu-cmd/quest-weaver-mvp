import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PlayerNotes from "@/pages/PlayerNotes";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { useAppVersion } from "@/hooks/useAppVersion";
import Auth from "./components/Auth";
import Index from "./pages/Index";
import CampaignHub from "./pages/CampaignHub";
import DemoCampaignHub from "./pages/DemoCampaignHub";
import SessionDM from "./pages/SessionDM";
import SessionPlayer from "./pages/SessionPlayer";
import SessionSpectator from "./pages/SessionSpectator";
import CombatMap from "./pages/CombatMap";
import WorldMap from "./pages/WorldMap";
import CharacterSheetPage from "./pages/CharacterSheetPage";
import CharacterList from "./pages/CharacterList";
import CampaignTimeline from "./pages/CampaignTimeline";
import Inventory from "./pages/Inventory";
import Notes from "./pages/Notes";
import Lore from "./pages/Lore";
import NotFound from "./pages/NotFound";
import { PlayerHome } from "./components/permissions/PlayerHome";
import AuditHarness from "./pages/dev/AuditHarness";
import PlayerHub from "@/pages/PlayerHub";
import PlayerDashboardNew from "@/pages/PlayerDashboardNew";
import { PlayerWaitingRoom } from "@/components/player/PlayerWaitingRoom";
import PlayerCampaignView from "@/pages/PlayerCampaignView";
import PlayerSettings from "@/pages/PlayerSettings";
import PlayerCharactersPage from "@/pages/PlayerCharactersPage";
import PlayerCharacterViewPage from "@/pages/PlayerCharacterViewPage";
import Community from "./pages/Community";
import Changelog from "./pages/Changelog";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auto-refresh when new version is deployed
  useAppVersion();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TenantProvider>
            <CampaignProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index session={session} />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/player" element={<Navigate to="/player-hub" replace />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/:categoryId" element={<Community />} />
                <Route path="/community/topic/:topicId" element={<Community />} />
                <Route path="/changelog" element={<Changelog />} />
                
                {/* Protected routes */}
                {loading ? (
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-lg">Loading...</div>
                    </div>
                  } />
                ) : !session ? (
                  <Route path="*" element={<Auth />} />
                ) : (
                  <>
                    <Route path="/campaign-hub" element={<CampaignHub />} />
                    <Route path="/campaigns/:campaignId" element={<CampaignHub />} />
                    <Route path="/campaigns/:campaignId/dm/:sessionId?" element={<SessionDM />} />
                    <Route path="/demo/:demoId/campaign" element={<DemoCampaignHub />} />
                    <Route path="/demo/:demoId/dm/:sessionId?" element={<SessionDM />} />
                    <Route path="/session/dm" element={<SessionDM />} />
                    <Route path="/session/player" element={<SessionPlayer />} />
                    <Route path="/session/spectator" element={<SessionSpectator />} />
                    <Route path="/player/waiting" element={<PlayerWaitingRoom />} />
                    <Route path="/player-home" element={<PlayerHome />} />
                    <Route path="/map" element={<CombatMap />} />
                    <Route path="/world-map" element={<WorldMap />} />
                    <Route path="/timeline" element={<CampaignTimeline />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/lore" element={<Lore />} />
                    <Route path="/campaign/:campaignId/characters" element={<CharacterList />} />
                    <Route path="/characters/:characterId" element={<CharacterSheetPage />} />
                    <Route path="/player/:playerId" element={<PlayerDashboardNew />} />
                    <Route path="/player/:playerId/settings" element={<PlayerSettings />} />
                    <Route path="/player/:playerId/characters" element={<PlayerCharactersPage />} />
                    <Route path="/player/:playerId/characters/:characterId" element={<PlayerCharacterViewPage />} />
                    <Route path="/player/:playerId/notes" element={<PlayerNotes />} />
                    <Route path="/player/campaign/:campaignCode" element={<PlayerCampaignView />} />
                    <Route path="/audit" element={<AuditHarness />} />
                    <Route path="/player-hub" element={<PlayerHub />} />
                    <Route path="*" element={<NotFound />} />
                  </>
                )}
              </Routes>
            </CampaignProvider>
          </TenantProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
