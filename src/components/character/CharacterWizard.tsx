import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

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
  
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    level: 1,
    classId: "",
    className: "",
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityMethod: "standard-array",
    ancestryId: "",
    backgroundId: "",
    skills: [],
    tools: [],
    languages: [],
    equipment: [],
    spells: [],
    features: [],
  });

  // Load existing character data if editing
  useEffect(() => {
    if (editCharacterId && open) {
      loadExistingCharacter(editCharacterId);
    }
  }, [editCharacterId, open]);

  const loadExistingCharacter = async (id: string) => {
    // TODO: Load from all normalized tables
    const { data: character, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      toast({
        title: "Error loading character",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Map database data to wizard format
    // TODO: Load from normalized tables
  };

  // Auto-save draft on data change
  useEffect(() => {
    if (draftId && wizardData.name) {
      saveDraft();
    }
  }, [wizardData, draftId]);

  const saveDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (draftId) {
        // Update existing draft
        await supabase
          .from("characters")
          .update({ 
            name: wizardData.name,
            class: wizardData.className,
            creation_status: 'draft'
          })
          .eq("id", draftId);
      } else if (wizardData.name && wizardData.classId) {
        // Create new draft
        const { data, error } = await supabase
          .from("characters")
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            name: wizardData.name,
            class: wizardData.className,
            level: wizardData.level,
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

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Basics
        return !!(wizardData.name && wizardData.classId);
      case 1: // Ancestry
        return !!wizardData.ancestryId;
      case 2: // Abilities
        return true; // Always valid
      case 3: // Background
        return !!wizardData.backgroundId;
      case 4: // Proficiencies
        return true; // Skills can be empty
      case 5: // Equipment
        return wizardData.equipment.length > 0;
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
    return casters.includes(wizardData.className);
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
        description: `${wizardData.name} is ready for adventure.`,
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
        return <StepBasics data={wizardData} updateData={updateWizardData} />;
      case 1:
        return <StepAncestry data={wizardData} updateData={updateWizardData} />;
      case 2:
        return <StepAbilities data={wizardData} updateData={updateWizardData} />;
      case 3:
        return <StepBackground data={wizardData} updateData={updateWizardData} />;
      case 4:
        return <StepProficiencies data={wizardData} updateData={updateWizardData} />;
      case 5:
        return <StepEquipment data={wizardData} updateData={updateWizardData} />;
      case 6:
        return <StepSpells data={wizardData} updateData={updateWizardData} />;
      case 7:
        return <StepFeatures data={wizardData} updateData={updateWizardData} />;
      case 8:
        return <StepDescription data={wizardData} updateData={updateWizardData} />;
      case 9:
        return <StepReview data={wizardData} onFinalize={handleFinalizeCharacter} loading={loading} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleCancel = () => {
    if (currentStep > 0 && wizardData.name) {
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Main wizard content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
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

            {/* Step content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="max-w-4xl">
                {renderStep()}
              </div>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t flex justify-between">
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
          <div className="w-80 border-l bg-muted/30">
            <LiveSummaryPanel data={wizardData} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterWizard;
