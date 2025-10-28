import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { FeatSelector } from "./FeatSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LevelUpWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  currentLevel: number;
  onComplete: () => void;
}

type LevelUpStep = "hp-roll" | "asi-or-feat" | "features" | "review";

export const LevelUpWizard = ({
  open,
  onOpenChange,
  characterId,
  currentLevel,
  onComplete
}: LevelUpWizardProps) => {
  const [step, setStep] = useState<LevelUpStep>("hp-roll");
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useAverage, setUseAverage] = useState(false);
  const [choice, setChoice] = useState<"asi" | "feat" | null>(null);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [abilityIncreases, setAbilityIncreases] = useState<Record<string, number>>({});

  const newLevel = currentLevel + 1;
  const canChooseFeat = newLevel % 4 === 0 || (character?.class === "Fighter" && newLevel % 6 === 0) || (character?.class === "Rogue" && newLevel % 10 === 0);

  useEffect(() => {
    if (open) {
      loadCharacter();
    }
  }, [open, characterId]);

  const loadCharacter = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .select(`
          *,
          character_abilities(*),
          character_feats(*)
        `)
        .eq("id", characterId)
        .single();

      if (error) throw error;
      setCharacter(data);
    } catch (error) {
      console.error("Error loading character:", error);
      toast.error("Failed to load character");
    } finally {
      setLoading(false);
    }
  };

  const getHitDie = () => {
    const hitDice: Record<string, number> = {
      Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8,
      Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10,
      Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6
    };
    return hitDice[character?.class] || 8;
  };

  const rollHP = () => {
    const die = getHitDie();
    const roll = Math.floor(Math.random() * die) + 1;
    setHpRoll(roll);
  };

  const takeAverage = () => {
    const die = getHitDie();
    const avg = Math.floor(die / 2) + 1;
    setHpRoll(avg);
    setUseAverage(true);
  };

  const handleAbilityIncrease = (ability: string, delta: number) => {
    const current = abilityIncreases[ability] || 0;
    const newValue = current + delta;
    
    if (newValue < 0 || newValue > 2) return;
    
    const totalIncreases = Object.values(abilityIncreases).reduce((sum, val) => sum + val, 0);
    if (totalIncreases - current + newValue > 2) return;

    setAbilityIncreases({
      ...abilityIncreases,
      [ability]: newValue
    });
  };

  const handleComplete = async () => {
    if (!hpRoll) {
      toast.error("Please roll for HP");
      return;
    }

    try {
      const conMod = Math.floor(((character?.character_abilities?.[0]?.con || 10) - 10) / 2);
      const hpGain = hpRoll + conMod;

      // Update character level and HP
      const { error: updateError } = await supabase
        .from("characters")
        .update({
          level: newLevel,
          max_hp: (character?.max_hp || 0) + hpGain,
          current_hp: (character?.current_hp || 0) + hpGain
        })
        .eq("id", characterId);

      if (updateError) throw updateError;

      // Record level history
      const { error: historyError } = await supabase
        .from("character_level_history")
        .insert({
          character_id: characterId,
          class_id: character?.classId,
          previous_level: currentLevel,
          new_level: newLevel,
          hp_gained: hpGain,
          choices_made: {
            asi_or_feat: choice,
            feat_id: selectedFeat,
            ability_increases: abilityIncreases
          }
        });

      if (historyError) throw historyError;

      // Add feat if selected
      if (choice === "feat" && selectedFeat) {
        const { error: featError } = await supabase
          .from("character_feats")
          .insert({
            character_id: characterId,
            feat_id: selectedFeat,
            level_gained: newLevel
          });

        if (featError) throw featError;
      }

      // Apply ability increases
      if (choice === "asi" && Object.keys(abilityIncreases).length > 0) {
        const abilities = character?.character_abilities?.[0];
        if (abilities) {
          const updates: Record<string, number> = {};
          Object.entries(abilityIncreases).forEach(([ability, increase]) => {
            const current = abilities[ability.toLowerCase()] || 10;
            updates[ability.toLowerCase()] = Math.min(20, current + increase);
          });

          const { error: asiError } = await supabase
            .from("character_abilities")
            .update(updates)
            .eq("character_id", characterId);

          if (asiError) throw asiError;
        }
      }

      toast.success(`Leveled up to ${newLevel}!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error leveling up:", error);
      toast.error("Failed to level up character");
    }
  };

  if (loading) {
    return null;
  }

  const steps: LevelUpStep[] = canChooseFeat 
    ? ["hp-roll", "asi-or-feat", "review"]
    : ["hp-roll", "review"];

  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <DialogTitle>Level Up to {newLevel}</DialogTitle>
          </div>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {step === "hp-roll" && (
            <Card>
              <CardHeader>
                <CardTitle>Roll for Hit Points</CardTitle>
                <CardDescription>
                  Roll a d{getHitDie()} or take the average ({Math.floor(getHitDie() / 2) + 1})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hpRoll === null ? (
                  <div className="flex gap-2">
                    <Button onClick={rollHP} className="flex-1">
                      Roll d{getHitDie()}
                    </Button>
                    <Button onClick={takeAverage} variant="outline" className="flex-1">
                      Take Average
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary">{hpRoll}</div>
                    <p className="text-sm text-muted-foreground">
                      {useAverage ? "Average HP" : "Rolled HP"}
                    </p>
                    <Button onClick={() => setHpRoll(null)} variant="outline" size="sm">
                      Re-roll
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === "asi-or-feat" && canChooseFeat && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ability Score Improvement or Feat</CardTitle>
                  <CardDescription>
                    Choose to increase your ability scores or gain a feat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={choice === "asi" ? "default" : "outline"}
                      onClick={() => setChoice("asi")}
                      className="h-20"
                    >
                      Ability Score Improvement
                    </Button>
                    <Button
                      variant={choice === "feat" ? "default" : "outline"}
                      onClick={() => setChoice("feat")}
                      className="h-20"
                    >
                      Choose a Feat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {choice === "asi" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ability Score Improvements</CardTitle>
                    <CardDescription>
                      You have 2 points to distribute (max 20 in any ability)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["STR", "DEX", "CON", "INT", "WIS", "CHA"].map((ability) => {
                        const currentScore = character?.character_abilities?.[0]?.[ability.toLowerCase()] || 10;
                        const increase = abilityIncreases[ability] || 0;
                        const newScore = currentScore + increase;
                        
                        return (
                          <div key={ability} className="flex items-center justify-between">
                            <span className="font-medium">{ability}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{currentScore}</Badge>
                              {increase > 0 && (
                                <>
                                  <span>→</span>
                                  <Badge>{newScore}</Badge>
                                </>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAbilityIncrease(ability, -1)}
                                  disabled={increase === 0}
                                >
                                  -
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAbilityIncrease(ability, 1)}
                                  disabled={newScore >= 20}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Points remaining: {2 - Object.values(abilityIncreases).reduce((sum, val) => sum + val, 0)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {choice === "feat" && (
                <FeatSelector
                  level={newLevel}
                  abilityScores={
                    ["STR", "DEX", "CON", "INT", "WIS", "CHA"].reduce((acc, ability) => {
                      acc[ability] = character?.character_abilities?.[0]?.[ability.toLowerCase()] || 10;
                      return acc;
                    }, {} as Record<string, number>)
                  }
                  currentFeats={character?.character_feats?.map((f: any) => f.feat_id) || []}
                  onSelectFeat={setSelectedFeat}
                  selectedFeatId={selectedFeat || undefined}
                />
              )}
            </div>
          )}

          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle>Review Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>HP Gained</Label>
                  <p className="text-2xl font-bold text-primary">+{hpRoll}</p>
                </div>

                {canChooseFeat && choice && (
                  <div className="border-t pt-4">
                    <Label>{choice === "asi" ? "Ability Improvements" : "Feat Selected"}</Label>
                    {choice === "asi" && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(abilityIncreases).map(([ability, increase]) => (
                          increase > 0 && (
                            <Badge key={ability}>
                              {ability} +{increase}
                            </Badge>
                          )
                        ))}
                      </div>
                    )}
                    {choice === "feat" && selectedFeat && (
                      <Badge className="mt-2">Feat Selected</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const prevIndex = currentStepIndex - 1;
                if (prevIndex >= 0) {
                  setStep(steps[prevIndex]);
                }
              }}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStepIndex < steps.length - 1 ? (
              <Button
                onClick={() => {
                  const nextIndex = currentStepIndex + 1;
                  if (nextIndex < steps.length) {
                    setStep(steps[nextIndex]);
                  }
                }}
                disabled={
                  (step === "hp-roll" && hpRoll === null) ||
                  (step === "asi-or-feat" && !choice)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Complete Level Up
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
