import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { useCombatActions } from "@/hooks/useCombatActions";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface QuickHPControlsProps {
  characterId: string;
  characterName: string;
  currentHP: number;
  maxHP: number;
  encounterId: string;
  currentRound: number;
  combatantType: 'character' | 'monster';
}

export function QuickHPControls({
  characterId,
  characterName,
  currentHP,
  maxHP,
  encounterId,
  currentRound,
  combatantType,
}: QuickHPControlsProps) {
  const [damageAmount, setDamageAmount] = useState("");
  const [healAmount, setHealAmount] = useState("");
  const [optimisticHP, setOptimisticHP] = useState<number | null>(null);
  const { applyDamage, applyHealing } = useCombatActions();
  const { toast } = useToast();
  const [damageOpen, setDamageOpen] = useState(false);
  const [healOpen, setHealOpen] = useState(false);

  const displayHP = optimisticHP !== null ? optimisticHP : currentHP;

  const handleQuickDamage = async (amount: number) => {
    if (amount <= 0) return;

    // Optimistic update
    const predictedHP = Math.max(0, currentHP - amount);
    setOptimisticHP(predictedHP);

    try {
      await applyDamage(
        characterId,
        amount,
        "bludgeoning",
        encounterId,
        currentRound,
        "Quick Damage",
        undefined,
        (newHP) => {
          // Server confirmed - clear optimistic state
          setOptimisticHP(null);
        }
      );
      setDamageAmount("");
      setDamageOpen(false);
    } catch (error: any) {
      // Rollback optimistic update on error
      setOptimisticHP(null);
      toast({
        title: "Error applying damage",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleQuickHeal = async (amount: number) => {
    if (amount <= 0) return;

    // Optimistic update
    const predictedHP = Math.min(maxHP, currentHP + amount);
    setOptimisticHP(predictedHP);

    try {
      await applyHealing(
        characterId,
        amount,
        encounterId,
        currentRound,
        "Quick Heal",
        undefined,
        (newHP) => {
          // Server confirmed - clear optimistic state
          setOptimisticHP(null);
        }
      );
      setHealAmount("");
      setHealOpen(false);
    } catch (error: any) {
      // Rollback optimistic update on error
      setOptimisticHP(null);
      toast({
        title: "Error applying healing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-1">
      <Popover open={damageOpen} onOpenChange={setDamageOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Quick Damage"
            aria-label={`Apply damage to ${characterName}`}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Quick Damage</h4>
              <p className="text-xs text-muted-foreground">{characterName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Amount</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={damageAmount}
                  onChange={(e) => setDamageAmount(e.target.value)}
                  placeholder="0"
                  className="h-8"
                  min="1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleQuickDamage(parseInt(damageAmount));
                    }
                  }}
                />
                <Button
                  onClick={() => handleQuickDamage(parseInt(damageAmount))}
                  disabled={!damageAmount || parseInt(damageAmount) <= 0}
                  size="sm"
                  variant="destructive"
                >
                  Apply
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {displayHP - parseInt(damageAmount || "0") < 0
                ? `${characterName} would be at 0 HP`
                : `${displayHP} → ${Math.max(0, displayHP - parseInt(damageAmount || "0"))} HP`}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={healOpen} onOpenChange={setHealOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-status-buff hover:text-status-buff"
            title="Quick Heal"
            aria-label={`Apply healing to ${characterName}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Quick Heal</h4>
              <p className="text-xs text-muted-foreground">{characterName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Amount</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={healAmount}
                  onChange={(e) => setHealAmount(e.target.value)}
                  placeholder="0"
                  className="h-8"
                  min="1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleQuickHeal(parseInt(healAmount));
                    }
                  }}
                />
                <Button
                  onClick={() => handleQuickHeal(parseInt(healAmount))}
                  disabled={!healAmount || parseInt(healAmount) <= 0}
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.min(maxHP, displayHP + parseInt(healAmount || "0")) === maxHP
                ? `${characterName} would be at full HP`
                : `${displayHP} → ${Math.min(maxHP, displayHP + parseInt(healAmount || "0"))}/${maxHP} HP`}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
