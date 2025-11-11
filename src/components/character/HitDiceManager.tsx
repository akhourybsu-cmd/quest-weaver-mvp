import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Dices, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HitDiceManagerProps {
  characterId: string;
  character: {
    hit_dice_current: number;
    hit_dice_total: number;
    hit_die: string;
    current_hp: number;
    max_hp: number;
    level: number;
    con_save: number; // We'll derive CON from save bonus
  };
  onHeal: (amount: number) => void;
}

const HitDiceManager = ({ characterId, character, onHeal }: HitDiceManagerProps) => {
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ roll: number; con: number; total: number } | null>(null);
  const { toast } = useToast();

  // Calculate CON modifier from save bonus (save = ability mod + prof if proficient)
  // For now, use a simplified approach - we'll improve this when we have ability scores table
  const getConModifier = (): number => {
    // Rough estimate: assume proficient if save is unusually high
    // This is a placeholder - ideally we'd have actual ability scores
    return Math.floor(character.con_save / 2);
  };

  const rollHitDie = async () => {
    if (character.hit_dice_current <= 0) {
      toast({
        title: "No Hit Dice Available",
        description: "You have no hit dice remaining. Take a long rest to restore them.",
        variant: "destructive",
      });
      return;
    }

    if (character.current_hp >= character.max_hp) {
      toast({
        title: "Already at Max HP",
        description: "You are already at maximum hit points.",
      });
      return;
    }

    setRolling(true);

    try {
      // Get CON modifier
      const conMod = getConModifier();

      // Parse hit die (e.g., "d8" -> 8)
      const dieSize = parseInt(character.hit_die.replace('d', ''));
      
      // Roll the die
      const roll = Math.floor(Math.random() * dieSize) + 1;
      const healing = Math.max(1, roll + conMod); // Minimum 1 HP

      // Update character
      const newHp = Math.min(character.current_hp + healing, character.max_hp);
      const { error: updateError } = await supabase
        .from('characters')
        .update({
          current_hp: newHp,
          hit_dice_current: character.hit_dice_current - 1,
        })
        .eq('id', characterId);

      if (updateError) throw updateError;

      // Log the roll
      await supabase.from('hit_dice_rolls').insert({
        character_id: characterId,
        rest_type: 'short',
        dice_rolled: 1,
        roll_result: roll,
        con_modifier: conMod,
        total_healing: healing,
      });

      setLastRoll({ roll, con: conMod, total: healing });
      onHeal(healing);

      toast({
        title: "Hit Die Rolled!",
        description: `Rolled ${roll} + ${conMod} CON = ${healing} HP healed`,
      });
    } catch (error) {
      console.error('Error rolling hit die:', error);
      toast({
        title: "Error",
        description: "Failed to roll hit die",
        variant: "destructive",
      });
    } finally {
      setRolling(false);
    }
  };

  const isAtMaxHp = character.current_hp >= character.max_hp;
  const hasHitDice = character.hit_dice_current > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Hit Dice
        </CardTitle>
        <CardDescription>
          Spend hit dice during a short rest to regain HP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hit Dice Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {character.hit_dice_current} / {character.hit_dice_total}
            </span>
            <Badge variant="outline">{character.hit_die}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Available
          </div>
        </div>

        {/* Current HP */}
        <div className="flex items-center justify-between py-2 border-t">
          <span className="text-sm text-muted-foreground">Current HP</span>
          <span className="font-medium">
            {character.current_hp} / {character.max_hp}
          </span>
        </div>

        {/* Last Roll Display */}
        {lastRoll && (
          <Alert>
            <Plus className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Last Roll</div>
              <div className="text-sm">
                {lastRoll.roll} (die) + {lastRoll.con} (CON) = {lastRoll.total} HP
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {!hasHitDice && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hit dice remaining. Long rest restores {Math.max(1, Math.floor(character.hit_dice_total / 2))} hit dice.
            </AlertDescription>
          </Alert>
        )}

        {isAtMaxHp && hasHitDice && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are at maximum HP
            </AlertDescription>
          </Alert>
        )}

        {/* Roll Button */}
        <Button
          onClick={rollHitDie}
          disabled={rolling || !hasHitDice || isAtMaxHp}
          className="w-full"
          size="lg"
        >
          <Dices className="w-4 h-4 mr-2" />
          Roll {character.hit_die} Hit Die
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Long rest restores half your hit dice (minimum 1)
        </div>
      </CardContent>
    </Card>
  );
};

export default HitDiceManager;
