import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import CharacterCard from "@/components/character/CharacterCard";
import CharacterWizard from "@/components/character/CharacterWizard";

const CharacterList = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editCharacterId, setEditCharacterId] = useState<string | null>(null);
  const [isPlayer, setIsPlayer] = useState(false);

  useEffect(() => {
    loadCharacters();
    checkRole();
  }, [campaignId]);

  const checkRole = async () => {
    if (!campaignId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("dm_user_id")
      .eq("id", campaignId)
      .single();

    setIsPlayer(campaign?.dm_user_id !== user.id);
  };

  const loadCharacters = async () => {
    if (!campaignId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      // Load user's characters for this campaign
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error("Error loading characters:", error);
      toast({
        title: "Error",
        description: "Failed to load characters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading characters...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/campaign/${campaignId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Button>

          <Button onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Character
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Characters</h1>
          <p className="text-muted-foreground">
            Create and manage your characters for this campaign
          </p>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You don't have any characters yet
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                campaignId={campaignId!}
                onResumeCreation={(id) => {
                  setEditCharacterId(id);
                  setShowWizard(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <CharacterWizard
        open={showWizard}
        campaignId={campaignId || null}
        editCharacterId={editCharacterId}
        onComplete={() => {
          setShowWizard(false);
          setEditCharacterId(null);
          loadCharacters();
        }}
      />
    </div>
  );
};

export default CharacterList;
