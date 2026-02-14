import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonsterForm, MonsterFormData, getDefaultFormData } from "@/hooks/useMonsterForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { StepStart } from "./wizard/StepStart";
import { StepIdentity } from "./wizard/StepIdentity";
import { StepDefenses } from "./wizard/StepDefenses";
import { StepAbilities } from "./wizard/StepAbilities";
import { StepTraits } from "./wizard/StepTraits";
import { StepActions } from "./wizard/StepActions";
import { StepSpellcasting } from "./wizard/StepSpellcasting";
import { StepFinalize } from "./wizard/StepFinalize";

interface MonsterWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<MonsterFormData>;
  editId?: string; // If editing existing homebrew
  campaignId?: string;
  onSaved: () => void;
}

const STEPS = [
  { label: "Start", icon: "📄" },
  { label: "Identity", icon: "🏷️" },
  { label: "Defenses", icon: "🛡️" },
  { label: "Abilities", icon: "💪" },
  { label: "Traits", icon: "🔮" },
  { label: "Actions", icon: "⚔️" },
  { label: "Spells", icon: "✨" },
  { label: "Finalize", icon: "✅" },
];

export function MonsterWizard({ open, onOpenChange, initialData, editId, campaignId, onSaved }: MonsterWizardProps) {
  const { formData, setFormData, updateField, currentStep, nextStep, prevStep, goToStep } = useMonsterForm(initialData);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { toast.error("You must be logged in"); return; }

      const actionsForCat = (cat: string) => formData.actions.filter(a => a.category === cat).map(a => ({
        name: a.name,
        description: a.description,
        attack_bonus: a.attackBonus,
        reach: a.reach,
        damage_dice: a.damageDice,
        damage_type: a.damageType,
        save_dc: a.saveDC,
        save_ability: a.saveAbility,
        recharge: a.recharge,
      }));

      const payload: any = {
        owner_user_id: userData.user.id,
        campaign_id: campaignId || null,
        name: formData.name,
        type: formData.type,
        size: formData.size.toLowerCase(),
        alignment: formData.alignment || null,
        cr: formData.cr,
        ac: formData.ac,
        hp_avg: formData.hpAvg,
        hp_formula: formData.hpFormula || null,
        speed: formData.speeds,
        abilities: formData.abilities,
        saves: Object.fromEntries(
          Object.entries(formData.saveProficiencies)
            .filter(([, v]) => v)
            .map(([k]) => [k, Math.floor((formData.abilities[k as keyof typeof formData.abilities] - 10) / 2) + formData.proficiencyBonus])
        ),
        skills: formData.skills,
        senses: formData.senses,
        languages: formData.languages || null,
        immunities: formData.immunities,
        resistances: formData.resistances,
        vulnerabilities: formData.vulnerabilities,
        condition_immunities: formData.conditionImmunities,
        traits: formData.traits,
        actions: actionsForCat("action"),
        bonus_actions: actionsForCat("bonus_action"),
        reactions: actionsForCat("reaction"),
        legendary_actions: actionsForCat("legendary"),
        lair_actions: actionsForCat("lair"),
        proficiency_bonus: formData.proficiencyBonus,
        is_published: formData.isPublished,
        tags: formData.tags,
        spellcasting: formData.hasSpellcasting ? formData.spellcasting : {},
        subtype: formData.subtype || null,
        armor_description: formData.armorDescription || null,
        derived_from_monster_id: formData.derivedFromMonsterId || null,
        derived_from_source: formData.derivedFromSource || null,
      };

      let error;
      if (editId) {
        ({ error } = await supabase.from("monster_homebrew").update(payload).eq("id", editId));
      } else {
        ({ error } = await supabase.from("monster_homebrew").insert(payload));
      }

      if (error) throw error;
      toast.success(editId ? "Monster updated!" : "Monster created!");
      onSaved();
      onOpenChange(false);
      setFormData(getDefaultFormData());
      goToStep(0);
    } catch (err: any) {
      console.error("Error saving monster:", err);
      toast.error(err.message || "Failed to save monster");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto fantasy-border-ornaments bg-card">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-xl text-brass">
            {editId ? "Edit Monster" : "Create Monster"}
          </DialogTitle>
          <div className="space-y-2">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`text-[10px] px-2 py-1 rounded whitespace-nowrap transition-colors ${i === currentStep ? "bg-brass/20 text-brass font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </DialogHeader>

        <div className="min-h-[300px]">
          {currentStep === 0 && <StepStart data={formData} updateField={updateField} setFormData={setFormData} />}
          {currentStep === 1 && <StepIdentity data={formData} updateField={updateField} />}
          {currentStep === 2 && <StepDefenses data={formData} updateField={updateField} />}
          {currentStep === 3 && <StepAbilities data={formData} updateField={updateField} />}
          {currentStep === 4 && <StepTraits data={formData} updateField={updateField} />}
          {currentStep === 5 && <StepActions data={formData} updateField={updateField} />}
          {currentStep === 6 && <StepSpellcasting data={formData} updateField={updateField} />}
          {currentStep === 7 && <StepFinalize data={formData} updateField={updateField} onSave={handleSave} saving={saving} />}
        </div>

        <div className="flex justify-between pt-2 border-t border-brass/20">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {currentStep < 7 && (
            <Button onClick={nextStep} className="bg-brass/20 hover:bg-brass/30 text-brass">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
