import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dices } from "lucide-react";

interface ConcentrationSaveDialogProps {
  open: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  dc: number;
  encounterId: string;
  effectId: string;
  conSaveBonus: number;
}

const ConcentrationSaveDialog = ({
  open,
  onClose,
  characterId,
  characterName,
  dc,
  encounterId,
  effectId,
  conSaveBonus,
}: ConcentrationSaveDialogProps) => {
  const [rolling, setRolling] = useState(false);
  const { toast } = useToast();

  const rollConcentrationSave = async () => {
    setRolling(true);

    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + conSaveBonus;
    const success = total >= dc;

    // Log the save result
    await supabase.from("combat_log").insert({
      encounter_id: encounterId,
      character_id: characterId,
      round: 0, // Current round would need to be passed
      action_type: "save",
      message: `${characterName} ${success ? "maintains" : "loses"} concentration (${roll}+${conSaveBonus}=${total} vs DC ${dc})`,
      details: { roll, modifier: conSaveBonus, total, dc, success, type: "concentration" },
    });

    // If failed, remove the effect
    if (!success) {
      await supabase
        .from("effects")
        .delete()
        .eq("id", effectId);

      toast({
        title: "Concentration Lost!",
        description: `${characterName} rolled ${roll}+${conSaveBonus}=${total} vs DC ${dc}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Concentration Maintained",
        description: `${characterName} rolled ${roll}+${conSaveBonus}=${total} vs DC ${dc}`,
      });
    }

    setRolling(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concentration Check</DialogTitle>
          <DialogDescription>
            {characterName} must make a Constitution saving throw to maintain concentration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground">DC to Maintain</div>
            <div className="text-3xl font-bold">{dc}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Constitution Save: +{conSaveBonus}
            </div>
          </div>

          <Button
            onClick={rollConcentrationSave}
            disabled={rolling}
            className="w-full"
            size="lg"
          >
            <Dices className="w-4 h-4 mr-2" />
            Roll Concentration Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConcentrationSaveDialog;
