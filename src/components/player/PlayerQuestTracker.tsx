import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, CheckCircle2, Target, MapPin, Award, Coins, User, Tag, Circle } from "lucide-react";
import { PlayerEmptyState } from "./PlayerEmptyState";

interface Quest {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  legacy_quest_giver: string;
  quest_giver_id?: string;
  location_id?: string;
  status: string;
  difficulty?: string;
  locations: string[];
  tags: string[];
  reward_xp: number;
  reward_gp: number;
  steps: any[];
  npc?: { id: string; name: string; };
  location?: { id: string; name: string; };
}

interface PlayerQuestTrackerProps {
  campaignId: string;
}

export function PlayerQuestTracker({ campaignId }: PlayerQuestTrackerProps) {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    fetchQuests();

    const channel = supabase
      .channel(`player-quests:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quests',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchQuests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchQuests = async () => {
    const { data } = await supabase
      .from("quests")
      .select(`
        *,
        quest_steps(id, description, is_completed, progress_current, progress_max, step_order),
        npc:quest_giver_id(id, name),
        location:location_id(id, name)
      `)
      .eq("campaign_id", campaignId)
      .eq("player_visible", true)
      .order("status", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      setQuests(data.map(q => ({
        ...q,
        steps: (q.quest_steps || []).sort((a: any, b: any) => a.step_order - b.step_order)
      })));
    }
  };

  const activeQuests = quests.filter(q => q.status === 'in_progress');
  const completedQuests = quests.filter(q => q.status === 'completed');
  
  const getProgress = (quest: Quest) => {
    if (!quest.steps?.length) return 0;
    return Math.round((quest.steps.filter((s: any) => s.is_completed).length / quest.steps.length) * 100);
  };

  if (quests.length === 0) {
    return (
      <PlayerEmptyState
        icon={ScrollText}
        title="No Active Quests"
        description="Your DM hasn't assigned any quests yet. Check back after your next session!"
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          Quest Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-28rem)] min-h-[200px] pr-4">
          <div className="space-y-3">
            {activeQuests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Active Quests
                </h4>
                {activeQuests.map((quest) => (
                  <div key={quest.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-semibold">{quest.title}</h5>
                          {quest.difficulty && (
                            <Badge variant="outline" className="text-xs">{quest.difficulty}</Badge>
                          )}
                        </div>
                        {(quest.npc?.name || quest.legacy_quest_giver) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />{quest.npc?.name || quest.legacy_quest_giver}
                          </p>
                        )}
                      </div>
                    </div>
                    {quest.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {quest.locations?.[0] && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{quest.locations[0]}</span>
                      )}
                      {quest.reward_xp > 0 && (
                        <span className="flex items-center gap-1"><Award className="w-3 h-3" />{quest.reward_xp} XP</span>
                      )}
                      {quest.reward_gp > 0 && (
                        <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{quest.reward_gp} GP</span>
                      )}
                    </div>
                    {quest.steps?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{quest.steps.filter((s: any) => s.is_completed).length}/{quest.steps.length}</span>
                        </div>
                        <Progress value={getProgress(quest)} className="h-1.5" />
                        <div className="space-y-1 mt-1">
                          {quest.steps.map((step: any) => (
                            <div key={step.id} className="flex items-start gap-2 text-xs">
                              {step.is_completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              )}
                              <span className={step.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                                {step.description}
                                {step.progress_max > 0 && (
                                  <span className="text-muted-foreground ml-1">
                                    ({step.progress_current || 0}/{step.progress_max})
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {completedQuests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                {completedQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="p-3 bg-muted/30 border border-border rounded-lg opacity-60"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold line-through">{quest.title}</h5>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
