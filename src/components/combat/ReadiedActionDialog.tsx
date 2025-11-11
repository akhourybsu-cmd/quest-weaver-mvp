import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReadiedActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounterId: string;
  characterId?: string;
  monsterId?: string;
  combatantName: string;
  currentRound: number;
}

export function ReadiedActionDialog({
  open,
  onOpenChange,
  encounterId,
  characterId,
  monsterId,
  combatantName,
  currentRound,
}: ReadiedActionDialogProps) {
  const [actionDescription, setActionDescription] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!actionDescription.trim() || !triggerCondition.trim()) {
      toast.error("Please describe both the action and trigger condition");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('readied_actions').insert({
        encounter_id: encounterId,
        character_id: characterId,
        monster_id: monsterId,
        action_description: actionDescription,
        trigger_condition: triggerCondition,
        expires_at_round: currentRound + 1,
      });

      if (error) throw error;

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: currentRound,
        action_type: 'readied_action',
        message: `${combatantName} readies an action`,
        details: {
          action: actionDescription,
          trigger: triggerCondition,
        },
      });

      toast.success("Action readied!");
      setActionDescription("");
      setTriggerCondition("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating readied action:", error);
      toast.error("Failed to ready action");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ready an Action - {combatantName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can ready an action to take as a reaction when a specific trigger occurs. 
            The readied action expires at the start of your next turn if not used.
          </p>

          <div>
            <Label>Action Description</Label>
            <Textarea
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="I attack with my longsword"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>Trigger Condition</Label>
            <Textarea
              value={triggerCondition}
              onChange={(e) => setTriggerCondition(e.target.value)}
              placeholder="When an enemy moves within 5 feet of me"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              Ready Action
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
