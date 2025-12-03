import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, AlertTriangle, Swords, BookOpen, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  meetsMulticlassPrerequisites, 
  canLeaveClass,
  getMulticlassProficiencies,
  MULTICLASS_PREREQUISITES,
  type AbilityKey 
} from "@/lib/rules/multiclassRules";

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  currentClasses: Array<{ className: string; level: number }>;
  abilityScores: Record<AbilityKey, number>;
  onClassAdded: (className: string, classId: string) => void;
}

interface SrdClass {
  id: string;
  name: string;
  hit_die: number;
  spellcasting_ability: string | null;
}

export function AddClassDialog({
  open,
  onOpenChange,
  characterId,
  currentClasses,
  abilityScores,
  onClassAdded,
}: AddClassDialogProps) {
  const [availableClasses, setAvailableClasses] = useState<SrdClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const primaryClass = currentClasses[0]?.className;
  const currentClassNames = currentClasses.map(c => c.className);
  const totalLevel = currentClasses.reduce((sum, c) => sum + c.level, 0);

  // Check if can leave current class
  const leaveCheck = primaryClass ? canLeaveClass(primaryClass, abilityScores) : { canLeave: true };

  useEffect(() => {
    if (open) {
      fetchClasses();
      setSelectedClass(null);
    }
  }, [open]);

  async function fetchClasses() {
    const { data } = await supabase
      .from("srd_classes")
      .select("id, name, hit_die, spellcasting_ability")
      .order("name");
    
    if (data) {
      setAvailableClasses(data);
    }
  }

  function getClassEligibility(className: string) {
    // Already has this class
    if (currentClassNames.includes(className)) {
      return { eligible: false, reason: "Already have this class" };
    }

    // Max 20 total levels
    if (totalLevel >= 20) {
      return { eligible: false, reason: "Maximum level 20 reached" };
    }

    // Check prerequisites
    const prereqCheck = meetsMulticlassPrerequisites(className, abilityScores);
    if (!prereqCheck.meets) {
      return { eligible: false, reason: `Need: ${prereqCheck.missing.join(", ")}` };
    }

    return { eligible: true };
  }

  function getPrerequisiteDisplay(className: string) {
    const prereqs = MULTICLASS_PREREQUISITES[className];
    if (!prereqs) return "None";

    if (className === "Fighter") {
      return "STR 13 or DEX 13";
    }

    return Object.entries(prereqs.abilities)
      .map(([ability, score]) => `${ability.toUpperCase()} ${score}`)
      .join(", ");
  }

  async function handleAddClass() {
    if (!selectedClass) return;

    setLoading(true);
    const classData = availableClasses.find(c => c.name === selectedClass);
    if (!classData) {
      setLoading(false);
      return;
    }

    // Get multiclass proficiencies
    const proficiencies = getMulticlassProficiencies(selectedClass);

    // Add proficiencies to character
    const proficiencyInserts: Array<{ character_id: string; type: string; name: string }> = [];
    
    if (proficiencies.armor) {
      proficiencies.armor.forEach(armor => {
        proficiencyInserts.push({ character_id: characterId, type: "armor", name: armor });
      });
    }
    if (proficiencies.weapons) {
      proficiencies.weapons.forEach(weapon => {
        proficiencyInserts.push({ character_id: characterId, type: "weapon", name: weapon });
      });
    }
    if (proficiencies.tools) {
      proficiencies.tools.forEach(tool => {
        proficiencyInserts.push({ character_id: characterId, type: "tool", name: tool });
      });
    }

    if (proficiencyInserts.length > 0) {
      await supabase.from("character_proficiencies").insert(proficiencyInserts);
    }

    // Add the class entry
    await supabase.from("character_classes").insert({
      character_id: characterId,
      class_id: classData.id,
      class_level: 1,
      is_primary: false,
    });

    setLoading(false);
    onClassAdded(selectedClass, classData.id);
    onOpenChange(false);
  }

  const selectedClassData = availableClasses.find(c => c.name === selectedClass);
  const selectedProficiencies = selectedClass ? getMulticlassProficiencies(selectedClass) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Add New Class (Multiclass)
          </DialogTitle>
          <DialogDescription>
            Choose a new class to multiclass into. You must meet the prerequisites for both your current class and the new class.
          </DialogDescription>
        </DialogHeader>

        {!leaveCheck.canLeave && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{leaveCheck.reason}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Select Class</Label>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <RadioGroup value={selectedClass || ""} onValueChange={setSelectedClass}>
                {availableClasses.map(cls => {
                  const eligibility = getClassEligibility(cls.name);
                  const isDisabled = !eligibility.eligible || !leaveCheck.canLeave;

                  return (
                    <div
                      key={cls.id}
                      className={`flex items-center space-x-2 p-2 rounded-md ${
                        isDisabled ? "opacity-50" : "hover:bg-accent"
                      }`}
                    >
                      <RadioGroupItem
                        value={cls.name}
                        id={cls.id}
                        disabled={isDisabled}
                      />
                      <Label
                        htmlFor={cls.id}
                        className={`flex-1 cursor-pointer ${isDisabled ? "cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{cls.name}</span>
                          {currentClassNames.includes(cls.name) && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          d{cls.hit_die} • Prereq: {getPrerequisiteDisplay(cls.name)}
                        </div>
                        {!eligibility.eligible && !currentClassNames.includes(cls.name) && (
                          <div className="text-xs text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {eligibility.reason}
                          </div>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </ScrollArea>
          </div>

          {/* Class Details */}
          <div className="space-y-4">
            {selectedClassData ? (
              <>
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedClassData.name}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Hit Die: <span className="font-medium">d{selectedClassData.hit_die}</span></div>
                      {selectedClassData.spellcasting_ability && (
                        <div>Spellcasting: <span className="font-medium">{selectedClassData.spellcasting_ability}</span></div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {selectedProficiencies && (
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Gained Proficiencies</span>
                      </div>
                      <div className="text-sm space-y-2">
                        {selectedProficiencies.armor && selectedProficiencies.armor.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Armor:</span>{" "}
                            {selectedProficiencies.armor.join(", ")}
                          </div>
                        )}
                        {selectedProficiencies.weapons && selectedProficiencies.weapons.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Weapons:</span>{" "}
                            {selectedProficiencies.weapons.join(", ")}
                          </div>
                        )}
                        {selectedProficiencies.tools && selectedProficiencies.tools.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Tools:</span>{" "}
                            {selectedProficiencies.tools.join(", ")}
                          </div>
                        )}
                        {selectedProficiencies.skills && (
                          <div>
                            <span className="text-muted-foreground">Skills:</span>{" "}
                            Choose {selectedProficiencies.skills.count} from {selectedProficiencies.skills.options.join(", ")}
                          </div>
                        )}
                        {!selectedProficiencies.armor?.length && 
                         !selectedProficiencies.weapons?.length && 
                         !selectedProficiencies.tools?.length && 
                         !selectedProficiencies.skills && (
                          <div className="text-muted-foreground italic">None</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-xs text-muted-foreground">
                  <Check className="h-3 w-3 inline mr-1 text-green-500" />
                  You meet the prerequisites for {selectedClassData.name}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a class to see details
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddClass}
            disabled={!selectedClass || loading || !leaveCheck.canLeave}
          >
            {loading ? "Adding..." : "Add Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
