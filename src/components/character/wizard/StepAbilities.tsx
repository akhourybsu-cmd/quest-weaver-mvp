import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateModifier } from "@/lib/dnd5e";
import { STANDARD_ARRAY, validatePointBuy } from "@/lib/characterRules";
import type { WizardData } from "../CharacterWizard";

interface StepAbilitiesProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const ABILITIES = [
  { key: "str", label: "Strength" },
  { key: "dex", label: "Dexterity" },
  { key: "con", label: "Constitution" },
  { key: "int", label: "Intelligence" },
  { key: "wis", label: "Wisdom" },
  { key: "cha", label: "Charisma" },
] as const;

const StepAbilities = ({ data, updateData }: StepAbilitiesProps) => {
  const [method, setMethod] = useState<"standard-array" | "point-buy" | "rolled">(data.abilityMethod);
  const [standardArrayAssignments, setStandardArrayAssignments] = useState<number[]>(Object.values(data.abilityScores));
  
  const handleMethodChange = (newMethod: "standard-array" | "point-buy" | "rolled") => {
    setMethod(newMethod);
    updateData({ abilityMethod: newMethod });
  };

  const updateScore = (ability: keyof typeof data.abilityScores, value: number) => {
    updateData({
      abilityScores: {
        ...data.abilityScores,
        [ability]: Math.max(1, Math.min(20, value))
      }
    });
  };

  const pointBuyValidation = validatePointBuy(Object.values(data.abilityScores));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Ability Scores</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how to generate your character's ability scores. These determine your character's core capabilities.
        </p>
      </div>

      <Tabs value={method} onValueChange={handleMethodChange as any}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="standard-array">Standard Array</TabsTrigger>
          <TabsTrigger value="point-buy">Point Buy</TabsTrigger>
          <TabsTrigger value="rolled">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="standard-array" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Assign these values to your abilities: {STANDARD_ARRAY.join(", ")}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {ABILITIES.map((ability) => (
                  <div key={ability.key} className="space-y-2">
                    <Label>{ability.label}</Label>
                    <Input
                      type="number"
                      min="8"
                      max="15"
                      value={data.abilityScores[ability.key]}
                      onChange={(e) => updateScore(ability.key, parseInt(e.target.value) || 10)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="point-buy" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  You have 27 points to spend. Scores cost: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9
                </p>
                <p className="text-sm font-medium mt-2">
                  Points Used: {pointBuyValidation.pointsUsed} / 27
                  {pointBuyValidation.valid && <span className="text-green-600 ml-2">✓ Valid</span>}
                  {!pointBuyValidation.valid && pointBuyValidation.pointsUsed > 27 && (
                    <span className="text-destructive ml-2">Too many points!</span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {ABILITIES.map((ability) => {
                  const score = data.abilityScores[ability.key];
                  const modifier = calculateModifier(score);
                  return (
                    <div key={ability.key} className="space-y-2">
                      <Label>{ability.label}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min="8"
                          max="15"
                          value={score}
                          onChange={(e) => updateScore(ability.key, parseInt(e.target.value) || 10)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">
                          ({modifier >= 0 ? '+' : ''}{modifier})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rolled" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Enter your rolled ability scores (usually 4d6 drop lowest). Valid range: 1-20.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {ABILITIES.map((ability) => {
                  const score = data.abilityScores[ability.key];
                  const modifier = calculateModifier(score);
                  return (
                    <div key={ability.key} className="space-y-2">
                      <Label>{ability.label}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={score}
                          onChange={(e) => updateScore(ability.key, parseInt(e.target.value) || 10)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">
                          ({modifier >= 0 ? '+' : ''}{modifier})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-3">Your Modifiers</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {ABILITIES.map((ability) => {
              const score = data.abilityScores[ability.key];
              const modifier = calculateModifier(score);
              return (
                <div key={ability.key} className="flex justify-between">
                  <span className="text-muted-foreground">{ability.label}:</span>
                  <span className="font-mono font-bold">
                    {modifier >= 0 ? '+' : ''}{modifier}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepAbilities;
