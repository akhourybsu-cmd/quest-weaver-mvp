import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DamageType } from "@/types/combat";

interface Target {
  id: string;
  name: string;
  type: 'character' | 'monster';
}

interface AoEDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounterId: string;
  casterId: string;
  casterType: 'character' | 'monster';
  availableTargets: Target[];
  spellName: string;
  spellLevel: number;
}

const DAMAGE_TYPES: DamageType[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder'
];

export function AoEDamageDialog({
  open,
  onOpenChange,
  encounterId,
  casterId,
  casterType,
  availableTargets,
  spellName,
  spellLevel,
}: AoEDamageDialogProps) {
  const [damageRoll, setDamageRoll] = useState("");
  const [damageType, setDamageType] = useState<DamageType>("fire");
  const [saveDC, setSaveDC] = useState("");
  const [saveAbility, setSaveAbility] = useState<"str" | "dex" | "con" | "int" | "wis" | "cha">("dex");
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [includeFriendlyFire, setIncludeFriendlyFire] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTarget = (targetId: string) => {
    const newSet = new Set(selectedTargets);
    if (newSet.has(targetId)) {
      newSet.delete(targetId);
    } else {
      newSet.add(targetId);
    }
    setSelectedTargets(newSet);
  };

  const rollDamage = () => {
    // Parse dice notation like "8d6" and roll
    const match = damageRoll.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) {
      toast.error("Invalid damage format. Use format like '8d6' or '8d6+3'");
      return null;
    }

    const [, numDice, dieSize, modifier] = match;
    const dice = parseInt(numDice);
    const size = parseInt(dieSize);
    const mod = modifier ? parseInt(modifier) : 0;

    let total = mod;
    const rolls: number[] = [];
    
    for (let i = 0; i < dice; i++) {
      const roll = Math.floor(Math.random() * size) + 1;
      rolls.push(roll);
      total += roll;
    }

    return { total, rolls, modifier: mod };
  };

  const handleSubmit = async () => {
    if (!damageRoll || !saveDC || selectedTargets.size === 0) {
      toast.error("Please fill in all fields and select at least one target");
      return;
    }

    setIsSubmitting(true);

    try {
      // Roll damage once
      const damageResult = rollDamage();
      if (!damageResult) {
        setIsSubmitting(false);
        return;
      }

      const { total: fullDamage, rolls } = damageResult;

      // Create save prompt for all selected targets
      const targetIds = Array.from(selectedTargets);
      const { data: savePrompt, error: promptError } = await supabase
        .from('save_prompts')
        .insert({
          encounter_id: encounterId,
          ability: saveAbility.toUpperCase() as any,
          dc: parseInt(saveDC),
          target_scope: 'custom',
          target_character_ids: targetIds,
          description: `${spellName} (AoE)`,
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: 1, // Will be updated by trigger
        action_type: 'spell',
        message: `${spellName} affects ${selectedTargets.size} targets`,
        details: {
          spell: spellName,
          damage_roll: damageRoll,
          damage: fullDamage,
          damage_type: damageType,
          save_dc: parseInt(saveDC),
          save_ability: saveAbility,
          rolls,
          targets: targetIds.length,
          save_prompt_id: savePrompt.id,
        },
      });

      toast.success(`${spellName} cast! Targets must make DC ${saveDC} ${saveAbility.toUpperCase()} saves.`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating AoE damage:", error);
      toast.error("Failed to apply AoE damage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{spellName} - Area of Effect Damage</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Damage Roll (e.g., 8d6)</Label>
              <Input
                value={damageRoll}
                onChange={(e) => setDamageRoll(e.target.value)}
                placeholder="8d6"
              />
            </div>

            <div>
              <Label>Damage Type</Label>
              <Select value={damageType} onValueChange={(v) => setDamageType(v as DamageType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Save DC</Label>
              <Input
                type="number"
                value={saveDC}
                onChange={(e) => setSaveDC(e.target.value)}
                placeholder="15"
              />
            </div>

            <div>
              <Label>Save Ability</Label>
              <Select value={saveAbility} onValueChange={(v: any) => setSaveAbility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="str">Strength</SelectItem>
                  <SelectItem value="dex">Dexterity</SelectItem>
                  <SelectItem value="con">Constitution</SelectItem>
                  <SelectItem value="int">Intelligence</SelectItem>
                  <SelectItem value="wis">Wisdom</SelectItem>
                  <SelectItem value="cha">Charisma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="friendly-fire"
              checked={includeFriendlyFire}
              onCheckedChange={(checked) => setIncludeFriendlyFire(checked as boolean)}
            />
            <Label htmlFor="friendly-fire" className="cursor-pointer">
              Include allies in area (friendly fire)
            </Label>
          </div>

          <div>
            <Label>Select Targets ({selectedTargets.size} selected)</Label>
            <div className="mt-2 border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {availableTargets.map(target => (
                <div key={target.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={target.id}
                    checked={selectedTargets.has(target.id)}
                    onCheckedChange={() => toggleTarget(target.id)}
                  />
                  <Label htmlFor={target.id} className="cursor-pointer flex-1">
                    {target.name} ({target.type})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              Cast Spell
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
