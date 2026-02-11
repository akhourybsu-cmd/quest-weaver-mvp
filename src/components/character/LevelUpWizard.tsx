import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, TrendingUp, Sparkles, BookOpen, Swords, Star, Shield, Eye } from "lucide-react";
import { FeatSelector } from "./FeatSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { applyFeature } from "@/lib/rules/rulesEngine";
import { getSpellSlotInfo } from "@/lib/rules/spellRules";
import { WizardSpellbookStep } from "./levelup/WizardSpellbookStep";
import { FeatureChoiceStep } from "./levelup/FeatureChoiceStep";
import { SpellSelectionStep } from "./levelup/SpellSelectionStep";
import { InvocationSelector } from "./levelup/InvocationSelector";
import { MagicalSecretsStep } from "./levelup/MagicalSecretsStep";
import { FavoredEnemySelector, FAVORED_ENEMY_TYPES } from "./levelup/FavoredEnemySelector";
import { FavoredTerrainSelector, FAVORED_TERRAIN_TYPES } from "./levelup/FavoredTerrainSelector";
import { MulticlassLevelUpStep } from "./levelup/MulticlassLevelUpStep";
import { SubclassSelectionStep } from "./levelup/SubclassSelectionStep";
import { MysticArcanumStep, getMysticArcanumSpellLevel } from "./levelup/MysticArcanumStep";
import type { AbilityKey } from "@/lib/rules/multiclassRules";
import {
  isThirdCasterSubclass,
  getThirdCasterCantripGain,
  getThirdCasterSpellsKnownGain,
  getThirdCasterMaxSpellLevel,
} from "@/lib/rules/thirdCasterUtils";
import { AUTO_PREPARED_BY_SUBCLASS } from "@/lib/rules/subclassSpells";
import {
  CLASS_LEVEL_UP_RULES,
  getClassRules,
  getSpellsKnownGain,
  getCantripGain,
  getFeatureChoicesAtLevel,
  isASILevel,
  getMaxSpellLevelForClass,
  getInvocationsKnownAtLevel,
  METAMAGIC_OPTIONS,
  PACT_BOONS,
  ELDRITCH_INVOCATIONS,
  FeatureChoice,
} from "@/lib/rules/levelUpRules";

interface LevelUpWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  currentLevel: number;
  onComplete: () => void;
}

type LevelUpStep = 
  | "class-select"
  | "hp-roll"
  | "subclass"
  | "wizard-spellbook"
  | "spells" 
  | "cantrips"
  | "invocations"
  | "pact-boon"
  | "metamagic"
  | "fighting-style"
  | "expertise"
  | "magical-secrets"
  | "mystic-arcanum"
  | "favored-enemy"
  | "favored-terrain"
  | "asi-or-feat" 
  | "features" 
  | "review";

interface CharacterClass {
  className: string;
  classId: string;
  level: number;
  isPrimary: boolean;
}

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
  concentration?: boolean;
  ritual?: boolean;
}

interface FeatureToGrant {
  id: string;
  name: string;
  description: string;
  level: number;
  source: string;
}

