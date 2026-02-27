import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, Loader2, Sparkles } from "lucide-react";
import { useAtom } from "jotai";
import { draftAtom, resetDraftAtom } from "@/state/characterWizard";
import { emptyGrants } from "@/lib/rules/5eRules";
import { useSRDAutoSeed } from "@/hooks/useSRDAutoSeed";
import { CLASS_LEVEL_UP_RULES } from "@/lib/rules/levelUpRules";

// Wizard steps
import StepBasics from "./wizard/StepBasics";
import StepAncestry from "./wizard/StepAncestry";
import StepAbilities from "./wizard/StepAbilities";
import StepBackground from "./wizard/StepBackground";
import StepProficiencies from "./wizard/StepProficiencies";
import StepEquipment from "./wizard/StepEquipment";
import StepSpells from "./wizard/StepSpells";
import StepFeatures from "./wizard/StepFeatures";
import StepLevelChoices from "./wizard/StepLevelChoices";
import StepDescription from "./wizard/StepDescription";
import StepReview from "./wizard/StepReview";
import LiveSummaryPanel from "./wizard/LiveSummaryPanel";

interface CharacterWizardProps {
  open: boolean;
  campaignId: string | null;
  onComplete: () => void;
  editCharacterId?: string | null;
}

export interface WizardData {
  // Step 1: Basics
  name: string;
  level: number;
  classId: string;
  className: string;
  subclassId?: string;
  
  // Step 2: Ancestry
  ancestryId: string;
  subancestryId?: string;
  
  // Step 3: Ability Scores
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  abilityMethod: "standard-array" | "point-buy" | "rolled";
  
  // Step 4: Background
  backgroundId: string;
  
  // Step 5: Proficiencies
  skills: string[];
  tools: string[];
  languages: string[];
  
  // Step 6: Equipment
  equipment: { item_ref: string; qty: number; equipped: boolean; data: any }[];
  startingGold?: number;
  
  // Step 7: Spells (if applicable)
  spells: { spell_id: string; known: boolean; prepared: boolean }[];
  
  // Step 8: Features
  features: { source: string; name: string; level: number; description: string; data: any }[];
  
  // Step 9: Description
  alignment?: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  personality?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  portrait_url?: string;
  notes?: string;
}

// Steps are now computed dynamically based on level
const getSteps = (level: number, isSpellcaster: boolean) => {
  const baseSteps = [
    "Basics",
    "Ancestry",
    "Abilities",
    "Background",
    "Proficiencies",
    "Equipment",
  ];
  
  if (isSpellcaster) {
    baseSteps.push("Spells");
  }
  
  baseSteps.push("Features");
  
  // Add level choices step if level > 1
  if (level > 1) {
    baseSteps.push("Level Choices");
  }
  
  baseSteps.push("Description", "Review");
  
  return baseSteps;
};

// === Helper: deserialize grants from JSON (arrays -> Sets) ===
function deserializeGrants(raw: any) {
  return {
    savingThrows: new Set<string>(raw?.savingThrows || []),
    skillProficiencies: new Set<string>(raw?.skillProficiencies || []),
    toolProficiencies: new Set<string>(raw?.toolProficiencies || []),
    armorProficiencies: new Set<string>(raw?.armorProficiencies || []),
    weaponProficiencies: new Set<string>(raw?.weaponProficiencies || []),
    languages: new Set<string>(raw?.languages || []),
    features: raw?.features || [],
    traits: raw?.traits || [],
    abilityBonuses: raw?.abilityBonuses || {},
  };
}

// === Helper: serialize grants to JSON (Sets -> arrays) ===
function serializeGrants(grants: any) {
  return {
    savingThrows: Array.from(grants.savingThrows || []),
    skillProficiencies: Array.from(grants.skillProficiencies || []),
    toolProficiencies: Array.from(grants.toolProficiencies || []),
    armorProficiencies: Array.from(grants.armorProficiencies || []),
    weaponProficiencies: Array.from(grants.weaponProficiencies || []),
    languages: Array.from(grants.languages || []),
    features: grants.features || [],
    traits: grants.traits || [],
    abilityBonuses: grants.abilityBonuses || {},
  };
}

