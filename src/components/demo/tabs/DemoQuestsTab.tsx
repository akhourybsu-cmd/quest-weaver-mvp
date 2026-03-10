import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Scroll, Users, MapPin, Plus, ScrollText,
  Award, Coins, Target, Sword, User, Pencil, Trash2
} from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoQuests } from "@/lib/demoAdapters";

interface DemoQuestsTabProps {
  campaign: DemoCampaign;
}

const difficultyColors: Record<string, string> = {
  easy: "text-buff-green border-buff-green/30",
  medium: "text-warning-amber border-warning-amber/30",
  hard: "text-destructive border-destructive/30",
  deadly: "text-dragon-red border-dragon-red/30"
};

export function DemoQuestsTab({ campaign }: DemoQuestsTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const [view, setView] = useState<"board" | "list">("board");
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const quests = adaptDemoQuests(campaign);

  const questsByStatus = {
    not_started: quests.filter(q => q.status === 'not_started'),
    in_progress: quests.filter(q => q.status === 'in_progress' || q.status === 'active'),
    completed: quests.filter(q => q.status === 'completed'),
    failed: quests.filter(q => q.status === 'failed')
  };

  const handleQuestClick = (quest: any) => {
    setSelectedQuest(quest);
    setEditTitle(quest.title);
    setEditDescription(quest.description || "");
    setEditMode(false);
    setDetailOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedQuest) return;
    // Update the raw quest in campaign.quests
    const rawQuest = campaign.quests.find(q => q.id === selectedQuest.id);
    if (rawQuest) {
      updateEntity("quests", selectedQuest.id, { title: editTitle, description: editDescription });
    }
    setEditMode(false);
    setDetailOpen(false);
  };

  const handleToggleObjective = (questId: string, objId: string) => {
    const rawQuest = campaign.quests.find(q => q.id === questId);
    if (!rawQuest) return;
    const updatedObjectives = rawQuest.objectives.map(obj =>
      obj.id === objId ? { ...obj, complete: !obj.complete } : obj
    );
    updateEntity("quests", questId, { objectives: updatedObjectives });
  };

  const confirmDeleteQuest = () => {
    if (!selectedQuest) return;
    deleteEntity("quests", selectedQuest.id);
    setDeleteDialogOpen(false);
    setDetailOpen(false);
    setSelectedQuest(null);
  };

  const handleAddQuest = () => {
    if (!newTitle.trim()) return;
    addEntity("quests", {
      title: newTitle,
      arc: "Custom",
      status: "hook",
      description: newDescription,
      objectives: [],
      npcs: [],
      locations: [],
      rewards: { xp: 0, gp: 0, items: [] },
      visibility: "shared",
    });
    setNewTitle("");
    setNewDescription("");
    setAddDialogOpen(false);
  };

  const QuestCard = ({ quest }: { quest: any }) => {
    const completedSteps = quest.steps?.filter((s: any) => s.completed || s.complete || s.is_completed).length || 0;
    const totalSteps = quest.steps?.length || 0;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
      <Card 
        className="hover:shadow-lg transition-all bg-card border-brass/20 cursor-pointer"
        onClick={() => handleQuestClick(quest)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-cinzel">{quest.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {quest.questType && (
              <Badge variant="outline" className="text-xs border-brass/30">
                {quest.questType.replace('_', ' ')}
              </Badge>
            )}
            {quest.difficulty && (
              <Badge variant="outline" className={`text-xs ${difficultyColors[quest.difficulty] || ""}`}>
                {quest.difficulty}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalSteps > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedSteps}/{totalSteps}</span>
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
              {quest.rewardXP > 0 && (
                <span className="flex items-center gap-1 text-warning-amber">
                  <Award className="w-3 h-3" />
                  {quest.rewardXP} XP
                </span>
              )}
              {quest.rewardGP > 0 && (
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
  };

  const StatusColumn = ({ title, color, quests: columnQuests }: { title: string; color: string; quests: any[] }) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        {title} ({columnQuests.length})
      </h3>
      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {columnQuests.map((quest: any) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setAddDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Quest
        </Button>
      </div>

      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusColumn title="Not Started" color="bg-secondary" quests={questsByStatus.not_started} />
          <StatusColumn title="In Progress" color="bg-blue-500" quests={questsByStatus.in_progress} />
          <StatusColumn title="Completed" color="bg-buff-green" quests={questsByStatus.completed} />
          <StatusColumn title="Failed" color="bg-destructive" quests={questsByStatus.failed} />
        </div>
      )}

      {view === "list" && (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {quests.map((quest: any) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Quest Detail / Edit Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedQuest && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-brass" />
                  {editMode ? (
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-cinzel text-lg" />
                  ) : (
                    selectedQuest.title
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {editMode ? (
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} placeholder="Quest description..." />
                ) : (
                  <p className="text-sm text-muted-foreground">{selectedQuest.description}</p>
                )}

                {/* Objectives - always interactive */}
                {selectedQuest.steps && selectedQuest.steps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-brass mb-2">Objectives</h4>
                    <div className="space-y-2">
                      {selectedQuest.steps.map((step: any) => (
                        <label key={step.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={() => handleToggleObjective(selectedQuest.id, step.id)}
                            className="rounded border-brass/30"
                          />
                          <span className={step.completed ? "line-through text-muted-foreground" : ""}>
                            {step.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                {editMode ? (
                  <>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Quest Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cinzel">New Quest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Quest title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea placeholder="Description..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddQuest} disabled={!newTitle.trim()}>Create Quest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
    </div>
  );
}
