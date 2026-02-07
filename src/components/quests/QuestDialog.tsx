import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Calendar, Loader2, Target, Gift, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";
import { timelineLogger } from "@/hooks/useTimelineLogger";
import { QuestDialogObjectives, type QuestStep } from "@/components/quests/QuestDialogObjectives";
import { QuestDialogRewards } from "@/components/quests/QuestDialogRewards";
import { QuestDialogNotes } from "@/components/quests/QuestDialogNotes";

interface QuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  questToEdit?: any;
}

interface RewardItem {
  id: string;
  name: string;
  quantity: number;
}

const INITIAL_STEP: QuestStep = { description: "", objectiveType: "other", progressMax: 1 };

const QuestDialog = ({ open, onOpenChange, campaignId, questToEdit }: QuestDialogProps) => {
  const isEditing = !!questToEdit;
  const { toast } = useToast();

  // Core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questType, setQuestType] = useState("side_quest");
  const [questStatus, setQuestStatus] = useState("not_started");
  const [difficulty, setDifficulty] = useState<string>("none");
  const [questGiverId, setQuestGiverId] = useState<string>("none");
  const [giver, setGiver] = useState("");
  const [primaryLocationId, setPrimaryLocationId] = useState<string>("none");

  // Details
  const [steps, setSteps] = useState<QuestStep[]>([{ ...INITIAL_STEP }]);
  const [rewardXP, setRewardXP] = useState("");
  const [rewardGP, setRewardGP] = useState("");
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<string>("none");
  const [parentQuestId, setParentQuestId] = useState<string>("none");
  const [playerVisible, setPlayerVisible] = useState(false);
  const [lorePageId, setLorePageId] = useState<string | null>(null);
  const [dmNotes, setDmNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Reference data
  const [characters, setCharacters] = useState<any[]>([]);
  const [factions, setFactions] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<any[]>([]);
  const [allQuests, setAllQuests] = useState<{ id: string; title: string }[]>([]);

  // UI state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddToSessionDialog, setShowAddToSessionDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsTab, setDetailsTab] = useState("objectives");

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setGiver("");
    setQuestGiverId("none");
    setPrimaryLocationId("none");
    setQuestType("side_quest");
    setQuestStatus("not_started");
    setDifficulty("none");
    setTags([]);
    setRewardXP("");
    setRewardGP("");
    setRewardItems([]);
    setDmNotes("");
    setSelectedCharacters([]);
    setSelectedFaction("none");
    setParentQuestId("none");
    setSteps([{ ...INITIAL_STEP }]);
    setLorePageId(null);
    setPlayerVisible(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      const [charsRes, factsRes, npcRes, locRes, questsRes] = await Promise.all([
        supabase.from("characters").select("id, name").eq("campaign_id", campaignId),
        supabase.from("factions").select("id, name").eq("campaign_id", campaignId),
        supabase.from("npcs").select("id, name").eq("campaign_id", campaignId).order("name"),
        supabase.from("locations").select("id, name, location_type").eq("campaign_id", campaignId).order("name"),
        supabase.from("quests").select("id, title").eq("campaign_id", campaignId),
      ]);

      if (charsRes.data) setCharacters(charsRes.data);
      if (factsRes.data) setFactions(factsRes.data);
      if (npcRes.data) setNpcs(npcRes.data);
      if (locRes.data) setLocationsList(locRes.data);
      if (questsRes.data) setAllQuests(questsRes.data);
    };

    loadData();

    if (questToEdit) {
      setTitle(questToEdit.title || "");
      setDescription(questToEdit.description || "");
      setGiver(questToEdit.legacyQuestGiver || questToEdit.questGiver || "");
      setQuestGiverId(questToEdit.questGiverId || "none");
      setPrimaryLocationId(questToEdit.locationId || "none");
      setQuestType(questToEdit.questType || "side_quest");
      setQuestStatus(questToEdit.status || "not_started");
      setDifficulty(questToEdit.difficulty || "none");
      setTags(questToEdit.tags || []);
      setRewardXP(questToEdit.rewardXP?.toString() || "");
      setRewardGP(questToEdit.rewardGP?.toString() || "");
      setRewardItems(questToEdit.rewardItems || []);
      setDmNotes(questToEdit.dmNotes || "");
      setSelectedCharacters(questToEdit.assignedTo || []);
      setSelectedFaction(questToEdit.factionId || "none");
      setParentQuestId(questToEdit.questChainParent || "none");
      setPlayerVisible(questToEdit.playerVisible || false);
      setLorePageId(questToEdit.lorePageId || null);
      setSteps(questToEdit.steps?.map((s: any) => ({
        id: s.id,
        description: s.description,
        objectiveType: s.objectiveType || s.objective_type || "other",
        progressMax: s.progressMax || s.progress_max || 1,
      })) || [{ ...INITIAL_STEP }]);
    } else {
      resetForm();
    }
  }, [open, campaignId, questToEdit, resetForm]);

  const toggleCharacter = (charId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Missing information", description: "Please provide a quest title.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const rewardItemsJson = rewardItems.length > 0
        ? rewardItems.map(r => ({ id: r.id, name: r.name, quantity: r.quantity } as Record<string, unknown>))
        : null;

      const questPayload = {
        title: title.trim(),
        description,
        legacy_quest_giver: giver || null,
        quest_giver_id: questGiverId !== "none" ? questGiverId : null,
        location_id: primaryLocationId !== "none" ? primaryLocationId : null,
        quest_type: questType,
        status: isEditing ? questStatus : "not_started",
        difficulty: difficulty !== "none" ? difficulty : null,
        tags,
        reward_xp: rewardXP ? parseInt(rewardXP) : 0,
        reward_gp: rewardGP ? parseFloat(rewardGP) : 0,
        reward_items: rewardItemsJson as any,
        assigned_to: selectedCharacters,
        faction_id: selectedFaction !== "none" ? selectedFaction : null,
        quest_chain_parent: parentQuestId !== "none" ? parentQuestId : null,
        dm_notes: dmNotes || null,
        player_visible: playerVisible,
        lore_page_id: lorePageId,
      };

      if (isEditing) {
        const { error: questError } = await supabase
          .from("quests")
          .update(questPayload)
          .eq("id", questToEdit.id);

        if (questError) throw questError;

        // Recreate steps
        await supabase.from("quest_steps").delete().eq("quest_id", questToEdit.id);
        const validSteps = steps.filter((s) => s.description.trim());
        if (validSteps.length > 0) {
          await supabase.from("quest_steps").insert(
            validSteps.map((step, index) => ({
              quest_id: questToEdit.id,
              description: step.description,
              objective_type: step.objectiveType,
              progress_max: step.progressMax,
              step_order: index,
            }))
          );
        }

        toast({ title: "Quest updated!", description: `${title} has been updated.` });
      } else {
        const { data: questData, error: questError } = await supabase
          .from("quests")
          .insert([{ campaign_id: campaignId, ...questPayload }])
          .select()
          .single();

        if (questError) throw questError;

        const validSteps = steps.filter((s) => s.description.trim());
        if (validSteps.length > 0) {
          await supabase.from("quest_steps").insert(
            validSteps.map((step, index) => ({
              quest_id: questData.id,
              description: step.description,
              objective_type: step.objectiveType,
              progress_max: step.progressMax,
              step_order: index,
            }))
          );
        }

        // Log to timeline
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("live_session_id")
          .eq("id", campaignId)
          .single();

        const questGiverNpc = npcs.find(n => n.id === questGiverId);
        await timelineLogger.questCreated(
          campaignId,
          campaign?.live_session_id || null,
          title,
          questData.id,
          questGiverNpc?.name || giver || undefined
        );

        toast({ title: "Quest added!", description: `${title} added to quest log.` });
      }

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!questToEdit) return;
    try {
      await supabase.from("quest_steps").delete().eq("quest_id", questToEdit.id);
      const { error } = await supabase.from("quests").delete().eq("id", questToEdit.id);
      if (error) throw error;

      toast({ title: "Quest deleted!", description: `${title} has been deleted.` });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="ornaments" size="full" className="max-h-[90vh] h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle className="font-cinzel text-xl">
            {isEditing ? "Edit Quest" : "Create Quest"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update quest details, objectives, and rewards."
              : "Fill in the essentials to create a quest. Expand sections below for more detail."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-2 space-y-4">
            {/* ─── ESSENTIAL FIELDS (always visible) ─── */}
            <div className="space-y-3">
              {/* Row 1: Title, Type, Difficulty */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="quest-title" className="text-xs text-muted-foreground">Title *</Label>
                  <Input
                    id="quest-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="The Missing Heirloom"
                    className="h-9 border-brass/20 font-medium"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={questType} onValueChange={setQuestType}>
                    <SelectTrigger className="h-9 w-[130px] border-brass/20 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main_quest">Main Quest</SelectItem>
                      <SelectItem value="side_quest">Side Quest</SelectItem>
                      <SelectItem value="faction">Faction</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="miscellaneous">Misc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="h-9 w-[110px] border-brass/20 text-sm">
                      <SelectValue placeholder="—" />
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
              </div>

              {/* Status (edit mode only) */}
              {isEditing && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={questStatus} onValueChange={setQuestStatus}>
                    <SelectTrigger className="h-9 w-[160px] border-brass/20 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Description */}
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                label="Description"
                placeholder="A local noble has lost their family's ancient sword..."
                rows={3}
                showPreview={false}
              />

              {/* Row 2: Quest Giver + Primary Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quest Giver</Label>
                  <Select value={questGiverId} onValueChange={setQuestGiverId}>
                    <SelectTrigger className="h-9 border-brass/20 text-sm">
                      <SelectValue placeholder="Select NPC..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {npcs.map(npc => (
                        <SelectItem key={npc.id} value={npc.id}>{npc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {questGiverId === "none" && (
                    <Input
                      value={giver}
                      onChange={(e) => setGiver(e.target.value)}
                      placeholder="Or type a custom name..."
                      className="h-8 text-sm border-brass/20"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Primary Location</Label>
                  <Select value={primaryLocationId} onValueChange={setPrimaryLocationId}>
                    <SelectTrigger className="h-9 border-brass/20 text-sm">
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locationsList.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                          {loc.location_type && ` (${loc.location_type.replace(/_/g, ' ')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ─── DETAIL TABS ─── */}
            <div className="border-t border-brass/15 pt-3">
              <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                <TabsList className="grid w-full grid-cols-3 bg-card/80 border border-brass/20">
                  <TabsTrigger value="objectives" className="text-xs gap-1.5 data-[state=active]:bg-brass/15 data-[state=active]:text-foreground">
                    <Target className="w-3.5 h-3.5" />
                    Objectives
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="text-xs gap-1.5 data-[state=active]:bg-brass/15 data-[state=active]:text-foreground">
                    <Gift className="w-3.5 h-3.5" />
                    Rewards & Details
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs gap-1.5 data-[state=active]:bg-brass/15 data-[state=active]:text-foreground">
                    <BookOpen className="w-3.5 h-3.5" />
                    DM Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="objectives" className="mt-3">
                  <QuestDialogObjectives steps={steps} onStepsChange={setSteps} />
                </TabsContent>

                <TabsContent value="rewards" className="mt-3">
                  <QuestDialogRewards
                    campaignId={campaignId}
                    rewardXP={rewardXP}
                    onRewardXPChange={setRewardXP}
                    rewardGP={rewardGP}
                    onRewardGPChange={setRewardGP}
                    rewardItems={rewardItems}
                    onRewardItemsChange={setRewardItems}
                    characters={characters}
                    selectedCharacters={selectedCharacters}
                    onToggleCharacter={toggleCharacter}
                    factions={factions}
                    selectedFaction={selectedFaction}
                    onFactionChange={setSelectedFaction}
                    parentQuestId={parentQuestId}
                    onParentQuestChange={setParentQuestId}
                    quests={allQuests}
                    currentQuestId={questToEdit?.id}
                    playerVisible={playerVisible}
                    onPlayerVisibleChange={setPlayerVisible}
                    lorePageId={lorePageId}
                    onLorePageIdChange={setLorePageId}
                    title={title}
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-3">
                  <QuestDialogNotes
                    dmNotes={dmNotes}
                    onDmNotesChange={setDmNotes}
                    tags={tags}
                    onTagsChange={setTags}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        {/* ─── FOOTER ─── */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-brass/15">
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            )}
            {isEditing && questToEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddToSessionDialog(true)}
                className="text-muted-foreground"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                Add to Session
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-brass/30">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {isEditing ? "Update Quest" : "Create Quest"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{title}&quot;? This will also delete all quest steps. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add to session */}
      {isEditing && questToEdit && (
        <AddItemToSessionDialog
          open={showAddToSessionDialog}
          onOpenChange={setShowAddToSessionDialog}
          campaignId={campaignId}
          itemType="quest"
          itemId={questToEdit.id}
          itemName={title}
        />
      )}
    </Dialog>
  );
};

export default QuestDialog;
