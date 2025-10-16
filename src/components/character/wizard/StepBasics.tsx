import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WizardData } from "../CharacterWizard";

interface StepBasicsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepBasics = ({ data, updateData }: StepBasicsProps) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subclasses, setSubclasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (data.classId) {
      loadSubclasses(data.classId);
      const cls = classes.find(c => c.id === data.classId);
      setSelectedClass(cls);
    }
  }, [data.classId, classes]);

  const loadClasses = async () => {
    const { data: classData, error } = await supabase
      .from("srd_classes")
      .select("*")
      .order("name");
      
    if (!error && classData) {
      setClasses(classData);
    }
  };

  const loadSubclasses = async (classId: string) => {
    const { data: subclassData, error } = await supabase
      .from("srd_subclasses")
      .select("*")
      .eq("class_id", classId)
      .order("name");
      
    if (!error && subclassData) {
      setSubclasses(subclassData);
    }
  };

  const handleClassChange = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    updateData({ 
      classId, 
      className: cls?.name || "",
      subclassId: undefined // Reset subclass when class changes
    });
  };

  // Determine if subclass choice is available at current level
  const canChooseSubclass = selectedClass && data.level >= (selectedClass.unlock_level || 3);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Start by choosing your character's name, class, and level. This will determine their core capabilities.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Character Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Enter character name"
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="level">Level *</Label>
            <Input
              id="level"
              type="number"
              min="1"
              max="20"
              value={data.level}
              onChange={(e) => updateData({ level: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class *</Label>
            <Select value={data.classId} onValueChange={handleClassChange}>
              <SelectTrigger id="class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} (d{cls.hit_die})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canChooseSubclass && subclasses.length > 0 && (
          <div className="space-y-2 max-w-md">
            <Label htmlFor="subclass">Subclass</Label>
            <Select 
              value={data.subclassId || ""} 
              onValueChange={(value) => updateData({ subclassId: value })}
            >
              <SelectTrigger id="subclass">
                <SelectValue placeholder="Select subclass (optional)" />
              </SelectTrigger>
              <SelectContent>
                {subclasses.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Available at level {selectedClass?.unlock_level || 3}
            </p>
          </div>
        )}
      </div>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedClass.name}</CardTitle>
            <CardDescription>
              Hit Die: d{selectedClass.hit_die}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Saving Throws:</span>{" "}
              {selectedClass.saving_throws?.map((s: string) => s.toUpperCase()).join(", ")}
            </div>
            {selectedClass.spellcasting_ability && (
              <div>
                <span className="font-medium">Spellcasting Ability:</span>{" "}
                {selectedClass.spellcasting_ability.toUpperCase()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepBasics;
