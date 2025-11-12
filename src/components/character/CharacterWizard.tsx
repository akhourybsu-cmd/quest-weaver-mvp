import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useAtom } from "jotai";
import { draftAtom, resetDraftAtom } from "@/state/characterWizard";

// Wizard steps
import StepBasics from "./wizard/StepBasics";
import StepAncestry from "./wizard/StepAncestry";
import StepAbilities from "./wizard/StepAbilities";
import StepBackground from "./wizard/StepBackground";
import StepProficiencies from "./wizard/StepProficiencies";
import StepEquipment from "./wizard/StepEquipment";
import StepSpells from "./wizard/StepSpells";
import StepFeatures from "./wizard/StepFeatures";
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

const STEPS = [
  "Basics",
  "Ancestry",
  "Abilities",
  "Background",
  "Proficiencies",
  "Equipment",
  "Spells",
  "Features",
  "Description",
  "Review"
];

const CharacterWizard = ({ open, campaignId, onComplete, editCharacterId }: CharacterWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(editCharacterId || null);
  const [loading, setLoading] = useState(false);
  
  const [draft, setDraft] = useAtom(draftAtom);
  const [, resetDraft] = useAtom(resetDraftAtom);

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
      // Load main character data
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
        
        // Restore the full wizard state including current step
        if (wizardState.currentStep !== undefined) {
          setCurrentStep(wizardState.currentStep);
        }
        
        if (wizardState.draft) {
          // Convert arrays back to Sets for grant collections
          const restoredDraft = {
            ...wizardState.draft,
            grants: {
              ...wizardState.draft.grants,
              savingThrows: new Set(wizardState.draft.grants.savingThrows || []),
              skillProficiencies: new Set(wizardState.draft.grants.skillProficiencies || []),
              toolProficiencies: new Set(wizardState.draft.grants.toolProficiencies || []),
              armorProficiencies: new Set(wizardState.draft.grants.armorProficiencies || []),
              weaponProficiencies: new Set(wizardState.draft.grants.weaponProficiencies || []),
              languages: new Set(wizardState.draft.grants.languages || []),
            }
          };
          
          setDraft(restoredDraft);
          setDraftId(id);
          setLoading(false);
          return;
        }
      }

      // Fallback: Load from normalized tables (for completed characters or old drafts)
      // Load abilities
      const { data: abilities } = await supabase
        .from("character_abilities")
        .select("*")
        .eq("character_id", id)
        .single();

      // Load proficiencies
      const { data: proficiencies } = await supabase
        .from("character_proficiencies")
        .select("*")
        .eq("character_id", id);

      // Load languages
      const { data: languages } = await supabase
        .from("character_languages")
        .select("*")
        .eq("character_id", id);

      // Load equipment
      const { data: equipment } = await supabase
        .from("character_equipment")
        .select("*")
        .eq("character_id", id);

      // Load spells
      const { data: spells } = await supabase
        .from("character_spells")
        .select("*")
        .eq("character_id", id);

      // Load features
      const { data: features } = await supabase
        .from("character_features")
        .select("*")
        .eq("character_id", id);

      // Load skills
      const { data: skills } = await supabase
        .from("character_skills")
        .select("*")
        .eq("character_id", id);

      // Reconstruct draft from database data
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
        personality: undefined,
        ideals: undefined,
        bonds: undefined,
        flaws: undefined,
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
    // Save if we have an existing draft, OR if we have minimum data for a new draft
    if (draft.name && (draftId || (draft.classId && draft.className))) {
      saveDraft();
    }
  }, [draft, draftId]);

  const saveDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Serialize the full wizard state to preserve all selections
      // Exclude portraitBlob as it can't be serialized
      const { portraitBlob, ...draftWithoutBlob } = draft;
      
      const wizardState = {
        currentStep,
        draft: {
          ...draftWithoutBlob,
          // Convert Sets to arrays for JSON serialization
          grants: {
            ...draft.grants,
            savingThrows: Array.from(draft.grants.savingThrows),
            skillProficiencies: Array.from(draft.grants.skillProficiencies),
            toolProficiencies: Array.from(draft.grants.toolProficiencies),
            armorProficiencies: Array.from(draft.grants.armorProficiencies),
            weaponProficiencies: Array.from(draft.grants.weaponProficiencies),
            languages: Array.from(draft.grants.languages),
          }
        }
      };

      if (draftId) {
        // Update existing draft with full state
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
        // Create new draft with full state
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
    switch (currentStep) {
      case 0: // Basics
        return !!(draft.name && draft.classId && draft.className);
      case 1: // Ancestry
        return !!draft.ancestryId;
      case 2: // Abilities
        return true; // Always valid
      case 3: // Background
        return !!draft.backgroundId;
      case 4: // Proficiencies
        // Check if all required choices are met
        const skillsNeeded = draft.needs.skill?.required ?? 0;
        const toolsNeeded = draft.needs.tool?.required ?? 0;
        const langsNeeded = draft.needs.language?.required ?? 0;
        return (
          draft.choices.skills.length >= skillsNeeded &&
          draft.choices.tools.length >= toolsNeeded &&
          draft.choices.languages.length >= langsNeeded
        );
      case 5: // Equipment
        return !!draft.choices.equipmentBundleId;
      case 6: // Spells
        return true; // May not be a caster
      case 7: // Features
        return true;
      case 8: // Description
        return true; // All optional
      case 9: // Review
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
    
    // Skip spells step if not a caster (from Equipment to Features)
    if (currentStep === 5 && !isSpellcaster()) {
      setCurrentStep(7); // Skip directly to Features
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    // Skip spells step if not a caster (from Features back to Equipment)
    if (currentStep === 7 && !isSpellcaster()) {
      setCurrentStep(5); // Skip back to Equipment
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const isSpellcaster = (): boolean => {
    // Check if class has spellcasting progression in SRD data
    // This requires us to fetch class data - for now, check via known caster names
    const casterNames = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", 
                         "Eldritch Knight", "Arcane Trickster"];
    const className = draft.className || "";
    return casterNames.some(caster => className.toLowerCase().includes(caster.toLowerCase()));
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

      // Ensure we have a character ID to work with
      let characterId = draftId;
      
      if (!characterId) {
        console.log("No draftId found, creating character now...");
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

        if (createError) {
          console.error("Error creating character:", createError);
          throw createError;
        }
        if (!newChar) throw new Error("Failed to create character");
        
        characterId = newChar.id;
        setDraftId(characterId);
      }

      if (!characterId) throw new Error("Unable to create character");

      // Upload portrait if one was selected
      let portraitUrl: string | null = null;
      if (draft.portraitBlob) {
        const fileExt = 'jpg';
        const fileName = `${user.id}/${characterId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('portraits')
          .upload(fileName, draft.portraitBlob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading portrait:", uploadError);
          // Don't fail character creation if portrait upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('portraits')
            .getPublicUrl(fileName);
          portraitUrl = publicUrl;
        }
      }

      // Update main character record
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
        })
        .eq("id", characterId);

      if (charError) {
        console.error("Error updating character:", charError);
        throw charError;
      }

      // Write abilities
      const { error: abilitiesError } = await supabase
        .from("character_abilities")
        .upsert({
          character_id: characterId,
          str: draft.abilityScores.STR,
          dex: draft.abilityScores.DEX,
          con: draft.abilityScores.CON,
          int: draft.abilityScores.INT,
          wis: draft.abilityScores.WIS,
          cha: draft.abilityScores.CHA,
          method: draft.abilityMethod,
        });

      if (abilitiesError) {
        console.error("Error saving abilities:", abilitiesError);
        throw abilitiesError;
      }

      // Write saves (from grants)
      if (draft.grants.savingThrows.size > 0) {
        const savesData: any = {
          character_id: characterId,
          str: draft.grants.savingThrows.has('STR'),
          dex: draft.grants.savingThrows.has('DEX'),
          con: draft.grants.savingThrows.has('CON'),
          int: draft.grants.savingThrows.has('INT'),
          wis: draft.grants.savingThrows.has('WIS'),
          cha: draft.grants.savingThrows.has('CHA'),
        };

        const { error: savesError } = await supabase
          .from("character_saves")
          .upsert(savesData);

        if (savesError) {
          console.error("Error saving saves:", savesError);
          throw savesError;
        }
      }

      // Write skills
      if (draft.choices.skills.length > 0) {
        const skillsData = draft.choices.skills.map(skill => ({
          character_id: characterId,
          skill,
          proficient: true,
          expertise: false,
        }));

        const { error: skillsError } = await supabase
          .from("character_skills")
          .upsert(skillsData);

        if (skillsError) {
          console.error("Error saving skills:", skillsError);
          throw skillsError;
        }
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

      if (proficiencies.length > 0) {
        const { error: profError } = await supabase
          .from("character_proficiencies")
          .upsert(proficiencies);

        if (profError) {
          console.error("Error saving proficiencies:", profError);
          throw profError;
        }
      }

      // Write languages
      if (draft.grants.languages.size > 0) {
        const languagesData = Array.from(draft.grants.languages).map(lang => ({
          character_id: characterId,
          name: lang,
        }));

        const { error: langError } = await supabase
          .from("character_languages")
          .upsert(languagesData);

        if (langError) {
          console.error("Error saving languages:", langError);
          throw langError;
        }
      }

      // Write features
      if (draft.grants.features.length > 0) {
        const featuresData = draft.grants.features.map(feature => ({
          character_id: characterId,
          source: feature.source,
          name: feature.name,
          level: feature.level,
          description: feature.description,
          data: {},
        }));

        const { error: featuresError } = await supabase
          .from("character_features")
          .upsert(featuresData);

        if (featuresError) {
          console.error("Error saving features:", featuresError);
          throw featuresError;
        }
      }

      // Write spells (if caster)
      if (draft.choices.spellsKnown && draft.choices.spellsKnown.length > 0) {
        const spellsData = draft.choices.spellsKnown.map(spellId => ({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          prepared: draft.choices.spellsPrepared?.includes(spellId) || false,
        }));

        const { error: spellsError } = await supabase
          .from("character_spells")
          .upsert(spellsData);

        if (spellsError) {
          console.error("Error saving spells:", spellsError);
          throw spellsError;
        }
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
    switch (currentStep) {
      case 0:
        return <StepBasics />;
      case 1:
        return <StepAncestry />;
      case 2:
        return <StepAbilities />;
      case 3:
        return <StepBackground />;
      case 4:
        return <StepProficiencies />;
      case 5:
        return <StepEquipment />;
      case 6:
        return <StepSpells />;
      case 7:
        return <StepFeatures />;
      case 8:
        return <StepDescription />;
      case 9:
        return <StepReview onFinalize={handleFinalizeCharacter} loading={loading} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleCancel = () => {
    if (currentStep > 0 && draft.name) {
      // Has progress, confirm before closing
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
      <DialogContent className="max-w-full md:max-w-4xl lg:max-w-7xl h-[100vh] md:h-[95vh] p-0 flex flex-col">
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Main wizard content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-4 md:p-6 border-b flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Character Creation Wizard
              </h2>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs md:text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Step {currentStep + 1} of {STEPS.length}: </span>
                  <span className="sm:hidden">{currentStep + 1}/{STEPS.length}: </span>
                  {STEPS[currentStep]}
                </p>
                <Button variant="outline" size="sm" onClick={handleSaveAndExit}>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Save & Exit</span>
                </Button>
              </div>
              <Progress value={progress} className="mt-3" />
            </div>

            {/* Step content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                  {renderStep()}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 md:p-6 border-t flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:w-auto">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>

          {/* Live summary sidebar - hidden on mobile, visible on tablet+ */}
          <div className="hidden md:block md:w-80 border-l bg-muted/30 flex-shrink-0">
            <LiveSummaryPanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterWizard;
