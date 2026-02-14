import { MonsterFormData } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepIdentityProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
}

const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
const TYPES = ["aberration", "beast", "celestial", "construct", "dragon", "elemental", "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"];
const CR_OPTIONS = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

function crLabel(cr: number): string {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export function StepIdentity({ data, updateField }: StepIdentityProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Size</Label>
          <Select value={data.size} onValueChange={v => updateField("size", v)}>
            <SelectTrigger className="bg-background/50 border-brass/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={data.type} onValueChange={v => updateField("type", v)}>
            <SelectTrigger className="bg-background/50 border-brass/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Subtype (optional)</Label>
          <Input value={data.subtype} onChange={e => updateField("subtype", e.target.value)} placeholder="e.g. shapechanger" className="bg-background/50 border-brass/30" />
        </div>
        <div>
          <Label>Alignment (optional)</Label>
          <Input value={data.alignment} onChange={e => updateField("alignment", e.target.value)} placeholder="e.g. chaotic evil" className="bg-background/50 border-brass/30" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Challenge Rating</Label>
          <Select value={String(data.cr)} onValueChange={v => updateField("cr", Number(v))}>
            <SelectTrigger className="bg-background/50 border-brass/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CR_OPTIONS.map(cr => <SelectItem key={cr} value={String(cr)}>{crLabel(cr)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Proficiency Bonus</Label>
          <Input type="number" value={data.proficiencyBonus} onChange={e => updateField("proficiencyBonus", Number(e.target.value))} className="bg-background/50 border-brass/30" />
        </div>
      </div>
    </div>
  );
}
