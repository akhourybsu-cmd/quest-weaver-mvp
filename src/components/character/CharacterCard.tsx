import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, User, Trash2, TrendingUp } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { LevelUpWizard } from "./LevelUpWizard";
import { CharacterExporter } from "./CharacterExporter";

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    class: string;
    level: number;
    max_hp: number;
    current_hp: number;
    ac: number;
    temp_hp?: number;
    creation_status?: 'draft' | 'complete';
    subclass_name?: string | null;
  };
  campaignId: string;
  onResumeCreation?: (characterId: string) => void;
}

const CharacterCard = ({ character, campaignId, onResumeCreation }: CharacterCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const isIncomplete = character.creation_status === 'draft';
  const hpPercent = (character.current_hp / character.max_hp) * 100;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", character.id);

      if (error) throw error;

      toast.success("Character deleted successfully");
      setShowDeleteDialog(false);
      // Refresh the page to update the character list
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting character:", error);
      toast.error("Failed to delete character: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${isIncomplete ? 'border-yellow-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg truncate">{character.name}</h3>
              {isIncomplete && (
                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                  Incomplete
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.class}
              {character.subclass_name && (
                <span className="text-primary"> • {character.subclass_name}</span>
              )}
            </p>
            {character.level >= 3 && !character.subclass_name && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500 mt-1">
                Subclass Available
              </Badge>
            )}
          </div>
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">HP</span>
                <span className="font-bold">{character.current_hp}/{character.max_hp}</span>
              </div>
              <Progress value={hpPercent} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">AC</div>
              <div className="text-lg font-bold">{character.ac}</div>
            </div>
          </div>
        </div>

        {character.temp_hp > 0 && (
          <div>
            <Badge variant="secondary">
              Temp HP: {character.temp_hp}
            </Badge>
          </div>
        )}

        <div className="flex gap-2">
          {isIncomplete ? (
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onResumeCreation?.(character.id);
              }}
            >
              Continue Creation
            </Button>
          ) : (
            <>
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/campaign/${campaignId}/character/${character.id}`);
                }}
              >
                View Sheet
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLevelUp(true);
                }}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <LevelUpWizard
        open={showLevelUp}
        onOpenChange={setShowLevelUp}
        characterId={character.id}
        currentLevel={character.level}
        onComplete={() => window.location.reload()}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {character.name} and remove them from all campaigns. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CharacterCard;
