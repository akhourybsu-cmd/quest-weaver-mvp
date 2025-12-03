import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Swords, TrendingUp } from "lucide-react";
import { AddClassDialog } from "./AddClassDialog";
import type { AbilityKey } from "@/lib/rules/multiclassRules";

interface CharacterClass {
  className: string;
  classId: string;
  level: number;
  isPrimary: boolean;
}

interface MulticlassLevelUpStepProps {
  characterId: string;
  characterClasses: CharacterClass[];
  abilityScores: Record<AbilityKey, number>;
  totalLevel: number;
  selectedClassToLevel: string | null;
  onSelectClassToLevel: (className: string, classId: string) => void;
  onClassAdded: (className: string, classId: string) => void;
}

export function MulticlassLevelUpStep({
  characterId,
  characterClasses,
  abilityScores,
  totalLevel,
  selectedClassToLevel,
  onSelectClassToLevel,
  onClassAdded,
}: MulticlassLevelUpStepProps) {
  const [addClassOpen, setAddClassOpen] = useState(false);

  const canAddNewClass = totalLevel < 20 && characterClasses.length < 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Level Up Choice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose which class to gain a level in, or add a new class to multiclass.
        </p>

        <RadioGroup
          value={selectedClassToLevel || ""}
          onValueChange={(value) => {
            const cls = characterClasses.find(c => c.className === value);
            if (cls) {
              onSelectClassToLevel(cls.className, cls.classId);
            }
          }}
        >
          {characterClasses.map((cls) => (
            <div
              key={cls.classId}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
            >
              <RadioGroupItem value={cls.className} id={`class-${cls.classId}`} />
              <Label htmlFor={`class-${cls.classId}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cls.className}</span>
                    {cls.isPrimary && (
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Level {cls.level}
                    </span>
                    {selectedClassToLevel === cls.className && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {selectedClassToLevel === cls.className && (
                      <span className="text-sm font-medium text-green-500">
                        → {cls.level + 1}
                      </span>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {canAddNewClass && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddClassOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Class (Multiclass)
            </Button>
          </>
        )}

        {totalLevel >= 20 && (
          <p className="text-sm text-muted-foreground text-center">
            Maximum character level (20) reached
          </p>
        )}

        <AddClassDialog
          open={addClassOpen}
          onOpenChange={setAddClassOpen}
          characterId={characterId}
          currentClasses={characterClasses.map(c => ({ className: c.className, level: c.level }))}
          abilityScores={abilityScores}
          onClassAdded={onClassAdded}
        />
      </CardContent>
    </Card>
  );
}
