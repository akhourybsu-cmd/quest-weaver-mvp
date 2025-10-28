import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ScrollText, 
  Plus, 
  CheckCircle2, 
  MapPin, 
  Coins, 
  Award,
  User,
  Tag,
  AlertCircle,
  Sword,
  Target,
  Users
} from "lucide-react";
import QuestDialog from "./QuestDialog";

interface QuestStep {
  id: string;
  description: string;
  isCompleted: boolean;
  objectiveType: string;
  progressCurrent: number;
  progressMax: number;
  notes?: string;
}

interface Quest {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  questGiver?: string;
  questType: string;
  status: string;
  difficulty?: string;
  locations: string[];
  tags: string[];
  rewardXP: number;
  rewardGP: number;
  assignedTo: string[];
  steps: QuestStep[];
}

interface QuestLogProps {
  campaignId: string;
  isDM: boolean;
}

const difficultyColors = {
  easy: "bg-status-buff",
  moderate: "bg-yellow-500",
  hard: "bg-orange-500",
  deadly: "bg-destructive",
};

const statusColors = {
  not_started: "bg-secondary",
  in_progress: "bg-blue-500",
  completed: "bg-status-buff",
  failed: "bg-destructive",
};

const typeIcons = {
  main_quest: Sword,
  side_quest: Target,
  faction: Users,
  personal: User,
  miscellaneous: ScrollText,
};

const QuestLog = ({ campaignId, isDM }: QuestLogProps) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const loadQuests = async () => {
      const { data: questsData } = await supabase
        .from("quests")
        .select(`
          id,
          title,
          description,
          is_completed,
          quest_giver,
          quest_type,
          status,
          difficulty,
          locations,
          tags,
          reward_xp,
          reward_gp,
          assigned_to,
          quest_steps (
            id,
            description,
            is_completed,
            step_order,
            objective_type,
            progress_current,
            progress_max,
            notes
          )
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (questsData) {
        setQuests(
          questsData.map((q: any) => ({
            id: q.id,
            title: q.title,
            description: q.description,
            isCompleted: q.is_completed,
            questGiver: q.quest_giver,
            questType: q.quest_type || 'side_quest',
            status: q.status || 'not_started',
            difficulty: q.difficulty,
            locations: q.locations || [],
            tags: q.tags || [],
            rewardXP: q.reward_xp || 0,
            rewardGP: q.reward_gp || 0,
            assignedTo: q.assigned_to || [],
            steps: (q.quest_steps || [])
              .sort((a: any, b: any) => a.step_order - b.step_order)
              .map((s: any) => ({
                id: s.id,
                description: s.description,
                isCompleted: s.is_completed,
                objectiveType: s.objective_type || 'other',
                progressCurrent: s.progress_current || 0,
                progressMax: s.progress_max || 1,
                notes: s.notes,
              })),
          }))
        );
      }
    };

    loadQuests();

    const channel = supabase
      .channel(`quests:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quests",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadQuests()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quest_steps",
        },
        () => loadQuests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const handleToggleStep = async (step: QuestStep) => {
    await supabase
      .from("quest_steps")
      .update({ is_completed: !step.isCompleted })
      .eq("id", step.id);
  };

  const handleUpdateProgress = async (stepId: string, current: number, max: number) => {
    const newCurrent = Math.min(current + 1, max);
    await supabase
      .from("quest_steps")
      .update({ 
        progress_current: newCurrent,
        is_completed: newCurrent >= max 
      })
      .eq("id", stepId);
  };

  const filteredQuests = quests.filter(quest => {
    const matchesSearch = !searchQuery || 
      quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.questGiver?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "active" && quest.status === "in_progress") ||
      (activeTab === "completed" && quest.status === "completed") ||
      (activeTab === "not_started" && quest.status === "not_started") ||
      (activeTab === "failed" && quest.status === "failed") ||
      (activeTab === "main" && quest.questType === "main_quest") ||
      (activeTab === "side" && quest.questType === "side_quest");

    return matchesSearch && matchesTab;
  });

  const getQuestProgress = (quest: Quest) => {
    if (quest.steps.length === 0) return 0;
    const completed = quest.steps.filter(s => s.isCompleted).length;
    return Math.round((completed / quest.steps.length) * 100);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Quest Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search quests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
            {isDM && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Quest
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="not_started">Not Started</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="side">Side</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {filteredQuests.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No quests found
              </div>
            ) : (
              filteredQuests.map((quest) => {
                const TypeIcon = typeIcons[quest.questType as keyof typeof typeIcons] || ScrollText;
                const progress = getQuestProgress(quest);

                return (
                  <div key={quest.id} className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
                    {/* Quest Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <TypeIcon className="w-5 h-5 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{quest.title}</h3>
                            <Badge className={statusColors[quest.status as keyof typeof statusColors]}>
                              {quest.status.replace('_', ' ')}
                            </Badge>
                            {quest.difficulty && (
                              <Badge variant="outline" className={difficultyColors[quest.difficulty as keyof typeof difficultyColors]}>
                                {quest.difficulty}
                              </Badge>
                            )}
                          </div>
                          {quest.questGiver && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="w-3 h-3" />
                              Given by: {quest.questGiver}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quest Description */}
                    {quest.description && (
                      <p className="text-sm text-muted-foreground">
                        {quest.description}
                      </p>
                    )}

                    {/* Quest Metadata */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {quest.locations.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {quest.locations.join(", ")}
                        </div>
                      )}
                      {quest.rewardXP > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Award className="w-3 h-3" />
                          {quest.rewardXP} XP
                        </div>
                      )}
                      {quest.rewardGP > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Coins className="w-3 h-3" />
                          {quest.rewardGP} GP
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {quest.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {quest.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    {quest.steps.length > 0 && quest.status !== 'completed' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{quest.steps.filter(s => s.isCompleted).length}/{quest.steps.length} objectives</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Quest Steps */}
                    {quest.steps.length > 0 && (
                      <div className="space-y-2 pl-2 border-l-2 ml-6">
                        {quest.steps.map((step) => (
                          <div key={step.id} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={step.isCompleted}
                                onCheckedChange={() => handleToggleStep(step)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm ${
                                      step.isCompleted
                                        ? "line-through text-muted-foreground"
                                        : ""
                                    }`}
                                  >
                                    {step.description}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {step.objectiveType}
                                  </Badge>
                                </div>
                                
                                {/* Progress Tracker */}
                                {step.progressMax > 1 && !step.isCompleted && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Progress 
                                        value={(step.progressCurrent / step.progressMax) * 100} 
                                        className="h-1 flex-1"
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {step.progressCurrent}/{step.progressMax}
                                      </span>
                                      {isDM && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2"
                                          onClick={() => handleUpdateProgress(step.id, step.progressCurrent, step.progressMax)}
                                        >
                                          +1
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {step.notes && (
                                  <div className="mt-1 text-xs text-muted-foreground flex items-start gap-1">
                                    <AlertCircle className="w-3 h-3 mt-0.5" />
                                    {step.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed Badge */}
                    {quest.status === 'completed' && (
                      <div className="flex items-center gap-2 text-status-buff font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Quest Completed!</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {isDM && (
        <QuestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaignId={campaignId}
        />
      )}
    </Card>
  );
};

export default QuestLog;
