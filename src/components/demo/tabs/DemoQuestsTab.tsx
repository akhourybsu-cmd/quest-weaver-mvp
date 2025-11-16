import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Scroll, Users, MapPin, Trophy, Plus, ScrollText, 
  MoreVertical, Pencil, Trash2, Play, CheckCircle2, XCircle,
  Search, Minus, ChevronDown, ChevronUp, Award, Coins, Target, Sword, User, StickyNote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoQuests } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";

interface QuestStep {
  id: string;
  description: string;
  completed: boolean;
  objectiveType?: string;
  progressCurrent?: number;
  progressMax?: number;
}

interface DemoQuestsTabProps {
  campaign: DemoCampaign;
}

const statusColors: Record<string, string> = {
  not_started: "border-secondary/50 text-secondary-foreground",
  in_progress: "border-blue-500/50 text-blue-500",
  active: "border-blue-500/50 text-blue-500",
  completed: "border-green-500/50 text-green-500",
  failed: "border-destructive/50 text-destructive"
};

const difficultyColors: Record<string, string> = {
  easy: "border-green-500/50 text-green-500",
  moderate: "border-yellow-500/50 text-yellow-500",
  hard: "border-orange-500/50 text-orange-500",
  deadly: "border-destructive/50 text-destructive"
};

const typeIcons: Record<string, any> = {
  main_quest: Sword,
  side_quest: Target,
  faction: Users,
  personal: User,
  miscellaneous: ScrollText
};

