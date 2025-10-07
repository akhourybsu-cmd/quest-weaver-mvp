import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Dices, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavePrompt {
  id: string;
  ability: string;
  dc: number;
  description: string;
  advantage_mode: string;
  half_on_success: boolean;
  status: string;
  target_character_ids: string[] | null;
}

interface SaveResult {
  id: string;
  save_prompt_id: string;
  roll: number;
  modifier: number;
  total: number;
  success: boolean;
}

interface SavePromptSubmitProps {
  encounterId: string;
  characterId: string;
  characterName: string;
  savingThrowBonuses: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
}

const SavePromptSubmit = ({
  encounterId,
  characterId,
  characterName,
  savingThrowBonuses,
}: SavePromptSubmitProps) => {
  const [prompts, setPrompts] = useState<SavePrompt[]>([]);
  const [results, setResults] = useState<Record<string, SaveResult>>({});
  const [rolls, setRolls] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchActivePrompts();
    fetchMyResults();

    // Subscribe to new prompts
    const channel = supabase
      .channel(`player-save-prompts:${encounterId}:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'save_prompts',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => {
          fetchActivePrompts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'save_prompts',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => {
          fetchActivePrompts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'save_results',
        },
        (payload) => {
          // @ts-ignore
          if (payload.new.character_id === characterId) {
            fetchMyResults();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, characterId]);

  const fetchActivePrompts = async () => {
    const { data } = await supabase
      .from('save_prompts')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setPrompts(data || []);
  };

  const fetchMyResults = async () => {
    const { data } = await supabase
      .from('save_results')
      .select('*')
      .eq('character_id', characterId);

    if (data) {
      const resultsMap = data.reduce((acc, result) => {
        acc[result.save_prompt_id] = result;
        return acc;
      }, {} as Record<string, SaveResult>);
      setResults(resultsMap);
    }
  };

  const rollD20 = (promptId: string, advantageMode: string) => {
    let roll: number;

    if (advantageMode === 'advantage') {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      roll = Math.max(roll1, roll2);
      toast({
        title: "Rolled with Advantage",
        description: `Rolls: ${roll1}, ${roll2} → Using ${roll}`,
      });
    } else if (advantageMode === 'disadvantage') {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      roll = Math.min(roll1, roll2);
      toast({
        title: "Rolled with Disadvantage",
        description: `Rolls: ${roll1}, ${roll2} → Using ${roll}`,
      });
    } else {
      roll = Math.floor(Math.random() * 20) + 1;
      toast({
        title: "Rolled d20",
        description: `Result: ${roll}`,
      });
    }

    setRolls((prev) => ({ ...prev, [promptId]: roll }));
  };

  const submitResult = async (prompt: SavePrompt) => {
    const roll = rolls[prompt.id];
    if (roll === undefined) {
      toast({
        title: "Roll first",
        description: "Click the dice button to roll",
        variant: "destructive",
      });
      return;
    }

    const modifier = savingThrowBonuses[prompt.ability as keyof typeof savingThrowBonuses] || 0;

    setSubmitting((prev) => ({ ...prev, [prompt.id]: true }));

    try {
      const { error } = await supabase.functions.invoke('record-save-result', {
        body: {
          savePromptId: prompt.id,
          characterId,
          roll,
          modifier,
        },
      });

      if (error) throw error;

      const total = roll + modifier;
      const success = total >= prompt.dc;

      toast({
        title: success ? "Save Succeeded!" : "Save Failed",
        description: `${roll} + ${modifier} = ${total} vs DC ${prompt.dc}`,
        variant: success ? "default" : "destructive",
      });

      // Clear roll
      setRolls((prev) => {
        const newRolls = { ...prev };
        delete newRolls[prompt.id];
        return newRolls;
      });
    } catch (error: any) {
      toast({
        title: "Error submitting result",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting((prev) => ({ ...prev, [prompt.id]: false }));
    }
  };

  const activePromptsForMe = prompts.filter(
    (p) => !results[p.id] && p.target_character_ids?.includes(characterId)
  );

  if (activePromptsForMe.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Saving Throws Required
      </h3>
      {activePromptsForMe.map((prompt) => {
        const roll = rolls[prompt.id];
        const modifier = savingThrowBonuses[prompt.ability as keyof typeof savingThrowBonuses] || 0;
        const total = roll !== undefined ? roll + modifier : undefined;
        const isSubmitting = submitting[prompt.id];

        return (
          <Card key={prompt.id} className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>
                  {prompt.ability.toUpperCase()} Save (DC {prompt.dc})
                </span>
                {prompt.advantage_mode !== 'normal' && (
                  <Badge variant="outline" className="capitalize">
                    {prompt.advantage_mode}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{prompt.description}</p>

              {prompt.half_on_success && (
                <Badge variant="secondary" className="text-xs">
                  Half damage on success
                </Badge>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Your modifier: {modifier >= 0 ? '+' : ''}{modifier}
                </Label>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rollD20(prompt.id, prompt.advantage_mode)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    <Dices className="w-4 h-4 mr-2" />
                    {roll !== undefined ? `Rolled: ${roll}` : 'Roll d20'}
                  </Button>
                </div>

                {total !== undefined && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {roll} + {modifier} = {total}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {total >= prompt.dc ? '✓ Success' : '✗ Failure'}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => submitResult(prompt)}
                  disabled={roll === undefined || isSubmitting}
                  className="w-full"
                  size="sm"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit Result
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SavePromptSubmit;