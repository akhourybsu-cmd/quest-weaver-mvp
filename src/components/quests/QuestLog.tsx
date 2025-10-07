import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollText, Plus, CheckCircle2 } from "lucide-react";
import QuestDialog from "./QuestDialog";

interface QuestStep {
  id: string;
  description: string;
  isCompleted: boolean;
}

interface Quest {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  questGiver?: string;
  steps: QuestStep[];
}

interface QuestLogProps {
  campaignId: string;
  isDM: boolean;
}

const QuestLog = ({ campaignId, isDM }: QuestLogProps) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

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
          quest_steps (
            id,
            description,
            is_completed,
            step_order
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
            steps: (q.quest_steps || [])
              .sort((a: any, b: any) => a.step_order - b.step_order)
              .map((s: any) => ({
                id: s.id,
                description: s.description,
                isCompleted: s.is_completed,
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

  const activeQuests = quests.filter((q) => !q.isCompleted);
  const completedQuests = quests.filter((q) => q.isCompleted);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Quest Log
          </CardTitle>
          {isDM && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Quest
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Active Quests</h3>
            {activeQuests.map((quest) => (
              <div key={quest.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <div className="font-semibold">{quest.title}</div>
                  {quest.questGiver && (
                    <div className="text-sm text-muted-foreground">
                      Given by: {quest.questGiver}
                    </div>
                  )}
                  {quest.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {quest.description}
                    </p>
                  )}
                </div>

                {quest.steps.length > 0 && (
                  <div className="space-y-2 pl-2 border-l-2">
                    {quest.steps.map((step) => (
                      <div key={step.id} className="flex items-start gap-2">
                        <Checkbox
                          checked={step.isCompleted}
                          onCheckedChange={() => handleToggleStep(step)}
                          className="mt-1"
                        />
                        <span
                          className={`text-sm ${
                            step.isCompleted
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {step.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Completed Quests */}
        {completedQuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-buff" />
              Completed
            </h3>
            {completedQuests.map((quest) => (
              <div
                key={quest.id}
                className="border rounded-lg p-4 bg-muted/30 opacity-75"
              >
                <div className="font-semibold">{quest.title}</div>
                {quest.questGiver && (
                  <div className="text-sm text-muted-foreground">
                    Given by: {quest.questGiver}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {quests.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No quests yet
          </div>
        )}
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
