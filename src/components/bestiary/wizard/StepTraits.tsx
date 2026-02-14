import { useState } from "react";
import { MonsterFormData } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface StepTraitsProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
}

function TagInput({ label, tags, onAdd, onRemove }: { label: string; tags: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1 mt-1">
        <Input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && val.trim()) { e.preventDefault(); onAdd(val.trim()); setVal(""); } }} className="bg-background/50 border-brass/30 h-8 text-xs" placeholder="Type and press Enter" />
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); } }}><Plus className="w-3 h-3" /></Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((t, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] gap-1">
              {t}
              <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => onRemove(i)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepTraits({ data, updateField }: StepTraitsProps) {
  const addTo = (key: "resistances" | "immunities" | "vulnerabilities" | "conditionImmunities") => (tag: string) => {
    updateField(key, [...data[key], tag]);
  };
  const removeFrom = (key: "resistances" | "immunities" | "vulnerabilities" | "conditionImmunities") => (idx: number) => {
    updateField(key, data[key].filter((_, i) => i !== idx));
  };

  const addTrait = () => {
    updateField("traits", [...data.traits, { name: "", description: "" }]);
  };
  const updateTrait = (idx: number, field: "name" | "description", value: string) => {
    const updated = data.traits.map((t, i) => i === idx ? { ...t, [field]: value } : t);
    updateField("traits", updated);
  };
  const removeTrait = (idx: number) => {
    updateField("traits", data.traits.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <TagInput label="Damage Resistances" tags={data.resistances} onAdd={addTo("resistances")} onRemove={removeFrom("resistances")} />
        <TagInput label="Damage Immunities" tags={data.immunities} onAdd={addTo("immunities")} onRemove={removeFrom("immunities")} />
        <TagInput label="Damage Vulnerabilities" tags={data.vulnerabilities} onAdd={addTo("vulnerabilities")} onRemove={removeFrom("vulnerabilities")} />
        <TagInput label="Condition Immunities" tags={data.conditionImmunities} onAdd={addTo("conditionImmunities")} onRemove={removeFrom("conditionImmunities")} />
      </div>
      <div>
        <Label>Languages</Label>
        <Input value={data.languages} onChange={e => updateField("languages", e.target.value)} placeholder="Common, Draconic" className="bg-background/50 border-brass/30" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="font-cinzel text-base">Traits</Label>
          <Button type="button" size="sm" variant="outline" onClick={addTrait}><Plus className="w-3 h-3 mr-1" /> Add Trait</Button>
        </div>
        {data.traits.map((t, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={t.name} onChange={e => updateTrait(i, "name", e.target.value)} placeholder="Trait name" className="bg-background/50 border-brass/30 w-1/3" />
            <Textarea value={t.description} onChange={e => updateTrait(i, "description", e.target.value)} placeholder="Description" className="bg-background/50 border-brass/30 min-h-[60px]" />
            <Button type="button" size="sm" variant="ghost" onClick={() => removeTrait(i)}><X className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