// === Helper: compute derived stats ===
function applyAncestryBonuses(baseScores: Record<string, number>, abilityBonuses: Record<string, number>): Record<string, number> {
  const result = { ...baseScores };
  for (const [ability, bonus] of Object.entries(abilityBonuses)) {
    const key = ability.toUpperCase();
    if (key in result) {
      result[key] += bonus;
    }
  }
  return result;
}

function computeDerivedStats(draft: any, classRules: any) {
  // Apply ancestry ability bonuses before computing modifiers
  const bonuses = draft.grants?.abilityBonuses || {};
  const scores = applyAncestryBonuses(draft.abilityScores, bonuses);
  
  const abilityMod = (score: number) => Math.floor((score - 10) / 2);
  const conMod = abilityMod(scores.CON);
  const dexMod = abilityMod(scores.DEX);
  const wisMod = abilityMod(scores.WIS);
  const intMod = abilityMod(scores.INT);
  const chaMod = abilityMod(scores.CHA);
  const strMod = abilityMod(scores.STR);
  
  const hitDie = classRules?.hitDie || 8;
  const profBonus = Math.floor((draft.level - 1) / 4) + 2;
  
  // HP calculation: Level 1 = max hit die + CON mod. Levels 2+ from levelChoices or average
  let maxHp = hitDie + conMod;
  const levelChoices = draft.choices?.featureChoices?.levelChoices;
  if (levelChoices && typeof levelChoices === 'object') {
    for (let lvl = 2; lvl <= draft.level; lvl++) {
      const lc = levelChoices[lvl];
      const hpRoll = lc?.hpRoll ?? (Math.floor(hitDie / 2) + 1); // default to average
      maxHp += hpRoll + conMod;
    }
  } else if (draft.level > 1) {
    // No level choices recorded, use average for all levels
    for (let lvl = 2; lvl <= draft.level; lvl++) {
      maxHp += (Math.floor(hitDie / 2) + 1) + conMod;
    }
  }
  maxHp = Math.max(maxHp, draft.level); // minimum 1 HP per level
  
  // Check skill proficiencies for passive calculations
  const allSkills = new Set([
    ...Array.from(draft.grants?.skillProficiencies || []),
    ...(draft.choices?.skills || []),
  ]);
  
  const passivePerception = 10 + wisMod + (allSkills.has('Perception') ? profBonus : 0);
  const passiveInvestigation = 10 + intMod + (allSkills.has('Investigation') ? profBonus : 0);
  const passiveInsight = 10 + wisMod + (allSkills.has('Insight') ? profBonus : 0);
  
  // Saving throw values
  const saveProficient = draft.grants?.savingThrows || new Set();
  const saves = {
    str: strMod + (saveProficient.has('STR') ? profBonus : 0),
    dex: dexMod + (saveProficient.has('DEX') ? profBonus : 0),
    con: conMod + (saveProficient.has('CON') ? profBonus : 0),
    int: intMod + (saveProficient.has('INT') ? profBonus : 0),
    wis: wisMod + (saveProficient.has('WIS') ? profBonus : 0),
    cha: chaMod + (saveProficient.has('CHA') ? profBonus : 0),
  };
  
  // Spellcasting stats
  let spellAbility: string | null = null;
  let spellSaveDC: number | null = null;
  let spellAttackMod: number | null = null;
  
  if (classRules?.spellcasting?.ability) {
    const abilityMap: Record<string, number> = { wis: wisMod, cha: chaMod, int: intMod };
    const castingMod = abilityMap[classRules.spellcasting.ability] || 0;
    spellAbility = classRules.spellcasting.ability.toUpperCase();
    spellSaveDC = 8 + profBonus + castingMod;
    spellAttackMod = profBonus + castingMod;
  }
  
  return {
    maxHp,
    profBonus,
    ac: 10 + dexMod,
    initiativeBonus: dexMod,
    passivePerception,
    passiveInvestigation,
    passiveInsight,
    saves,
    hitDie: `d${hitDie}`,
    spellAbility,
    spellSaveDC,
    spellAttackMod,
  };
}

