import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Auth from "./components/Auth";
import Index from "./pages/Index";
import CampaignHub from "./pages/CampaignHub";
import SessionDM from "./pages/SessionDM";
import SessionPlayer from "./pages/SessionPlayer";
import SessionSpectator from "./pages/SessionSpectator";
import CombatMap from "./pages/CombatMap";
import WorldMap from "./pages/WorldMap";
import CampaignTimeline from "./pages/CampaignTimeline";
import Inventory from "./pages/Inventory";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/campaign-hub" element={<CampaignHub />} />
            <Route path="/session/dm" element={<SessionDM />} />
            <Route path="/session/player" element={<SessionPlayer />} />
            <Route path="/session/spectator" element={<SessionSpectator />} />
            <Route path="/map" element={<CombatMap />} />
            <Route path="/world-map" element={<WorldMap />} />
            <Route path="/timeline" element={<CampaignTimeline />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/notes" element={<Notes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
