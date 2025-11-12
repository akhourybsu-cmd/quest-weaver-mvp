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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

interface AddToSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  npcId: string;
  npcName: string;
  campaignId: string;
}

interface Session {
  id: string;
  session_number: number;
  created_at?: string;
}

const AddToSessionDialog = ({
  open,
  onOpenChange,
  npcId,
  npcName,
  campaignId,
}: AddToSessionDialogProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSessions();
      loadExistingAssignments();
    }
  }, [open, campaignId, npcId]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("campaign_sessions")
      .select("id, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (data) {
      // Add session numbers based on sorted order
      const sessionsWithNumbers = data.map((session, index) => ({
        id: session.id,
        created_at: session.created_at,
        session_number: data.length - index,
      }));
      setSessions(sessionsWithNumbers);
    } else {
      setSessions([]);
    }
  };

  const loadExistingAssignments = async () => {
    const { data } = await supabase
      .from("session_npcs")
      .select("session_id")
      .eq("npc_id", npcId);

    setExistingAssignments(new Set((data || []).map((a) => a.session_id)));
    setSelectedSessions(new Set((data || []).map((a) => a.session_id)));
  };

  const handleToggleSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const handleSave = async () => {
    setLoading(true);

    // Find sessions to add and remove
    const toAdd = Array.from(selectedSessions).filter((s) => !existingAssignments.has(s));
    const toRemove = Array.from(existingAssignments).filter((s) => !selectedSessions.has(s));

    try {
      // Add new assignments
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase.from("session_npcs").insert(
          toAdd.map((sessionId) => ({
            session_id: sessionId,
            npc_id: npcId,
          }))
        );
        if (insertError) throw insertError;
      }

      // Remove deselected assignments
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("session_npcs")
          .delete()
          .eq("npc_id", npcId)
          .in("session_id", toRemove);
        if (deleteError) throw deleteError;
      }

      toast({
        title: "Sessions updated",
        description: `${npcName} has been ${toAdd.length > 0 ? "added to" : "updated in"} selected sessions`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {npcName} to Sessions</DialogTitle>
          <DialogDescription>
            Select which sessions this NPC should be associated with
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sessions found
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={session.id}
                    checked={selectedSessions.has(session.id)}
                    onCheckedChange={() => handleToggleSession(session.id)}
                  />
                  <label
                    htmlFor={session.id}
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Session {session.session_number}</span>
                    {session.created_at && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            Save
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToSessionDialog;
