import { MonsterFormData, MonsterAction } from "@/hooks/useMonsterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

interface StepActionsProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
}

const CATEGORIES = [
  { id: "action" as const, label: "Actions" },
  { id: "bonus_action" as const, label: "Bonus" },
  { id: "reaction" as const, label: "Reactions" },
  { id: "legendary" as const, label: "Legendary" },
  { id: "lair" as const, label: "Lair" },
];

export function StepActions({ data, updateField }: StepActionsProps) {
  const addAction = (category: MonsterAction["category"]) => {
    const newAction: MonsterAction = {
      id: nanoid(6),
      name: "",
      description: "",
      category,
    };
    updateField("actions", [...data.actions, newAction]);
  };

  const updateAction = (id: string, field: keyof MonsterAction, value: any) => {
    updateField("actions", data.actions.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAction = (id: string) => {
    updateField("actions", data.actions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <Tabs defaultValue="action">
        <TabsList className="bg-obsidian/50">
          {CATEGORIES.map(c => (
            <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.label} ({data.actions.filter(a => a.category === c.id).length})</TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map(c => (
          <TabsContent key={c.id} value={c.id} className="space-y-3">
            {data.actions.filter(a => a.category === c.id).map(action => (
              <div key={action.id} className="border border-brass/20 rounded-lg p-3 bg-card/30 space-y-2">
                <div className="flex gap-2">
                  <Input value={action.name} onChange={e => updateAction(action.id, "name", e.target.value)} placeholder="Action name" className="bg-background/50 border-brass/30" />
                  <Select value={action.recharge || ""} onValueChange={v => updateAction(action.id, "recharge", v || undefined)}>
                    <SelectTrigger className="w-36 bg-background/50 border-brass/30"><SelectValue placeholder="Recharge" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Recharge 5-6">Recharge 5-6</SelectItem>
                      <SelectItem value="Recharge 6">Recharge 6</SelectItem>
                      <SelectItem value="1/Day">1/Day</SelectItem>
                      <SelectItem value="2/Day">2/Day</SelectItem>
                      <SelectItem value="3/Day">3/Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => removeAction(action.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
                <Textarea value={action.description} onChange={e => updateAction(action.id, "description", e.target.value)} placeholder="Description..." className="bg-background/50 border-brass/30 min-h-[60px]" />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[10px]">To Hit</Label>
                    <Input type="number" value={action.attackBonus ?? ""} onChange={e => updateAction(action.id, "attackBonus", e.target.value ? Number(e.target.value) : undefined)} className="bg-background/50 border-brass/30 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Reach/Range</Label>
                    <Input value={action.reach ?? ""} onChange={e => updateAction(action.id, "reach", e.target.value)} className="bg-background/50 border-brass/30 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Damage</Label>
                    <Input value={action.damageDice ?? ""} onChange={e => updateAction(action.id, "damageDice", e.target.value)} placeholder="2d6+3" className="bg-background/50 border-brass/30 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Type</Label>
                    <Input value={action.damageType ?? ""} onChange={e => updateAction(action.id, "damageType", e.target.value)} placeholder="slashing" className="bg-background/50 border-brass/30 h-8 text-xs" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => addAction(c.id)} className="w-full border-dashed border-brass/30">
              <Plus className="w-3 h-3 mr-1" /> Add {c.label.replace(/s$/, "")}
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
