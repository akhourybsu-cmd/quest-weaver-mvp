import { MonsterFormData } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface StepSpellcastingProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
}

export function StepSpellcasting({ data, updateField }: StepSpellcastingProps) {
  const [newSpellLevel, setNewSpellLevel] = useState("Cantrips");
  const [newSpellName, setNewSpellName] = useState("");

  const sc = data.spellcasting;
  const updateSC = (field: string, value: any) => {
    updateField("spellcasting", { ...sc, [field]: value });
  };

  const addSpell = () => {
    if (!newSpellName.trim()) return;
    const existing = sc.spells[newSpellLevel] || [];
    updateSC("spells", { ...sc.spells, [newSpellLevel]: [...existing, newSpellName.trim()] });
    setNewSpellName("");
  };

  const removeSpell = (level: string, idx: number) => {
    const updated = { ...sc.spells };
    updated[level] = updated[level].filter((_, i) => i !== idx);
    if (updated[level].length === 0) delete updated[level];
    updateSC("spells", updated);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={data.hasSpellcasting} onCheckedChange={v => updateField("hasSpellcasting", v)} />
        <span className="font-cinzel text-base">Has Spellcasting</span>
      </label>

      {data.hasSpellcasting && (
        <div className="space-y-4 pl-2 border-l-2 border-brass/20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Spellcasting Ability</Label>
              <Select value={sc.ability} onValueChange={v => updateSC("ability", v)}>
                <SelectTrigger className="bg-background/50 border-brass/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="int">Intelligence</SelectItem>
                  <SelectItem value="wis">Wisdom</SelectItem>
                  <SelectItem value="cha">Charisma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={sc.mode} onValueChange={v => updateSC("mode", v)}>
                <SelectTrigger className="bg-background/50 border-brass/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="innate">Innate</SelectItem>
                  <SelectItem value="slots">Spell Slots</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Save DC</Label>
              <Input type="number" value={sc.saveDC} onChange={e => updateSC("saveDC", Number(e.target.value))} className="bg-background/50 border-brass/30" />
            </div>
            <div>
              <Label>Attack Bonus</Label>
              <Input type="number" value={sc.attackBonus} onChange={e => updateSC("attackBonus", Number(e.target.value))} className="bg-background/50 border-brass/30" />
            </div>
          </div>

          <div>
            <Label className="font-cinzel text-sm mb-2 block">Spells</Label>
            <div className="flex gap-2 mb-2">
              <Select value={newSpellLevel} onValueChange={setNewSpellLevel}>
                <SelectTrigger className="w-28 bg-background/50 border-brass/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cantrips", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "At will", "3/day", "1/day"].map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={newSpellName} onChange={e => setNewSpellName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpell(); } }} placeholder="Spell name" className="bg-background/50 border-brass/30" />
              <Button type="button" size="sm" variant="outline" onClick={addSpell}><Plus className="w-3 h-3" /></Button>
            </div>
            {Object.entries(sc.spells).map(([level, spells]) => (
              <div key={level} className="mb-1.5">
                <span className="text-xs font-bold text-brass">{level}: </span>
                {(spells as string[]).map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-0.5 text-xs bg-card/50 border border-brass/20 rounded px-1.5 py-0.5 mr-1 mb-0.5">
                    {s}
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => removeSpell(level, i)} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
