import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { DMEmptyState } from "@/components/campaign/DMEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Scroll, Users, MapPin, Plus, Loader2, ScrollText,
  Award, Coins, Target, Sword, User, CheckSquare
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QuestDialog from "@/components/quests/QuestDialog";
import { QuestDetailDialog } from "@/components/quests/QuestDetailDialog";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoQuests } from "@/lib/demoAdapters";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkVisibilityBar } from "@/components/campaign/BulkVisibilityBar";

interface Quest {
  id: string;
  title: string;
  description?: string;
  legacyQuestGiver?: string;
  questGiverId?: string;
  locationId?: string;
  questType?: string;
  status: string;
  difficulty?: string;
  locations?: string[];
  tags?: string[];
  rewardXP?: number;
  rewardGP?: number;
  assignedTo?: string[];
  factionId?: string;
  dmNotes?: string;
  steps?: any[];
  npc?: { id: string; name: string; };
  location?: { id: string; name: string; location_type?: string; };
  noteCount?: number;
  [key: string]: any;
}

interface QuestsTabProps {
  campaignId: string;
  onQuestSelect?: (quest: Quest) => void;
  demoMode?: boolean;
  demoCampaign?: DemoCampaign | null;
}

const getQuestTypeIcon = (type?: string) => {
  switch(type) {
    case 'main_quest': return <Sword className="w-3 h-3" />;
    case 'side_quest': return <Target className="w-3 h-3" />;
    case 'faction': return <Users className="w-3 h-3" />;
    case 'personal': return <User className="w-3 h-3" />;
    default: return <Scroll className="w-3 h-3" />;
  }
};

const getDifficultyColor = (difficulty?: string) => {
  switch(difficulty) {
    case 'easy': return 'text-buff-green border-buff-green/30';
    case 'medium': case 'moderate': return 'text-warning-amber border-warning-amber/30';
    case 'hard': return 'text-destructive border-destructive/30';
    case 'deadly': return 'text-dragon-red border-dragon-red/30';
    default: return 'text-muted-foreground border-brass/30';
  }
};

