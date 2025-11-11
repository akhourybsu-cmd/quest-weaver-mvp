import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Swords, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AttackRollDialog from "./AttackRollDialog";
import { useCombatModifiers } from "@/hooks/useCombatModifiers";

interface OpportunityAttackPromptProps {
  encounterId: string;
  attackerId: string;
  attackerType: 'character' | 'monster';
  attackerName: string;
  targetId: string;
  targetType: 'character' | 'monster';
  targetName: string;
  targetAC: number;
  onResolve: (attacked: boolean) => void;
}

const OpportunityAttackPrompt = ({
  encounterId,
  attackerId,
  attackerType,
  attackerName,
  targetId,
  targetType,
  targetName,
  targetAC,
  onResolve,
}: OpportunityAttackPromptProps) => {
  const [open, setOpen] = useState(true);
  const [reactionAvailable, setReactionAvailable] = useState(true);
  const [showAttackRoll, setShowAttackRoll] = useState(false);
  const { toast } = useToast();
  const modifiers = useCombatModifiers(encounterId, attackerId, attackerType);

  useEffect(() => {
    checkReactionAvailable();
  }, []);

  const checkReactionAvailable = async () => {
    if (attackerType === 'character') {
      const { data } = await supabase
        .from('characters')
        .select('reaction_used')
        .eq('id', attackerId)
        .single();
      
      setReactionAvailable(!data?.reaction_used);
    } else {
      // For monsters, check initiative table
      const { data } = await supabase
        .from('initiative')
        .select('combatant_id')
        .eq('encounter_id', encounterId)
        .eq('combatant_id', attackerId)
        .single();
      
      // Simplified: assume monsters have reactions unless we add tracking
      setReactionAvailable(true);
    }
  };

  const handleAttack = () => {
    setShowAttackRoll(true);
  };

  const handleDecline = async () => {
    // Log that OA was declined
    await supabase.from('opportunity_attacks').insert({
      encounter_id: encounterId,
      attacker_id: attackerId,
      attacker_type: attackerType,
      target_id: targetId,
      target_type: targetType,
      resolved: true,
      attack_result: { declined: true },
    });

    toast({
      title: "Opportunity Attack Declined",
      description: `${attackerName} chose not to attack`,
    });

    setOpen(false);
    onResolve(false);
  };

  const handleAttackComplete = async (result: any) => {
    // Mark reaction as used
    if (attackerType === 'character') {
      await supabase
        .from('characters')
        .update({ reaction_used: true })
        .eq('id', attackerId);
    }

    // Log the OA
    await supabase.from('opportunity_attacks').insert({
      encounter_id: encounterId,
      attacker_id: attackerId,
      attacker_type: attackerType,
      target_id: targetId,
      target_type: targetType,
      resolved: true,
      attack_result: result,
    });

    toast({
      title: "Opportunity Attack Resolved",
      description: result.hit ? `Hit! ${result.damage} damage` : "Missed!",
    });

    setOpen(false);
    onResolve(true);
  };

  if (showAttackRoll) {
    // For opportunity attacks, we use the old dialog format
    // TODO: Integrate with proper AttackRollDialog when ready
    return null; // Placeholder
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-destructive" />
            Opportunity Attack!
          </DialogTitle>
          <DialogDescription>
            {targetName} is leaving {attackerName}'s reach
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Attacker Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{attackerName}</span>
              <Badge variant={reactionAvailable ? "default" : "destructive"}>
                {reactionAvailable ? "Reaction Available" : "No Reaction"}
              </Badge>
            </div>
            
            {modifiers.advantageMode !== 'normal' && (
              <div className="text-sm">
                <Badge variant={modifiers.advantageMode === 'advantage' ? 'default' : 'destructive'}>
                  {modifiers.advantageMode === 'advantage' ? 'Advantage' : 'Disadvantage'}
                </Badge>
                <span className="text-muted-foreground ml-2">
                  {modifiers.sources.advantages[0] || modifiers.sources.disadvantages[0]}
                </span>
              </div>
            )}
          </div>

          {/* Target Info */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-medium">{targetName}</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>AC {targetAC}</span>
            </div>
          </div>

          {/* RAW Rules */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <strong>RAW:</strong> Opportunity attacks use your reaction. The target must be leaving your reach without using the Disengage action.
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleAttack}
              disabled={!reactionAvailable}
              className="flex-1"
              variant="destructive"
            >
              <Swords className="w-4 h-4 mr-2" />
              Make Attack
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpportunityAttackPrompt;
