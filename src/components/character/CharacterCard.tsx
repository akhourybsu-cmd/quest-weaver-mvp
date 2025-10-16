import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, User, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface CharacterCardProps {
  character: any;
  campaignId: string;
}

const CharacterCard = ({ character, campaignId }: CharacterCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/campaign/${campaignId}/character/${character.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{character.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.class}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-8 w-8 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Character
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

        <Button 
          className="w-full" 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/campaign/${campaignId}/character/${character.id}`);
          }}
        >
          View Character Sheet
        </Button>
      </CardContent>

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
