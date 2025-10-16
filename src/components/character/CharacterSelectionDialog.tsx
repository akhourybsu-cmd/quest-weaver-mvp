import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sword, Plus, Shield } from "lucide-react";
import CharacterWizard from "./CharacterWizard";

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  campaign_id: string | null;
}

interface CharacterSelectionDialogProps {
  open: boolean;
  campaignId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const CharacterSelectionDialog = ({
  open,
  campaignId,
  onComplete,
  onCancel,
}: CharacterSelectionDialogProps) => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showCreation, setShowCreation] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCharacters();
    }
  }, [open]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("characters")
        .select("id, name, class, level, campaign_id")
        .eq("user_id", user.id)
        .is("campaign_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading characters",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = async (characterId: string) => {
    setAssigning(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update({ campaign_id: campaignId })
        .eq("id", characterId);

      if (error) throw error;

      toast({
        title: "Character assigned!",
        description: "You can now join the campaign session",
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCharacterCreated = async () => {
    setShowCreation(false);
    await fetchCharacters();
  };

  if (showCreation) {
    return (
      <CharacterWizard
        open={true}
        campaignId={null}
        onComplete={handleCharacterCreated}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Character</DialogTitle>
          <DialogDescription>
            Select an existing character or create a new one for this campaign
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading your characters...
          </div>
        ) : characters.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              {characters.map((character) => (
                <Card key={character.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sword className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{character.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Level {character.level} {character.class}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSelectCharacter(character.id)}
                        disabled={assigning}
                        size="sm"
                      >
                        {assigning ? "Assigning..." : "Select"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowCreation(true)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Character
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Sword className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground mb-4">
                You don't have any characters yet
              </p>
              <Button
                onClick={() => setShowCreation(true)}
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Character
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CharacterSelectionDialog;
