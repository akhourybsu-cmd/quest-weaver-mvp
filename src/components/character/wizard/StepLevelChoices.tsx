import { useState, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, ChevronRight, ChevronLeft, Sparkles, Star, Swords, Target, MapPin, Check, Dice6 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeatSelector } from "../FeatSelector";
import { FeatureChoiceStep } from "../levelup/FeatureChoiceStep";
import { MagicalSecretsStep } from "../levelup/MagicalSecretsStep";
import { FavoredEnemySelector, FAVORED_ENEMY_TYPES } from "../levelup/FavoredEnemySelector";
import { FavoredTerrainSelector, FAVORED_TERRAIN_TYPES } from "../levelup/FavoredTerrainSelector";
import { InvocationSelector } from "../levelup/InvocationSelector";
import {
  getClassRules,
  getFeatureChoicesAtLevel,
  isASILevel,
  getMaxSpellLevelForClass,
  getInvocationsKnownAtLevel,
  METAMAGIC_OPTIONS,
  PACT_BOONS,
  ELDRITCH_INVOCATIONS,
  getCantripGain,
  getSpellsKnownGain,
} from "@/lib/rules/levelUpRules";

// Types for tracking choices per level
export interface LevelChoices {
  level: number;
  hpRoll?: number;
  useAverage?: boolean;
  asiChoice?: "asi" | "feat";
  abilityIncreases?: Record<string, number>;
  selectedFeat?: string;
  fightingStyle?: string;
  expertise?: string[];
  metamagic?: string[];
  invocations?: string[];
  pactBoon?: string;
  magicalSecrets?: string[];
  favoredEnemy?: string;
  favoredTerrain?: string;
  newSpells?: string[];
  newCantrips?: string[];
}

