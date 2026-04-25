import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/back-button";
import CharacterSheet from "@/components/character/CharacterSheet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { LevelUpWizard } from "@/components/character/LevelUpWizard";

const CharacterSheetPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [resolvedCampaignId, setResolvedCampaignId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [characterLevel, setCharacterLevel] = useState<number>(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAccess();
  }, [characterId]);

  const checkAccess = async () => {
    if (!characterId) {
      navigate("/");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      // Check if user owns this character or is DM of the campaign
      const { data: character, error } = await supabase
        .from("characters")
        .select(`
          id,
          user_id,
          campaign_id,
          campaigns!inner(dm_user_id)
        `)
        .eq("id", characterId)
        .single();

      if (error) throw error;

      const isOwner = character.user_id === user.id;
      const isDM = (character as any).campaigns?.dm_user_id === user.id;

      if (!isOwner && !isDM) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this character.",
          variant: "destructive",
        });
        navigate("/campaign-hub");
        return;
      }

      setResolvedCampaignId(character.campaign_id);
      setIsOwner(isOwner);
      setHasAccess(true);

      // Fetch level for the wizard
      const { data: full } = await supabase
        .from("characters")
        .select("level")
        .eq("id", characterId)
        .maybeSingle();
      if (full?.level) setCharacterLevel(full.level);
    } catch (error) {
      console.error("Error checking access:", error);
      toast({
        title: "Error",
        description: "Failed to load character",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading character...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <BackButton
            fallback={resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : "/campaign-hub"}
            label="Back"
          />
          {isOwner && characterLevel < 20 && (
            <Button
              onClick={() => setShowLevelUp(true)}
              className="ml-auto h-11 min-w-[44px] gap-2 bg-gradient-to-r from-brass to-brass/80 text-background hover:from-brass/90 hover:to-brass/70 font-cinzel font-semibold shadow-md"
              aria-label="Level Up Character"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Level Up</span>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <CharacterSheet
          key={refreshKey}
          characterId={characterId!}
          campaignId={resolvedCampaignId!}
        />
      </main>

      {isOwner && (
        <LevelUpWizard
          key={`wizard-${characterLevel}`}
          open={showLevelUp}
          onOpenChange={setShowLevelUp}
          characterId={characterId!}
          currentLevel={characterLevel}
          onComplete={() => {
            setShowLevelUp(false);
            setCharacterLevel((l) => l + 1);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};

export default CharacterSheetPage;
