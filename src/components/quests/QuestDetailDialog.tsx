import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Scroll, MapPin, Award, Coins, Target, Sword, User, Users, 
  StickyNote, CheckCircle2, XCircle, ChevronUp, ChevronDown,
  Edit, Trash2, Calendar, Plus, Minus, Eye, EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Quest {
  id: string;
  title: string;
  description?: string;
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
  [key: string]: any;
}

interface QuestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: Quest | null;
  onEdit?: () => void;
  onDelete?: () => void;
  demoMode?: boolean;
}

const questTypeIcons: Record<string, any> = {
  main_quest: Scroll,
  side_quest: Target,
  faction_quest: Users,
  personal_quest: User,
  bounty: Sword,
};

const difficultyColors: Record<string, string> = {
  easy: "bg-buff-green/20 text-buff-green border-buff-green/30",
  medium: "bg-warning-amber/20 text-warning-amber border-warning-amber/30",
  hard: "bg-destructive/20 text-destructive border-destructive/30",
  deadly: "bg-dragon-red/30 text-dragon-red border-dragon-red/40",
};

export function QuestDetailDialog({ open, onOpenChange, quest, onEdit, onDelete, demoMode }: QuestDetailDialogProps) {
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const { toast } = useToast();

  if (!quest) return null;

  const TypeIcon = quest.questType ? questTypeIcons[quest.questType] || Scroll : Scroll;

  const handleStatusChange = async (newStatus: string) => {
    if (demoMode) {
      toast({ title: "Demo Mode", description: "Status changes are not persisted in demo mode" });
      return;
    }

    const { error } = await supabase
      .from('quests')
      .update({ status: newStatus })
      .eq('id', quest.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update quest status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Quest status updated" });
    }
  };

  const handleStepToggle = async (stepId: string, currentCompleted: boolean) => {
    if (demoMode) {
      toast({ title: "Demo Mode", description: "Step changes are not persisted in demo mode" });
      return;
    }

    const { error } = await supabase
      .from('quest_steps')
      .update({ 
        is_completed: !currentCompleted,
        completed_at: !currentCompleted ? new Date().toISOString() : null
      })
      .eq('id', stepId);

    if (error) {
      toast({ title: "Error", description: "Failed to update step", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Step updated" });
    }
  };

  const handleProgressUpdate = async (stepId: string, change: number, currentProgress: number, maxProgress: number) => {
    if (demoMode) {
      toast({ title: "Demo Mode", description: "Progress changes are not persisted in demo mode" });
      return;
    }

    const newProgress = Math.max(0, Math.min(maxProgress, currentProgress + change));
    const isCompleted = newProgress >= maxProgress;

    const { error } = await supabase
      .from('quest_steps')
      .update({ 
        progress_current: newProgress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', stepId);

    if (error) {
      toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
    }
  };

  const calculateProgress = () => {
    if (!quest.steps || quest.steps.length === 0) return 0;
    const completed = quest.steps.filter(s => s.is_completed || s.isCompleted).length;
    return Math.round((completed / quest.steps.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" variant="ornaments" size="xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-cinzel">{quest.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {quest.questType?.replace('_', ' ') || 'Quest'}
                </Badge>
                {quest.difficulty && quest.difficulty !== 'none' && (
                  <Badge className={difficultyColors[quest.difficulty] || ''}>
                    {quest.difficulty}
                  </Badge>
                )}
                <Badge variant={quest.status === 'completed' ? 'default' : 'secondary'}>
                  {quest.status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlayerVisible(!isPlayerVisible)}
              >
                {isPlayerVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-4 px-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={quest.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
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

              {quest.description && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {quest.description}
                  </p>
                </div>
              )}

              {quest.npc && (
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Quest Giver
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Badge variant="secondary">{quest.npc.name}</Badge>
                  </div>
                </div>
              )}

              {quest.location && (
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Primary Location
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Badge variant="secondary">{quest.location.name}</Badge>
                    {quest.location.location_type && (
                      <span className="text-xs text-muted-foreground">
                        ({quest.location.location_type})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {quest.locations && quest.locations.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Locations</label>
                  <div className="flex flex-wrap gap-2">
                    {quest.locations.map((loc: string, idx: number) => (
                      <Badge key={idx} variant="outline">{loc}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {quest.tags && quest.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {quest.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="objectives" className="space-y-4 px-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Overall Progress</label>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-3">
                {quest.steps && quest.steps.length > 0 ? (
                  quest.steps.map((step: any, idx: number) => {
                    const isCompleted = step.is_completed || step.isCompleted;
                    const hasProgress = step.objective_type === 'counter' && step.progress_max > 1;

                    return (
                      <div
                        key={step.id || idx}
                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleStepToggle(step.id, isCompleted)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {step.description}
                          </p>
                          {hasProgress && (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => handleProgressUpdate(step.id, -1, step.progress_current || 0, step.progress_max)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs font-medium">
                                {step.progress_current || 0} / {step.progress_max}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => handleProgressUpdate(step.id, 1, step.progress_current || 0, step.progress_max)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-buff-green flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No objectives defined for this quest
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4 px-1">
              {(quest.rewardXP || quest.rewardGP) ? (
                <div className="space-y-3">
                  {quest.rewardXP && quest.rewardXP > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <Award className="h-5 w-5 text-warning-amber" />
                      <div>
                        <p className="text-sm font-medium">Experience Points</p>
                        <p className="text-lg font-bold text-warning-amber">{quest.rewardXP.toLocaleString()} XP</p>
                      </div>
                    </div>
                  )}
                  {quest.rewardGP && quest.rewardGP > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <Coins className="h-5 w-5 text-brass" />
                      <div>
                        <p className="text-sm font-medium">Gold Pieces</p>
                        <p className="text-lg font-bold text-brass">{quest.rewardGP.toLocaleString()} GP</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No rewards specified for this quest
                </p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 px-1">
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  DM Notes
                </label>
                {quest.dmNotes ? (
                  <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                    <p className="text-sm whitespace-pre-wrap">{quest.dmNotes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No DM notes for this quest
                  </p>
                )}
              </div>

              {quest.noteCount && quest.noteCount > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Linked Campaign Notes</label>
                  <Badge variant="secondary">{quest.noteCount} linked notes</Badge>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
