import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  creation_status: 'draft' | 'complete';
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
  const [editCharacterId, setEditCharacterId] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Character | null>(null);

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
        .select(`
          id, 
          name, 
          class, 
          level, 
          campaign_id, 
          creation_status,
          campaign:campaigns(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCharacters((data || []).map(char => ({
        ...char,
        creation_status: (char.creation_status as 'draft' | 'complete') || 'complete'
      })));
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

  const handleSelectCharacter = async (character: Character) => {
    // Check if character creation is incomplete
    if (character.creation_status === 'draft') {
      toast({
        title: "Character Incomplete",
        description: "Please finish creating this character before joining a campaign",
        variant: "destructive",
      });
      return;
    }

    // Warn if character is already in another campaign
    if (character.campaign_id && character.campaign_id !== campaignId) {
      setReassignTarget(character);
      return;
    }

    // Skip if already in this campaign
    if (character.campaign_id === campaignId) {
      toast({
        title: "Already assigned",
        description: "This character is already in this campaign",
      });
      onComplete();
      return;
    }

    await assignCharacter(character);
  };

  const assignCharacter = async (character: Character) => {
    setAssigning(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update({ campaign_id: campaignId })
        .eq("id", character.id);

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

  const handleConfirmReassign = async () => {
    if (!reassignTarget) return;
    await assignCharacter(reassignTarget);
    setReassignTarget(null);
  };

  const handleCharacterCreated = async () => {
    setShowCreation(false);
    setEditCharacterId(null);
    await fetchCharacters();
  };

  const handleResumeCreation = (characterId: string) => {
    setEditCharacterId(characterId);
    setShowCreation(true);
  };

  if (showCreation) {
    return (
      <CharacterWizard
        open={true}
        campaignId={campaignId}
        onComplete={handleCharacterCreated}
        editCharacterId={editCharacterId}
      />
    );
  }

  return (
    <>
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
                {characters.map((character) => {
                  const isInThisCampaign = character.campaign_id === campaignId;
                  const isInOtherCampaign = character.campaign_id && character.campaign_id !== campaignId;
                  
                  return (
                    <Card 
                      key={character.id} 
                      className={`transition-colors ${
                        character.creation_status === 'draft' 
                          ? 'border-yellow-500/50' 
                          : isInThisCampaign
                          ? 'border-green-500/50 bg-green-500/5'
                          : isInOtherCampaign
                          ? 'border-orange-500/50'
                          : 'hover:border-primary cursor-pointer'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Sword className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold truncate">{character.name}</h4>
                                {character.creation_status === 'draft' && (
                                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                    Incomplete
                                  </Badge>
                                )}
                                {isInThisCampaign && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                    Current Campaign
                                  </Badge>
                                )}
                                {isInOtherCampaign && (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                    In: {(character as any).campaign?.name}
                                  </Badge>
                                )}
                                {!character.campaign_id && (
                                  <Badge variant="outline" className="text-xs">
                                    Available
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Level {character.level} {character.class}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {character.creation_status === 'draft' ? (
                            <Button
                              onClick={() => handleResumeCreation(character.id)}
                              variant="outline"
                              size="sm"
                            >
                              Continue
                            </Button>
                          ) : isInThisCampaign ? (
                            <Badge variant="secondary">Selected</Badge>
                          ) : (
                            <Button
                              onClick={() => handleSelectCharacter(character)}
                              disabled={assigning}
                              size="sm"
                              variant={isInOtherCampaign ? "outline" : "default"}
                            >
                              {assigning ? "Assigning..." : isInOtherCampaign ? "Reassign" : "Select"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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

      {/* Reassignment Confirmation */}
      <AlertDialog open={!!reassignTarget} onOpenChange={(open) => !open && setReassignTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Character?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{reassignTarget?.name}</strong> is currently assigned to another campaign. 
              Reassigning will remove them from that campaign and place them in this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReassign}>
              Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CharacterSelectionDialog;
