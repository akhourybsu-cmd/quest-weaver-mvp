import { MonsterFormData } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MONSTER_TEMPLATES } from "./monsterTemplates";

interface StepStartProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
  setFormData: React.Dispatch<React.SetStateAction<MonsterFormData>>;
}

export function StepStart({ data, updateField, setFormData }: StepStartProps) {
  const startOptions = [
    { id: "blank" as const, label: "Blank Monster", icon: "📄", desc: "Start from scratch" },
    { id: "template" as const, label: "From Template", icon: "📋", desc: "Use an archetype preset" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Label className="font-cinzel text-base">Monster Name</Label>
        <Input
          value={data.name}
          onChange={e => updateField("name", e.target.value)}
          placeholder="Enter monster name..."
          className="mt-1 bg-background/50 border-brass/30"
        />
      </div>

      <div>
        <Label className="font-cinzel text-base mb-2 block">Start From</Label>
        <div className="grid grid-cols-2 gap-3">
          {startOptions.map(opt => (
            <Card
              key={opt.id}
              className={`p-4 cursor-pointer transition-all hover:border-brass/60 ${data.startType === opt.id ? "border-brass bg-brass/10" : "border-brass/20 bg-card/50"}`}
              onClick={() => updateField("startType", opt.id)}
            >
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div className="font-cinzel text-sm font-semibold">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {data.startType === "template" && (
        <div>
          <Label className="font-cinzel text-base mb-2 block">Choose Template</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MONSTER_TEMPLATES.map(t => (
              <Card
                key={t.id}
                className="p-3 cursor-pointer transition-all hover:border-brass/60 border-brass/20 bg-card/50"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    ...t.data,
                    name: prev.name || t.name,
                    startType: "template",
                    speeds: { ...prev.speeds, ...t.data.speeds },
                    abilities: { ...prev.abilities, ...t.data.abilities },
                    saveProficiencies: { ...prev.saveProficiencies, ...t.data.saveProficiencies },
                    spellcasting: { ...prev.spellcasting, ...t.data.spellcasting },
                    actions: t.data.actions || prev.actions,
                  }));
                }}
              >
                <span className="text-xl">{t.icon}</span>
                <div className="font-cinzel text-xs font-semibold mt-1">{t.name}</div>
                <div className="text-[10px] text-muted-foreground">{t.description}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
