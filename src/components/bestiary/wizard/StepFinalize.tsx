import { useState } from "react";
import { MonsterFormData } from "@/hooks/useMonsterForm";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatblockPreview } from "./StatblockPreview";
import { X, Plus, Sparkles } from "lucide-react";

interface StepFinalizeProps {
  data: MonsterFormData;
  updateField: <K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => void;
  onSave: () => void;
  saving: boolean;
}

export function StepFinalize({ data, updateField, onSave, saving }: StepFinalizeProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
      updateField("tags", [...data.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <Label className="font-cinzel text-base mb-2 block">Tags</Label>
            <div className="flex gap-1">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="e.g. boss, undead" className="bg-background/50 border-brass/30" />
              <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="w-3 h-3" /></Button>
            </div>
            {data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.tags.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {t}
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => updateField("tags", data.tags.filter((_, j) => j !== i))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={data.isPublished} onCheckedChange={v => updateField("isPublished", v)} />
            <span className="text-sm">Published to campaign</span>
          </label>
          <Button
            onClick={onSave}
            disabled={!data.name.trim() || saving}
            className="w-full bg-gradient-to-r from-brass to-brass/80 text-obsidian font-cinzel text-base py-5 animate-pulse-breathe"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Monster"}
          </Button>
        </div>
        <div className="border border-brass/20 rounded-lg bg-card/30 max-h-[400px] overflow-hidden">
          <StatblockPreview data={data} />
        </div>
      </div>
    </div>
  );
}
