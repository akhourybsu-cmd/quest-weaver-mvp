import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { useAppVersion } from "@/hooks/useAppVersion";
import Auth from "./components/Auth";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const CampaignHub = lazy(() => import("./pages/CampaignHub"));
const DemoCampaignHub = lazy(() => import("./pages/DemoCampaignHub"));
const SessionDM = lazy(() => import("./pages/SessionDM"));
const SessionPlayer = lazy(() => import("./pages/SessionPlayer"));
const SessionSpectator = lazy(() => import("./pages/SessionSpectator"));
const CombatMap = lazy(() => import("./pages/CombatMap"));
const WorldMap = lazy(() => import("./pages/WorldMap"));
const CharacterSheetPage = lazy(() => import("./pages/CharacterSheetPage"));
const CharacterList = lazy(() => import("./pages/CharacterList"));
const CampaignTimeline = lazy(() => import("./pages/CampaignTimeline"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Notes = lazy(() => import("./pages/Notes"));
const Lore = lazy(() => import("./pages/Lore"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuditHarness = lazy(() => import("./pages/dev/AuditHarness"));
const AdminTools = lazy(() => import("./pages/dev/AdminTools"));
const BetaTools = lazy(() => import("./pages/BetaTools"));
const BetaToolsLibrary = lazy(() => import("./pages/BetaToolsLibrary"));
const BetaToolsGenerator = lazy(() => import("./pages/BetaToolsGenerator"));
const PlayerHub = lazy(() => import("@/pages/PlayerHub"));
const PlayerDashboardNew = lazy(() => import("@/pages/PlayerDashboardNew"));
const PlayerWaitingRoom = lazy(() => import("@/components/player/PlayerWaitingRoom").then(m => ({ default: m.PlayerWaitingRoom })));
const PlayerCampaignView = lazy(() => import("@/pages/PlayerCampaignView"));
const PlayerSettings = lazy(() => import("@/pages/PlayerSettings"));
const PlayerCharactersPage = lazy(() => import("@/pages/PlayerCharactersPage"));
const PlayerCharacterViewPage = lazy(() => import("@/pages/PlayerCharacterViewPage"));
const PlayerNotes = lazy(() => import("@/pages/PlayerNotes"));
const Community = lazy(() => import("./pages/Community"));
const Changelog = lazy(() => import("./pages/Changelog"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-lg">Loading...</div>
  </div>
);

function AppRoutes() {
  const { session, loading } = useAuth();

  // Auto-refresh when new version is deployed
  useAppVersion();

  return (
    <CampaignProvider>
      <Suspense fallback={<PageLoader />}>
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
            <Route path="*" element={<PageLoader />} />
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
              <Route path="/admin" element={<AdminTools />} />
              <Route path="/player-hub" element={<PlayerHub />} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </Suspense>
    </CampaignProvider>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