const CharacterWizard = ({ open, campaignId, onComplete, editCharacterId }: CharacterWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(editCharacterId || null);
  const [loading, setLoading] = useState(false);
  
  const [draft, setDraft] = useAtom(draftAtom);
  const [, resetDraft] = useAtom(resetDraftAtom);
  
  // Auto-seed SRD data if missing
  const { isSeeding, seedComplete, seedingStatus } = useSRDAutoSeed();

  // Helper to check if class is a spellcaster at the current level
  const checkIsSpellcaster = (): boolean => {
    const className = draft.className || "";
    // Half-casters (Paladin, Ranger) don't get spellcasting until level 2
    const halfCasters = ["Paladin", "Ranger"];
    if (halfCasters.some(c => className.toLowerCase() === c.toLowerCase()) && draft.level < 2) {
      return false;
    }
    const casterNames = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", 
                         "Eldritch Knight", "Arcane Trickster"];
    return casterNames.some(caster => className.toLowerCase().includes(caster.toLowerCase()));
  };

  // Compute steps dynamically based on level and class
  const STEPS = useMemo(() => {
    return getSteps(draft.level, checkIsSpellcaster());
  }, [draft.level, draft.className]);

  // Reset draft when dialog opens
  useEffect(() => {
    if (open && !editCharacterId) {
      resetDraft();
    }
  }, [open, editCharacterId]);

  // Load existing character data if editing
  useEffect(() => {
    if (editCharacterId && open) {
      loadExistingCharacter(editCharacterId);
    }
  }, [editCharacterId, open]);

  const loadExistingCharacter = async (id: string) => {
    setLoading(true);
    try {
      const { data: character, error: charError } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();
        
      if (charError) throw charError;
      if (!character) return;

      // Check if we have a saved wizard state (for draft characters)
      if (character.wizard_state && character.creation_status === 'draft') {
        const wizardState = character.wizard_state as any;
        
        if (wizardState.currentStep !== undefined) {
          setCurrentStep(wizardState.currentStep);
        }
        
        if (wizardState.draft) {
          const wd = wizardState.draft;
          // Deserialize grantSources
          const grantSources = {
            class: deserializeGrants(wd.grantSources?.class),
            ancestry: deserializeGrants(wd.grantSources?.ancestry),
            subAncestry: deserializeGrants(wd.grantSources?.subAncestry),
            background: deserializeGrants(wd.grantSources?.background),
          };
          
          const restoredDraft = {
            ...wd,
            grants: deserializeGrants(wd.grants),
            grantSources,
          };
          
          setDraft(restoredDraft);
          setDraftId(id);
          setLoading(false);
          return;
        }
      }

      // Fallback: Load from normalized tables (for completed characters or old drafts)
      const { data: abilities } = await supabase
        .from("character_abilities")
        .select("*")
        .eq("character_id", id)
        .single();

      const { data: proficiencies } = await supabase
        .from("character_proficiencies")
        .select("*")
        .eq("character_id", id);

      const { data: languages } = await supabase
        .from("character_languages")
        .select("*")
        .eq("character_id", id);

      const { data: equipment } = await supabase
        .from("character_equipment")
        .select("*")
        .eq("character_id", id);

      const { data: spells } = await supabase
        .from("character_spells")
        .select("*")
        .eq("character_id", id);

      const { data: features } = await supabase
        .from("character_features")
        .select("*")
        .eq("character_id", id);

      const { data: skills } = await supabase
        .from("character_skills")
        .select("*")
        .eq("character_id", id);

      const emptyGrantSources = {
        class: emptyGrants(),
        ancestry: emptyGrants(),
        subAncestry: emptyGrants(),
        background: emptyGrants(),
      };

      setDraft({
        name: character.name,
        level: character.level,
        classId: character.class || "",
        className: character.class,
        subclassId: character.subclass_id || undefined,
        ancestryId: character.ancestry_id || "",
        subAncestryId: character.subancestry_id || undefined,
        backgroundId: character.background_id || "",
        alignment: character.alignment || undefined,
        age: character.age || undefined,
        height: character.height || undefined,
        weight: character.weight || undefined,
        eyes: character.eyes || undefined,
        skin: character.skin || undefined,
        hair: character.hair || undefined,
        personality: character.personality_traits || undefined,
        ideals: character.ideals || undefined,
        bonds: character.bonds || undefined,
        flaws: character.flaws || undefined,
        notes: character.notes || undefined,
        abilityScores: abilities ? {
          STR: abilities.str,
          DEX: abilities.dex,
          CON: abilities.con,
          INT: abilities.int,
          WIS: abilities.wis,
          CHA: abilities.cha,
        } : { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        abilityMethod: abilities?.method || "standard-array",
        grantSources: emptyGrantSources,
        grants: {
          savingThrows: new Set(),
          skillProficiencies: new Set(
            proficiencies?.filter(p => p.type === 'skill').map(p => p.name) || []
          ),
          toolProficiencies: new Set(
            proficiencies?.filter(p => p.type === 'tool').map(p => p.name) || []
          ),
          armorProficiencies: new Set(
            proficiencies?.filter(p => p.type === 'armor').map(p => p.name) || []
          ),
          weaponProficiencies: new Set(
            proficiencies?.filter(p => p.type === 'weapon').map(p => p.name) || []
          ),
          languages: new Set(languages?.map(l => l.name) || []),
          features: features?.map(f => ({
            source: f.source,
            name: f.name,
            level: f.level,
            description: f.description || "",
          })) || [],
          traits: [],
          abilityBonuses: {},
        },
        needs: {
          skill: undefined,
          tool: undefined,
          language: undefined,
        },
        choices: {
          skills: skills?.filter(s => s.proficient).map(s => s.skill) || [],
          tools: [],
          languages: [],
          equipmentBundleId: undefined,
          spellsKnown: spells?.filter(s => s.known).map(s => s.spell_id) || [],
          spellsPrepared: spells?.filter(s => s.prepared).map(s => s.spell_id) || [],
          featureChoices: {},
        },
      });
      
      setDraftId(id);
    } catch (error: any) {
      console.error("Error loading character:", error);
      toast({
        title: "Error loading character",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save draft on data change
  useEffect(() => {
    if (draft.name && (draftId || (draft.classId && draft.className))) {
      saveDraft();
    }
  }, [draft, draftId]);

  const saveDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { portraitBlob, ...draftWithoutBlob } = draft;
      
      const wizardState = {
        currentStep,
        draft: {
          ...draftWithoutBlob,
          grants: serializeGrants(draft.grants),
          grantSources: {
            class: serializeGrants(draft.grantSources.class),
            ancestry: serializeGrants(draft.grantSources.ancestry),
            subAncestry: serializeGrants(draft.grantSources.subAncestry),
            background: serializeGrants(draft.grantSources.background),
          },
        }
      };

      if (draftId) {
        await supabase
          .from("characters")
          .update({ 
            name: draft.name,
            class: draft.className || "",
            level: draft.level,
            creation_status: 'draft',
            wizard_state: wizardState as any
          })
          .eq("id", draftId);
      } else if (draft.name && draft.classId && draft.className) {
        const { data, error } = await supabase
          .from("characters")
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            name: draft.name,
            class: draft.className,
            level: draft.level,
            creation_status: 'draft',
            max_hp: 10,
            current_hp: 10,
            ac: 10,
            proficiency_bonus: 2,
            wizard_state: wizardState as any
          })
          .select()
          .single();

        if (!error && data) {
          setDraftId(data.id);
        } else if (error) {
          console.error("Error creating draft:", error);
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const canProceed = (): boolean => {
    const stepName = STEPS[currentStep];
    
    switch (stepName) {
      case "Basics":
        return !!(draft.name && draft.classId && draft.className);
      case "Ancestry":
        return !!draft.ancestryId;
      case "Abilities":
        return true;
      case "Background":
        return !!draft.backgroundId;
      case "Proficiencies":
        const skillsNeeded = draft.needs.skill?.required ?? 0;
        const toolsNeeded = draft.needs.tool?.required ?? 0;
        const langsNeeded = draft.needs.language?.required ?? 0;
        return (
          draft.choices.skills.length >= skillsNeeded &&
          draft.choices.tools.length >= toolsNeeded &&
          draft.choices.languages.length >= langsNeeded
        );
      case "Equipment":
        return !!draft.choices.equipmentBundleId;
      case "Spells":
        return true;
      case "Features":
        return true;
      case "Level Choices":
        return true;
      case "Description":
        return true;
      case "Review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast({
        title: "Missing Required Fields",
        description: "Please complete all required selections before continuing.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSaveAndExit = async () => {
    await saveDraft();
    toast({
      title: "Progress Saved",
      description: "Your character draft has been saved.",
    });
    onComplete();
  };

  const handleFinalizeCharacter = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let characterId = draftId;
      
      if (!characterId) {
        const { data: newChar, error: createError } = await supabase
          .from("characters")
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            name: draft.name,
            class: draft.className,
            level: draft.level,
            creation_status: 'draft',
            max_hp: 10,
            current_hp: 10,
            ac: 10,
            proficiency_bonus: 2,
          })
          .select()
          .single();

        if (createError) throw createError;
        if (!newChar) throw new Error("Failed to create character");
        
        characterId = newChar.id;
        setDraftId(characterId);
      }

      if (!characterId) throw new Error("Unable to create character");

      // === Apply ASI from level choices to ability scores ===
      const finalAbilityScores = { ...draft.abilityScores };
      const levelChoices = draft.choices?.featureChoices?.levelChoices as Record<string, any> | undefined;
      const levelUpFeatures: Array<{ name: string; source: string; level: number; description: string }> = [];
      
      if (levelChoices) {
        for (const [lvlStr, lc] of Object.entries(levelChoices)) {
          const lvl = parseInt(lvlStr);
          if (!lc) continue;
          
          // Apply ASI (field is abilityIncreases from StepLevelChoices)
          if (lc.abilityIncreases && typeof lc.abilityIncreases === 'object') {
            for (const [ability, increase] of Object.entries(lc.abilityIncreases)) {
              const key = ability.toUpperCase() as keyof typeof finalAbilityScores;
              if (key in finalAbilityScores) {
                finalAbilityScores[key] += Number(increase) || 0;
              }
            }
          }
          
          // Collect fighting style
          if (lc.fightingStyle) {
            levelUpFeatures.push({
              name: `Fighting Style: ${lc.fightingStyle}`,
              source: 'class',
              level: lvl,
              description: `Fighting style chosen at level ${lvl}.`,
            });
          }
          
          // Collect invocations
          if (Array.isArray(lc.invocations)) {
            for (const inv of lc.invocations) {
              levelUpFeatures.push({
                name: typeof inv === 'string' ? inv : inv.name || inv,
                source: 'invocation',
                level: lvl,
                description: typeof inv === 'object' ? inv.description || '' : '',
              });
            }
          }
          
          // Collect metamagic
          if (Array.isArray(lc.metamagic)) {
            for (const mm of lc.metamagic) {
              levelUpFeatures.push({
                name: typeof mm === 'string' ? mm : mm.name || mm,
                source: 'metamagic',
                level: lvl,
                description: typeof mm === 'object' ? mm.description || '' : '',
              });
            }
          }
          
          // Collect pact boon
          if (lc.pactBoon) {
            levelUpFeatures.push({
              name: typeof lc.pactBoon === 'string' ? lc.pactBoon : lc.pactBoon.name || lc.pactBoon,
              source: 'class',
              level: lvl,
              description: typeof lc.pactBoon === 'object' ? lc.pactBoon.description || '' : `Pact boon chosen at level ${lvl}.`,
            });
          }
          
          // Collect feat
          if (lc.feat) {
            levelUpFeatures.push({
              name: typeof lc.feat === 'string' ? lc.feat : lc.feat.name || lc.feat,
              source: 'feat',
              level: lvl,
              description: typeof lc.feat === 'object' ? lc.feat.description || '' : '',
            });
          }
          
          // Collect favored enemy/terrain
          if (lc.favoredEnemy) {
            levelUpFeatures.push({
              name: `Favored Enemy: ${lc.favoredEnemy}`,
              source: 'class',
              level: lvl,
              description: '',
            });
          }
          if (lc.favoredTerrain) {
            levelUpFeatures.push({
              name: `Favored Terrain: ${lc.favoredTerrain}`,
              source: 'class',
              level: lvl,
              description: '',
            });
          }
        }
      }

      // === Compute derived stats ===
      const classRules = draft.className ? CLASS_LEVEL_UP_RULES[draft.className] : null;
      // Temporarily update draft ability scores for derived stat computation
      const draftForStats = { ...draft, abilityScores: finalAbilityScores };
      const derived = computeDerivedStats(draftForStats, classRules);

      // Upload portrait if one was selected
      let portraitUrl: string | null = null;
      if (draft.portraitBlob) {
        const fileExt = 'jpg';
        const fileName = `${user.id}/${characterId}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portraits')
          .upload(fileName, draft.portraitBlob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading portrait:", uploadError);
          toast({
            title: "Portrait upload failed",
            description: uploadError.message || "Could not upload portrait image",
            variant: "destructive"
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('portraits')
            .getPublicUrl(fileName);
          portraitUrl = publicUrl;
        }
      }

      // === Fetch ancestry speed for the character record ===
      let ancestrySpeed = 30;
      if (draft.ancestryId) {
        const { data: ancestryData } = await supabase
          .from("srd_ancestries")
          .select("speed")
          .eq("id", draft.ancestryId)
          .single();
        if (ancestryData?.speed) {
          ancestrySpeed = Number(ancestryData.speed) || 30;
        }
      }

      // Update main character record with all derived stats
      const { error: charError } = await supabase
        .from("characters")
        .update({ 
          creation_status: 'complete',
          wizard_state: null,
          name: draft.name,
          class: draft.className,
          level: draft.level,
          ancestry_id: draft.ancestryId || null,
          subancestry_id: draft.subAncestryId || null,
          background_id: draft.backgroundId || null,
          subclass_id: draft.subclassId || null,
          alignment: draft.alignment || null,
          age: draft.age || null,
          height: draft.height || null,
          weight: draft.weight || null,
          eyes: draft.eyes || null,
          skin: draft.skin || null,
          hair: draft.hair || null,
          notes: draft.notes || null,
          portrait_url: portraitUrl,
          // Fix 5: Persist personality/description
          personality_traits: draft.personality || null,
          ideals: draft.ideals || null,
          bonds: draft.bonds || null,
          flaws: draft.flaws || null,
          // Fix 2 & 3: Computed stats
          max_hp: derived.maxHp,
          current_hp: derived.maxHp,
          ac: derived.ac,
          proficiency_bonus: derived.profBonus,
          initiative_bonus: derived.initiativeBonus,
          speed: ancestrySpeed,
          hit_die: derived.hitDie,
          hit_dice_total: draft.level,
          hit_dice_current: draft.level,
          passive_perception: derived.passivePerception,
          passive_investigation: derived.passiveInvestigation,
          passive_insight: derived.passiveInsight,
          spell_ability: derived.spellAbility,
          spell_save_dc: derived.spellSaveDC,
          spell_attack_mod: derived.spellAttackMod,
          str_save: derived.saves.str,
          dex_save: derived.saves.dex,
          con_save: derived.saves.con,
          int_save: derived.saves.int,
          wis_save: derived.saves.wis,
          cha_save: derived.saves.cha,
        })
        .eq("id", characterId);

      if (charError) throw charError;

      // Write abilities (with ASI applied)
      const { error: abilitiesError } = await supabase
        .from("character_abilities")
        .upsert({
          character_id: characterId,
          str: finalAbilityScores.STR,
          dex: finalAbilityScores.DEX,
          con: finalAbilityScores.CON,
          int: finalAbilityScores.INT,
          wis: finalAbilityScores.WIS,
          cha: finalAbilityScores.CHA,
          method: draft.abilityMethod,
        });

      if (abilitiesError) throw abilitiesError;

      // Write saves (proficiency booleans)
      if (draft.grants.savingThrows.size > 0) {
        const { error: savesError } = await supabase
          .from("character_saves")
          .upsert({
            character_id: characterId,
            str: draft.grants.savingThrows.has('STR'),
            dex: draft.grants.savingThrows.has('DEX'),
            con: draft.grants.savingThrows.has('CON'),
            int: draft.grants.savingThrows.has('INT'),
            wis: draft.grants.savingThrows.has('WIS'),
            cha: draft.grants.savingThrows.has('CHA'),
          });

        if (savesError) throw savesError;
      }

      // Write skills (including expertise from level choices)
      const expertiseSkills = new Set<string>();
      if (levelChoices) {
        for (const lc of Object.values(levelChoices)) {
          if (Array.isArray((lc as any)?.expertise)) {
            for (const s of (lc as any).expertise) {
              expertiseSkills.add(s);
            }
          }
        }
      }
      
      if (draft.choices.skills.length > 0 || expertiseSkills.size > 0) {
        const allSkillNames = new Set([...draft.choices.skills, ...expertiseSkills]);
        const skillsData = Array.from(allSkillNames).map(skill => ({
          character_id: characterId,
          skill,
          proficient: draft.choices.skills.includes(skill),
          expertise: expertiseSkills.has(skill),
        }));

        const { error: skillsError } = await supabase
          .from("character_skills")
          .upsert(skillsData);

        if (skillsError) throw skillsError;
      }

      // Write proficiencies
      const proficiencies = [];
      for (const tool of draft.grants.toolProficiencies) {
        proficiencies.push({ character_id: characterId, type: 'tool', name: tool });
      }
      for (const armor of draft.grants.armorProficiencies) {
        proficiencies.push({ character_id: characterId, type: 'armor', name: armor });
      }
      for (const weapon of draft.grants.weaponProficiencies) {
        proficiencies.push({ character_id: characterId, type: 'weapon', name: weapon });
      }
      // Also persist player-chosen tools
      for (const tool of (draft.choices.tools || [])) {
        if (!draft.grants.toolProficiencies.has(tool)) {
          proficiencies.push({ character_id: characterId, type: 'tool', name: tool });
        }
      }

      if (proficiencies.length > 0) {
        const { error: profError } = await supabase
          .from("character_proficiencies")
          .upsert(proficiencies);
        if (profError) throw profError;
      }

      // Write languages (granted + player-chosen)
      const allLanguages = new Set([
        ...Array.from(draft.grants.languages),
        ...(draft.choices.languages || []),
      ]);
      
      if (allLanguages.size > 0) {
        const languagesData = Array.from(allLanguages).map(lang => ({
          character_id: characterId,
          name: lang,
        }));
        const { error: langError } = await supabase
          .from("character_languages")
          .upsert(languagesData);
        if (langError) throw langError;
      }

      // Write features (grants + level-up features)
      const allFeatures = [
        ...draft.grants.features.map(f => ({
          character_id: characterId,
          source: f.source,
          name: f.name,
          level: f.level || 1,
          description: f.description || "",
          data: {},
        })),
        ...levelUpFeatures.map(f => ({
          character_id: characterId,
          source: f.source,
          name: f.name,
          level: f.level,
          description: f.description,
          data: {},
        })),
      ];

      if (allFeatures.length > 0) {
        const { error: featuresError } = await supabase
          .from("character_features")
          .upsert(allFeatures);
        if (featuresError) throw featuresError;
      }

      // Write spells
      const allSpellIds = new Set([
        ...(draft.choices.spellsKnown || []),
        ...(draft.choices.spellsPrepared || []),
      ]);

      if (allSpellIds.size > 0) {
        const spellsData = Array.from(allSpellIds).map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: draft.choices.spellsPrepared?.includes(spellId) || false,
          source: 'class',
        }));

        const { error: spellsError } = await supabase
          .from("character_spells")
          .upsert(spellsData);
        if (spellsError) throw spellsError;
      }

      // Write character class levels (per-level HP tracking)
      if (draft.classId) {
        const classLevelsData = [];
        for (let lvl = 1; lvl <= draft.level; lvl++) {
          const lc = levelChoices?.[lvl] as any;
          const hpGained = lvl === 1 
            ? derived.maxHp - (draft.level > 1 ? derived.maxHp : 0) // Level 1 is max die + CON
            : (lc?.hpRoll ?? (Math.floor((classRules?.hitDie || 8) / 2) + 1)) + Math.floor((finalAbilityScores.CON - 10) / 2);
          classLevelsData.push({
            character_id: characterId,
            class_id: draft.classId,
            subclass_id: draft.subclassId || null,
            level: lvl,
            hp_gained: lvl === 1 ? (classRules?.hitDie || 8) + Math.floor((finalAbilityScores.CON - 10) / 2) : hpGained,
            hit_dice_remaining: 1,
          });
        }
        const { error: clError } = await supabase
          .from("character_class_levels")
          .upsert(classLevelsData);
        if (clError) console.error("Error writing class levels:", clError);
      }

      // Write spell slots
      if (derived.spellAbility && classRules) {
        const { getSpellSlotInfo } = await import("@/lib/rules/spellRules");
        const slotInfo = getSpellSlotInfo([{ className: draft.className || "", level: draft.level }]);
        const slotRows: Array<{ character_id: string; spell_level: number; max_slots: number; used_slots: number }> = [];
        
        if (slotInfo.shared) {
          for (const [lvlStr, count] of Object.entries(slotInfo.shared.slots)) {
            slotRows.push({
              character_id: characterId!,
              spell_level: Number(lvlStr),
              max_slots: count,
              used_slots: 0,
            });
          }
        }
        if (slotInfo.pact) {
          // Store pact slots as a special entry (level = pact slot level)
          slotRows.push({
            character_id: characterId!,
            spell_level: slotInfo.pact.pactSlotLevel,
            max_slots: slotInfo.pact.pactSlots,
            used_slots: 0,
          });
        }
        if (slotRows.length > 0) {
          const { error: slotsError } = await supabase
            .from("character_spell_slots")
            .upsert(slotRows);
          if (slotsError) console.error("Error writing spell slots:", slotsError);
        }
      }

      // Write class resources (rage, ki, sorcery points, etc.)
      if (classRules?.resourceProgression && classRules.resourceProgression.length > 0) {
        const resourceRows = classRules.resourceProgression
          .filter(r => draft.level >= (r.startLevel || 1))
          .map(r => {
            const maxVal = r.formula(draft.level);
            return {
              character_id: characterId!,
              resource_key: r.key,
              label: r.label,
              max_value: maxVal,
              current_value: maxVal,
              recharge: r.recharge,
            };
          });
        if (resourceRows.length > 0) {
          const { error: resError } = await supabase
            .from("character_resources")
            .upsert(resourceRows);
          if (resError) console.error("Error writing resources:", resError);
        }

      toast({
        title: "Character Created!",
        description: `${draft.name} is ready for adventure.`,
      });
      onComplete();
    } catch (error) {
      console.error("Error creating character:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create character",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const stepName = STEPS[currentStep];
    
    switch (stepName) {
      case "Basics":
        return <StepBasics />;
      case "Ancestry":
        return <StepAncestry />;
      case "Abilities":
        return <StepAbilities />;
      case "Background":
        return <StepBackground />;
      case "Proficiencies":
        return <StepProficiencies />;
      case "Equipment":
        return <StepEquipment />;
      case "Spells":
        return <StepSpells />;
      case "Features":
        return <StepFeatures />;
      case "Level Choices":
        return <StepLevelChoices />;
      case "Description":
        return <StepDescription />;
      case "Review":
        return <StepReview onFinalize={handleFinalizeCharacter} loading={loading} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleCancel = () => {
    if (currentStep > 0 && draft.name) {
      if (confirm("You have unsaved progress. Do you want to save your draft before closing?")) {
        handleSaveAndExit();
      } else {
        onComplete();
      }
    } else {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-full md:max-w-4xl lg:max-w-7xl h-[100vh] md:h-[95vh] p-0 flex flex-col fantasy-border-ornaments bg-gradient-to-br from-parchment/5 via-transparent to-brass/5">
        {/* Show loading state while seeding SRD data */}
        {isSeeding ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Sparkles className="h-8 w-8 animate-spin text-brass" />
            <div className="text-center">
              <p className="font-cinzel font-semibold text-brass">Preparing Character Creator...</p>
              <p className="text-sm text-muted-foreground">
                {seedingStatus || "Loading game data for the first time"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {/* Main wizard content */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-brass/20 flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-cinzel font-bold mb-2 text-brass tracking-wide">
                  Character Creation Wizard
                </h2>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <span className="hidden sm:inline">Step {currentStep + 1} of {STEPS.length}: </span>
                    <span className="sm:hidden">{currentStep + 1}/{STEPS.length}: </span>
                    <span className="font-cinzel">{STEPS[currentStep]}</span>
                  </p>
                  <Button variant="outline" size="sm" onClick={handleSaveAndExit} className="border-brass/30 hover:bg-brass/10 hover:text-brass active:scale-95 transition-all">
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Save & Exit</span>
                  </Button>
                </div>
                <Progress value={progress} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-brass/70 [&>div]:to-brass" />
              </div>

              {/* Step content - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 md:p-6">
                  <div className="max-w-4xl mx-auto" key={currentStep}>
                    <div className="animate-fade-in">
                      {renderStep()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-4 md:p-6 border-t border-brass/20 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="w-full sm:w-auto border-brass/30 hover:bg-brass/10 hover:text-brass active:scale-95 transition-all"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:w-auto bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-brass-foreground active:scale-95 transition-all">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Live summary sidebar - hidden on mobile, visible on tablet+ */}
            <div className="hidden md:block md:w-80 border-l border-brass/20 bg-gradient-to-b from-parchment/5 to-brass/5 flex-shrink-0">
              <LiveSummaryPanel />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CharacterWizard;
