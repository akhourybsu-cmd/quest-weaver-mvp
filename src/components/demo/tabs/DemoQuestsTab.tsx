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
    const completedSteps = quest.steps?.filter((s: any) => s.completed || s.complete).length || 0;
    const totalSteps = quest.steps?.length || 0;

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
      <Card className="hover:shadow-lg transition-all bg-card border-brass/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base font-cinzel">{quest.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
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
                <Badge variant="outline" className={statusColors[quest.status]}>
                  {quest.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(quest.id)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress Bar */}
          {totalSteps > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{completedSteps}/{totalSteps}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-arcanePurple transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Compact Info */}
          {!isExpanded && (
            <>
              {quest.npc && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="w-3 h-3 text-brass" />
                  <span className="text-muted-foreground">{quest.npc.name}</span>
                </div>
              )}

              {quest.location && (
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3 h-3 text-brass" />
                  <span className="text-muted-foreground">{quest.location.name}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {quest.rewardXP > 0 && (
                  <Badge variant="outline" className="text-xs border-brass/30">
                    <Award className="w-3 h-3 mr-1" />
                    {quest.rewardXP} XP
                  </Badge>
                )}
                {quest.rewardGP > 0 && (
                  <Badge variant="outline" className="text-xs border-brass/30">
                    <Coins className="w-3 h-3 mr-1" />
                    {quest.rewardGP} GP
                  </Badge>
                )}
              </div>
            </>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <div className="space-y-4 pt-2 border-t border-brass/20 bg-background/95 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
              {/* Description */}
              {quest.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{quest.description}</p>
                </div>
              )}

              {/* Quest Giver & Location */}
              <div className="grid grid-cols-2 gap-3">
                {quest.npc && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1 text-brass">Quest Giver</h4>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-3 h-3 text-brass" />
                      <span>{quest.npc.name}</span>
                    </div>
                  </div>
                )}

                {quest.location && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1 text-brass">Location</h4>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3 h-3 text-brass" />
                      <span>{quest.location.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quest Steps */}
              {quest.steps && quest.steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Objectives</h4>
                  <div className="space-y-2">
                    {quest.steps.map((step: any, idx: number) => (
                      <div key={step.id || idx} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={step.completed || step.complete}
                          onCheckedChange={() => handleStepToggle(quest.id, step.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className={(step.completed || step.complete) ? 'line-through text-muted-foreground' : ''}>
                            {step.description}
                          </p>
                          {step.progressMax && step.progressMax > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProgressUpdate(quest.id, step.id, -1);
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                {step.progressCurrent || 0}/{step.progressMax}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProgressUpdate(quest.id, step.id, 1);
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {(step.completed || step.complete) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Rewards</h4>
                <div className="flex flex-wrap gap-2">
                  {quest.rewardXP > 0 && (
                    <Badge variant="outline" className="border-brass/30">
                      <Award className="w-3 h-3 mr-1" />
                      {quest.rewardXP} XP
                    </Badge>
                  )}
                  {quest.rewardGP > 0 && (
                    <Badge variant="outline" className="border-brass/30">
                      <Coins className="w-3 h-3 mr-1" />
                      {quest.rewardGP} GP
                    </Badge>
                  )}
                  {(!quest.rewardXP || quest.rewardXP === 0) && (!quest.rewardGP || quest.rewardGP === 0) && (
                    <span className="text-sm text-muted-foreground">No rewards specified</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {quest.tags && quest.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {quest.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* DM Notes */}
              {quest.dmNotes && (
                <div>
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <StickyNote className="w-3 h-3" />
                    DM Notes
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{quest.dmNotes}</p>
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