const StepLevelChoices = () => {
  const [draft, setDraft] = useAtom(draftAtom);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelChoices, setLevelChoices] = useState<LevelChoices[]>([]);
  const [currentLevelStep, setCurrentLevelStep] = useState(0);
  
  // Track what's been accumulated so far
  const [accumulatedFavoredEnemies, setAccumulatedFavoredEnemies] = useState<string[]>([]);
  const [accumulatedFavoredTerrains, setAccumulatedFavoredTerrains] = useState<string[]>([]);
  const [accumulatedInvocations, setAccumulatedInvocations] = useState<string[]>([]);
  const [accumulatedMetamagic, setAccumulatedMetamagic] = useState<string[]>([]);
  const [accumulatedExpertise, setAccumulatedExpertise] = useState<string[]>([]);
  const [accumulatedPactBoon, setAccumulatedPactBoon] = useState<string | null>(null);
  const [proficientSkills, setProficientSkills] = useState<string[]>([]);
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);

  // Subclass-type choices that are handled by the subclass dropdown, not level choice steps
  const SUBCLASS_CHOICE_TYPES = new Set([
    'divine_domain', 'sorcerous_origin', 'otherworldly_patron', 'monastic_tradition',
    'sacred_oath', 'ranger_archetype', 'roguish_archetype', 'arcane_tradition',
    'land_circle', 'totem', 'martial_archetype',
  ]);

  // Levels that need processing
  // Level 1 is included if the class has actionable level 1 feature choices (not subclass picks)
  const levelsToProcess = useMemo(() => {
    const levels: number[] = [];
    const classRulesCheck = getClassRules(draft.className || "");
    const level1Choices = classRulesCheck?.featureChoiceLevels?.[1] || [];
    const hasActionableLevel1Choices = level1Choices.some(c => !SUBCLASS_CHOICE_TYPES.has(c.type));
    if (hasActionableLevel1Choices) {
      levels.push(1);
    }
    for (let i = 2; i <= draft.level; i++) {
      levels.push(i);
    }
    return levels;
  }, [draft.level, draft.className]);

  // Initialize or restore level choices from draft
  useEffect(() => {
    if (levelsToProcess.length > 0 && levelChoices.length === 0 && !restoredFromDraft) {
      // Try to restore from draft first
      const saved = (draft.choices?.featureChoices as any)?.levelChoices as Record<number, LevelChoices> | undefined;
      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
        const restored: LevelChoices[] = levelsToProcess.map(level => {
          const lc = saved[level];
          return lc ? { ...lc, level } : { level };
        });
        setLevelChoices(restored);
        
        // Restore accumulated state from saved choices
        const enemies: string[] = [];
        const terrains: string[] = [];
        const invocations: string[] = [];
        const metamagic: string[] = [];
        const expertise: string[] = [];
        let pactBoon: string | null = null;
        
        for (const lc of restored) {
          if (lc.favoredEnemy) enemies.push(lc.favoredEnemy);
          if (lc.favoredTerrain) terrains.push(lc.favoredTerrain);
          if (lc.invocations) invocations.push(...lc.invocations);
          if (lc.metamagic) metamagic.push(...lc.metamagic);
          if (lc.expertise) expertise.push(...lc.expertise);
          if (lc.pactBoon) pactBoon = lc.pactBoon;
        }
        
        setAccumulatedFavoredEnemies(enemies);
        setAccumulatedFavoredTerrains(terrains);
        setAccumulatedInvocations(invocations);
        setAccumulatedMetamagic(metamagic);
        setAccumulatedExpertise(expertise);
        setAccumulatedPactBoon(pactBoon);
      } else {
        const initialChoices = levelsToProcess.map(level => ({ level }));
        setLevelChoices(initialChoices);
      }
      setRestoredFromDraft(true);
    }
    // Set proficient skills from draft choices
    setProficientSkills(draft.choices.skills);
  }, [levelsToProcess, draft.choices.skills]);

  const currentLevel = levelsToProcess[currentLevelIndex] || 2;
  const currentChoices = levelChoices.find(c => c.level === currentLevel) || { level: currentLevel };
  
  // Get class rules for current level
  const classRules = useMemo(() => {
    return getClassRules(draft.className || "");
  }, [draft.className]);

  // Determine what choices are needed at this level
  const levelRequirements = useMemo(() => {
    if (!classRules) return { steps: [] as string[] };
    
    const steps: string[] = [];
    const featureChoices = getFeatureChoicesAtLevel(draft.className || "", currentLevel);
    
    // HP is always needed for level 2+ (not level 1)
    if (currentLevel >= 2) {
      steps.push("hp");
    }
    
    // Feature choices (exclude subclass-type choices handled by StepBasics)
    featureChoices.forEach(choice => {
      if (SUBCLASS_CHOICE_TYPES.has(choice.type)) return; // Skip subclass picks
      if (choice.type === "fighting_style") steps.push("fighting-style");
      if (choice.type === "expertise") steps.push("expertise");
      if (choice.type === "metamagic") steps.push("metamagic");
      if (choice.type === "magical_secrets") steps.push("magical-secrets");
      if (choice.type === "favored_enemy") steps.push("favored-enemy");
      if (choice.type === "favored_terrain") steps.push("favored-terrain");
    });
    
    // Pact Boon at level 3 for Warlock
    if (draft.className === "Warlock" && currentLevel === 3) {
      steps.push("pact-boon");
    }
    
    // Invocations for Warlock
    const currentInvocations = getInvocationsKnownAtLevel(currentLevel);
    const prevInvocations = getInvocationsKnownAtLevel(currentLevel - 1);
    if (draft.className === "Warlock" && currentInvocations > prevInvocations) {
      steps.push("invocations");
    }
    
    // ASI levels
    if (isASILevel(draft.className || "", currentLevel)) {
      steps.push("asi");
    }
    
    return { steps, featureChoices };
  }, [classRules, draft.className, currentLevel]);

  const totalStepsForLevel = levelRequirements.steps.length;
  const currentStepName = levelRequirements.steps[currentLevelStep];

  // Update choices for current level
  const updateCurrentChoices = (updates: Partial<LevelChoices>) => {
    setLevelChoices(prev => 
      prev.map(c => c.level === currentLevel ? { ...c, ...updates } : c)
    );
  };

  // HP calculation (include ancestry CON bonus)
  const hitDie = classRules?.hitDie || 8;
  const abilityBonuses = draft.grants?.abilityBonuses || {};
  const conBonus = abilityBonuses['con'] || abilityBonuses['CON'] || abilityBonuses['Con'] || 0;
  const conMod = Math.floor((draft.abilityScores.CON + conBonus - 10) / 2);

  const handleHpRoll = () => {
    const roll = Math.floor(Math.random() * hitDie) + 1;
    updateCurrentChoices({ hpRoll: roll, useAverage: false });
  };

  const handleUseAverage = () => {
    const avg = Math.floor(hitDie / 2) + 1;
    updateCurrentChoices({ hpRoll: avg, useAverage: true });
  };

  // Navigation
  const canProceedStep = () => {
    switch (currentStepName) {
      case "hp":
        return currentChoices.hpRoll !== undefined;
      case "fighting-style":
        return !!currentChoices.fightingStyle;
      case "expertise":
        const expertiseChoice = levelRequirements.featureChoices?.find(c => c.type === "expertise");
        return (currentChoices.expertise?.length || 0) >= (expertiseChoice?.count || 0);
      case "metamagic":
        const metamagicChoice = levelRequirements.featureChoices?.find(c => c.type === "metamagic");
        return (currentChoices.metamagic?.length || 0) >= (metamagicChoice?.count || 0);
      case "magical-secrets":
        const secretsChoice = levelRequirements.featureChoices?.find(c => c.type === "magical_secrets");
        return (currentChoices.magicalSecrets?.length || 0) >= (secretsChoice?.count || 0);
      case "favored-enemy":
        return !!currentChoices.favoredEnemy;
      case "favored-terrain":
        return !!currentChoices.favoredTerrain;
      case "pact-boon":
        return !!currentChoices.pactBoon;
      case "invocations":
        const invocationsNeeded = getInvocationsKnownAtLevel(currentLevel) - getInvocationsKnownAtLevel(currentLevel - 1);
        return (currentChoices.invocations?.length || 0) >= invocationsNeeded;
      case "asi":
        if (!currentChoices.asiChoice) return false;
        if (currentChoices.asiChoice === "asi") {
          const total = Object.values(currentChoices.abilityIncreases || {}).reduce((s, v) => s + v, 0);
          return total === 2;
        }
        return !!currentChoices.selectedFeat;
      default:
        return true;
    }
  };

  const goNextStep = () => {
    // Update accumulated choices when moving past certain steps
    if (currentStepName === "favored-enemy" && currentChoices.favoredEnemy) {
      setAccumulatedFavoredEnemies(prev => [...prev, currentChoices.favoredEnemy!]);
    }
    if (currentStepName === "favored-terrain" && currentChoices.favoredTerrain) {
      setAccumulatedFavoredTerrains(prev => [...prev, currentChoices.favoredTerrain!]);
    }
    if (currentStepName === "invocations" && currentChoices.invocations) {
      setAccumulatedInvocations(prev => [...prev, ...currentChoices.invocations!]);
    }
    if (currentStepName === "metamagic" && currentChoices.metamagic) {
      setAccumulatedMetamagic(prev => [...prev, ...currentChoices.metamagic!]);
    }
    if (currentStepName === "expertise" && currentChoices.expertise) {
      setAccumulatedExpertise(prev => [...prev, ...currentChoices.expertise!]);
    }
    if (currentStepName === "pact-boon" && currentChoices.pactBoon) {
      setAccumulatedPactBoon(currentChoices.pactBoon);
    }

    if (currentLevelStep < totalStepsForLevel - 1) {
      setCurrentLevelStep(prev => prev + 1);
    } else if (currentLevelIndex < levelsToProcess.length - 1) {
      // Move to next level
      setCurrentLevelIndex(prev => prev + 1);
      setCurrentLevelStep(0);
    }
  };

  const goPrevStep = () => {
    if (currentLevelStep > 0) {
      setCurrentLevelStep(prev => prev - 1);
    } else if (currentLevelIndex > 0) {
      const prevLevelIdx = currentLevelIndex - 1;
      const prevLevel = levelsToProcess[prevLevelIdx];
      setCurrentLevelIndex(prevLevelIdx);
      // Compute actual step count for previous level (including HP step if level >= 2)
      const prevFeatureChoices = getFeatureChoicesAtLevel(draft.className || "", prevLevel);
      let prevStepCount = prevLevel >= 2 ? 1 : 0; // HP step
      prevFeatureChoices.forEach(choice => {
        if (choice.type === "fighting_style") prevStepCount++;
        if (choice.type === "expertise") prevStepCount++;
        if (choice.type === "metamagic") prevStepCount++;
        if (choice.type === "magical_secrets") prevStepCount++;
        if (choice.type === "favored_enemy") prevStepCount++;
        if (choice.type === "favored_terrain") prevStepCount++;
      });
      if (draft.className === "Warlock" && prevLevel === 3) prevStepCount++; // pact boon
      const prevInv = getInvocationsKnownAtLevel(prevLevel) - getInvocationsKnownAtLevel(prevLevel - 1);
      if (draft.className === "Warlock" && prevInv > 0) prevStepCount++;
      if (isASILevel(draft.className || "", prevLevel)) prevStepCount++;
      setCurrentLevelStep(Math.max(0, prevStepCount - 1));
    }
  };

  const isComplete = currentLevelIndex === levelsToProcess.length - 1 && 
                     currentLevelStep === totalStepsForLevel - 1 && 
                     canProceedStep();

  // Save all choices to draft as a Record keyed by level number
  useEffect(() => {
    if (levelChoices.length > 0) {
      const levelChoicesRecord: Record<number, LevelChoices> = {};
      for (const lc of levelChoices) {
        levelChoicesRecord[lc.level] = lc;
      }
      setDraft(prev => ({
        ...prev,
        choices: {
          ...prev.choices,
          featureChoices: {
            ...prev.choices.featureChoices,
            levelChoices: levelChoicesRecord as any,
          }
        }
      }));
    }
  }, [levelChoices]);

  if (levelsToProcess.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No additional level choices needed for this character.
        </CardContent>
      </Card>
    );
  }

  const progressPercent = ((currentLevelIndex * totalStepsForLevel + currentLevelStep + 1) / 
                          (levelsToProcess.length * Math.max(1, totalStepsForLevel))) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Level {currentLevel} Choices</CardTitle>
            <Badge variant="outline">
              Level {currentLevelIndex + 1} of {levelsToProcess.length}
            </Badge>
          </div>
          <CardDescription>
            Making choices for leveling from {currentLevel - 1} → {currentLevel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Step {currentLevelStep + 1} of {totalStepsForLevel}</span>
            <span>{Math.round(progressPercent)}% complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <ScrollArea className="h-[400px]">
        {/* HP Step */}
        {currentStepName === "hp" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Hit Points for Level {currentLevel}
              </CardTitle>
              <CardDescription>
                Roll 1d{hitDie} or take the average ({Math.floor(hitDie / 2) + 1})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleHpRoll} variant="outline" className="flex-1">
                  <Dice6 className="h-4 w-4 mr-2" />
                  Roll 1d{hitDie}
                </Button>
                <Button onClick={handleUseAverage} variant="outline" className="flex-1">
                  Take Average ({Math.floor(hitDie / 2) + 1})
                </Button>
              </div>
              
              {currentChoices.hpRoll !== undefined && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground">HP Gained</p>
                  <p className="text-3xl font-bold text-primary">
                    {currentChoices.hpRoll} + {conMod} = {currentChoices.hpRoll + conMod}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Roll + CON modifier)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fighting Style */}
        {currentStepName === "fighting-style" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                Fighting Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeatureChoiceStep
                choice={{ type: "fighting_style", count: 1 }}
                className={draft.className || ""}
                currentProficientSkills={[]}
                currentExpertiseSkills={[]}
                selectedValues={currentChoices.fightingStyle ? [currentChoices.fightingStyle] : []}
                onSelectionChange={(vals) => updateCurrentChoices({ fightingStyle: vals[0] })}
              />
            </CardContent>
          </Card>
        )}

        {/* Expertise */}
        {currentStepName === "expertise" && (
          <FeatureChoiceStep
            choice={levelRequirements.featureChoices?.find(c => c.type === "expertise") || { type: "expertise", count: 2 }}
            className={draft.className || ""}
            currentProficientSkills={proficientSkills}
            currentExpertiseSkills={accumulatedExpertise}
            selectedValues={currentChoices.expertise || []}
            onSelectionChange={(vals) => updateCurrentChoices({ expertise: vals })}
          />
        )}

        {/* Metamagic */}
        {currentStepName === "metamagic" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Metamagic Options
              </CardTitle>
              <CardDescription>
                Choose metamagic options to modify your spells
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {METAMAGIC_OPTIONS.filter(m => !accumulatedMetamagic.includes(m.id)).map(meta => (
                  <div
                    key={meta.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentChoices.metamagic?.includes(meta.id)
                        ? "bg-primary/20 border-primary/40"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      const current = currentChoices.metamagic || [];
                      const choice = levelRequirements.featureChoices?.find(c => c.type === "metamagic");
                      if (current.includes(meta.id)) {
                        updateCurrentChoices({ metamagic: current.filter(m => m !== meta.id) });
                      } else if (current.length < (choice?.count || 2)) {
                        updateCurrentChoices({ metamagic: [...current, meta.id] });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={currentChoices.metamagic?.includes(meta.id)} />
                      <span className="font-medium">{meta.name}</span>
                      <Badge variant="outline" className="text-xs">{(meta as any).cost || 1} SP</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Magical Secrets */}
        {currentStepName === "magical-secrets" && (
          <MagicalSecretsStep
            maxSpellLevel={getMaxSpellLevelForClass(draft.className || "", currentLevel)}
            currentSpellIds={draft.choices.spellsKnown}
            selectedSpells={currentChoices.magicalSecrets || []}
            count={levelRequirements.featureChoices?.find(c => c.type === "magical_secrets")?.count || 2}
            onSelectionChange={(spells) => updateCurrentChoices({ magicalSecrets: spells })}
          />
        )}

        {/* Favored Enemy */}
        {currentStepName === "favored-enemy" && (
          <FavoredEnemySelector
            currentFavoredEnemies={accumulatedFavoredEnemies}
            selectedEnemy={currentChoices.favoredEnemy || null}
            onSelectionChange={(enemy) => updateCurrentChoices({ favoredEnemy: enemy })}
          />
        )}

        {/* Favored Terrain */}
        {currentStepName === "favored-terrain" && (
          <FavoredTerrainSelector
            currentFavoredTerrains={accumulatedFavoredTerrains}
            selectedTerrain={currentChoices.favoredTerrain || null}
            onSelectionChange={(terrain) => updateCurrentChoices({ favoredTerrain: terrain })}
          />
        )}

        {/* Pact Boon */}
        {currentStepName === "pact-boon" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Pact Boon
              </CardTitle>
              <CardDescription>Choose your pact boon from your patron</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={currentChoices.pactBoon || ""}
                onValueChange={(val) => updateCurrentChoices({ pactBoon: val })}
              >
                {PACT_BOONS.map(boon => (
                  <div key={boon.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={boon.id} id={boon.id} className="mt-1" />
                    <div>
                      <Label htmlFor={boon.id} className="font-medium cursor-pointer">{boon.name}</Label>
                      <p className="text-sm text-muted-foreground">{boon.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Invocations */}
        {currentStepName === "invocations" && (
          <InvocationSelector
            warlockLevel={currentLevel}
            pactBoon={accumulatedPactBoon || currentChoices.pactBoon || null}
            knownCantrips={[]}
            currentInvocations={accumulatedInvocations}
            selectedNewInvocations={currentChoices.invocations || []}
            invocationsToRemove={[]}
            onNewInvocationToggle={(invId) => {
              const current = currentChoices.invocations || [];
              if (current.includes(invId)) {
                updateCurrentChoices({ invocations: current.filter(i => i !== invId) });
              } else {
                updateCurrentChoices({ invocations: [...current, invId] });
              }
            }}
            onRemoveInvocationToggle={() => {}}
            newCount={getInvocationsKnownAtLevel(currentLevel) - getInvocationsKnownAtLevel(currentLevel - 1)}
            replaceCount={0}
          />
        )}

        {/* ASI/Feat */}
        {currentStepName === "asi" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Ability Score Improvement
              </CardTitle>
              <CardDescription>
                Increase your abilities or take a feat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={currentChoices.asiChoice || ""}
                onValueChange={(val) => updateCurrentChoices({ 
                  asiChoice: val as "asi" | "feat",
                  abilityIncreases: val === "asi" ? {} : undefined,
                  selectedFeat: val === "feat" ? undefined : currentChoices.selectedFeat
                })}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <RadioGroupItem value="asi" id="asi" />
                  <Label htmlFor="asi">Ability Score Increase (+2 to one or +1 to two)</Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <RadioGroupItem value="feat" id="feat" />
                  <Label htmlFor="feat">Take a Feat</Label>
                </div>
              </RadioGroup>

              {currentChoices.asiChoice === "asi" && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {["STR", "DEX", "CON", "INT", "WIS", "CHA"].map(ability => {
                    const currentIncrease = currentChoices.abilityIncreases?.[ability] || 0;
                    const totalUsed = Object.values(currentChoices.abilityIncreases || {}).reduce((s, v) => s + v, 0);
                    const canAdd = totalUsed < 2 && currentIncrease < 2;
                    
                    return (
                      <div key={ability} className="flex items-center justify-between p-2 rounded border">
                        <span className="font-medium">{ability}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentIncrease === 0}
                            onClick={() => updateCurrentChoices({
                              abilityIncreases: {
                                ...currentChoices.abilityIncreases,
                                [ability]: currentIncrease - 1
                              }
                            })}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center">{currentIncrease}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canAdd}
                            onClick={() => updateCurrentChoices({
                              abilityIncreases: {
                                ...currentChoices.abilityIncreases,
                                [ability]: currentIncrease + 1
                              }
                            })}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentChoices.asiChoice === "feat" && (
                <FeatSelector
                  level={currentLevel}
                  abilityScores={draft.abilityScores}
                  currentFeats={[]}
                  selectedFeatId={currentChoices.selectedFeat}
                  onSelectFeat={(featId) => updateCurrentChoices({ selectedFeat: featId })}
                />
              )}
            </CardContent>
          </Card>
        )}
      </ScrollArea>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={goPrevStep}
          disabled={currentLevelIndex === 0 && currentLevelStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          {isComplete && (
            <Badge variant="default" className="bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              All Levels Complete
            </Badge>
          )}
        </div>

        <Button
          onClick={goNextStep}
          disabled={!canProceedStep()}
        >
          {isComplete ? "Done" : "Next"}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default StepLevelChoices;
