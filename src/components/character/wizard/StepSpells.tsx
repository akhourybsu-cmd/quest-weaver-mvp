import { Card, CardContent } from "@/components/ui/card";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";

const StepSpells = () => {
  const [draft] = useAtom(draftAtom);

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
            {draft.choices.spellsKnown && draft.choices.spellsKnown.length > 0 ? (
              <p className="text-sm">
                {draft.choices.spellsKnown.length} spell(s) selected
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
