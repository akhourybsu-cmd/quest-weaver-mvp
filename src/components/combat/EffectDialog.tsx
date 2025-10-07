import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force",
  "lightning", "necrotic", "piercing", "poison",
  "psychic", "radiant", "slashing", "thunder"
];

const TICK_TIMINGS = [
  { value: "start", label: "Start of Turn" },
  { value: "end", label: "End of Turn" },
];

interface EffectDialogProps {
  encounterId: string;
  currentRound: number;
  characters: Array<{ id: string; name: string }>;
}

const EffectDialog = ({ encounterId, currentRound, characters }: EffectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [duration, setDuration] = useState("");
  const [requiresConcentration, setRequiresConcentration] = useState(false);
  const [concentratingCharacterId, setConcentratingCharacterId] = useState("");
  const [damagePerTick, setDamagePerTick] = useState("");
  const [damageType, setDamageType] = useState("fire");
  const [tickTiming, setTickTiming] = useState("end");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name || !targetCharacterId) {
      toast({
        title: "Missing fields",
        description: "Name and target are required",
        variant: "destructive",
      });
      return;
    }

    const endRound = duration ? currentRound + parseInt(duration) : null;

    const { error } = await supabase.from("effects").insert([{
      encounter_id: encounterId,
      character_id: targetCharacterId,
      name,
      description: description || null,
      source: source || null,
      start_round: currentRound,
      end_round: endRound,
      requires_concentration: requiresConcentration,
      concentrating_character_id: requiresConcentration ? concentratingCharacterId : null,
      damage_per_tick: damagePerTick ? parseInt(damagePerTick) : null,
      damage_type_per_tick: damagePerTick ? (damageType as any) : null,
      ticks_at: tickTiming as any,
    }]);

    if (error) {
      toast({
        title: "Error adding effect",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Effect added",
      description: `${name} applied to character`,
    });

    // Reset form
    setName("");
    setDescription("");
    setSource("");
    setTargetCharacterId("");
    setDuration("");
    setRequiresConcentration(false);
    setConcentratingCharacterId("");
    setDamagePerTick("");
    setDamageType("fire");
    setTickTiming("end");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Add Effect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Effect/Condition</DialogTitle>
          <DialogDescription>
            Apply a condition, buff, or debuff to a character
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target Character *</Label>
            <Select value={targetCharacterId} onValueChange={setTargetCharacterId}>
              <SelectTrigger id="target">
                <SelectValue placeholder="Select character..." />
              </SelectTrigger>
              <SelectContent>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Effect Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Poisoned, Bless, Hunter's Mark"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Effect details..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Spell, ability, item"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (rounds)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Leave blank for indefinite"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="concentration">Requires Concentration</Label>
            <Switch
              id="concentration"
              checked={requiresConcentration}
              onCheckedChange={setRequiresConcentration}
            />
          </div>

          {requiresConcentration && (
            <div className="space-y-2">
              <Label htmlFor="concentrator">Concentrating Character</Label>
              <Select value={concentratingCharacterId} onValueChange={setConcentratingCharacterId}>
                <SelectTrigger id="concentrator">
                  <SelectValue placeholder="Select character..." />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="damage-tick">Damage per Tick (optional)</Label>
            <Input
              id="damage-tick"
              type="number"
              min="0"
              value={damagePerTick}
              onChange={(e) => setDamagePerTick(e.target.value)}
              placeholder="e.g., 2d6 = 7"
            />
          </div>

          {damagePerTick && (
            <>
              <div className="space-y-2">
                <Label htmlFor="damage-type-tick">Damage Type</Label>
                <Select value={damageType} onValueChange={setDamageType}>
                  <SelectTrigger id="damage-type-tick">
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

              <div className="space-y-2">
                <Label htmlFor="tick-timing">Damage Timing</Label>
                <Select value={tickTiming} onValueChange={setTickTiming}>
                  <SelectTrigger id="tick-timing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICK_TIMINGS.map((timing) => (
                      <SelectItem key={timing.value} value={timing.value}>
                        {timing.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Add Effect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EffectDialog;
