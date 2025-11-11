import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LingeringInjuryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  trigger: 'dropped_to_zero' | 'crit_fail_death_save';
}

// DMG 272 Lingering Injuries Table
const INJURY_TABLE = [
  { roll: 1, name: "Lose an Eye", description: "Disadvantage on Wisdom (Perception) checks that rely on sight and ranged attack rolls. Greater Restoration cures.", effects: { disadvantagePerception: true, disadvantageRangedAttacks: true }, isPermanent: false },
  { roll: 2, name: "Lose an Arm or Hand", description: "No longer able to hold anything with two hands, and only one object at a time. Greater Restoration or Regeneration cures.", effects: { loseArm: true }, isPermanent: false },
  { roll: 3, name: "Lose a Foot or Leg", description: "Speed halved. Cannot use Dash action. Greater Restoration or Regeneration cures.", effects: { speedHalved: true, cannotDash: true }, isPermanent: false },
  { roll: 4, name: "Limp", description: "Speed reduced by 5 feet. Magical healing removes limp.", effects: { speedReduction: 5 }, isPermanent: false },
  { roll: 5, name: "Internal Injury", description: "Whenever you attempt an action, must make DC 15 CON save or lose action and take 1d10 damage. Heals with 10 days bed rest or Greater Restoration.", effects: { internalInjury: true }, isPermanent: false },
  { roll: 6, name: "Broken Ribs", description: "Disadvantage on STR and DEX ability checks. Heals with 10 days bed rest or Greater Restoration.", effects: { disadvantageStrDex: true }, isPermanent: false },
  { roll: 7, name: "Horrible Scar", description: "Disadvantage on CHA (Persuasion) checks, advantage on CHA (Intimidation) checks. Scar can be removed by Greater Restoration.", effects: { disadvantagePersuasion: true, advantageIntimidation: true }, isPermanent: false },
  { roll: 8, name: "Festering Wound", description: "Hit point maximum reduced by 1 every 24 hours. Dies if this reaches 0. Greater Restoration stops reduction.", effects: { festeringWound: true }, isPermanent: false },
  { roll: 9, name: "Minor Scar", description: "No mechanical effect.", effects: {}, isPermanent: true },
  { roll: 10, name: "Broken Bone", description: "Disadvantage on all physical ability checks. Heals with 10 days bed rest or Lesser Restoration.", effects: { disadvantagePhysicalChecks: true }, isPermanent: false },
];

export function LingeringInjuryDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  trigger,
}: LingeringInjuryDialogProps) {
  const [rolling, setRolling] = useState(false);
  const [injury, setInjury] = useState<typeof INJURY_TABLE[0] | null>(null);

  const handleRollInjury = async () => {
    setRolling(true);

    try {
      // Roll 1d10 on lingering injuries table
      const roll = Math.floor(Math.random() * 10) + 1;
      const rolledInjury = INJURY_TABLE.find(i => i.roll === roll) || INJURY_TABLE[8]; // Default to minor scar
      
      setInjury(rolledInjury);

      // Save injury to database
      await supabase.from('lingering_injuries').insert({
        character_id: characterId,
        injury_type: rolledInjury.name,
        description: rolledInjury.description,
        effects: rolledInjury.effects,
        is_permanent: rolledInjury.isPermanent,
      });

      const triggerText = trigger === 'dropped_to_zero' 
        ? 'dropped to 0 HP and survived'
        : 'failed death save by 5+';
      
      toast.error(`${characterName} suffers lingering injury: ${rolledInjury.name} (${triggerText})`);

      setTimeout(() => {
        onOpenChange(false);
        setInjury(null);
      }, 5000);
    } catch (error) {
      console.error('Error rolling lingering injury:', error);
      toast.error("Failed to roll lingering injury");
    } finally {
      setRolling(false);
    }
  };

  const triggerDescription = trigger === 'dropped_to_zero'
    ? `${characterName} dropped to 0 HP and survived`
    : `${characterName} failed a death saving throw by 5 or more`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Lingering Injury (Optional Rule)
          </DialogTitle>
          <DialogDescription>{triggerDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trigger Alert */}
          <Alert variant="destructive">
            <Heart className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">⚠ Injury Roll Required</div>
              <div className="text-sm mt-1">{triggerDescription}</div>
            </AlertDescription>
          </Alert>

          {/* Injury Result */}
          {injury && (
            <Alert className="border-orange-500 bg-orange-50">
              <Dices className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <div className="font-semibold text-lg mb-2">
                  {injury.name}
                </div>
                <div className="text-sm mb-2">{injury.description}</div>
                {injury.isPermanent ? (
                  <div className="text-xs text-red-600 font-semibold">
                    ⚠ Permanent (cannot be healed)
                  </div>
                ) : (
                  <div className="text-xs text-green-600">
                    ✓ Can be healed (see description)
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* RAW Explanation */}
          {!injury && (
            <Alert>
              <AlertDescription className="text-xs">
                <strong>RAW (DMG 272):</strong> Lingering injuries are permanent debilitations that persist after magic healing. Roll 1d10 on the Lingering Injuries table when:
                <ul className="list-disc list-inside mt-1">
                  <li>A creature drops to 0 HP and survives</li>
                  <li>A creature fails a death saving throw by 5 or more</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Roll Button */}
          {!injury && (
            <Button
              onClick={handleRollInjury}
              disabled={rolling}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              <Dices className="w-4 h-4 mr-2" />
              Roll Lingering Injury (1d10)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
