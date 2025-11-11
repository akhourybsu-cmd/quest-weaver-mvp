import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Swords, Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TwoWeaponFightingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  encounterId: string;
  mainHandWeapon: {
    name: string;
    damage: string;
    damageType: string;
    isLight: boolean;
  };
  offHandWeapon: {
    name: string;
    damage: string;
    damageType: string;
    isLight: boolean;
  };
  attackBonus: number;
  abilityModifier: number;
  hasTwoWeaponFightingStyle: boolean;
  hasDualWielderFeat: boolean;
}

export function TwoWeaponFightingDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  encounterId,
  mainHandWeapon,
  offHandWeapon,
  attackBonus,
  abilityModifier,
  hasTwoWeaponFightingStyle,
  hasDualWielderFeat,
}: TwoWeaponFightingDialogProps) {
  const [rolling, setRolling] = useState(false);

  // RAW: Both weapons must be light, unless Dual Wielder feat
  const canTwoWeaponFight = hasDualWielderFeat || (mainHandWeapon.isLight && offHandWeapon.isLight);

  const handleAttack = async () => {
    if (!canTwoWeaponFight) {
      toast.error("Both weapons must be light melee weapons (or have Dual Wielder feat)");
      return;
    }

    setRolling(true);

    try {
      // Main hand attack (with ability modifier to damage)
      const mainRoll = Math.floor(Math.random() * 20) + 1;
      const mainHit = mainRoll + attackBonus;
      
      // Parse main hand damage dice (e.g., "1d8")
      const mainDiceMatch = mainHandWeapon.damage.match(/(\d+)d(\d+)/);
      const mainNumDice = mainDiceMatch ? parseInt(mainDiceMatch[1]) : 1;
      const mainDieSize = mainDiceMatch ? parseInt(mainDiceMatch[2]) : 6;
      
      let mainDamage = abilityModifier; // Always add modifier to main hand
      for (let i = 0; i < mainNumDice; i++) {
        mainDamage += Math.floor(Math.random() * mainDieSize) + 1;
      }

      // Off-hand attack (bonus action, NO ability modifier unless Two-Weapon Fighting style)
      const offRoll = Math.floor(Math.random() * 20) + 1;
      const offHit = offRoll + attackBonus;
      
      // Parse off-hand damage dice
      const offDiceMatch = offHandWeapon.damage.match(/(\d+)d(\d+)/);
      const offNumDice = offDiceMatch ? parseInt(offDiceMatch[1]) : 1;
      const offDieSize = offDiceMatch ? parseInt(offDiceMatch[2]) : 6;
      
      let offDamage = hasTwoWeaponFightingStyle ? abilityModifier : 0; // Only add mod if Fighting Style
      for (let i = 0; i < offNumDice; i++) {
        offDamage += Math.floor(Math.random() * offDieSize) + 1;
      }

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: 0,
        action_type: 'two_weapon_fighting',
        message: `${characterName} attacks with ${mainHandWeapon.name} (${mainHit}) and ${offHandWeapon.name} (${offHit})`,
        details: {
          mainHand: {
            weapon: mainHandWeapon.name,
            roll: mainRoll,
            toHit: mainHit,
            damage: mainDamage,
            damageType: mainHandWeapon.damageType,
          },
          offHand: {
            weapon: offHandWeapon.name,
            roll: offRoll,
            toHit: offHit,
            damage: offDamage,
            damageType: offHandWeapon.damageType,
            modifierAdded: hasTwoWeaponFightingStyle,
          },
        },
      });

      toast.success(`${characterName} attacks: ${mainHandWeapon.name} (${mainHit}, ${mainDamage} dmg) + ${offHandWeapon.name} (${offHit}, ${offDamage} dmg)`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error rolling two-weapon fighting:', error);
      toast.error("Failed to roll attacks");
    } finally {
      setRolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Two-Weapon Fighting
          </DialogTitle>
          <DialogDescription>
            {characterName} attacks with both weapons
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Weapon Info */}
          <Alert>
            <Swords className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Main Hand: {mainHandWeapon.name}</div>
              <div className="text-sm">
                Damage: {mainHandWeapon.damage} + {abilityModifier} ({mainHandWeapon.damageType})
              </div>
              <div className="text-sm">To Hit: +{attackBonus}</div>
            </AlertDescription>
          </Alert>

          <Alert>
            <Swords className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Off-Hand: {offHandWeapon.name} (Bonus Action)</div>
              <div className="text-sm">
                Damage: {offHandWeapon.damage} {hasTwoWeaponFightingStyle ? `+ ${abilityModifier}` : '+ 0'} ({offHandWeapon.damageType})
              </div>
              <div className="text-sm">To Hit: +{attackBonus}</div>
              {hasTwoWeaponFightingStyle && (
                <div className="text-xs text-green-600 mt-1">
                  ✓ Two-Weapon Fighting Style: Add ability modifier to off-hand damage
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Validation */}
          {!canTwoWeaponFight && (
            <Alert variant="destructive">
              <AlertDescription>
                ⚠ Cannot use Two-Weapon Fighting: Both weapons must be light melee weapons (or have Dual Wielder feat)
              </AlertDescription>
            </Alert>
          )}

          {hasDualWielderFeat && !mainHandWeapon.isLight && (
            <Alert className="border-blue-500 bg-blue-50">
              <AlertDescription className="text-blue-900">
                ✓ Dual Wielder feat allows non-light weapons
              </AlertDescription>
            </Alert>
          )}

          {/* RAW Warning */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>RAW:</strong> When you take the Attack action with a light melee weapon in one hand, you can use a bonus action to attack with a different light melee weapon in your other hand. You don't add your ability modifier to the damage of the bonus attack, unless that modifier is negative. (PHB 195)
            </AlertDescription>
          </Alert>

          {/* Attack Button */}
          <Button
            onClick={handleAttack}
            disabled={rolling || !canTwoWeaponFight}
            className="w-full"
            size="lg"
          >
            <Dices className="w-4 h-4 mr-2" />
            Roll Both Attacks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
