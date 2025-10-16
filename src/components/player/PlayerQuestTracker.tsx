import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, CheckCircle2, Circle } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  quest_giver: string;
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
      .select("*")
      .eq("campaign_id", campaignId)
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (data) {
      setQuests(data);
    }
  };

  const activeQuests = quests.filter(q => !q.is_completed);
  const completedQuests = quests.filter(q => q.is_completed);

  if (quests.length === 0) {
    return null;
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
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {activeQuests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Active Quests</h4>
                {activeQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="p-3 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <Circle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold">{quest.title}</h5>
                        {quest.quest_giver && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Given by: {quest.quest_giver}
                          </p>
                        )}
                        {quest.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {quest.description}
                          </p>
                        )}
                      </div>
                    </div>
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
