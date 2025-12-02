import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, TrendingUp, Sparkles, BookOpen, Swords } from "lucide-react";
import { FeatSelector } from "./FeatSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { applyFeature } from "@/lib/rules/rulesEngine";
import { getCantripCount, getKnownPreparedModel } from "@/lib/rules/spellRules";

interface LevelUpWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  currentLevel: number;
  onComplete: () => void;
}

type LevelUpStep = "hp-roll" | "spells" | "asi-or-feat" | "features" | "review";

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
}

interface FeatureToGrant {
  id: string;
  name: string;
  description: string;
  level: number;
  source: string;
}

const HIT_DICE: Record<string, number> = {
  Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8,
  Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10,
  Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6
};

const KNOWN_CASTERS = ["Bard", "Sorcerer", "Warlock", "Ranger"];
const CANTRIP_CLASSES = ["Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"];

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
  
  // HP
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useAverage, setUseAverage] = useState(false);
  
  // ASI/Feat
  const [choice, setChoice] = useState<"asi" | "feat" | null>(null);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [abilityIncreases, setAbilityIncreases] = useState<Record<string, number>>({});
  
  // Spells
  const [availableSpells, setAvailableSpells] = useState<SpellOption[]>([]);
  const [currentSpells, setCurrentSpells] = useState<string[]>([]);
  const [newSpells, setNewSpells] = useState<string[]>([]);
  const [spellToSwap, setSpellToSwap] = useState<string | null>(null);
  const [swapReplacement, setSwapReplacement] = useState<string | null>(null);
  const [newCantrips, setNewCantrips] = useState<string[]>([]);
  const [availableCantrips, setAvailableCantrips] = useState<SpellOption[]>([]);
  
  // Features
  const [featuresToGrant, setFeaturesToGrant] = useState<FeatureToGrant[]>([]);

  const newLevel = currentLevel + 1;
  
  // Determine if ASI/Feat is available at this level
  const canChooseFeat = useMemo(() => {
    if (!character?.class) return false;
    const cls = character.class;
    // Standard ASI levels: 4, 8, 12, 16, 19
    const standardASI = [4, 8, 12, 16, 19].includes(newLevel);
    // Fighter gets extra at 6, 14
    const fighterExtra = cls === "Fighter" && [6, 14].includes(newLevel);
    // Rogue gets extra at 10
    const rogueExtra = cls === "Rogue" && newLevel === 10;
    return standardASI || fighterExtra || rogueExtra;
  }, [character?.class, newLevel]);

  // Determine if this class is a known caster that gains spells on level up
  const isKnownCaster = useMemo(() => {
    return KNOWN_CASTERS.includes(character?.class || "");
  }, [character?.class]);

  // Determine if this class gets cantrips and if they gain one at this level
  const cantripGain = useMemo(() => {
    if (!character?.class || !CANTRIP_CLASSES.includes(character.class)) return 0;
    const prevCount = getCantripCount(character.class, currentLevel);
    const newCount = getCantripCount(character.class, newLevel);
    return newCount - prevCount;
  }, [character?.class, currentLevel, newLevel]);

  // Calculate spells known increase
  const spellsKnownGain = useMemo(() => {
    if (!isKnownCaster || !character?.class) return 0;
    const prevModel = getKnownPreparedModel(character.class, currentLevel, 0);
    const newModel = getKnownPreparedModel(character.class, newLevel, 0);
    if (prevModel.model !== "known" || newModel.model !== "known") return 0;
    return (newModel.knownMax || 0) - (prevModel.knownMax || 0);
  }, [character?.class, currentLevel, newLevel, isKnownCaster]);

  // Can swap one spell on level up (Bard, Sorcerer, Warlock)
  const canSwapSpell = useMemo(() => {
    return ["Bard", "Sorcerer", "Warlock"].includes(character?.class || "");
  }, [character?.class]);

  useEffect(() => {
    if (open) {
      loadCharacter();
      loadFeatures();
    }
  }, [open, characterId]);

  useEffect(() => {
    if (character?.class) {
      loadSpells();
    }
  }, [character?.class]);

  const loadCharacter = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .select(`
          *,
          character_abilities(*),
          character_feats(*),
          character_spells(spell_id, known)
        `)
        .eq("id", characterId)
        .single();

      if (error) throw error;
      setCharacter(data);
      setCurrentSpells(data.character_spells?.filter((s: any) => s.known).map((s: any) => s.spell_id) || []);
    } catch (error) {
      console.error("Error loading character:", error);
      toast.error("Failed to load character");
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      // Get class ID
      const { data: classes } = await supabase
        .from("srd_classes")
        .select("id, name")
        .single();

      // Get character's class
      const { data: charData } = await supabase
        .from("characters")
        .select("class, subclass_id")
        .eq("id", characterId)
        .single();

      if (!charData) return;

      // Get class ID by name
      const { data: classData } = await supabase
        .from("srd_classes")
        .select("id")
        .eq("name", charData.class)
        .single();

      if (!classData) return;

      // Get class features for this level
      const { data: classFeatures } = await supabase
        .from("srd_class_features")
        .select("id, name, description, level")
        .eq("class_id", classData.id)
        .eq("level", newLevel);

      const features: FeatureToGrant[] = (classFeatures || []).map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        level: f.level,
        source: "Class"
      }));

      // Get subclass features if applicable
      if (charData.subclass_id) {
        const { data: subclassFeatures } = await supabase
          .from("srd_subclass_features")
          .select("id, name, description, level")
          .eq("subclass_id", charData.subclass_id)
          .eq("level", newLevel);

        (subclassFeatures || []).forEach(f => {
          features.push({
            id: f.id,
            name: f.name,
            description: f.description,
            level: f.level,
            source: "Subclass"
          });
        });
      }

      setFeaturesToGrant(features);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  const loadSpells = async () => {
    if (!character?.class) return;

    try {
      // Load spells available for this class
      const { data: spells } = await supabase
        .from("srd_spells")
        .select("id, name, level, school")
        .contains("classes", [character.class])
        .order("level")
        .order("name");

      if (spells) {
        const leveledSpells = spells.filter(s => s.level > 0);
        const cantrips = spells.filter(s => s.level === 0);
        setAvailableSpells(leveledSpells);
        setAvailableCantrips(cantrips);
      }
    } catch (error) {
      console.error("Error loading spells:", error);
    }
  };

  const getHitDie = () => HIT_DICE[character?.class] || 8;

  const rollHP = () => {
    const die = getHitDie();
    const roll = Math.floor(Math.random() * die) + 1;
    setHpRoll(roll);
    setUseAverage(false);
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

    setAbilityIncreases({ ...abilityIncreases, [ability]: newValue });
  };

  const toggleNewSpell = (spellId: string) => {
    if (newSpells.includes(spellId)) {
      setNewSpells(newSpells.filter(s => s !== spellId));
    } else if (newSpells.length < spellsKnownGain) {
      setNewSpells([...newSpells, spellId]);
    }
  };

  const toggleNewCantrip = (spellId: string) => {
    if (newCantrips.includes(spellId)) {
      setNewCantrips(newCantrips.filter(s => s !== spellId));
    } else if (newCantrips.length < cantripGain) {
      setNewCantrips([...newCantrips, spellId]);
    }
  };

  const handleComplete = async () => {
    if (!hpRoll) {
      toast.error("Please roll for HP");
      return;
    }

    try {
      const conMod = Math.floor(((character?.character_abilities?.[0]?.con || 10) - 10) / 2);
      const hpGain = Math.max(1, hpRoll + conMod);

      // Update character level and HP
      const { error: updateError } = await supabase
        .from("characters")
        .update({
          level: newLevel,
          max_hp: (character?.max_hp || 0) + hpGain,
          current_hp: (character?.current_hp || 0) + hpGain,
          hit_dice_total: newLevel,
          hit_dice_current: (character?.hit_dice_current || currentLevel) + 1
        })
        .eq("id", characterId);

      if (updateError) throw updateError;

      // Get class ID for history
      const { data: classData } = await supabase
        .from("srd_classes")
        .select("id")
        .eq("name", character?.class)
        .single();

      // Record level history
      if (classData) {
        await supabase.from("character_level_history").insert({
          character_id: characterId,
          class_id: classData.id,
          previous_level: currentLevel,
          new_level: newLevel,
          hp_gained: hpGain,
          choices_made: {
            asi_or_feat: choice,
            feat_id: selectedFeat,
            ability_increases: abilityIncreases,
            new_spells: newSpells,
            new_cantrips: newCantrips,
            spell_swap: spellToSwap ? { from: spellToSwap, to: swapReplacement } : null
          },
          features_gained: featuresToGrant.map(f => ({ id: f.id, name: f.name }))
        });
      }

      // Add feat if selected
      if (choice === "feat" && selectedFeat) {
        await supabase.from("character_feats").insert({
          character_id: characterId,
          feat_id: selectedFeat,
          level_gained: newLevel
        });

        const { data: featData } = await supabase
          .from("srd_feats")
          .select("*")
          .eq("id", selectedFeat)
          .single();

        if (featData) {
          await applyFeature({
            characterId,
            featureId: featData.id,
            featureType: 'feat',
            rules: (featData.grants || {}) as any,
            level: newLevel
          });
        }
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

          await supabase
            .from("character_abilities")
            .update(updates)
            .eq("character_id", characterId);
        }
      }

      // Add new spells
      if (newSpells.length > 0) {
        const spellInserts = newSpells.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: false
        }));
        await supabase.from("character_spells").insert(spellInserts);
      }

      // Add new cantrips
      if (newCantrips.length > 0) {
        const cantripInserts = newCantrips.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: true // Cantrips are always prepared
        }));
        await supabase.from("character_spells").insert(cantripInserts);
      }

      // Handle spell swap
      if (spellToSwap && swapReplacement) {
        await supabase
          .from("character_spells")
          .delete()
          .eq("character_id", characterId)
          .eq("spell_id", spellToSwap);

        await supabase.from("character_spells").insert({
          character_id: characterId,
          spell_id: swapReplacement,
          known: true,
          prepared: false
        });
      }

      // Add granted features
      if (featuresToGrant.length > 0) {
        const featureInserts = featuresToGrant.map(f => ({
          character_id: characterId,
          name: f.name,
          description: f.description,
          level: f.level,
          source: f.source
        }));
        await supabase.from("character_features").insert(featureInserts);
      }

      // Update class resources if applicable
      await updateClassResources();

      toast.success(`Leveled up to ${newLevel}!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error leveling up:", error);
      toast.error("Failed to level up character");
    }
  };

  const updateClassResources = async () => {
    // Update resource max values based on new level
    const resourceUpdates: Record<string, number> = {};
    
    switch (character?.class) {
      case "Barbarian":
        if (newLevel >= 17) resourceUpdates["rage"] = 6;
        else if (newLevel >= 12) resourceUpdates["rage"] = 5;
        else if (newLevel >= 6) resourceUpdates["rage"] = 4;
        else if (newLevel >= 3) resourceUpdates["rage"] = 3;
        else resourceUpdates["rage"] = 2;
        break;
      case "Monk":
        resourceUpdates["ki_points"] = newLevel;
        break;
      case "Sorcerer":
        resourceUpdates["sorcery_points"] = newLevel;
        break;
      case "Bard":
        const chaMod = Math.floor(((character?.character_abilities?.[0]?.cha || 10) - 10) / 2);
        resourceUpdates["bardic_inspiration"] = Math.max(1, chaMod);
        break;
    }

    for (const [key, max] of Object.entries(resourceUpdates)) {
      await supabase
        .from("character_resources")
        .update({ max_value: max })
        .eq("character_id", characterId)
        .eq("resource_key", key);
    }
  };

  // Build steps array based on what's available
  const steps = useMemo(() => {
    const s: LevelUpStep[] = ["hp-roll"];
    if (isKnownCaster && (spellsKnownGain > 0 || cantripGain > 0 || canSwapSpell)) {
      s.push("spells");
    }
    if (canChooseFeat) {
      s.push("asi-or-feat");
    }
    if (featuresToGrant.length > 0) {
      s.push("features");
    }
    s.push("review");
    return s;
  }, [isKnownCaster, spellsKnownGain, cantripGain, canSwapSpell, canChooseFeat, featuresToGrant]);

  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  if (loading) return null;

  const canProceed = () => {
    switch (step) {
      case "hp-roll":
        return hpRoll !== null;
      case "spells":
        return newSpells.length === spellsKnownGain && newCantrips.length === cantripGain;
      case "asi-or-feat":
        if (!choice) return false;
        if (choice === "asi") {
          const total = Object.values(abilityIncreases).reduce((sum, val) => sum + val, 0);
          return total === 2;
        }
        return !!selectedFeat;
      case "features":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <DialogTitle>Level Up to {newLevel}</DialogTitle>
          </div>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* HP Roll Step */}
          {step === "hp-roll" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5" />
                  Roll for Hit Points
                </CardTitle>
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
                      {useAverage ? "Average HP" : "Rolled HP"} + CON modifier = 
                      <span className="font-bold ml-1">
                        {Math.max(1, hpRoll + Math.floor(((character?.character_abilities?.[0]?.con || 10) - 10) / 2))} HP
                      </span>
                    </p>
                    <Button onClick={() => setHpRoll(null)} variant="outline" size="sm">
                      Re-roll
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Spells Step */}
          {step === "spells" && (
            <div className="space-y-4">
              {/* New Cantrips */}
              {cantripGain > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Learn New Cantrips ({newCantrips.length}/{cantripGain})
                    </CardTitle>
                    <CardDescription>
                      You can learn {cantripGain} new cantrip{cantripGain > 1 ? "s" : ""} at this level.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {availableCantrips
                          .filter(s => !currentSpells.includes(s.id))
                          .map(spell => (
                            <div
                              key={spell.id}
                              className={`flex items-center gap-3 p-2 border rounded cursor-pointer transition-colors ${
                                newCantrips.includes(spell.id) ? "bg-primary/10 border-primary" : "hover:bg-muted"
                              }`}
                              onClick={() => toggleNewCantrip(spell.id)}
                            >
                              <Checkbox checked={newCantrips.includes(spell.id)} />
                              <div>
                                <p className="font-medium">{spell.name}</p>
                                <p className="text-xs text-muted-foreground">{spell.school}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* New Spells Known */}
              {spellsKnownGain > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Learn New Spells ({newSpells.length}/{spellsKnownGain})
                    </CardTitle>
                    <CardDescription>
                      You can learn {spellsKnownGain} new spell{spellsKnownGain > 1 ? "s" : ""} at this level.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {availableSpells
                          .filter(s => !currentSpells.includes(s.id) && !newSpells.includes(s.id) || newSpells.includes(s.id))
                          .map(spell => (
                            <div
                              key={spell.id}
                              className={`flex items-center gap-3 p-2 border rounded cursor-pointer transition-colors ${
                                newSpells.includes(spell.id) ? "bg-primary/10 border-primary" : "hover:bg-muted"
                              }`}
                              onClick={() => toggleNewSpell(spell.id)}
                            >
                              <Checkbox checked={newSpells.includes(spell.id)} />
                              <div className="flex-1">
                                <p className="font-medium">{spell.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Level {spell.level} • {spell.school}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Spell Swap */}
              {canSwapSpell && currentSpells.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Swap a Spell (Optional)</CardTitle>
                    <CardDescription>
                      You may replace one spell you know with another from the {character?.class} spell list.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Spell to Replace</p>
                      <ScrollArea className="h-[150px] border rounded p-2">
                        {currentSpells.map(spellId => {
                          const spell = availableSpells.find(s => s.id === spellId);
                          if (!spell) return null;
                          return (
                            <div
                              key={spellId}
                              className={`p-2 rounded cursor-pointer ${
                                spellToSwap === spellId ? "bg-destructive/10" : "hover:bg-muted"
                              }`}
                              onClick={() => setSpellToSwap(spellToSwap === spellId ? null : spellId)}
                            >
                              {spell.name}
                            </div>
                          );
                        })}
                      </ScrollArea>
                    </div>
                    {spellToSwap && (
                      <div>
                        <p className="text-sm font-medium mb-2">Replace With</p>
                        <ScrollArea className="h-[150px] border rounded p-2">
                          {availableSpells
                            .filter(s => !currentSpells.includes(s.id) && !newSpells.includes(s.id))
                            .map(spell => (
                              <div
                                key={spell.id}
                                className={`p-2 rounded cursor-pointer ${
                                  swapReplacement === spell.id ? "bg-primary/10" : "hover:bg-muted"
                                }`}
                                onClick={() => setSwapReplacement(spell.id)}
                              >
                                {spell.name} (Level {spell.level})
                              </div>
                            ))}
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ASI or Feat Step */}
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
                      Distribute 2 points among your abilities (max 20)
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

          {/* Features Step */}
          {step === "features" && featuresToGrant.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>New Features at Level {newLevel}</CardTitle>
                <CardDescription>
                  You gain the following features at this level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuresToGrant.map((feature, idx) => (
                    <div key={feature.id || idx} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{feature.name}</h4>
                        <Badge variant="outline">{feature.source}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Step */}
          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle>Review Level Up</CardTitle>
                <CardDescription>Confirm your choices before leveling up</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">HP Gained</p>
                  <p className="text-2xl font-bold text-primary">
                    +{Math.max(1, (hpRoll || 0) + Math.floor(((character?.character_abilities?.[0]?.con || 10) - 10) / 2))}
                  </p>
                </div>

                <Separator />

                {newCantrips.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">New Cantrips</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {newCantrips.map(id => {
                        const spell = availableCantrips.find(s => s.id === id);
                        return spell ? <Badge key={id}>{spell.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                )}

                {newSpells.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">New Spells Known</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {newSpells.map(id => {
                        const spell = availableSpells.find(s => s.id === id);
                        return spell ? <Badge key={id}>{spell.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                )}

                {spellToSwap && swapReplacement && (
                  <div>
                    <p className="text-sm font-medium">Spell Swap</p>
                    <p className="text-sm text-muted-foreground">
                      {availableSpells.find(s => s.id === spellToSwap)?.name} → 
                      {availableSpells.find(s => s.id === swapReplacement)?.name}
                    </p>
                  </div>
                )}

                {canChooseFeat && choice && (
                  <div>
                    <p className="text-sm font-medium">{choice === "asi" ? "Ability Improvements" : "Feat"}</p>
                    {choice === "asi" && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(abilityIncreases).map(([ability, increase]) => (
                          increase > 0 && <Badge key={ability}>{ability} +{increase}</Badge>
                        ))}
                      </div>
                    )}
                    {choice === "feat" && selectedFeat && (
                      <Badge className="mt-1">Feat Selected</Badge>
                    )}
                  </div>
                )}

                {featuresToGrant.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">New Features</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {featuresToGrant.map((f, idx) => (
                        <Badge key={idx} variant="secondary">{f.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const prevIndex = currentStepIndex - 1;
                if (prevIndex >= 0) setStep(steps[prevIndex]);
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
                  if (nextIndex < steps.length) setStep(steps[nextIndex]);
                }}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!canProceed()}>
                Complete Level Up
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};