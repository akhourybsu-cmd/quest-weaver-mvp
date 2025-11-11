import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FallDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  encounterId: string;
}

export function FallDamageDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  encounterId,
}: FallDamageDialogProps) {
  const [distance, setDistance] = useState(10);
  const [applying, setApplying] = useState(false);

  const handleApplyFallDamage = async () => {
    setApplying(true);

    try {
      // RAW: 1d6 per 10ft, max 20d6
      const numDice = Math.min(Math.floor(distance / 10), 20);
      
      // Roll damage
      let totalDamage = 0;
      const rolls: number[] = [];
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        totalDamage += roll;
      }

      // Apply damage via edge function
      const { error } = await supabase.functions.invoke('apply-damage', {
        body: {
          encounterId,
          targetId: characterId,
          targetType: 'character',
          damage: totalDamage,
          damageType: 'bludgeoning',
          source: `Fall damage (${distance}ft)`,
        },
      });

      if (error) throw error;

      // Apply prone condition if >10ft
      if (distance > 10) {
        await supabase.from('effects').insert({
          encounter_id: encounterId,
          character_id: characterId,
          name: 'Prone',
          description: 'Prone from fall',
          source: 'Fall',
          start_round: 0,
          requires_concentration: false,
        });
      }

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: 0,
        action_type: 'fall_damage',
        message: `${characterName} falls ${distance}ft and takes ${totalDamage} bludgeoning damage${distance > 10 ? ' (prone)' : ''}`,
        details: {
          distance,
          numDice,
          rolls,
          totalDamage,
          prone: distance > 10,
        },
      });

      toast.success(`${characterName} takes ${totalDamage} fall damage${distance > 10 ? ' and lands prone' : ''}!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying fall damage:', error);
      toast.error("Failed to apply fall damage");
    } finally {
      setApplying(false);
    }
  };

  const numDice = Math.min(Math.floor(distance / 10), 20);
  const maxDamage = numDice * 6;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5" />
            Fall Damage
          </DialogTitle>
          <DialogDescription>
            {characterName} falls from height
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Distance Input */}
          <div className="space-y-2">
            <Label htmlFor="distance">Fall Distance (feet)</Label>
            <Input
              id="distance"
              type="number"
              min={10}
              max={500}
              step={10}
              value={distance}
              onChange={(e) => setDistance(Math.max(10, parseInt(e.target.value) || 10))}
            />
          </div>

          {/* Damage Calculation */}
          <Alert>
            <Dices className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Damage: {numDice}d6 bludgeoning</div>
              <div className="text-sm mt-1">
                ({numDice} × 1d6, max {maxDamage} damage)
              </div>
              {distance > 10 && (
                <div className="text-sm mt-1 text-orange-600 font-semibold">
                  ⚠ Lands prone
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* RAW Warning */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>RAW:</strong> A creature takes 1d6 bludgeoning damage for every 10 feet it falls, to a maximum of 20d6. Landing prone after falling more than 10 feet. (PHB 183)
            </AlertDescription>
          </Alert>

          {/* Apply Button */}
          <Button
            onClick={handleApplyFallDamage}
            disabled={applying}
            className="w-full"
            size="lg"
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Apply Fall Damage ({numDice}d6)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
