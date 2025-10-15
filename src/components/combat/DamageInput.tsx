import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Swords } from "lucide-react";

const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force",
  "lightning", "necrotic", "piercing", "poison",
  "psychic", "radiant", "slashing", "thunder"
];

interface DamageInputProps {
  characterId: string;
  characterName: string;
  sourceName?: string;
  onApplyDamage: (amount: number, damageType: string, sourceName?: string, abilityName?: string) => void;
}

const DamageInput = ({ characterName, sourceName, onApplyDamage }: DamageInputProps) => {
  const [amount, setAmount] = useState("");
  const [damageType, setDamageType] = useState("bludgeoning");
  const [abilityName, setAbilityName] = useState("");
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    const dmg = parseInt(amount);
    if (dmg && dmg > 0) {
      const finalSource = sourceName || "DM";
      const finalAbility = abilityName.trim() || "Attack";
      onApplyDamage(dmg, damageType, finalSource, finalAbility);
      setAmount("");
      setAbilityName("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Swords className="w-4 h-4 mr-2" />
          Damage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Damage to {characterName}</DialogTitle>
          <DialogDescription>
            Select damage type and amount. Resistances and vulnerabilities will be automatically applied.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ability-name">Ability/Move Name</Label>
            <Input
              id="ability-name"
              type="text"
              value={abilityName}
              onChange={(e) => setAbilityName(e.target.value)}
              placeholder="Attack, Fireball, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="damage-amount">Damage Amount</Label>
            <Input
              id="damage-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="damage-type">Damage Type</Label>
            <Select value={damageType} onValueChange={setDamageType}>
              <SelectTrigger id="damage-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAMAGE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleApply} className="w-full">
            Apply Damage
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DamageInput;
