import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface SavePromptDialogProps {
  encounterId: string;
  onPromptSave: (ability: string, dc: number, description: string) => void;
}

const SavePromptDialog = ({ onPromptSave }: SavePromptDialogProps) => {
  const [ability, setAbility] = useState("DEX");
  const [dc, setDc] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    const dcNum = parseInt(dc);
    if (ability && dcNum && description) {
      onPromptSave(ability, dcNum, description);
      setDc("");
      setDescription("");
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
            All players will be prompted to make a saving throw.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Fireball explodes in the room"
              rows={3}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Send Save Prompt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavePromptDialog;
