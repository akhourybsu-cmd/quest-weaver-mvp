import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Zap, X } from "lucide-react";
import { toast } from "sonner";

interface ReadiedAction {
  id: string;
  character_id: string | null;
  monster_id: string | null;
  action_description: string;
  trigger_condition: string;
  expires_at_round: number;
  combatantName?: string;
}

interface ReadiedActionsListProps {
  encounterId: string;
  currentRound: number;
  isDM?: boolean;
}

export function ReadiedActionsList({ encounterId, currentRound, isDM }: ReadiedActionsListProps) {
  const [actions, setActions] = useState<ReadiedAction[]>([]);

  useEffect(() => {
    loadActions();

    const channel = supabase
      .channel(`readied_actions_${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'readied_actions',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => loadActions()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [encounterId]);

  const loadActions = async () => {
    const { data, error } = await supabase
      .from('readied_actions')
      .select('*')
      .eq('encounter_id', encounterId)
      .gte('expires_at_round', currentRound);

    if (error) {
      console.error("Error loading readied actions:", error);
      return;
    }

    // Fetch combatant names
    const enriched = await Promise.all(
      (data || []).map(async (action) => {
        let combatantName = "Unknown";
        
        if (action.character_id) {
          const { data: char } = await supabase
            .from('characters')
            .select('name')
            .eq('id', action.character_id)
            .single();
          if (char) combatantName = char.name;
        } else if (action.monster_id) {
          const { data: monster } = await supabase
            .from('encounter_monsters')
            .select('name')
            .eq('id', action.monster_id)
            .single();
          if (monster) combatantName = monster.name;
        }

        return { ...action, combatantName };
      })
    );

    setActions(enriched);
  };

  const handleTrigger = async (action: ReadiedAction) => {
    try {
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: currentRound,
        action_type: 'reaction',
        message: `${action.combatantName} uses readied action: ${action.action_description}`,
        details: {
          trigger: action.trigger_condition,
        },
      });

      await supabase.from('readied_actions').delete().eq('id', action.id);

      toast.success("Readied action triggered!");
    } catch (error) {
      console.error("Error triggering action:", error);
      toast.error("Failed to trigger action");
    }
  };

  const handleCancel = async (actionId: string) => {
    try {
      await supabase.from('readied_actions').delete().eq('id', actionId);
      toast.success("Readied action cancelled");
    } catch (error) {
      console.error("Error cancelling action:", error);
      toast.error("Failed to cancel action");
    }
  };

  if (actions.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Readied Actions ({actions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map(action => (
          <div
            key={action.id}
            className="border rounded-lg p-3 bg-card"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">{action.combatantName}</div>
              <div className="text-xs text-muted-foreground">
                Expires: Round {action.expires_at_round}
              </div>
            </div>
            
            <div className="text-sm mb-1">
              <span className="font-medium">Action: </span>
              {action.action_description}
            </div>
            
            <div className="text-sm text-muted-foreground mb-3">
              <span className="font-medium">Trigger: </span>
              {action.trigger_condition}
            </div>

            {isDM && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleTrigger(action)}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Trigger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(action.id)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
