import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dice6, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContestedCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkType: 'grapple' | 'shove';
  attackerId: string;
  attackerType: 'character' | 'monster';
  attackerName: string;
  attackerBonus: number; // Athletics bonus
  targetId: string;
  targetType: 'character' | 'monster';
  targetName: string;
  targetAthleticsBonus: number;
  targetAcrobaticsBonus: number;
  encounterId: string;
  onSuccess: () => void;
}

const ContestedCheckDialog = ({
  open,
  onOpenChange,
  checkType,
  attackerId,
  attackerType,
  attackerName,
  attackerBonus,
  targetId,
  targetType,
  targetName,
  targetAthleticsBonus,
  targetAcrobaticsBonus,
  encounterId,
  onSuccess,
}: ContestedCheckDialogProps) => {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{
    attackerRoll: number;
    attackerTotal: number;
    targetRoll: number;
    targetTotal: number;
    targetUsedAcrobatics: boolean;
    success: boolean;
  } | null>(null);
  const { toast } = useToast();

  const rollD20 = () => Math.floor(Math.random() * 20) + 1;

  const handleRoll = async () => {
    setRolling(true);

    // Roll for attacker (always Athletics)
    const attackerRoll = rollD20();
    const attackerTotal = attackerRoll + attackerBonus;

    // Target chooses Athletics or Acrobatics (we pick the better one)
    const targetUsedAcrobatics = targetAcrobaticsBonus > targetAthleticsBonus;
    const targetBonus = targetUsedAcrobatics ? targetAcrobaticsBonus : targetAthleticsBonus;
    const targetRoll = rollD20();
    const targetTotal = targetRoll + targetBonus;

    const success = attackerTotal > targetTotal;

    const rollResult = {
      attackerRoll,
      attackerTotal,
      targetRoll,
      targetTotal,
      targetUsedAcrobatics,
      success,
    };

    setResult(rollResult);

    // If successful, apply the condition
    if (success) {
      try {
        const condition = checkType === 'grapple' ? 'grappled' : 'prone';
        
        // Add condition to target
        if (targetType === 'character') {
          const { error } = await supabase
            .from('character_conditions')
            .insert({
              character_id: targetId,
              condition,
              encounter_id: encounterId,
              ends_at_round: null, // Manual removal for grapple, instant for prone
            });

          if (error) throw error;
        }

        // Mark action as used
        if (attackerType === 'character') {
          await supabase
            .from('characters')
            .update({ action_used: true })
            .eq('id', attackerId);
        }

        // Log to combat log
        await supabase.from('combat_log').insert({
          encounter_id: encounterId,
          round: 0, // Would need to pass current round
          action_type: checkType,
          message: `${attackerName} ${checkType === 'grapple' ? 'grappled' : 'shoved'} ${targetName}!`,
          details: rollResult,
        });

        toast({
          title: `${checkType === 'grapple' ? 'Grapple' : 'Shove'} Success!`,
          description: `${targetName} is now ${condition}`,
        });

        onSuccess();
      } catch (error) {
        console.error('Error applying condition:', error);
        toast({
          title: "Error",
          description: "Failed to apply condition",
          variant: "destructive",
        });
      }
    } else {
      // Mark action as used even on failure
      if (attackerType === 'character') {
        await supabase
          .from('characters')
          .update({ action_used: true })
          .eq('id', attackerId);
      }

      toast({
        title: `${checkType === 'grapple' ? 'Grapple' : 'Shove'} Failed`,
        description: `${targetName} resisted!`,
        variant: "destructive",
      });
    }

    setRolling(false);
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {checkType === 'grapple' ? 'Grapple Attempt' : 'Shove Attempt'}
          </DialogTitle>
          <DialogDescription>
            {checkType === 'grapple' 
              ? 'Contest Athletics to restrain the target (speed 0)'
              : 'Contest Athletics to knock the target prone or push 5 feet'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Attacker */}
          <div className="bg-primary/10 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{attackerName}</span>
              <Badge>Athletics +{attackerBonus}</Badge>
            </div>
            {result && (
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Dice6 className="w-4 h-4" />
                  <span>Roll: {result.attackerRoll}</span>
                  <span className="text-muted-foreground">+{attackerBonus}</span>
                  <span className="font-bold">= {result.attackerTotal}</span>
                </div>
              </div>
            )}
          </div>

          {/* Target */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{targetName}</span>
              <div className="flex gap-1">
                <Badge variant="outline">Athletics +{targetAthleticsBonus}</Badge>
                <Badge variant="outline">Acrobatics +{targetAcrobaticsBonus}</Badge>
              </div>
            </div>
            {result && (
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Dice6 className="w-4 h-4" />
                  <span>Roll: {result.targetRoll}</span>
                  <span className="text-muted-foreground">
                    +{result.targetUsedAcrobatics ? targetAcrobaticsBonus : targetAthleticsBonus}
                  </span>
                  <span className="font-bold">= {result.targetTotal}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Used {result.targetUsedAcrobatics ? 'Acrobatics' : 'Athletics'}
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg text-center ${
              result.success ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'
            }`}>
              <p className="font-bold text-lg">
                {result.success ? 'Success!' : 'Failed!'}
              </p>
              <p className="text-sm">
                {result.success 
                  ? `${targetName} is ${checkType === 'grapple' ? 'grappled' : 'prone'}`
                  : `${targetName} resisted the ${checkType}`
                }
              </p>
            </div>
          )}

          {/* RAW Rules */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <strong>RAW:</strong> {checkType === 'grapple' 
              ? 'Grapple uses your action. Target must be within reach and no more than one size larger. Success: target is grappled (speed 0). Target can use action to escape (Athletics/Acrobatics vs your Athletics DC).'
              : 'Shove uses your action. Target must be within reach and no more than one size larger. Success: push target 5 feet or knock prone.'
            }
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!result ? (
              <Button
                onClick={handleRoll}
                disabled={rolling}
                className="flex-1"
              >
                <Dice6 className="w-4 h-4 mr-2" />
                Roll Contest
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="flex-1"
                variant={result.success ? "default" : "outline"}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContestedCheckDialog;
