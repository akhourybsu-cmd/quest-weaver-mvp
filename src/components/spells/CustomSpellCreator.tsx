import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomSpellCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onSpellCreated?: () => void;
}

const SPELL_SCHOOLS = [
  "Abjuration", "Conjuration", "Divination", "Enchantment",
  "Evocation", "Illusion", "Necromancy", "Transmutation"
];

const DAMAGE_TYPES = [
  "Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning",
  "Necrotic", "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder"
];

const SAVE_TYPES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const CLASSES = [
  "Bard", "Cleric", "Druid", "Paladin", "Ranger", 
  "Sorcerer", "Warlock", "Wizard"
];

export const CustomSpellCreator = ({
  open,
  onOpenChange,
  campaignId,
  onSpellCreated
}: CustomSpellCreatorProps) => {
  const [formData, setFormData] = useState({
    name: "",
    level: 0,
    school: "Evocation",
    casting_time: "1 action",
    range: "30 feet",
    duration: "Instantaneous",
    description: "",
    higher_levels: "",
    concentration: false,
    ritual: false,
    components: {
      verbal: false,
      somatic: false,
      material: false,
      material_description: ""
    },
    damage_type: "",
    save_type: "",
    classes: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("custom_spells")
        .insert({
          campaign_id: campaignId,
          created_by: user.id,
          ...formData
        });

      if (error) throw error;

      toast.success("Custom spell created!");
      onSpellCreated?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating spell:", error);
      toast.error("Failed to create custom spell");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: 0,
      school: "Evocation",
      casting_time: "1 action",
      range: "30 feet",
      duration: "Instantaneous",
      description: "",
      higher_levels: "",
      concentration: false,
      ritual: false,
      components: {
        verbal: false,
        somatic: false,
        material: false,
        material_description: ""
      },
      damage_type: "",
      save_type: "",
      classes: []
    });
  };

  const toggleClass = (className: string) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <DialogTitle>Create Custom Spell</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Spell Name*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Spell Level*</Label>
                  <Select
                    value={formData.level.toString()}
                    onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          {level === 0 ? "Cantrip" : `Level ${level}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School*</Label>
                  <Select
                    value={formData.school}
                    onValueChange={(value) => setFormData({ ...formData, school: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPELL_SCHOOLS.map(school => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="casting_time">Casting Time*</Label>
                  <Input
                    id="casting_time"
                    value={formData.casting_time}
                    onChange={(e) => setFormData({ ...formData, casting_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="range">Range*</Label>
                  <Input
                    id="range"
                    value={formData.range}
                    onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration*</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Components*</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="verbal"
                      checked={formData.components.verbal}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          components: { ...formData.components, verbal: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="verbal" className="font-normal">Verbal (V)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="somatic"
                      checked={formData.components.somatic}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          components: { ...formData.components, somatic: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="somatic" className="font-normal">Somatic (S)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="material"
                      checked={formData.components.material}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          components: { ...formData.components, material: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="material" className="font-normal">Material (M)</Label>
                  </div>
                </div>
                {formData.components.material && (
                  <Input
                    placeholder="Material components description"
                    value={formData.components.material_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        components: {
                          ...formData.components,
                          material_description: e.target.value
                        }
                      })
                    }
                  />
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="concentration"
                    checked={formData.concentration}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, concentration: !!checked })
                    }
                  />
                  <Label htmlFor="concentration" className="font-normal">Concentration</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ritual"
                    checked={formData.ritual}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, ritual: !!checked })
                    }
                  />
                  <Label htmlFor="ritual" className="font-normal">Ritual</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="damage_type">Damage Type (optional)</Label>
                  <Select
                    value={formData.damage_type}
                    onValueChange={(value) => setFormData({ ...formData, damage_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select damage type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAMAGE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="save_type">Save Type (optional)</Label>
                  <Select
                    value={formData.save_type}
                    onValueChange={(value) => setFormData({ ...formData, save_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select save type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAVE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="higher_levels">At Higher Levels (optional)</Label>
                <Textarea
                  id="higher_levels"
                  value={formData.higher_levels}
                  onChange={(e) => setFormData({ ...formData, higher_levels: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Available to Classes</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CLASSES.map(className => (
                    <div key={className} className="flex items-center gap-2">
                      <Checkbox
                        id={className}
                        checked={formData.classes.includes(className)}
                        onCheckedChange={() => toggleClass(className)}
                      />
                      <Label htmlFor={className} className="font-normal text-sm">
                        {className}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Spell"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
