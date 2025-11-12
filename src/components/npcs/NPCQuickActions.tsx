import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Star, StickyNote, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddToSessionDialog from "./AddToSessionDialog";

interface NPCQuickActionsProps {
  npcId: string;
  npcName: string;
  campaignId: string;
  isPinned: boolean;
  gmNotes?: string;
  onUpdate: () => void;
}

const NPCQuickActions = ({
  npcId,
  npcName,
  campaignId,
  isPinned,
  gmNotes,
  onUpdate,
}: NPCQuickActionsProps) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [notes, setNotes] = useState(gmNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("npcs")
      .update({ is_pinned: !isPinned })
      .eq("id", npcId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: isPinned ? "Unpinned" : "Pinned",
        description: `${npcName} ${isPinned ? "removed from" : "added to"} pinned NPCs`,
      });
      onUpdate();
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("npcs")
      .update({ gm_notes: notes })
      .eq("id", npcId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notes saved",
        description: `GM notes updated for ${npcName}`,
      });
      setNotesOpen(false);
      onUpdate();
    }
    setIsSaving(false);
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleTogglePin}
        title={isPinned ? "Unpin" : "Pin"}
      >
        <Star className={`w-4 h-4 ${isPinned ? "fill-warning text-warning" : ""}`} />
      </Button>

      <Popover open={notesOpen} onOpenChange={setNotesOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Quick notes">
            <StickyNote className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">GM Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quick notes about this NPC..."
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} disabled={isSaving}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNotes(gmNotes || "");
                  setNotesOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          setSessionDialogOpen(true);
        }}
        title="Add to session"
      >
        <UserPlus className="w-4 h-4" />
      </Button>

      <AddToSessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        npcId={npcId}
        npcName={npcName}
        campaignId={campaignId}
      />
    </div>
  );
};

export default NPCQuickActions;
