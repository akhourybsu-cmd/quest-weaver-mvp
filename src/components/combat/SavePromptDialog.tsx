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
import { Shield } from "lucide-react";

const ABILITIES = [
  { value: "STR", label: "Strength" },
  { value: "DEX", label: "Dexterity" },
  { value: "CON", label: "Constitution" },
  { value: "INT", label: "Intelligence" },
  { value: "WIS", label: "Wisdom" },
  { value: "CHA", label: "Charisma" },
];

const TARGET_SCOPES = [
  { value: "party", label: "All Party Members" },
  { value: "all", label: "All Combatants" },
  { value: "custom", label: "Custom Selection" },
];

const ADVANTAGE_MODES = [
  { value: "normal", label: "Normal" },
  { value: "advantage", label: "Advantage" },
  { value: "disadvantage", label: "Disadvantage" },
];

interface SavePromptDialogProps {
  encounterId: string;
  onPromptSave: (data: {
    ability: string;
    dc: number;
    description: string;
    targetScope: string;
    advantageMode: string;
    halfOnSuccess: boolean;
  }) => void;
}

const SavePromptDialog = ({ onPromptSave }: SavePromptDialogProps) => {
  const [ability, setAbility] = useState("DEX");
  const [dc, setDc] = useState("");
  const [description, setDescription] = useState("");
  const [targetScope, setTargetScope] = useState("party");
  const [advantageMode, setAdvantageMode] = useState("normal");
  const [halfOnSuccess, setHalfOnSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (loading) return;
    
    const dcNum = parseInt(dc);
    if (ability && dcNum && description) {
      setLoading(true);
      onPromptSave({
        ability,
        dc: dcNum,
        description,
        targetScope,
        advantageMode,
        halfOnSuccess,
      });
      setDc("");
      setDescription("");
      setTargetScope("party");
      setAdvantageMode("normal");
      setHalfOnSuccess(false);
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Request Save
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Saving Throw</DialogTitle>
          <DialogDescription>
            Configure and send a saving throw to players.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Target Scope</Label>
            <Select value={targetScope} onValueChange={setTargetScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_SCOPES.map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ability">Ability</Label>
            <Select value={ability} onValueChange={setAbility}>
              <SelectTrigger id="ability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ABILITIES.map((ab) => (
                  <SelectItem key={ab.value} value={ab.value}>
                    {ab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dc">DC (Difficulty Class)</Label>
            <Input
              id="dc"
              type="number"
              min="1"
              max="30"
              value={dc}
              onChange={(e) => setDc(e.target.value)}
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <Label>Roll Mode</Label>
            <Select value={advantageMode} onValueChange={setAdvantageMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADVANTAGE_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="half-damage">Half Damage on Success</Label>
            <Switch
              id="half-damage"
              checked={halfOnSuccess}
              onCheckedChange={setHalfOnSuccess}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Fireball explodes in the room"
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={loading || !dc || !description}>
            {loading ? "Sending..." : "Send Save Prompt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavePromptDialog;
