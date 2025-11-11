import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scroll, Dices, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScrollCastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  characterClass: string;
  characterLevel: number;
  spellcastingAbility: string;
  spellcastingModifier: number;
  scrollSpellName: string;
  scrollSpellLevel: number;
  scrollItemId: string;
  classSpellLists: string[][]; // Array of class spell lists
}

export function ScrollCastDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  characterClass,
  characterLevel,
  spellcastingAbility,
  spellcastingModifier,
  scrollSpellName,
  scrollSpellLevel,
  scrollItemId,
  classSpellLists,
}: ScrollCastDialogProps) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{
    canCast: boolean;
    needsCheck: boolean;
    roll?: number;
    total?: number;
    dc?: number;
    success?: boolean;
  } | null>(null);

  // Check if spell is on character's class spell list(s)
  const isOnClassList = classSpellLists.some(list => 
    list.includes(scrollSpellName.toLowerCase())
  );

  // Determine max castable spell level for character
  const spellSlotsByLevel: Record<number, number> = {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5,
    10: 5, 11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8, 17: 9, 18: 9, 19: 9, 20: 9
  };
  const maxSpellLevel = spellSlotsByLevel[characterLevel] || 0;

  const handleAttemptCast = async () => {
    setRolling(true);

    try {
      // RAW: If not on class list, scroll is unintelligible
      if (!isOnClassList) {
        setResult({ canCast: false, needsCheck: false });
        toast.error(`${scrollSpellName} is not on ${characterClass} spell list. Scroll is unintelligible.`);
        setRolling(false);
        return;
      }

      // RAW: If spell level > max castable level, need ability check DC 10 + spell level
      if (scrollSpellLevel > maxSpellLevel) {
        const dc = 10 + scrollSpellLevel;
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + spellcastingModifier;
        const success = total >= dc;

        setResult({
          canCast: success,
          needsCheck: true,
          roll,
          total,
          dc,
          success,
        });

        if (success) {
          toast.success(`${characterName} successfully casts ${scrollSpellName} from scroll!`);
          // Consume scroll
          await supabase
            .from('character_equipment')
            .delete()
            .eq('id', scrollItemId);
        } else {
          toast.error(`${characterName} fails to cast ${scrollSpellName}. Scroll crumbles to dust.`);
          // Scroll still consumed on failure
          await supabase
            .from('character_equipment')
            .delete()
            .eq('id', scrollItemId);
        }
      } else {
        // Spell level within character's capability, auto-success
        setResult({ canCast: true, needsCheck: false });
        toast.success(`${characterName} casts ${scrollSpellName} from scroll!`);
        
        // Consume scroll
        await supabase
          .from('character_equipment')
          .delete()
          .eq('id', scrollItemId);
      }

      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
      }, 3000);
    } catch (error) {
      console.error('Error casting scroll:', error);
      toast.error("Failed to cast scroll");
    } finally {
      setRolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scroll className="w-5 h-5" />
            Use Spell Scroll
          </DialogTitle>
          <DialogDescription>
            {characterName} attempts to cast {scrollSpellName} from scroll
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scroll Info */}
          <Alert>
            <Scroll className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Scroll: {scrollSpellName}</div>
              <div className="text-sm">Level {scrollSpellLevel} spell</div>
            </AlertDescription>
          </Alert>

          {/* Class List Check */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Class:</span>
              <span className="font-semibold">{characterClass}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">On Class Spell List:</span>
              <span className={isOnClassList ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {isOnClassList ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            {isOnClassList && scrollSpellLevel > maxSpellLevel && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Spell Level:</span>
                  <span className="font-semibold">{maxSpellLevel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ability Check DC:</span>
                  <span className="font-semibold text-orange-600">
                    {10 + scrollSpellLevel} ({spellcastingAbility})
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Result Display */}
          {result && (
            <Alert variant={result.canCast ? "default" : "destructive"}>
              <Dices className="h-4 w-4" />
              <AlertDescription>
                {!isOnClassList && (
                  <div className="text-sm">
                    The scroll's words are unintelligible. Only characters with {scrollSpellName} on their class spell list can read this scroll.
                  </div>
                )}
                {isOnClassList && result.needsCheck && (
                  <>
                    <div className="font-semibold mb-1">
                      {result.success ? "✓ Success!" : "✗ Failed!"}
                    </div>
                    <div className="text-sm">
                      {spellcastingAbility} Check: {result.roll} + {spellcastingModifier} = {result.total} vs DC {result.dc}
                    </div>
                    <div className="text-sm mt-1">
                      {result.success ? "Spell cast successfully!" : "Spell fails to cast. Scroll crumbles to dust."}
                    </div>
                  </>
                )}
                {isOnClassList && !result.needsCheck && result.canCast && (
                  <div className="text-sm">
                    ✓ Spell cast successfully! Scroll consumed.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* RAW Warning */}
          {!result && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>RAW:</strong> If the spell is on your class's spell list, you can cast it. If it's higher level than you can normally cast, make a {spellcastingAbility} check (DC 10 + spell level). On a failed check, the scroll is consumed but the spell doesn't cast. (DMG 200)
              </AlertDescription>
            </Alert>
          )}

          {/* Cast Button */}
          {!result && (
            <Button
              onClick={handleAttemptCast}
              disabled={rolling}
              className="w-full"
              size="lg"
              variant={!isOnClassList ? "destructive" : "default"}
            >
              <Scroll className="w-4 h-4 mr-2" />
              {!isOnClassList ? "Cannot Read Scroll" : "Cast Spell from Scroll"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
