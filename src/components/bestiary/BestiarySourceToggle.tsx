import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Hammer } from "lucide-react";

interface BestiarySourceToggleProps {
  showCompendium: boolean;
  showHomebrew: boolean;
  onToggleCompendium: (val: boolean) => void;
  onToggleHomebrew: (val: boolean) => void;
  onCreateMonster: () => void;
}

export function BestiarySourceToggle({
  showCompendium,
  showHomebrew,
  onToggleCompendium,
  onToggleHomebrew,
  onCreateMonster,
}: BestiarySourceToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-brass/20 bg-card/50 px-4 py-2.5">
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <BookOpen className="w-4 h-4 text-brass" />
          <span className="font-medium">Compendium</span>
          <Switch checked={showCompendium} onCheckedChange={onToggleCompendium} />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Hammer className="w-4 h-4 text-brass" />
          <span className="font-medium">Homebrew</span>
          <Switch checked={showHomebrew} onCheckedChange={onToggleHomebrew} />
        </label>
      </div>
      <Button onClick={onCreateMonster} size="sm" className="bg-brass hover:bg-brass/90 text-obsidian font-cinzel">
        <Plus className="w-4 h-4 mr-1" />
        Create Monster
      </Button>
    </div>
  );
}
