import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ConditionType } from "@/types/combat";

interface QuickConditionsPopoverProps {
  characterId: string;
  characterName: string;
  encounterId: string;
  currentRound: number;
}

// Match database enum exactly
type DbConditionType = 
  | 'blinded' | 'charmed' | 'deafened' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed'
  | 'petrified' | 'poisoned' | 'prone' | 'restrained'
  | 'stunned' | 'unconscious';

const COMMON_CONDITIONS: DbConditionType[] = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
];

const QuickConditionsPopover = ({
  characterId,
  characterName,
  encounterId,
  currentRound,
}: QuickConditionsPopoverProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState(1);

  const applyCondition = async (condition: DbConditionType) => {
    const endsAtRound = currentRound + duration;

    const { error } = await supabase.from("character_conditions").insert([{
      character_id: characterId,
      encounter_id: encounterId,
      condition: condition as any,
      ends_at_round: endsAtRound,
    }]);

    if (error) {
      toast({
        title: "Error applying condition",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Log the condition
    await supabase.from("combat_log").insert({
      encounter_id: encounterId,
      character_id: characterId,
      round: currentRound,
      action_type: "effect_applied",
      message: `${characterName} is now ${condition} (ends round ${endsAtRound})`,
    });

    toast({
      title: "Condition Applied",
      description: `${characterName} is ${condition} until round ${endsAtRound}`,
    });

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" title="Quick apply condition">
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-card z-50" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Quick Apply Condition</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Apply to {characterName}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm">
              Duration (rounds)
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={100}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Conditions</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {COMMON_CONDITIONS.map((condition) => (
                <Button
                  key={condition}
                  variant="outline"
                  size="sm"
                  onClick={() => applyCondition(condition)}
                  className="justify-start capitalize"
                >
                  {condition}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default QuickConditionsPopover;
