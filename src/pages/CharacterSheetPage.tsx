import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/back-button";
import CharacterSheet from "@/components/character/CharacterSheet";
import { useToast } from "@/hooks/use-toast";

const CharacterSheetPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [resolvedCampaignId, setResolvedCampaignId] = useState<string | null>(null);

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
      setHasAccess(true);
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
      <header className="border-b p-3 sm:p-4">
        <BackButton
          fallback={resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : "/campaign-hub"}
          label="Back to Campaign"
        />
      </header>

      <main className="flex-1 overflow-hidden">
        <CharacterSheet
          characterId={characterId!}
          campaignId={resolvedCampaignId!}
        />
      </main>
    </div>
  );
};

export default CharacterSheetPage;
