import { MonsterFormData } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepDefensesProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
}

export function StepDefenses({ data, updateField }: StepDefensesProps) {
  const updateSpeed = (key: string, value: number) => {
    updateField("speeds", { ...data.speeds, [key]: value });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Armor Class</Label>
          <Input type="number" value={data.ac} onChange={e => updateField("ac", Number(e.target.value))} className="bg-background/50 border-brass/30" />
        </div>
        <div>
          <Label>Armor Description</Label>
          <Input value={data.armorDescription} onChange={e => updateField("armorDescription", e.target.value)} placeholder="e.g. natural armor" className="bg-background/50 border-brass/30" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Hit Points (Average)</Label>
          <Input type="number" value={data.hpAvg} onChange={e => updateField("hpAvg", Number(e.target.value))} className="bg-background/50 border-brass/30" />
        </div>
        <div>
          <Label>HP Formula (optional)</Label>
          <Input value={data.hpFormula} onChange={e => updateField("hpFormula", e.target.value)} placeholder="e.g. 4d8+8" className="bg-background/50 border-brass/30" />
        </div>
      </div>
      <div>
        <Label className="font-cinzel text-base">Speeds</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-2">
          {(["walk", "fly", "swim", "climb", "burrow"] as const).map(s => (
            <div key={s}>
              <Label className="text-xs capitalize">{s}</Label>
              <Input type="number" value={data.speeds[s]} onChange={e => updateSpeed(s, Number(e.target.value))} className="bg-background/50 border-brass/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
