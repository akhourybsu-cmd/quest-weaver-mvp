import { MonsterFormData, abilityMod } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface StepAbilitiesProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
}

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

export function StepAbilities({ data, updateField }: StepAbilitiesProps) {
  const updateAbility = (key: string, value: number) => {
    updateField("abilities", { ...data.abilities, [key]: value });
  };
  const toggleSave = (key: string) => {
    updateField("saveProficiencies", { ...data.saveProficiencies, [key]: !data.saveProficiencies[key as keyof typeof data.saveProficiencies] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Label className="font-cinzel text-base mb-3 block">Ability Scores</Label>
        <div className="grid grid-cols-6 gap-2">
          {ABILITY_KEYS.map(a => {
            const mod = abilityMod(data.abilities[a]);
            return (
              <div key={a} className="text-center space-y-1">
                <div className="text-xs font-bold uppercase text-brass">{a}</div>
                <Input
                  type="number"
                  value={data.abilities[a]}
                  onChange={e => updateAbility(a, Number(e.target.value))}
                  className="text-center bg-background/50 border-brass/30 h-9"
                />
                <div className="text-xs text-muted-foreground">{mod >= 0 ? `+${mod}` : mod}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="font-cinzel text-base mb-3 block">Saving Throw Proficiencies</Label>
        <div className="flex flex-wrap gap-4">
          {ABILITY_KEYS.map(a => (
            <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox
                checked={data.saveProficiencies[a]}
                onCheckedChange={() => toggleSave(a)}
              />
              <span className="uppercase text-xs">{a}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