export function DemoQuestsTab({ campaign }: DemoQuestsTabProps) {
  const [view, setView] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { updateCampaign } = useDemo();

  const quests = adaptDemoQuests(campaign);

  const handleStepToggle = async (questId: string, stepId: string) => {
    const updatedQuests = campaign.quests.map(q => {
      if (q.id === questId) {
        return {
          ...q,
          objectives: q.objectives.map(obj => 
            obj.id === stepId ? { ...obj, complete: !obj.complete } : obj
          )
        };
      }
      return q;
    });

    await updateCampaign({ quests: updatedQuests });
    
    toast({
      title: "Step Updated",
      description: "Quest step status updated in demo"
    });
  };

  const handleProgressUpdate = async (questId: string, stepId: string, delta: number) => {
    // Demo quests use simple boolean objectives, no progress tracking
    toast({
      title: "Demo Mode",
      description: "Progress tracking not available for demo objectives",
      variant: "destructive"
    });
  };

  const handleStatusChange = async (questId: string, newStatus: string) => {
    // Map database statuses back to demo statuses
    const statusMap: Record<string, 'hook' | 'active' | 'complete' | 'failed'> = {
      'not_started': 'hook',
      'in_progress': 'active',
      'completed': 'complete',
      'failed': 'failed'
    };
    
    const demoStatus = statusMap[newStatus] || 'active';
    
    const updatedQuests = campaign.quests.map(q => 
      q.id === questId ? { ...q, status: demoStatus } : q
    );

    await updateCampaign({ quests: updatedQuests });

    toast({
      title: "Status Updated",
      description: `Quest status changed to ${newStatus.replace('_', ' ')} in demo`
    });
  };

  const calculateQuestProgress = (quest: any): number => {
    if (!quest.steps || quest.steps.length === 0) return 0;
    const completed = quest.steps.filter((s: any) => s.completed || s.complete).length;
    return Math.round((completed / quest.steps.length) * 100);
  };

  const toggleExpanded = (questId: string) => {
    setExpandedQuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questId)) {
        newSet.delete(questId);
      } else {
        newSet.add(questId);
      }
      return newSet;
    });
  };

  const filteredQuests = quests.filter(quest => {
    const matchesSearch = !searchQuery || 
      quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.npc?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || quest.status === filterStatus || 
      (filterStatus === "in_progress" && quest.status === "active");
    const matchesType = filterType === "all" || quest.questType === filterType;
    const matchesDifficulty = filterDifficulty === "all" || quest.difficulty === filterDifficulty;

    return matchesSearch && matchesStatus && matchesType && matchesDifficulty;
  });

  const questsByStatus = {
    not_started: filteredQuests.filter(q => q.status === 'not_started'),
    in_progress: filteredQuests.filter(q => q.status === 'in_progress' || q.status === 'active'),
    completed: filteredQuests.filter(q => q.status === 'completed'),
    failed: filteredQuests.filter(q => q.status === 'failed')
  };

  const QuestCard = ({ quest, compact = false }: { quest: any; compact?: boolean }) => {
    const TypeIcon = typeIcons[quest.questType || 'miscellaneous'] || ScrollText;
    const progress = calculateQuestProgress(quest);
    const isExpanded = expandedQuests.has(quest.id);

    return (
      <Card className="bg-card/50 border-brass/20 hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className="w-4 h-4 text-arcanePurple" />
                <CardTitle className="font-cinzel text-lg">{quest.title}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">{quest.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors[quest.status]}>
                {quest.status.replace('_', ' ')}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast({ title: "Demo Mode", description: "Quest editing not available in demo", variant: "destructive" })}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Quest
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange(quest.id, 'not_started')}>
                    Not Started
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(quest.id, 'in_progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(quest.id, 'completed')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(quest.id, 'failed')}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {quest.steps && quest.steps.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {quest.steps.filter((s: any) => s.completed).length} / {quest.steps.length} complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 text-sm">
            {quest.difficulty && (
              <Badge variant="outline" className={difficultyColors[quest.difficulty]}>
                {quest.difficulty}
              </Badge>
            )}
            {quest.npc && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{quest.npc.name}</span>
              </div>
            )}
            {quest.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{quest.location.name}</span>
              </div>
            )}
          </div>

          {/* Rewards */}
          {(quest.rewardXP || quest.rewardGP) && (
            <div className="flex gap-3 text-sm">
              {quest.rewardXP > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Award className="w-3 h-3" />
                  <span>{quest.rewardXP} XP</span>
                </div>
              )}
              {quest.rewardGP > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Coins className="w-3 h-3" />
                  <span>{quest.rewardGP} GP</span>
                </div>
              )}
            </div>
          )}

          {/* Steps - Expandable */}
          {quest.steps && quest.steps.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(quest.id)}
                className="w-full justify-between"
              >
                <span className="text-sm font-medium">
                  Quest Steps ({quest.steps.length})
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {quest.steps.map((step: any) => (
                    <div key={step.id} className="flex items-start gap-2 p-2 rounded bg-background/50 border border-brass/10">
                      <Checkbox
                        checked={step.completed}
                        onCheckedChange={() => handleStepToggle(quest.id, step.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {step.description}
                        </p>
                        {step.progressMax && step.progressMax > 1 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => handleProgressUpdate(quest.id, step.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {step.progressCurrent || 0} / {step.progressMax}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => handleProgressUpdate(quest.id, step.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Quests</h2>
          <p className="text-muted-foreground">Track your party's adventures</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card/50 border-brass/20">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search quests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="all">All Types</option>
                <option value="main_quest">Main Quest</option>
                <option value="side_quest">Side Quest</option>
                <option value="faction">Faction</option>
                <option value="personal">Personal</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="deadly">Deadly</option>
              </select>
              {(filterStatus !== "all" || filterType !== "all" || filterDifficulty !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterType("all");
                    setFilterDifficulty("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
        <TabsList>
          <TabsTrigger value="board">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        {/* Board View */}
        <TabsContent value="board" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(questsByStatus).map(([status, statusQuests]) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold capitalize">
                    {status.replace('_', ' ')}
                  </h3>
                  <Badge variant="secondary">{statusQuests.length}</Badge>
                </div>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {statusQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} compact />
                    ))}
                    {statusQuests.length === 0 && (
                      <Card className="bg-card/30 border-dashed border-brass/20">
                        <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                          No quests in this status
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <div className="space-y-4">
            {filteredQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
            {filteredQuests.length === 0 && (
              <Card className="bg-card/30 border-dashed border-brass/20">
                <CardContent className="pt-12 pb-12 text-center">
                  <Scroll className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No quests found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
