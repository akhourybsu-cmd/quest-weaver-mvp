import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SessionKiosk } from "@/components/session/SessionKiosk";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const SessionPlayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignCode = searchParams.get("campaign");
  const { toast } = useToast();

  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);

  useEffect(() => {
    if (!campaignCode) {
      navigate(`/player/dashboard`);
      return;
    }
    fetchCharacter();
  }, [campaignCode, navigate]);

  const fetchCharacter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, live_session_id")
      .eq("code", campaignCode)
      .maybeSingle();

    if (!campaign) {
      toast({ title: "Campaign not found", variant: "destructive" });
      navigate(`/player/campaign/${campaignCode}`);
      return;
    }

    setCampaignId(campaign.id);

    if (!campaign.live_session_id) {
      navigate(`/player/campaign/${campaignCode}`);
      return;
    }

    // Validate session is live
    const { data: session } = await supabase
      .from('campaign_sessions').select('status')
      .eq('id', campaign.live_session_id).maybeSingle();

    if (!session || !['live', 'paused'].includes(session.status)) {
      navigate(`/player/campaign/${campaignCode}`);
      return;
    }

    const { data } = await supabase
      .from("characters").select("*")
      .eq("campaign_id", campaign.id)
      .eq("user_id", user.id).maybeSingle();

    if (!data) {
      setShowCharacterSelection(true);
      setLoading(false);
      return;
    }

    setCharacter(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!character || !campaignId || !currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">No character found</p>
          <Button onClick={() => navigate(`/player/campaign/${campaignCode}`)}>Back to Campaign</Button>
          {showCharacterSelection && campaignId && (
            <CharacterSelectionDialog
              open={showCharacterSelection}
              campaignId={campaignId}
              onComplete={() => { setShowCharacterSelection(false); fetchCharacter(); }}
              onCancel={() => navigate(`/player/campaign/${campaignCode}`)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b-2 border-brand-brass/20 sticky top-0 z-40 px-3 py-2 flex items-center gap-2">
        <Button
          variant="ghost" size="sm"
          className="hover:text-brand-brass transition-colors"
          onClick={() => navigate(`/player/campaign/${campaignCode}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Exit
        </Button>
        <span className="text-sm text-brand-brass/70 font-cinzel">Full Session View</span>
      </header>
      <div className="flex-1">
        <SessionKiosk
          campaignId={campaignId}
          campaignCode={campaignCode || ''}
          currentUserId={currentUserId}
          character={character}
          onSessionEnded={() => navigate(`/player/campaign/${campaignCode}`)}
          onCharacterUpdate={fetchCharacter}
        />
      </div>
    </div>
  );
};

export default SessionPlayer;
