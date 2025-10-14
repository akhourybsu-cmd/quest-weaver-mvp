import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Dices } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ABILITY_SCORES, calculateModifier } from "@/lib/dnd5e";

interface SavePrompt {
  id: string;
  ability: string;
  dc: number;
  description: string;
  created_at: string;
}

interface Character {
  id: string;
  str_save: number;
  dex_save: number;
  con_save: number;
  int_save: number;
  wis_save: number;
  cha_save: number;
}

interface SavePromptListenerProps {
  characterId: string;
  character: Character;
  campaignId: string;
}

const SavePromptListener = ({ characterId, character, campaignId }: SavePromptListenerProps) => {
  const [savePrompts, setSavePrompts] = useState<SavePrompt[]>([]);
  const [respondedPrompts, setRespondedPrompts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveSavePrompts();

    // Subscribe to save prompts (INSERT + UPDATE for status changes)
    const channel = supabase
      .channel(`save-prompts-listener:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'save_prompts',
        },
        () => fetchActiveSavePrompts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchActiveSavePrompts = async () => {
    // Get active encounter for this campaign
    const { data: encounter } = await supabase
      .from("encounters")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)
      .maybeSingle();

    if (!encounter) {
      setSavePrompts([]);
      return;
    }

    // Get only active save prompts
    const { data, error } = await supabase
      .from("save_prompts")
      .select("*")
      .eq("encounter_id", encounter.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching save prompts:", error);
      return;
    }

    // Filter out prompts we've already responded to
    const { data: existingResults } = await supabase
      .from("save_results")
      .select("save_prompt_id")
      .eq("character_id", characterId);

    const respondedIds = new Set(existingResults?.map(r => r.save_prompt_id) || []);
    setRespondedPrompts(respondedIds);
    setSavePrompts(data || []);
  };

  const getSaveModifier = (ability: string): number => {
    const abilityMap: Record<string, keyof Character> = {
      "STR": "str_save",
      "DEX": "dex_save",
      "CON": "con_save",
      "INT": "int_save",
      "WIS": "wis_save",
      "CHA": "cha_save",
    };
    
    const saveValue = character[abilityMap[ability]];
    return typeof saveValue === 'number' ? saveValue : 0;
  };

  const rollSave = async (prompt: SavePrompt) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = getSaveModifier(prompt.ability);
    const total = roll + modifier;
    const success = total >= prompt.dc;

    const { error } = await supabase.from("save_results").insert({
      save_prompt_id: prompt.id,
      character_id: characterId,
      roll,
      modifier,
      total,
      success,
    });

    if (error) {
      toast({
        title: "Error submitting save",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setRespondedPrompts(prev => new Set([...prev, prompt.id]));

    toast({
      title: success ? "Save Successful!" : "Save Failed",
      description: `Rolled ${roll} + ${modifier} = ${total} vs DC ${prompt.dc}`,
      variant: success ? "default" : "destructive",
    });
  };

  const unrespondedPrompts = savePrompts.filter(p => !respondedPrompts.has(p.id));

  if (unrespondedPrompts.length === 0) return null;

  return (
    <Card className="shadow-md border-status-warning">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-status-warning" />
          Saving Throw Required!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unrespondedPrompts.map((prompt) => (
          <div key={prompt.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-semibold">
                {prompt.ability} Save
              </Badge>
              <Badge variant="secondary">DC {prompt.dc}</Badge>
            </div>
            <p className="text-sm">{prompt.description}</p>
            <Button onClick={() => rollSave(prompt)} size="sm" className="w-full">
              <Dices className="w-4 h-4 mr-2" />
              Roll {prompt.ability} Save (+{getSaveModifier(prompt.ability)})
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavePromptListener;
