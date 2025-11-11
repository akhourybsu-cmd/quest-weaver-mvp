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
import { Dice6, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EscapeGrappleButtonProps {
  characterId: string;
  characterName: string;
  athleticsBonus: number;
  acrobaticsBonus: number;
  encounterId: string;
  grapplerDC: number; // 8 + proficiency + STR mod of grappler
  conditionId: string;
}

const EscapeGrappleButton = ({
  characterId,
  characterName,
  athleticsBonus,
  acrobaticsBonus,
  grapplerDC,
  encounterId,
  conditionId,
}: EscapeGrappleButtonProps) => {
  const [open, setOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{
    roll: number;
    bonus: number;
    total: number;
    usedAcrobatics: boolean;
    success: boolean;
  } | null>(null);
  const { toast } = useToast();

  const rollD20 = () => Math.floor(Math.random() * 20) + 1;

  const handleEscapeAttempt = async () => {
    setRolling(true);

    // Choose better skill (Athletics or Acrobatics)
    const usedAcrobatics = acrobaticsBonus > athleticsBonus;
    const bonus = usedAcrobatics ? acrobaticsBonus : athleticsBonus;
    const roll = rollD20();
    const total = roll + bonus;
    const success = total >= grapplerDC;

    const escapeResult = {
      roll,
      bonus,
      total,
      usedAcrobatics,
      success,
    };

    setResult(escapeResult);

    // If successful, remove grappled condition
    if (success) {
      try {
        await supabase
          .from('character_conditions')
          .delete()
          .eq('id', conditionId);

        // Mark action as used
        await supabase
          .from('characters')
          .update({ action_used: true })
          .eq('id', characterId);

        toast({
          title: "Escape Successful!",
          description: `${characterName} is no longer grappled`,
        });
      } catch (error) {
        console.error('Error escaping grapple:', error);
        toast({
          title: "Error",
          description: "Failed to escape grapple",
          variant: "destructive",
        });
      }
    } else {
      // Mark action as used even on failure
      await supabase
        .from('characters')
        .update({ action_used: true })
        .eq('id', characterId);

      toast({
        title: "Escape Failed",
        description: `${characterName} remains grappled`,
        variant: "destructive",
      });
    }

    setRolling(false);
  };

  const handleClose = () => {
    setResult(null);
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <Unlink className="w-4 h-4 mr-2" />
        Escape Grapple
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlink className="w-5 h-5" />
              Escape Grapple
            </DialogTitle>
            <DialogDescription>
              Use your action to break free (Athletics or Acrobatics check)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Character Info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{characterName}</span>
                <div className="flex gap-1">
                  <Badge variant="outline">Athletics +{athleticsBonus}</Badge>
                  <Badge variant="outline">Acrobatics +{acrobaticsBonus}</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                DC: {grapplerDC}
              </div>
              {result && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Dice6 className="w-4 h-4" />
                    <span>Roll: {result.roll}</span>
                    <span className="text-muted-foreground">+{result.bonus}</span>
                    <span className="font-bold">= {result.total}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Used {result.usedAcrobatics ? 'Acrobatics' : 'Athletics'}
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
                  {result.success ? 'Escaped!' : 'Failed!'}
                </p>
                <p className="text-sm">
                  {result.success 
                    ? 'You are no longer grappled'
                    : 'You remain grappled'
                  }
                </p>
              </div>
            )}

            {/* RAW Rules */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <strong>RAW:</strong> Escaping a grapple requires using your action to make an Athletics or Acrobatics check against the grappler's escape DC (8 + proficiency + STR modifier).
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!result ? (
                <Button
                  onClick={handleEscapeAttempt}
                  disabled={rolling}
                  className="flex-1"
                >
                  <Dice6 className="w-4 h-4 mr-2" />
                  Attempt Escape
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
    </>
  );
};

export default EscapeGrappleButton;
