import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  started_at: string | null;
  status: string;
}

interface AddItemToSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  itemType: "quest" | "encounter" | "npc" | "handout" | "location" | "item" | "note";
  itemId: string;
  itemName: string;
}

const tableMap = {
  quest: "session_quests",
  encounter: "session_encounters",
  npc: "session_npcs",
  handout: "session_handouts",
  location: "session_locations",
  item: "session_items",
  note: "session_pack_notes",
};

const idMap = {
  quest: "quest_id",
  encounter: "encounter_id",
  npc: "npc_id",
  handout: "handout_id",
  location: "location_id",
  item: "item_id",
  note: "note_id",
};

export function AddItemToSessionDialog({
  open,
  onOpenChange,
  campaignId,
  itemType,
  itemId,
  itemName,
}: AddItemToSessionDialogProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSessions();
      loadExistingAssignments();
    }
  }, [open, campaignId, itemId]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("campaign_sessions")
      .select("id, started_at, status")
      .eq("campaign_id", campaignId)
      .order("started_at", { ascending: false });

    if (data) setSessions(data);
  };

  const loadExistingAssignments = async () => {
    const table = tableMap[itemType];
    const idField = idMap[itemType];

    const { data } = await (supabase as any)
      .from(table)
      .select("session_id")
      .eq(idField, itemId);

    if (data) {
      setExistingAssignments(new Set(data.map((d: any) => d.session_id)));
      setSelectedSessions(new Set(data.map((d: any) => d.session_id)));
    }
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

    try {
      const table = tableMap[itemType];
      const idField = idMap[itemType];

      // Determine which sessions to add and which to remove
      const toAdd = Array.from(selectedSessions).filter((id) => !existingAssignments.has(id));
      const toRemove = Array.from(existingAssignments).filter((id) => !selectedSessions.has(id));

      // Remove deselected sessions
      if (toRemove.length > 0) {
        const { error: deleteError } = await (supabase as any)
          .from(table)
          .delete()
          .eq(idField, itemId)
          .in("session_id", toRemove);

        if (deleteError) throw deleteError;
      }

      // Add newly selected sessions
      if (toAdd.length > 0) {
        const inserts = toAdd.map((sessionId) => ({
          session_id: sessionId,
          [idField]: itemId,
          status: "planned",
          planned_order: 0,
          section: "mid",
        }));

        const { error: insertError } = await (supabase as any).from(table).insert(inserts);

        if (insertError) throw insertError;
      }

      toast.success(`${itemName} has been added to ${selectedSessions.size} session(s)`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving session assignments:", error);
      toast.error(error.message || "Failed to save session assignments");
    } finally {
      setLoading(false);
    }
  };

  const formatSessionLabel = (session: Session) => {
    if (session.started_at) {
      return `${new Date(session.started_at).toLocaleDateString()} (${session.status})`;
    }
    return `Unscheduled (${session.status})`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Session Pack</DialogTitle>
          <DialogDescription>
            Select which session(s) to add "{itemName}" to
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sessions found. Create a session first.
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => handleToggleSession(session.id)}
                >
                  <Checkbox
                    checked={selectedSessions.has(session.id)}
                    onCheckedChange={() => handleToggleSession(session.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatSessionLabel(session)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || sessions.length === 0}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
