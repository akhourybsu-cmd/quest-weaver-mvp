import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

interface ClassResource {
  name: string;
  total: number;
  used: number;
  resetOn: 'short' | 'long';
}

interface ResourceSetupDialogProps {
  characterId: string;
  characterName: string;
  currentResources: {
    spellSlots?: SpellSlot[];
    classResources?: ClassResource[];
  };
  onUpdate: () => void;
}

export function ResourceSetupDialog({
  characterId,
  characterName,
  currentResources,
  onUpdate,
}: ResourceSetupDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>(
    currentResources.spellSlots || []
  );
  const [classResources, setClassResources] = useState<ClassResource[]>(
    currentResources.classResources || []
  );

  const [newSlotLevel, setNewSlotLevel] = useState<string>("1");
  const [newSlotTotal, setNewSlotTotal] = useState<string>("2");
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceTotal, setNewResourceTotal] = useState<string>("1");
  const [newResourceReset, setNewResourceReset] = useState<'short' | 'long'>('short');

  const addSpellSlot = () => {
    const level = parseInt(newSlotLevel);
    const total = parseInt(newSlotTotal);

    if (isNaN(level) || isNaN(total) || level < 1 || level > 9 || total < 1) {
      toast({
        title: "Invalid input",
        description: "Please enter valid spell slot values",
        variant: "destructive",
      });
      return;
    }

    if (spellSlots.some(s => s.level === level)) {
      toast({
        title: "Duplicate level",
        description: `Level ${level} spell slot already exists`,
        variant: "destructive",
      });
      return;
    }

    setSpellSlots([...spellSlots, { level, total, used: 0 }].sort((a, b) => a.level - b.level));
    setNewSlotLevel("1");
    setNewSlotTotal("2");
  };

  const removeSpellSlot = (level: number) => {
    setSpellSlots(spellSlots.filter(s => s.level !== level));
  };

  const addClassResource = () => {
    const total = parseInt(newResourceTotal);

    if (!newResourceName.trim() || isNaN(total) || total < 1) {
      toast({
        title: "Invalid input",
        description: "Please enter valid resource values",
        variant: "destructive",
      });
      return;
    }

    if (classResources.some(r => r.name === newResourceName)) {
      toast({
        title: "Duplicate resource",
        description: `${newResourceName} already exists`,
        variant: "destructive",
      });
      return;
    }

    setClassResources([...classResources, {
      name: newResourceName,
      total,
      used: 0,
      resetOn: newResourceReset
    }]);
    setNewResourceName("");
    setNewResourceTotal("1");
  };

  const removeClassResource = (name: string) => {
    setClassResources(classResources.filter(r => r.name !== name));
  };

  const saveResources = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('characters')
      .update({
        resources: {
          spellSlots,
          classResources
        } as any
      })
      .eq('id', characterId);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update resources",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Resources updated",
      description: "Character resources have been saved",
    });

    setOpen(false);
    onUpdate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Manage Resources
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Resources — {characterName}</DialogTitle>
          <DialogDescription>
            Configure spell slots and class resources for this character
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Spell Slots Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Spell Slots</h3>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Level</Label>
                <Select value={newSlotLevel} onValueChange={setNewSlotLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Total Slots</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newSlotTotal}
                  onChange={(e) => setNewSlotTotal(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addSpellSlot} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {spellSlots.map(slot => (
                <Badge key={slot.level} variant="secondary" className="gap-2">
                  Level {slot.level}: {slot.total} slots
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeSpellSlot(slot.level)}
                  />
                </Badge>
              ))}
              {spellSlots.length === 0 && (
                <p className="text-xs text-muted-foreground">No spell slots configured</p>
              )}
            </div>
          </div>

          {/* Class Resources Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Class Resources</h3>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g., Rage, Ki Points"
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                />
              </div>
              <div className="w-24">
                <Label className="text-xs">Total</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newResourceTotal}
                  onChange={(e) => setNewResourceTotal(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Label className="text-xs">Resets On</Label>
                <Select value={newResourceReset} onValueChange={(v) => setNewResourceReset(v as 'short' | 'long')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short Rest</SelectItem>
                    <SelectItem value="long">Long Rest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addClassResource} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {classResources.map(resource => (
                <Badge key={resource.name} variant="secondary" className="gap-2">
                  {resource.name}: {resource.total} ({resource.resetOn === 'short' ? 'SR' : 'LR'})
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeClassResource(resource.name)}
                  />
                </Badge>
              ))}
              {classResources.length === 0 && (
                <p className="text-xs text-muted-foreground">No class resources configured</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveResources} disabled={loading}>
            Save Resources
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
