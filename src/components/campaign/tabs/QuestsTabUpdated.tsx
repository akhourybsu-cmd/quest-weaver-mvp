import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scroll, Users, MapPin, Trophy, Eye, EyeOff, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QuestDialog from "@/components/quests/QuestDialog";

interface Quest {
  id: string;
  title: string;
  description?: string;
  questGiver?: string;
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
  [key: string]: any;
}

interface QuestsTabProps {
  campaignId: string;
  onQuestSelect?: (quest: Quest) => void;
}

export function QuestsTab({ campaignId, onQuestSelect }: QuestsTabProps) {
  const [view, setView] = useState<"board" | "list">("board");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState<Quest | undefined>(undefined);

  useEffect(() => {

    const fetchQuests = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quests')
          .select(`
            id,
            title,
            description,
            quest_giver,
            quest_type,
            status,
            difficulty,
            locations,
            tags,
            reward_xp,
            reward_gp,
            assigned_to,
            faction_id,
            dm_notes,
            quest_steps (
              id,
              description,
              objective_type,
              progress_current,
              progress_max,
              step_order
            )
          `)
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map database quests to component format
        const mappedQuests: Quest[] = (data || []).map((q: any) => ({
          id: q.id,
          title: q.title || 'Untitled Quest',
          description: q.description,
          questGiver: q.quest_giver,
          questType: q.quest_type || 'side_quest',
          status: q.status || 'not_started',
          difficulty: q.difficulty,
          locations: q.locations || [],
          tags: q.tags || [],
          rewardXP: q.reward_xp || 0,
          rewardGP: q.reward_gp || 0,
          assignedTo: q.assigned_to || [],
          factionId: q.faction_id,
          dmNotes: q.dm_notes,
          steps: (q.quest_steps || [])
            .sort((a: any, b: any) => a.step_order - b.step_order)
            .map((s: any) => ({
              id: s.id,
              description: s.description,
              objectiveType: s.objective_type,
              progressMax: s.progress_max,
              progressCurrent: s.progress_current,
            })),
        }));

        setQuests(mappedQuests);
      } catch (error) {
        console.error('Failed to fetch quests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`quests:${campaignId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quests', filter: `campaign_id=eq.${campaignId}` },
        () => fetchQuests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const questsByStatus = {
    not_started: quests.filter((q) => q.status === "not_started"),
    in_progress: quests.filter((q) => q.status === "in_progress"),
    completed: quests.filter((q) => q.status === "completed"),
    failed: quests.filter((q) => q.status === "failed"),
  };

  const handleQuestClick = (quest: Quest) => {
    if (onQuestSelect) {
      onQuestSelect(quest);
    } else {
      setQuestToEdit(quest);
      setDialogOpen(true);
    }
  };

  const QuestCard = ({ quest }: { quest: Quest }) => {
    const objectives = quest.steps || [];
    const completedObjectives = objectives.filter((o: any) => o.progressCurrent >= o.progressMax).length;
    const progress = objectives.length > 0 ? (completedObjectives / objectives.length) * 100 : 0;

    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-card/50 border-brass/20"
        onClick={() => handleQuestClick(quest)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-cinzel">{quest.title}</CardTitle>
            {quest.visibility === "dm" ? (
              <EyeOff className="w-4 h-4 text-brass shrink-0" />
            ) : (
              <Eye className="w-4 h-4 text-arcanePurple shrink-0" />
            )}
          </div>
          {quest.arc && <CardDescription className="text-xs">{quest.arc}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {objectives.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{completedObjectives}/{objectives.length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-arcanePurple transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {quest.assignedTo && quest.assignedTo.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Users className="w-3 h-3 text-brass" />
              <span className="text-muted-foreground">{quest.assignedTo.length} Assigned</span>
            </div>
          )}

          {quest.locations && quest.locations.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-3 h-3 text-brass" />
              <span className="text-muted-foreground">{quest.locations.length} Locations</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {quest.rewardXP > 0 && (
              <Badge variant="outline" className="text-xs border-brass/30">
                {quest.rewardXP} XP
              </Badge>
            )}
            {quest.rewardGP > 0 && (
              <Badge variant="outline" className="text-xs border-brass/30">
                {quest.rewardGP} GP
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-arcanePurple" />
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64">
          <Scroll className="w-16 h-16 text-brass/50 mb-4" />
          <h3 className="text-xl font-cinzel font-bold mb-2">No Quests Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Create your first quest to start building your campaign's narrative.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quest
          </Button>
        </div>
        <QuestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaignId={campaignId}
          questToEdit={questToEdit}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
          <TabsList>
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => { setQuestToEdit(undefined); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Quest
        </Button>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-brass">Not Started</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.not_started.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.not_started.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-arcanePurple">In Progress</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.in_progress.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.in_progress.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-green-500">Completed</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.completed.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.completed.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-dragonRed">Failed</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.failed.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.failed.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {quests.map((quest) => (
            <Card
              key={quest.id}
              className="cursor-pointer hover:bg-accent/5 transition-colors border-brass/20"
              onClick={() => handleQuestClick(quest)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Scroll className="w-5 h-5 text-arcanePurple" />
                    <div>
                      <h4 className="font-medium font-cinzel">{quest.title}</h4>
                      {quest.arc && <p className="text-sm text-muted-foreground">{quest.arc}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        quest.status === "in_progress"
                          ? "default"
                          : quest.status === "completed"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {quest.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {quest.steps?.filter((s: any) => s.progressCurrent >= s.progressMax).length || 0}/{quest.steps?.length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        questToEdit={questToEdit}
      />
    </div>
  );
}
