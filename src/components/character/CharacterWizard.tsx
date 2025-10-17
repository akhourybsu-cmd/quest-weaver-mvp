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
    if (draftId && draft.name) {
      saveDraft();
    }
  }, [draft, draftId]);

  const saveDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (draftId) {
        // Update existing draft
        await supabase
          .from("characters")
          .update({ 
            name: draft.name,
            class: draft.className || "",
            creation_status: 'draft'
          })
          .eq("id", draftId);
      } else if (draft.name && draft.classId) {
        // Create new draft
        const { data, error } = await supabase
          .from("characters")
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            name: draft.name,
            class: draft.className || "",
            level: draft.level,
            creation_status: 'draft',
            max_hp: 10,
            current_hp: 10,
            ac: 10,
            proficiency_bonus: 2,
          })
          .select()
          .single();

        if (!error && data) {
          setDraftId(data.id);
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Basics
        return !!(draft.name && draft.classId);
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
    
    // Skip spells step if not a caster
    if (currentStep === 6 && !isSpellcaster()) {
      setCurrentStep(prev => prev + 2);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    // Skip spells step if not a caster
    if (currentStep === 8 && !isSpellcaster()) {
      setCurrentStep(prev => prev - 2);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const isSpellcaster = (): boolean => {
    // TODO: Check if class has spellcasting
    const casters = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];
    return casters.includes(draft.className || "");
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

      // Mark character as complete
      if (draftId) {
        const { error } = await supabase
          .from("characters")
          .update({ creation_status: 'complete' })
          .eq("id", draftId);

        if (error) throw error;
      }

      // TODO: Implement full character creation with all normalized tables
      // This will write to:
      // - characters (main record)
      // - character_abilities
      // - character_saves
      // - character_skills
      // - character_proficiencies
      // - character_languages
      // - character_features
      // - character_equipment
      // - character_attacks
      // - character_spells (if caster)

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
      <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Main wizard content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-6 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold mb-2">
                Character Creation Wizard
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
                </p>
                <Button variant="outline" size="sm" onClick={handleSaveAndExit}>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Exit
                </Button>
              </div>
              <Progress value={progress} className="mt-3" />
            </div>

            {/* Step content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  {renderStep()}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t flex justify-between flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>

          {/* Live summary sidebar */}
          <div className="w-80 border-l bg-muted/30 flex-shrink-0">
            <LiveSummaryPanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterWizard;
