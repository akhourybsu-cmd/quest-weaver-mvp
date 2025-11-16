import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Scroll, Users, MapPin, Plus, ScrollText,
  Award, Coins, Target, Sword, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoQuests } from "@/lib/demoAdapters";
import { QuestDetailDialog } from "@/components/quests/QuestDetailDialog";

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
  const [view, setView] = useState<"board" | "list">("board");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const quests = adaptDemoQuests(campaign);

  const questsByStatus = {
    not_started: quests.filter(q => q.status === 'not_started'),
    in_progress: quests.filter(q => q.status === 'in_progress' || q.status === 'active'),
    completed: quests.filter(q => q.status === 'completed'),
    failed: quests.filter(q => q.status === 'failed')
  };

  const handleQuestClick = (quest: any) => {
    setSelectedQuest(quest);
    setDetailDialogOpen(true);
  };

  const handleDeleteQuest = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuest = () => {
    toast({ 
      title: "Demo Mode", 
      description: "Quest deletion is not available in demo mode" 
    });
    setDeleteDialogOpen(false);
    setDetailDialogOpen(false);
  };

  const QuestCard = ({ quest }: { quest: any }) => {
    const completedSteps = quest.steps?.filter((s: any) => s.completed || s.complete || s.is_completed).length || 0;
    const totalSteps = quest.steps?.length || 0;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const getQuestTypeIcon = (type?: string) => {
      switch(type) {
        case 'main_quest': return <Sword className="w-3 h-3" />;
        case 'side_quest': return <Target className="w-3 h-3" />;
        case 'faction': return <Users className="w-3 h-3" />;
        case 'personal': return <User className="w-3 h-3" />;
        default: return <Scroll className="w-3 h-3" />;
      }
    };

    return (
      <Card 
        className="hover:shadow-lg transition-all bg-card border-brass/20 cursor-pointer"
        onClick={() => handleQuestClick(quest)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base font-cinzel">{quest.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {quest.questType && (
                  <Badge variant="outline" className="text-xs border-brass/30">
                    {getQuestTypeIcon(quest.questType)}
                    <span className="ml-1">{quest.questType.replace('_', ' ')}</span>
                  </Badge>
                )}
                {quest.difficulty && (
                  <Badge variant="outline" className={`text-xs ${difficultyColors[quest.difficulty]}`}>
                    {quest.difficulty}
                  </Badge>
                )}
              </div>
            </div>
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
  };

  if (quests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Scroll className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No Quests</h3>
        <p className="text-muted-foreground text-center max-w-md">
          This demo campaign doesn't have any quests yet
        </p>
      </div>
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
      </div>

      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              Not Started ({questsByStatus.not_started.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {questsByStatus.not_started.map((quest: any) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              In Progress ({questsByStatus.in_progress.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {questsByStatus.in_progress.map((quest: any) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-buff-green" />
              Completed ({questsByStatus.completed.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {questsByStatus.completed.map((quest: any) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              Failed ({questsByStatus.failed.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {questsByStatus.failed.map((quest: any) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>
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

      <QuestDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        quest={selectedQuest}
        onDelete={handleDeleteQuest}
        demoMode={true}
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
    </div>
  );
}
