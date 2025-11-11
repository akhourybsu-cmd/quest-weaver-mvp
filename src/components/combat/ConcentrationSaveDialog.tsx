import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Focus, Dices, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConcentrationSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  damageTaken: number;
  encounterId: string;
  concentrationSpell: string;
  conModifier: number;
  isProficient: boolean;
  level: number;
}

export function ConcentrationSaveDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  damageTaken,
  encounterId,
  concentrationSpell,
  conModifier,
  isProficient,
  level,
}: ConcentrationSaveDialogProps) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{
    roll: number;
    total: number;
    dc: number;
    success: boolean;
  } | null>(null);

  // RAW: DC = 10 or half damage (whichever is higher)
  const dc = Math.max(10, Math.floor(damageTaken / 2));
  
  // Calculate save bonus: CON mod + prof bonus (if proficient)
  const profBonus = isProficient ? Math.floor((level - 1) / 4) + 2 : 0;
  const saveBonus = conModifier + profBonus;

  const rollSave = async () => {
    setRolling(true);

    try {
      // Roll d20
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + saveBonus;
      const success = total >= dc;

      setResult({ roll, total, dc, success });

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: 0,
        action_type: 'concentration_check',
        message: `${characterName} ${success ? 'maintains' : 'loses'} concentration on ${concentrationSpell}`,
        details: {
          roll,
          modifier: saveBonus,
          total,
          dc,
          damage: damageTaken,
          success,
        },
      });

      if (!success) {
        // Break concentration - delete all concentration effects for this character
        await supabase
          .from('effects')
          .delete()
          .eq('concentrating_character_id', characterId)
          .eq('requires_concentration', true);

        toast.error(`${characterName} loses concentration on ${concentrationSpell}`);
      } else {
        toast.success(`${characterName} maintains concentration on ${concentrationSpell}`);
      }

      // Auto-close after showing result
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
      }, 3000);
    } catch (error) {
      console.error('Error rolling concentration save:', error);
      toast.error("Failed to roll concentration save");
    } finally {
      setRolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Focus className="w-5 h-5" />
            Concentration Check
          </DialogTitle>
          <DialogDescription>
            {characterName} took {damageTaken} damage while concentrating
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Spell Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Concentrating On:</div>
              <div className="text-sm">{concentrationSpell}</div>
            </AlertDescription>
          </Alert>

          {/* DC Calculation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Damage Taken:</span>
              <span className="font-semibold">{damageTaken}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Required DC:</span>
              <Badge variant="secondary" className="font-semibold">
                {dc} (10 or half damage)
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Save Bonus:</span>
              <span className="font-semibold">+{saveBonus}</span>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <Dices className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">
                  {result.success ? "✓ Success!" : "✗ Failed!"}
                </div>
                <div className="text-sm">
                  Rolled {result.roll} + {saveBonus} = {result.total} vs DC {result.dc}
                </div>
                {result.success ? (
                  <div className="text-sm mt-1">Concentration maintained</div>
                ) : (
                  <div className="text-sm mt-1">Concentration broken</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          {!result && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>RAW:</strong> When you take damage while concentrating on a spell, you must make a Constitution saving throw to maintain concentration. The DC equals 10 or half the damage you took, whichever number is higher.
              </AlertDescription>
            </Alert>
          )}

          {/* Roll Button */}
          {!result && (
            <Button
              onClick={rollSave}
              disabled={rolling}
              className="w-full"
              size="lg"
            >
              <Dices className="w-4 h-4 mr-2" />
              Roll Constitution Save
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
