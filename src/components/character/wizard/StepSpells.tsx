import { Card, CardContent } from "@/components/ui/card";
import type { WizardData } from "../CharacterWizard";

interface StepSpellsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepSpells = ({ data, updateData }: StepSpellsProps) => {
  // TODO: Implement spell selection based on class and level
  // For now, just show a placeholder

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spells</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select your known or prepared spells based on your spellcasting class.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Spell selection will be implemented based on your class spellcasting progression. This step will be expanded with SRD spell data.
          </p>
          <div className="mt-4">
            {data.spells && data.spells.length > 0 ? (
              <p className="text-sm">
                {data.spells.length} spell(s) selected
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No spells selected yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepSpells;