async function getSaveProficiencies(characterId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("character_saves")
    .select("str, dex, con, int, wis, cha")
    .eq("character_id", characterId)
    .single();
  
  const proficient = new Set<string>();
  if (data) {
    if (data.str) proficient.add("STR");
    if (data.dex) proficient.add("DEX");
    if (data.con) proficient.add("CON");
    if (data.int) proficient.add("INT");
    if (data.wis) proficient.add("WIS");
    if (data.cha) proficient.add("CHA");
  }
  return proficient;
}

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
  
  // Multiclass state
  const [characterClasses, setCharacterClasses] = useState<CharacterClass[]>([]);
  const [selectedClassToLevel, setSelectedClassToLevel] = useState<{ className: string; classId: string } | null>(null);

  // Reset all state when dialog opens
  useEffect(() => {
    if (open) {
      // Reset step - will be set to class-select if multiclass after loading
      setStep("hp-roll");
      setLoading(true);
      
      // Reset multiclass
      setCharacterClasses([]);
      setSelectedClassToLevel(null);
      
      // Reset HP
      setHpRoll(null);
      setUseAverage(false);
      
      // Reset ASI/Feat
      setAsiChoice(null);
      setSelectedFeat(null);
      setAbilityIncreases({});
      
      // Reset spells
      setNewSpells([]);
      setNewCantrips([]);
      setSpellToSwap(null);
      setSwapReplacement(null);
      setWizardSpellbookSpells([]);
      
      // Reset feature choices
      setFightingStyleChoice([]);
      setExpertiseChoices([]);
      setMetamagicChoices([]);
      setPactBoonChoice([]);
      setNewInvocations([]);
      setInvocationsToRemove([]);
      setMagicalSecretsSpells([]);
      setFavoredEnemyChoice(null);
      setFavoredTerrainChoice(null);
      setSelectedSubclassId(null);
      setMysticArcanumSpellId(null);
      setExistingArcanumSpellIds([]);
      setSubclassName(null);
      
      // Reset existing data caches
      setCurrentProficientSkills([]);
      setCurrentExpertiseSkills([]);
      setCurrentInvocations([]);
      setCurrentPactBoon(null);
      setCurrentMetamagic([]);
      setCurrentFavoredEnemies([]);
      setCurrentFavoredTerrains([]);
      setCurrentSpellIds([]);
      setAvailableSpells([]);
      setAvailableCantrips([]);
    }
  }, [open]);
  
  // HP
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useAverage, setUseAverage] = useState(false);
  
  // ASI/Feat
  const [asiChoice, setAsiChoice] = useState<"asi" | "feat" | null>(null);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [abilityIncreases, setAbilityIncreases] = useState<Record<string, number>>({});
  
  // Spells
  const [availableSpells, setAvailableSpells] = useState<SpellOption[]>([]);
  const [availableCantrips, setAvailableCantrips] = useState<SpellOption[]>([]);
  const [currentSpellIds, setCurrentSpellIds] = useState<string[]>([]);
  const [newSpells, setNewSpells] = useState<string[]>([]);
  const [newCantrips, setNewCantrips] = useState<string[]>([]);
  const [spellToSwap, setSpellToSwap] = useState<string | null>(null);
  const [swapReplacement, setSwapReplacement] = useState<string | null>(null);
  const [wizardSpellbookSpells, setWizardSpellbookSpells] = useState<string[]>([]);
  
  // Feature choices
  const [fightingStyleChoice, setFightingStyleChoice] = useState<string[]>([]);
  const [expertiseChoices, setExpertiseChoices] = useState<string[]>([]);
  const [metamagicChoices, setMetamagicChoices] = useState<string[]>([]);
  const [pactBoonChoice, setPactBoonChoice] = useState<string[]>([]);
  const [newInvocations, setNewInvocations] = useState<string[]>([]);
  const [invocationsToRemove, setInvocationsToRemove] = useState<string[]>([]);
  const [magicalSecretsSpells, setMagicalSecretsSpells] = useState<string[]>([]);
  const [favoredEnemyChoice, setFavoredEnemyChoice] = useState<string | null>(null);
  const [favoredTerrainChoice, setFavoredTerrainChoice] = useState<string | null>(null);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string | null>(null);
  const [mysticArcanumSpellId, setMysticArcanumSpellId] = useState<string | null>(null);
  const [existingArcanumSpellIds, setExistingArcanumSpellIds] = useState<string[]>([]);
  
  // Existing character data
  const [currentProficientSkills, setCurrentProficientSkills] = useState<string[]>([]);
  const [currentExpertiseSkills, setCurrentExpertiseSkills] = useState<string[]>([]);
  const [currentInvocations, setCurrentInvocations] = useState<string[]>([]);
  const [currentPactBoon, setCurrentPactBoon] = useState<string | null>(null);
  const [currentMetamagic, setCurrentMetamagic] = useState<string[]>([]);
  const [currentFavoredEnemies, setCurrentFavoredEnemies] = useState<string[]>([]);
  const [currentFavoredTerrains, setCurrentFavoredTerrains] = useState<string[]>([]);
  
  // Subclass name (for third-caster & auto-prepared detection)
  const [subclassName, setSubclassName] = useState<string | null>(null);
  
  // Features
  const [featuresToGrant, setFeaturesToGrant] = useState<FeatureToGrant[]>([]);

  const newLevel = currentLevel + 1;
  
  // Detect third-caster subclass
  const isThirdCaster = isThirdCasterSubclass(subclassName);
  
  // Get class rules
  const classRules = useMemo(() => {
    return character?.class ? getClassRules(character.class) : null;
  }, [character?.class]);

  // Calculate what's needed at this level (with third-caster override)
  const cantripGain = useMemo(() => {
    if (isThirdCaster) return getThirdCasterCantripGain(currentLevel, newLevel);
    if (!character?.class) return 0;
    return getCantripGain(character.class, currentLevel, newLevel);
  }, [character?.class, currentLevel, newLevel, isThirdCaster]);

  const spellsKnownGain = useMemo(() => {
    if (isThirdCaster) return getThirdCasterSpellsKnownGain(currentLevel, newLevel);
    if (!character?.class) return 0;
    return getSpellsKnownGain(character.class, currentLevel, newLevel);
  }, [character?.class, currentLevel, newLevel, isThirdCaster]);

  const isWizard = character?.class === "Wizard";
  const wizardSpellsToAdd = isWizard ? 2 : 0;

  const maxSpellLevel = useMemo(() => {
    if (isThirdCaster) return getThirdCasterMaxSpellLevel(newLevel);
    if (!character?.class) return 0;
    return getMaxSpellLevelForClass(character.class, newLevel);
  }, [character?.class, newLevel, isThirdCaster]);

  const canSwapSpell = useMemo(() => {
    if (isThirdCaster) return true;
    return classRules?.spellcasting.canSwapOnLevelUp || false;
  }, [classRules, isThirdCaster]);

  const featureChoices = useMemo(() => {
    if (!character?.class) return [];
    return getFeatureChoicesAtLevel(character.class, newLevel);
  }, [character?.class, newLevel]);

  const hasASI = useMemo(() => {
    if (!character?.class) return false;
    return isASILevel(character.class, newLevel);
  }, [character?.class, newLevel]);

  // Warlock-specific
  const invocationsToGain = useMemo(() => {
    if (character?.class !== "Warlock") return 0;
    const prevCount = getInvocationsKnownAtLevel(currentLevel);
    const newCount = getInvocationsKnownAtLevel(newLevel);
    return newCount - prevCount;
  }, [character?.class, currentLevel, newLevel]);

  const invocationReplaceCount = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "invocation");
    return choice?.replaceCount || 0;
  }, [featureChoices]);

  const showPactBoon = useMemo(() => {
    return character?.class === "Warlock" && newLevel === 3 && !currentPactBoon;
  }, [character?.class, newLevel, currentPactBoon]);

  // Sorcerer metamagic
  const metamagicToGain = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "metamagic");
    return choice?.count || 0;
  }, [featureChoices]);

  // Fighting style
  const fightingStyleToChoose = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "fighting_style");
    return choice || null;
  }, [featureChoices]);

  // Expertise
  const expertiseToChoose = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "expertise");
    return choice || null;
  }, [featureChoices]);

  // Magical Secrets (Bard)
  const magicalSecretsToChoose = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "magical_secrets");
    return choice || null;
  }, [featureChoices]);

  // Favored Enemy (Ranger)
  const favoredEnemyToChoose = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "favored_enemy");
    return choice || null;
  }, [featureChoices]);

  // Subclass needed?
  const needsSubclass = useMemo(() => {
    if (!classRules || !character) return false;
    // If character already has a subclass, no need
    if (character.subclass_id) return false;
    // If this level is the subclass level for the class
    return newLevel >= classRules.subclassLevel;
  }, [classRules, character, newLevel]);

  // Warlock Mystic Arcanum (levels 11, 13, 15, 17)
  const needsMysticArcanum = useMemo(() => {
    if (character?.class !== "Warlock") return false;
    return getMysticArcanumSpellLevel(newLevel) !== null;
  }, [character?.class, newLevel]);

  // Favored Terrain (Ranger)
  const favoredTerrainToChoose = useMemo(() => {
    const choice = featureChoices.find(c => c.type === "favored_terrain");
    return choice || null;
  }, [featureChoices]);

  // Load character data
  useEffect(() => {
    if (open) {
      loadCharacter();
      loadFeatures();
    }
  }, [open, characterId]);

  useEffect(() => {
    if (character?.class) {
      loadSpells();
      loadCharacterProficiencies();
      loadCharacterFeatureChoices();
      if (character.class === "Warlock") {
        loadExistingArcanum();
      }
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
      setCurrentSpellIds(data.character_spells?.filter((s: any) => s.known).map((s: any) => s.spell_id) || []);
      
      // Load subclass name for third-caster & auto-prepared detection
      if (data.subclass_id) {
        const { data: subclassData } = await supabase
          .from("srd_subclasses")
          .select("name")
          .eq("id", data.subclass_id)
          .single();
        setSubclassName(subclassData?.name || null);
      }
      
      // Load character classes for multiclass support
      const { data: classesData } = await supabase
        .from("character_classes")
        .select(`
          id,
          class_level,
          is_primary,
          class_id,
          srd_classes!inner(id, name)
        `)
        .eq("character_id", characterId);
      
      if (classesData && classesData.length > 0) {
        const classes: CharacterClass[] = classesData.map((c: any) => ({
          className: c.srd_classes.name,
          classId: c.class_id,
          level: c.class_level,
          isPrimary: c.is_primary || false,
        }));
        setCharacterClasses(classes);
        
        // If multiclass, start with class selection
        if (classes.length > 1) {
          setStep("class-select");
        } else {
          // Single class - auto-select it
          setSelectedClassToLevel({ className: classes[0].className, classId: classes[0].classId });
        }
      } else {
        // No character_classes entries - use main character class
        const { data: srdClass } = await supabase
          .from("srd_classes")
          .select("id, name")
          .eq("name", data.class)
          .single();
        
        if (srdClass) {
          const singleClass: CharacterClass = {
            className: srdClass.name,
            classId: srdClass.id,
            level: data.level,
            isPrimary: true,
          };
          setCharacterClasses([singleClass]);
          setSelectedClassToLevel({ className: singleClass.className, classId: singleClass.classId });
        }
      }
    } catch (error) {
      console.error("Error loading character:", error);
      toast.error("Failed to load character");
    } finally {
      setLoading(false);
    }
  };

  const loadCharacterProficiencies = async () => {
    try {
      const { data: skills } = await supabase
        .from("character_skills")
        .select("skill, proficient, expertise")
        .eq("character_id", characterId);

      if (skills) {
        setCurrentProficientSkills(skills.filter(s => s.proficient).map(s => s.skill));
        setCurrentExpertiseSkills(skills.filter(s => s.expertise).map(s => s.skill));
      }
    } catch (error) {
      console.error("Error loading proficiencies:", error);
    }
  };

  const loadCharacterFeatureChoices = async () => {
    try {
      const { data: choices } = await supabase
        .from("character_feature_choices")
        .select("choice_key, value_json")
        .eq("character_id", characterId);

      if (choices) {
        const favoredEnemies: string[] = [];
        const favoredTerrains: string[] = [];
        
        choices.forEach(choice => {
          if (choice.choice_key === "pact_boon") {
            setCurrentPactBoon((choice.value_json as any)?.id || null);
          }
          if (choice.choice_key === "invocation") {
            setCurrentInvocations(prev => [...prev, (choice.value_json as any)?.id].filter(Boolean));
          }
          if (choice.choice_key === "metamagic") {
            setCurrentMetamagic(prev => [...prev, (choice.value_json as any)?.id].filter(Boolean));
          }
          if (choice.choice_key === "favored_enemy") {
            favoredEnemies.push((choice.value_json as any)?.id);
          }
          if (choice.choice_key === "favored_terrain") {
            favoredTerrains.push((choice.value_json as any)?.id);
          }
        });
        
        setCurrentFavoredEnemies(favoredEnemies.filter(Boolean));
        setCurrentFavoredTerrains(favoredTerrains.filter(Boolean));
      }
    } catch (error) {
      console.error("Error loading feature choices:", error);
    }
  };

  const loadExistingArcanum = async () => {
    try {
      const { data } = await supabase
        .from("character_mystic_arcanum")
        .select("spell_id")
        .eq("character_id", characterId);
      setExistingArcanumSpellIds((data || []).map(d => d.spell_id).filter(Boolean) as string[]);
    } catch (error) {
      console.error("Error loading mystic arcanum:", error);
    }
  };

  const loadFeatures = async () => {
    try {
      const { data: charData } = await supabase
        .from("characters")
        .select("class, subclass_id")
        .eq("id", characterId)
        .single();

      if (!charData) return;

      const { data: classData } = await supabase
        .from("srd_classes")
        .select("id")
        .eq("name", charData.class)
        .single();

      if (!classData) return;

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
      const { data: spells } = await supabase
        .from("srd_spells")
        .select("id, name, level, school, concentration, ritual")
        .contains("classes", [character.class])
        .order("level")
        .order("name");

      if (spells) {
        setAvailableSpells(spells.filter(s => s.level > 0));
        setAvailableCantrips(spells.filter(s => s.level === 0));
      }
    } catch (error) {
      console.error("Error loading spells:", error);
    }
  };

  const getHitDie = () => classRules?.hitDie || 8;

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

  const toggleSpell = (spellId: string, list: string[], setList: (v: string[]) => void, max: number) => {
    if (list.includes(spellId)) {
      setList(list.filter(s => s !== spellId));
    } else if (list.length < max) {
      setList([...list, spellId]);
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
      const newProfBonus = Math.floor((newLevel - 1) / 4) + 2;

      // Calculate derived stats updates
      const charUpdates: Record<string, any> = {
        level: newLevel,
        max_hp: (character?.max_hp || 0) + hpGain,
        current_hp: (character?.current_hp || 0) + hpGain,
        hit_dice_total: newLevel,
        hit_dice_current: (character?.hit_dice_current || currentLevel) + 1,
        proficiency_bonus: newProfBonus,
      };

      // If subclass was chosen, save it
      if (selectedSubclassId) {
        charUpdates.subclass_id = selectedSubclassId;
      }

      // Recalculate saving throw mods based on new proficiency bonus
      const abilities = character?.character_abilities?.[0];
      if (abilities) {
        const saveProficiencies = await getSaveProficiencies(characterId);
        const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
        abilityKeys.forEach(ab => {
          const mod = Math.floor(((abilities[ab] || 10) - 10) / 2);
          const saveKey = `${ab}_save` as string;
          charUpdates[saveKey] = mod + (saveProficiencies.has(ab.toUpperCase()) ? newProfBonus : 0);
        });

        // Update passive perception
        const wisMod = Math.floor(((abilities.wis || 10) - 10) / 2);
        const { data: percSkill } = await supabase
          .from("character_skills")
          .select("proficient, expertise")
          .eq("character_id", characterId)
          .eq("skill", "Perception")
          .single();
        const percBonus = wisMod + (percSkill?.proficient ? newProfBonus : 0) + (percSkill?.expertise ? newProfBonus : 0);
        charUpdates.passive_perception = 10 + percBonus;

        // Update spell save DC and spell attack mod if character has spellcasting
        if (character.spell_ability) {
          const spellAbKey = character.spell_ability.toLowerCase();
          const spellAbMod = Math.floor(((abilities[spellAbKey] || 10) - 10) / 2);
          charUpdates.spell_save_dc = 8 + newProfBonus + spellAbMod;
          charUpdates.spell_attack_mod = newProfBonus + spellAbMod;
        }
      }

      // Update character level, HP, proficiency bonus, and derived stats
      await supabase
        .from("characters")
        .update(charUpdates)
        .eq("id", characterId);

      // Update the specific class level in character_classes (for multiclass support)
      if (selectedClassToLevel) {
        const existingClass = characterClasses.find(c => c.classId === selectedClassToLevel.classId);
        if (existingClass && existingClass.level > 0) {
          // Update existing class entry
          await supabase
            .from("character_classes")
            .update({ class_level: existingClass.level + 1 })
            .eq("character_id", characterId)
            .eq("class_id", selectedClassToLevel.classId);
        }
        // Note: If this is a new multiclass (level 0), it was already inserted by AddClassDialog
      }

      // Record level history
      const classIdForHistory = selectedClassToLevel?.classId;
      const { data: classData } = classIdForHistory 
        ? { data: { id: classIdForHistory } }
        : await supabase
            .from("srd_classes")
            .select("id")
            .eq("name", character?.class)
            .single();

      if (classData) {
        await supabase.from("character_level_history").insert({
          character_id: characterId,
          class_id: classData.id,
          previous_level: currentLevel,
          new_level: newLevel,
          hp_gained: hpGain,
          choices_made: {
            asi_or_feat: asiChoice,
            feat_id: selectedFeat,
            ability_increases: abilityIncreases,
            new_spells: newSpells,
            new_cantrips: newCantrips,
            wizard_spellbook: wizardSpellbookSpells,
            spell_swap: spellToSwap ? { from: spellToSwap, to: swapReplacement } : null,
            fighting_style: fightingStyleChoice,
            expertise: expertiseChoices,
            metamagic: metamagicChoices,
            pact_boon: pactBoonChoice,
            invocations: newInvocations,
            invocations_removed: invocationsToRemove,
            magical_secrets: magicalSecretsSpells,
            favored_enemy: favoredEnemyChoice,
            favored_terrain: favoredTerrainChoice,
            subclass_id: selectedSubclassId,
            mystic_arcanum_spell: mysticArcanumSpellId,
          },
          features_gained: featuresToGrant.map(f => ({ id: f.id, name: f.name }))
        });
      }

      // Add feat if selected
      if (asiChoice === "feat" && selectedFeat) {
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
      if (asiChoice === "asi" && Object.keys(abilityIncreases).length > 0) {
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

          // Recalculate derived stats with new ability scores
          const newAbilities = { ...abilities, ...updates };
          const saveProficiencies = await getSaveProficiencies(characterId);
          const derivedUpdates: Record<string, any> = {};
          const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
          abilityKeys.forEach(ab => {
            const mod = Math.floor(((newAbilities[ab] || 10) - 10) / 2);
            derivedUpdates[`${ab}_save`] = mod + (saveProficiencies.has(ab.toUpperCase()) ? newProfBonus : 0);
          });

          // Recalculate passive perception with new WIS
          const newWisMod = Math.floor(((newAbilities.wis || 10) - 10) / 2);
          const { data: percSkill2 } = await supabase
            .from("character_skills")
            .select("proficient, expertise")
            .eq("character_id", characterId)
            .eq("skill", "Perception")
            .single();
          derivedUpdates.passive_perception = 10 + newWisMod + (percSkill2?.proficient ? newProfBonus : 0) + (percSkill2?.expertise ? newProfBonus : 0);

          // Recalculate spell stats with new ability scores
          if (character.spell_ability) {
            const spellAbKey = character.spell_ability.toLowerCase();
            const spellAbMod = Math.floor(((newAbilities[spellAbKey] || 10) - 10) / 2);
            derivedUpdates.spell_save_dc = 8 + newProfBonus + spellAbMod;
            derivedUpdates.spell_attack_mod = newProfBonus + spellAbMod;
          }

          await supabase
            .from("characters")
            .update(derivedUpdates)
            .eq("id", characterId);
        }
      }

      // Add wizard spellbook spells
      if (wizardSpellbookSpells.length > 0) {
        const spellInserts = wizardSpellbookSpells.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: false,
          source: 'spellbook'
        }));
        await supabase.from("character_spells").insert(spellInserts);
      }

      // Add new known spells
      if (newSpells.length > 0) {
        const spellInserts = newSpells.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: false,
          source: 'class'
        }));
        await supabase.from("character_spells").insert(spellInserts);
      }

      // Add new cantrips
      if (newCantrips.length > 0) {
        const cantripInserts = newCantrips.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: true,
          source: 'class'
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
          prepared: false,
          source: 'class'
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

      // Save feature choices
      const featureChoicesToSave: any[] = [];

      if (fightingStyleChoice.length > 0) {
        featureChoicesToSave.push({
          character_id: characterId,
          feature_type: 'class',
          choice_key: 'fighting_style',
          value_json: { id: fightingStyleChoice[0], name: fightingStyleChoice[0] },
          level_gained: newLevel
        });
      }

      if (expertiseChoices.length > 0) {
        expertiseChoices.forEach(skill => {
          featureChoicesToSave.push({
            character_id: characterId,
            feature_type: 'class',
            choice_key: 'expertise',
            value_json: { skill },
            level_gained: newLevel
          });
        });

        // Also update character_skills with expertise
        for (const skill of expertiseChoices) {
          await supabase
            .from("character_skills")
            .update({ expertise: true })
            .eq("character_id", characterId)
            .eq("skill", skill);
        }
      }

      if (metamagicChoices.length > 0) {
        metamagicChoices.forEach(mm => {
          const option = METAMAGIC_OPTIONS.find(o => o.id === mm);
          featureChoicesToSave.push({
            character_id: characterId,
            feature_type: 'class',
            choice_key: 'metamagic',
            value_json: { id: mm, name: option?.name || mm },
            level_gained: newLevel
          });
        });
      }

      if (pactBoonChoice.length > 0) {
        const boon = PACT_BOONS.find(b => b.id === pactBoonChoice[0]);
        featureChoicesToSave.push({
          character_id: characterId,
          feature_type: 'class',
          choice_key: 'pact_boon',
          value_json: { id: pactBoonChoice[0], name: boon?.name || pactBoonChoice[0] },
          level_gained: newLevel
        });
      }

      if (newInvocations.length > 0) {
        newInvocations.forEach(inv => {
          const invocation = ELDRITCH_INVOCATIONS.find(i => i.id === inv);
          featureChoicesToSave.push({
            character_id: characterId,
            feature_type: 'class',
            choice_key: 'invocation',
            value_json: { id: inv, name: invocation?.name || inv },
            level_gained: newLevel
          });
        });
      }

      // Save Magical Secrets spells (Bard)
      if (magicalSecretsSpells.length > 0) {
        // Add spells to character_spells
        const secretsInserts = magicalSecretsSpells.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: false,
          source: 'magical_secrets'
        }));
        await supabase.from("character_spells").insert(secretsInserts);
        
        // Also record the choice
        featureChoicesToSave.push({
          character_id: characterId,
          feature_type: 'class',
          choice_key: 'magical_secrets',
          value_json: { spells: magicalSecretsSpells },
          level_gained: newLevel
        });
      }

      // Save Favored Enemy (Ranger)
      if (favoredEnemyChoice) {
        const enemy = FAVORED_ENEMY_TYPES.find(e => e.id === favoredEnemyChoice);
        featureChoicesToSave.push({
          character_id: characterId,
          feature_type: 'class',
          choice_key: 'favored_enemy',
          value_json: { id: favoredEnemyChoice, name: enemy?.name || favoredEnemyChoice },
          level_gained: newLevel
        });
      }

      // Save Favored Terrain (Ranger)
      if (favoredTerrainChoice) {
        const terrain = FAVORED_TERRAIN_TYPES.find(t => t.id === favoredTerrainChoice);
        featureChoicesToSave.push({
          character_id: characterId,
          feature_type: 'class',
          choice_key: 'favored_terrain',
          value_json: { id: favoredTerrainChoice, name: terrain?.name || favoredTerrainChoice },
          level_gained: newLevel
        });
      }

      // Save Mystic Arcanum (Warlock levels 11, 13, 15, 17)
      if (mysticArcanumSpellId) {
        const arcanumSpellLevel = getMysticArcanumSpellLevel(newLevel);
        if (arcanumSpellLevel) {
          await supabase.from("character_mystic_arcanum").insert({
            character_id: characterId,
            spell_level: arcanumSpellLevel,
            spell_id: mysticArcanumSpellId,
          });
        }
      }

      // Remove replaced invocations
      if (invocationsToRemove.length > 0) {
        for (const inv of invocationsToRemove) {
          await supabase
            .from("character_feature_choices")
            .delete()
            .eq("character_id", characterId)
            .eq("choice_key", "invocation")
            .contains("value_json", { id: inv });
        }
      }

      if (featureChoicesToSave.length > 0) {
        await supabase.from("character_feature_choices").insert(featureChoicesToSave);
      }

      // Update class resources
      await updateClassResources();

      // Update spell slots
      await updateSpellSlots();

      toast.success(`Leveled up to ${newLevel}!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error leveling up:", error);
      toast.error("Failed to level up character");
    }
  };

  const updateClassResources = async () => {
    if (!classRules) return;

    for (const resource of classRules.resourceProgression) {
      if (resource.startLevel && newLevel < resource.startLevel) continue;

      const abilityMod = resource.key === 'divine_sense' || resource.key === 'bardic_inspiration'
        ? Math.floor(((character?.character_abilities?.[0]?.cha || 10) - 10) / 2)
        : 0;

      const maxValue = resource.formula(newLevel, abilityMod);

      // Check if resource exists
      const { data: existing } = await supabase
        .from("character_resources")
        .select("id")
        .eq("character_id", characterId)
        .eq("resource_key", resource.key)
        .single();

      if (existing) {
        await supabase
          .from("character_resources")
          .update({ max_value: maxValue })
          .eq("id", existing.id);
      } else {
        await supabase.from("character_resources").insert({
          character_id: characterId,
          resource_key: resource.key,
          label: resource.label,
          max_value: maxValue,
          current_value: maxValue,
          recharge: resource.recharge
        });
      }
    }
  };

  const updateSpellSlots = async () => {
    if (!classRules || classRules.spellcasting.type === 'none') return;

    const slotInfo = getSpellSlotInfo([{ className: character.class, level: newLevel }]);

    if (slotInfo.shared) {
      for (const [level, count] of Object.entries(slotInfo.shared.slots)) {
        const { data: existing } = await supabase
          .from("character_spell_slots")
          .select("id")
          .eq("character_id", characterId)
          .eq("spell_level", parseInt(level))
          .single();

        if (existing) {
          await supabase
            .from("character_spell_slots")
            .update({ max_slots: count })
            .eq("id", existing.id);
        } else {
          await supabase.from("character_spell_slots").insert({
            character_id: characterId,
            spell_level: parseInt(level),
            max_slots: count,
            used_slots: 0
          });
        }
      }
    }

    if (slotInfo.pact) {
      // Handle warlock pact slots separately if needed
      const { data: existing } = await supabase
        .from("character_spell_slots")
        .select("id")
        .eq("character_id", characterId)
        .eq("spell_level", slotInfo.pact.pactSlotLevel)
        .single();

      if (existing) {
        await supabase
          .from("character_spell_slots")
          .update({ max_slots: slotInfo.pact.pactSlots })
          .eq("id", existing.id);
      }
    }
  };

  // Build steps array dynamically based on class
  const steps = useMemo(() => {
    const s: LevelUpStep[] = [];
    
    // Multiclass class selection (if multiple classes)
    if (characterClasses.length > 1) {
      s.push("class-select");
    }
    
    s.push("hp-roll");
    
    // Subclass selection (if this is the subclass level and none chosen yet)
    if (needsSubclass) {
      s.push("subclass");
    }
    
    // Wizard spellbook (always 2 spells per level)
    if (isWizard) {
      s.push("wizard-spellbook");
    }
    
    // Known caster spells
    if (spellsKnownGain > 0 && !isWizard) {
      s.push("spells");
    }
    
    // Cantrips
    if (cantripGain > 0) {
      s.push("cantrips");
    }
    
    // Warlock invocations
    if (invocationsToGain > 0 || invocationReplaceCount > 0) {
      s.push("invocations");
    }
    
    // Pact Boon (Warlock level 3)
    if (showPactBoon) {
      s.push("pact-boon");
    }
    
    // Metamagic (Sorcerer)
    if (metamagicToGain > 0) {
      s.push("metamagic");
    }
    
    // Fighting Style
    if (fightingStyleToChoose) {
      s.push("fighting-style");
    }
    
    // Expertise
    if (expertiseToChoose) {
      s.push("expertise");
    }
    
    // Magical Secrets (Bard)
    if (magicalSecretsToChoose) {
      s.push("magical-secrets");
    }
    
    // Mystic Arcanum (Warlock levels 11, 13, 15, 17)
    if (needsMysticArcanum) {
      s.push("mystic-arcanum");
    }
    
    // Favored Enemy (Ranger)
    if (favoredEnemyToChoose) {
      s.push("favored-enemy");
    }
    
    // Favored Terrain (Ranger)
    if (favoredTerrainToChoose) {
      s.push("favored-terrain");
    }
    
    // ASI/Feat
    if (hasASI) {
      s.push("asi-or-feat");
    }
    
    // Features (if any new features)
    if (featuresToGrant.length > 0) {
      s.push("features");
    }
    
    s.push("review");
    return s;
  }, [characterClasses.length, isWizard, spellsKnownGain, cantripGain, invocationsToGain, invocationReplaceCount, showPactBoon, metamagicToGain, fightingStyleToChoose, expertiseToChoose, magicalSecretsToChoose, needsMysticArcanum, favoredEnemyToChoose, favoredTerrainToChoose, hasASI, featuresToGrant, needsSubclass]);

  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (step) {
      case "class-select":
        return selectedClassToLevel !== null;
      case "hp-roll":
        return hpRoll !== null;
      case "subclass":
        return selectedSubclassId !== null;
      case "wizard-spellbook":
        return wizardSpellbookSpells.length === wizardSpellsToAdd;
      case "spells":
        return newSpells.length === spellsKnownGain;
      case "cantrips":
        return newCantrips.length === cantripGain;
      case "invocations":
        return newInvocations.length >= invocationsToGain;
      case "pact-boon":
        return pactBoonChoice.length === 1;
      case "metamagic":
        return metamagicChoices.length === metamagicToGain;
      case "fighting-style":
        return fightingStyleChoice.length === 1;
      case "expertise":
        return expertiseChoices.length === (expertiseToChoose?.count || 0);
      case "magical-secrets":
        return magicalSecretsSpells.length === (magicalSecretsToChoose?.count || 0);
      case "mystic-arcanum":
        return mysticArcanumSpellId !== null;
      case "favored-enemy":
        return favoredEnemyChoice !== null;
      case "favored-terrain":
        return favoredTerrainChoice !== null;
      case "asi-or-feat":
        if (!asiChoice) return false;
        if (asiChoice === "asi") {
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

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <DialogTitle>Level Up to {newLevel} - {character?.name}</DialogTitle>
          </div>
          <Progress value={progress} className="mt-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span className="capitalize">{step.replace(/-/g, ' ')}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Class Select Step (Multiclass) */}
          {step === "class-select" && (
            <MulticlassLevelUpStep
              characterId={characterId}
              characterClasses={characterClasses}
              abilityScores={{
                str: character?.character_abilities?.[0]?.str || 10,
                dex: character?.character_abilities?.[0]?.dex || 10,
                con: character?.character_abilities?.[0]?.con || 10,
                int: character?.character_abilities?.[0]?.int || 10,
                wis: character?.character_abilities?.[0]?.wis || 10,
                cha: character?.character_abilities?.[0]?.cha || 10,
              }}
              totalLevel={currentLevel}
              selectedClassToLevel={selectedClassToLevel?.className || null}
              onSelectClassToLevel={(className, classId) => {
                setSelectedClassToLevel({ className, classId });
              }}
              onClassAdded={(className, classId) => {
                const newClass: CharacterClass = {
                  className,
                  classId,
                  level: 0, // Will become 1 after level up
                  isPrimary: false,
                };
                setCharacterClasses([...characterClasses, newClass]);
                setSelectedClassToLevel({ className, classId });
              }}
            />
          )}

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

          {/* Subclass Selection Step */}
          {step === "subclass" && (
            <SubclassSelectionStep
              className={character?.class || ""}
              selectedSubclassId={selectedSubclassId}
              onSelect={setSelectedSubclassId}
            />
          )}

          {/* Wizard Spellbook Step */}
          {step === "wizard-spellbook" && (
            <WizardSpellbookStep
              availableSpells={availableSpells}
              currentSpellIds={currentSpellIds}
              selectedSpells={wizardSpellbookSpells}
              onSpellToggle={(id) => toggleSpell(id, wizardSpellbookSpells, setWizardSpellbookSpells, wizardSpellsToAdd)}
              spellsToAdd={wizardSpellsToAdd}
              maxSpellLevel={maxSpellLevel}
            />
          )}

          {/* Known Caster Spells Step */}
          {step === "spells" && (
            <SpellSelectionStep
              className={character?.class || ""}
              availableSpells={availableSpells}
              currentSpellIds={currentSpellIds}
              selectedNewSpells={newSpells}
              onNewSpellToggle={(id) => toggleSpell(id, newSpells, setNewSpells, spellsKnownGain)}
              spellsToAdd={spellsKnownGain}
              maxSpellLevel={maxSpellLevel}
              canSwap={canSwapSpell}
              spellToSwap={spellToSwap}
              swapReplacement={swapReplacement}
              onSpellToSwapChange={setSpellToSwap}
              onSwapReplacementChange={setSwapReplacement}
              availableCantrips={[]}
              selectedNewCantrips={[]}
              onNewCantripToggle={() => {}}
              cantripsToAdd={0}
            />
          )}

          {/* Cantrips Step */}
          {step === "cantrips" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Learn New Cantrips
                </CardTitle>
                <CardDescription>
                  Choose {cantripGain} new cantrip{cantripGain > 1 ? "s" : ""} from your class list.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <span className="text-sm font-medium">Cantrips Selected</span>
                  <Badge variant={newCantrips.length === cantripGain ? "default" : "secondary"}>
                    {newCantrips.length} / {cantripGain}
                  </Badge>
                </div>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-1">
                    {availableCantrips
                      .filter(s => !currentSpellIds.includes(s.id))
                      .map(spell => {
                        const isSelected = newCantrips.includes(spell.id);
                        const isDisabled = !isSelected && newCantrips.length >= cantripGain;
                        
                        return (
                          <div
                            key={spell.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/20 border border-primary/40"
                                : isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-muted/50"
                            }`}
                            onClick={() => !isDisabled && toggleSpell(spell.id, newCantrips, setNewCantrips, cantripGain)}
                          >
                            <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none" />
                            <div className="flex-1">
                              <span className="font-medium">{spell.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{spell.school}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Invocations Step (Warlock) */}
          {step === "invocations" && (
            <InvocationSelector
              warlockLevel={newLevel}
              pactBoon={currentPactBoon || pactBoonChoice[0] || null}
              knownCantrips={currentSpellIds.map(id => availableCantrips.find(c => c.id === id)?.name || "").filter(Boolean)}
              currentInvocations={currentInvocations}
              selectedNewInvocations={newInvocations}
              invocationsToRemove={invocationsToRemove}
              onNewInvocationToggle={(id) => toggleSpell(id, newInvocations, setNewInvocations, invocationsToGain + invocationsToRemove.length)}
              onRemoveInvocationToggle={(id) => toggleSpell(id, invocationsToRemove, setInvocationsToRemove, invocationReplaceCount)}
              newCount={invocationsToGain}
              replaceCount={invocationReplaceCount}
            />
          )}

          {/* Pact Boon Step (Warlock Level 3) */}
          {step === "pact-boon" && (
            <FeatureChoiceStep
              choice={{ type: "pact_boon", count: 1 }}
              className={character?.class || ""}
              currentProficientSkills={[]}
              currentExpertiseSkills={[]}
              selectedValues={pactBoonChoice}
              onSelectionChange={setPactBoonChoice}
            />
          )}

          {/* Metamagic Step (Sorcerer) */}
          {step === "metamagic" && (
            <FeatureChoiceStep
              choice={{ type: "metamagic", count: metamagicToGain }}
              className={character?.class || ""}
              currentProficientSkills={[]}
              currentExpertiseSkills={[]}
              selectedValues={metamagicChoices}
              onSelectionChange={setMetamagicChoices}
            />
          )}

          {/* Fighting Style Step */}
          {step === "fighting-style" && fightingStyleToChoose && (
            <FeatureChoiceStep
              choice={fightingStyleToChoose}
              className={character?.class || ""}
              currentProficientSkills={[]}
              currentExpertiseSkills={[]}
              selectedValues={fightingStyleChoice}
              onSelectionChange={setFightingStyleChoice}
            />
          )}

          {/* Expertise Step */}
          {step === "expertise" && expertiseToChoose && (
            <FeatureChoiceStep
              choice={expertiseToChoose}
              className={character?.class || ""}
              currentProficientSkills={currentProficientSkills}
              currentExpertiseSkills={currentExpertiseSkills}
              selectedValues={expertiseChoices}
              onSelectionChange={setExpertiseChoices}
            />
          )}

          {/* Magical Secrets Step (Bard) */}
          {step === "magical-secrets" && magicalSecretsToChoose && (
            <MagicalSecretsStep
              maxSpellLevel={maxSpellLevel}
              currentSpellIds={currentSpellIds}
              selectedSpells={magicalSecretsSpells}
              count={magicalSecretsToChoose.count}
              onSelectionChange={setMagicalSecretsSpells}
            />
          )}

          {/* Mystic Arcanum Step (Warlock levels 11, 13, 15, 17) */}
          {step === "mystic-arcanum" && (
            <MysticArcanumStep
              characterLevel={newLevel}
              selectedSpellId={mysticArcanumSpellId}
              onSelect={setMysticArcanumSpellId}
              existingArcanumSpellIds={existingArcanumSpellIds}
            />
          )}

          {/* Favored Enemy Step (Ranger) */}
          {step === "favored-enemy" && (
            <FavoredEnemySelector
              currentFavoredEnemies={currentFavoredEnemies}
              selectedEnemy={favoredEnemyChoice}
              onSelectionChange={setFavoredEnemyChoice}
            />
          )}

          {/* Favored Terrain Step (Ranger) */}
          {step === "favored-terrain" && (
            <FavoredTerrainSelector
              currentFavoredTerrains={currentFavoredTerrains}
              selectedTerrain={favoredTerrainChoice}
              onSelectionChange={setFavoredTerrainChoice}
            />
          )}

          {/* ASI or Feat Step */}
          {step === "asi-or-feat" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Ability Score Improvement
                  </CardTitle>
                  <CardDescription>
                    Increase your ability scores or choose a feat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={asiChoice === "asi" ? "default" : "outline"}
                      onClick={() => setAsiChoice("asi")}
                      className="h-20"
                    >
                      +2 Ability Scores
                    </Button>
                    <Button
                      variant={asiChoice === "feat" ? "default" : "outline"}
                      onClick={() => setAsiChoice("feat")}
                      className="h-20"
                    >
                      Choose a Feat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {asiChoice === "asi" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribute 2 Points</CardTitle>
                    <CardDescription>
                      Increase abilities by up to 2 each (max 20)
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
                                  <Badge className="bg-primary">{newScore}</Badge>
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

              {asiChoice === "feat" && (
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
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  New Features at Level {newLevel}
                </CardTitle>
                <CardDescription>
                  You gain the following features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuresToGrant.map((feature, idx) => (
                    <div key={feature.id || idx} className="border rounded-lg p-4 bg-muted/30">
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
                <CardDescription>Confirm your choices before leveling up to {newLevel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium">HP Gained</p>
                  <p className="text-3xl font-bold text-primary">
                    +{Math.max(1, (hpRoll || 0) + Math.floor(((character?.character_abilities?.[0]?.con || 10) - 10) / 2))}
                  </p>
                </div>

                <Separator />

                {selectedSubclassId && (
                  <div>
                    <p className="text-sm font-medium mb-2">Subclass Chosen</p>
                    <Badge variant="secondary">Subclass Selected</Badge>
                  </div>
                )}

                {wizardSpellbookSpells.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Spellbook Additions</p>
                    <div className="flex flex-wrap gap-2">
                      {wizardSpellbookSpells.map(id => {
                        const spell = availableSpells.find(s => s.id === id);
                        return spell ? <Badge key={id} variant="secondary">{spell.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                )}

                {newSpells.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">New Spells Known</p>
                    <div className="flex flex-wrap gap-2">
                      {newSpells.map(id => {
                        const spell = availableSpells.find(s => s.id === id);
                        return spell ? <Badge key={id} variant="secondary">{spell.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                )}

                {newCantrips.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">New Cantrips</p>
                    <div className="flex flex-wrap gap-2">
                      {newCantrips.map(id => {
                        const spell = availableCantrips.find(s => s.id === id);
                        return spell ? <Badge key={id} variant="secondary">{spell.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                )}

                {fightingStyleChoice.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Fighting Style</p>
                    <Badge>{fightingStyleChoice[0]}</Badge>
                  </div>
                )}

                {expertiseChoices.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {expertiseChoices.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {metamagicChoices.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Metamagic</p>
                    <div className="flex flex-wrap gap-2">
                      {metamagicChoices.map(mm => {
                        const option = METAMAGIC_OPTIONS.find(o => o.id === mm);
                        return <Badge key={mm} variant="secondary">{option?.name || mm}</Badge>;
                      })}
                    </div>
                  </div>
                )}

                {pactBoonChoice.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Pact Boon</p>
                    <Badge>{PACT_BOONS.find(b => b.id === pactBoonChoice[0])?.name}</Badge>
                  </div>
                )}

                {newInvocations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">New Invocations</p>
                    <div className="flex flex-wrap gap-2">
                      {newInvocations.map(inv => {
                        const invocation = ELDRITCH_INVOCATIONS.find(i => i.id === inv);
                        return <Badge key={inv} variant="secondary">{invocation?.name || inv}</Badge>;
                      })}
                    </div>
                  </div>
                )}

                {mysticArcanumSpellId && (
                  <div>
                    <p className="text-sm font-medium mb-2">Mystic Arcanum ({getMysticArcanumSpellLevel(newLevel)}th Level)</p>
                    <Badge variant="secondary">Arcanum Spell Selected</Badge>
                  </div>
                )}

                {hasASI && asiChoice && (
                  <div>
                    <p className="text-sm font-medium mb-2">{asiChoice === "asi" ? "Ability Increases" : "Feat"}</p>
                    {asiChoice === "asi" && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(abilityIncreases).map(([ability, increase]) => (
                          increase > 0 ? <Badge key={ability} variant="secondary">{ability} +{increase}</Badge> : null
                        ))}
                      </div>
                    )}
                    {asiChoice === "feat" && selectedFeat && (
                      <Badge variant="secondary">Feat Selected</Badge>
                    )}
                  </div>
                )}

                {featuresToGrant.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">New Features</p>
                    <div className="flex flex-wrap gap-2">
                      {featuresToGrant.map(f => (
                        <Badge key={f.id} variant="outline">{f.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step === "review" ? (
            <Button onClick={handleComplete} disabled={!canProceed()}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Level Up!
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