// Memoized Quest Card Component
const QuestCard = memo(({ quest, onClick, selectionMode, isSelected, onToggleSelect }: { 
  quest: Quest; onClick: (quest: Quest) => void;
  selectionMode?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void;
}) => {
  const objectives = quest.steps || [];
  const completedObjectives = objectives.filter((o: any) => o.is_completed || o.isCompleted).length;
  const progress = objectives.length > 0 ? (completedObjectives / objectives.length) * 100 : 0;

  return (
    <Card
      className="hover:shadow-lg transition-all bg-card border-brass/20 cursor-pointer"
      onClick={() => selectionMode ? onToggleSelect?.(quest.id) : onClick(quest)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {selectionMode && (
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect?.(quest.id)} />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-base font-cinzel">{quest.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {quest.questType && (
                <Badge variant="outline" className="text-xs border-brass/30">
                  {getQuestTypeIcon(quest.questType)}
                  <span className="ml-1">{quest.questType.replace('_', ' ')}</span>
                </Badge>
              )}
              {quest.difficulty && quest.difficulty !== 'none' && (
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {objectives.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedObjectives}/{objectives.length}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {quest.npc && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {quest.npc.name}
            </span>
          )}
          {quest.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {quest.location.name}
            </span>
          )}
        </div>

        {(quest.rewardXP || quest.rewardGP) && (
          <div className="flex items-center gap-3 text-xs">
            {quest.rewardXP && (
              <span className="flex items-center gap-1 text-warning-amber">
                <Award className="w-3 h-3" />
                {quest.rewardXP} XP
              </span>
            )}
            {quest.rewardGP && (
              <span className="flex items-center gap-1 text-brass">
                <Coins className="w-3 h-3" />
                {quest.rewardGP} GP
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

QuestCard.displayName = "QuestCard";

export function QuestsTab({ campaignId, onQuestSelect, demoMode, demoCampaign }: QuestsTabProps) {
  const { toast } = useToast();
  const bulk = useBulkSelection();
  const [view, setView] = useState<"board" | "list">("board");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState<Quest | undefined>(undefined);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Allow other parts of the Campaign Hub (Overview / Quick Add / command palette)
  // to request opening the Quest creation dialog.
  useEffect(() => {
    if (demoMode) return;

    const onCreateQuest = () => {
      setQuestToEdit(undefined);
      setDialogOpen(true);
    };

    window.addEventListener("qw:create-quest", onCreateQuest as EventListener);
    return () => window.removeEventListener("qw:create-quest", onCreateQuest as EventListener);
  }, [demoMode]);

  const fetchQuests = useCallback(async () => {
    setLoading(true);
    try {
      if (demoMode && demoCampaign) {
        const adaptedQuests = adaptDemoQuests(demoCampaign);
        setQuests(adaptedQuests as any);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('quests')
        .select(`
          id,
          title,
          description,
          legacy_quest_giver,
          quest_giver_id,
          location_id,
          quest_type,
          status,
          difficulty,
          locations,
          tags,
          reward_xp,
          reward_gp,
          reward_items,
          assigned_to,
          faction_id,
          dm_notes,
          player_visible,
          lore_page_id,
          quest_chain_parent,
          quest_steps (
            id,
            description,
            objective_type,
            progress_current,
            progress_max,
            step_order,
            is_completed
          ),
          npc:quest_giver_id(id, name),
          location:location_id(id, name, location_type)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedQuests = (data || []).map((quest: any) => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        legacyQuestGiver: quest.legacy_quest_giver,
        questGiverId: quest.quest_giver_id,
        locationId: quest.location_id,
        questType: quest.quest_type,
        status: quest.status,
        difficulty: quest.difficulty,
        locations: quest.locations || [],
        tags: quest.tags || [],
        rewardXP: quest.reward_xp,
        rewardGP: quest.reward_gp,
        rewardItems: quest.reward_items || [],
        assignedTo: quest.assigned_to || [],
        factionId: quest.faction_id,
        dmNotes: quest.dm_notes,
        playerVisible: quest.player_visible,
        lorePageId: quest.lore_page_id,
        questChainParent: quest.quest_chain_parent,
        steps: quest.quest_steps || [],
        npc: quest.npc,
        location: quest.location,
        noteCount: 0,
      }));

      setQuests(transformedQuests);
    } catch (err) {
      console.error("Error fetching quests:", err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, demoMode, demoCampaign]);

  useEffect(() => {
    fetchQuests();

    if (demoMode) return;

    const channel = supabase
      .channel('quests-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quests',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          fetchQuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, demoMode, demoCampaign, fetchQuests]);

  // Memoized quests by status
  const questsByStatus = useMemo(() => ({
    not_started: quests.filter((q) => q.status === "not_started"),
    in_progress: quests.filter((q) => q.status === "in_progress"),
    completed: quests.filter((q) => q.status === "completed"),
    failed: quests.filter((q) => q.status === "failed"),
  }), [quests]);

  const handleQuestClick = useCallback((quest: Quest) => {
    if (onQuestSelect) {
      onQuestSelect(quest);
    } else {
      setSelectedQuest(quest);
      setDetailDialogOpen(true);
    }
  }, [onQuestSelect]);

  const handleEditQuest = useCallback(() => {
    if (selectedQuest) {
      setDetailDialogOpen(false);
      setQuestToEdit(selectedQuest);
      setDialogOpen(true);
    }
  }, [selectedQuest]);

  const handleDeleteQuest = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteQuest = useCallback(async () => {
    if (!selectedQuest) return;

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', selectedQuest.id);

    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete quest", 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Success", description: "Quest deleted successfully" });
      setDeleteDialogOpen(false);
      setDetailDialogOpen(false);
      setSelectedQuest(null);
      fetchQuests();
    }
  }, [selectedQuest, toast, fetchQuests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && quests.length === 0) {
    return (
      <>
        <DMEmptyState
          icon={Scroll}
          title="No Quests Yet"
          description="Start your adventure by creating your first quest. Track objectives, assign NPCs, and manage rewards."
          actionLabel={demoMode ? undefined : "Create Quest"}
          onAction={demoMode ? undefined : () => {
            setQuestToEdit(undefined);
            setDialogOpen(true);
          }}
        />

        {!demoMode && (
          <QuestDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            campaignId={campaignId}
            questToEdit={questToEdit}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>

        {!demoMode && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={bulk.selectionMode ? "secondary" : "outline"}
              onClick={bulk.selectionMode ? bulk.exitSelectionMode : bulk.enterSelectionMode}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {bulk.selectionMode ? "Exit Bulk Edit" : "Bulk Edit"}
            </Button>
            <Button onClick={() => {
              setQuestToEdit(undefined);
              setDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Quest
            </Button>
          </div>
        )}
      </div>

      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              Not Started ({questsByStatus.not_started.length})
            </h3>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-3 pr-4">
                {questsByStatus.not_started.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">No quests here yet</p>
                ) : (
                  questsByStatus.not_started.map((quest, index) => (
                    <div key={quest.id} className="stagger-item animate-fade-in" style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
                      <QuestCard quest={quest} onClick={handleQuestClick} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(quest.id)} onToggleSelect={bulk.toggleId} />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              In Progress ({questsByStatus.in_progress.length})
            </h3>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-3 pr-4">
                {questsByStatus.in_progress.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">No quests here yet</p>
                ) : (
                  questsByStatus.in_progress.map((quest, index) => (
                    <div key={quest.id} className="stagger-item animate-fade-in" style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
                      <QuestCard quest={quest} onClick={handleQuestClick} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(quest.id)} onToggleSelect={bulk.toggleId} />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-buff-green" />
              Completed ({questsByStatus.completed.length})
            </h3>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-3 pr-4">
                {questsByStatus.completed.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">No quests here yet</p>
                ) : (
                  questsByStatus.completed.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} onClick={handleQuestClick} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(quest.id)} onToggleSelect={bulk.toggleId} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              Failed ({questsByStatus.failed.length})
            </h3>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-3 pr-4">
                {questsByStatus.failed.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">No quests here yet</p>
                ) : (
                  questsByStatus.failed.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} onClick={handleQuestClick} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(quest.id)} onToggleSelect={bulk.toggleId} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {view === "list" && (
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="space-y-3">
            {quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onClick={handleQuestClick} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(quest.id)} onToggleSelect={bulk.toggleId} />
            ))}
          </div>
        </ScrollArea>
      )}

      <QuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        questToEdit={questToEdit}
      />

      <QuestDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        quest={selectedQuest}
        onEdit={handleEditQuest}
        onDelete={handleDeleteQuest}
        demoMode={demoMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedQuest?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {bulk.selectionMode && (
        <BulkVisibilityBar
          selectedIds={bulk.selectedIds}
          totalCount={quests.length}
          onSelectAll={() => bulk.selectAll(quests.map((q) => q.id))}
          onDeselectAll={bulk.deselectAll}
          onCancel={bulk.exitSelectionMode}
          tableName="quests"
          visibilityColumn="player_visible"
          entityLabel="quests"
          onUpdated={fetchQuests}
        />
      )}
    </div>
  );
}
