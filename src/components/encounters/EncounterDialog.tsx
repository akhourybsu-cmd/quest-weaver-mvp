import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, X, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import MonsterLibraryDialog from "@/components/monsters/MonsterLibraryDialog";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";

interface EncounterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  encounterId?: string | null;
  onSuccess: () => void;
}

interface EncounterMonster {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  ac: number;
  type: string;
  size: string;
}

interface Session {
  id: string;
  started_at: string | null;
  status: string;
}

export function EncounterDialog({
  open,
  onOpenChange,
  campaignId,
  encounterId,
  onSuccess,
}: EncounterDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<string>("none");
  const [sessionId, setSessionId] = useState<string>("none");
  const [monsters, setMonsters] = useState<EncounterMonster[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddToSessionDialog, setShowAddToSessionDialog] = useState(false);

  const isEditing = !!encounterId;

  useEffect(() => {
    if (open) {
      fetchSessions();
      if (encounterId) {
        fetchEncounter();
        fetchMonsters();
      } else {
        resetForm();
      }
    }
  }, [open, encounterId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_sessions")
        .select("id, started_at, status")
        .eq("campaign_id", campaignId)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchEncounter = async () => {
    if (!encounterId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("encounters")
        .select("*")
        .eq("id", encounterId)
        .single();

      if (error) throw error;

      setName(data.name || "");
      setDescription(data.description || "");
      setDifficulty(data.difficulty || "none");

      // Fetch session assignment
      const { data: sessionData } = await supabase
        .from("session_encounters")
        .select("session_id")
        .eq("encounter_id", encounterId)
        .maybeSingle();

      setSessionId(sessionData?.session_id || "none");
    } catch (error) {
      console.error("Error fetching encounter:", error);
      toast.error("Failed to load encounter");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonsters = async () => {
    if (!encounterId) return;

    try {
      const { data, error } = await supabase
        .from("encounter_monsters")
        .select(`
          id,
          name,
          hp_current,
          hp_max,
          ac,
          type,
          size
        `)
        .eq("encounter_id", encounterId)
        .order("name");

      if (error) throw error;
      setMonsters(data || []);
    } catch (error) {
      console.error("Error fetching monsters:", error);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDifficulty("none");
    setSessionId("none");
    setMonsters([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an encounter name");
      return;
    }

    setSaving(true);
    try {
      const encounterData = {
        campaign_id: campaignId,
        name: name.trim(),
        description: description.trim() || null,
        difficulty: difficulty !== "none" ? difficulty : null,
      };

      let finalEncounterId = encounterId;

      if (isEditing) {
        const { error } = await supabase
          .from("encounters")
          .update(encounterData)
          .eq("id", encounterId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("encounters")
          .insert(encounterData)
          .select()
          .single();

        if (error) throw error;
        finalEncounterId = data.id;
      }

      // Handle session assignment
      if (finalEncounterId) {
        // Delete existing assignment
        await supabase
          .from("session_encounters")
          .delete()
          .eq("encounter_id", finalEncounterId);

        // Add new assignment if selected
        if (sessionId !== "none") {
          const { error: sessionError } = await supabase
            .from("session_encounters")
            .insert({
              session_id: sessionId,
              encounter_id: finalEncounterId,
            });

          if (sessionError) throw sessionError;
        }
      }

      toast.success(isEditing ? "Encounter updated" : "Encounter created");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving encounter:", error);
      toast.error(error.message || "Failed to save encounter");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!encounterId) return;

    setDeleting(true);
    try {
      // Delete in proper order to handle foreign keys
      // 1. Delete initiative entries
      await supabase.from("initiative").delete().eq("encounter_id", encounterId);

      // 2. Delete encounter monsters
      await supabase.from("encounter_monsters").delete().eq("encounter_id", encounterId);

      // 3. Delete session assignments
      await supabase.from("session_encounters").delete().eq("encounter_id", encounterId);

      // 4. Delete the encounter itself
      const { error } = await supabase.from("encounters").delete().eq("id", encounterId);

      if (error) throw error;

      toast.success("Encounter deleted");
      onSuccess();
      onOpenChange(false);
      setDeleteDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error deleting encounter:", error);
      toast.error(error.message || "Failed to delete encounter");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMonster = async (monsterId: string) => {
    try {
      const { error } = await supabase
        .from("encounter_monsters")
        .delete()
        .eq("id", monsterId);

      if (error) throw error;

      toast.success("Monster removed");
      fetchMonsters();
    } catch (error: any) {
      console.error("Error removing monster:", error);
      toast.error("Failed to remove monster");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Encounter" : "Create Encounter"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update encounter details and manage monsters"
                : "Create a new combat encounter for your campaign"}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Encounter Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Goblin Ambush, Dragon's Lair"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the encounter setup, environment, and objectives..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="deadly">Deadly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session">Assign to Session</Label>
                    <Select value={sessionId} onValueChange={setSessionId}>
                      <SelectTrigger id="session">
                        <SelectValue placeholder="No session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Session</SelectItem>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.started_at 
                              ? new Date(session.started_at).toLocaleDateString()
                              : "Unscheduled"} ({session.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Monsters ({monsters.length})</Label>
                      <MonsterLibraryDialog
                        encounterId={encounterId!}
                        onMonstersAdded={fetchMonsters}
                      />
                    </div>

                    {monsters.length === 0 ? (
                      <Card>
                        <CardContent className="py-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            No monsters added yet. Use the button above to add monsters.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {monsters.map((monster) => (
                          <Card key={monster.id}>
                            <CardContent className="py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{monster.name}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground capitalize mt-1">
                                    {monster.size} {monster.type} • AC {monster.ac} • HP{" "}
                                    {monster.hp_current}/{monster.hp_max}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMonster(monster.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {isEditing && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <Button variant="outline" onClick={() => setShowAddToSessionDialog(true)} disabled={saving}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Session
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{isEditing ? "Save Changes" : "Create Encounter"}</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Encounter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{name}" and all associated monsters. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Encounter"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditing && encounterId && (
        <AddItemToSessionDialog
          open={showAddToSessionDialog}
          onOpenChange={setShowAddToSessionDialog}
          campaignId={campaignId}
          itemType="encounter"
          itemId={encounterId}
          itemName={name}
        />
      )}
    </>
  );
}
