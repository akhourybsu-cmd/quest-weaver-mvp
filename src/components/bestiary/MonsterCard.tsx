import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Eye, Copy, Pencil, Trash2, Heart, Shield } from "lucide-react";

export interface UnifiedMonster {
  id: string;
  name: string;
  cr: number | null;
  type: string;
  size: string;
  hp_avg: number;
  ac: number;
  source: "catalog" | "homebrew";
  // full data for detail/edit
  [key: string]: any;
}

interface MonsterCardProps {
  monster: UnifiedMonster;
  onView: (m: UnifiedMonster) => void;
  onDuplicate: (m: UnifiedMonster) => void;
  onEdit?: (m: UnifiedMonster) => void;
  onDelete?: (m: UnifiedMonster) => void;
  onAddToEncounter?: (m: UnifiedMonster) => void;
}

export function MonsterCard({ monster, onView, onDuplicate, onEdit, onDelete, onAddToEncounter }: MonsterCardProps) {
  const isHomebrew = monster.source === "homebrew";

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-card/50 border-brass/20 group">
      <CardHeader className="pb-3" onClick={() => onView(monster)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Flame className="w-4 h-4 text-dragonRed shrink-0" />
            <CardTitle className="text-base font-cinzel truncate">{monster.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={isHomebrew ? "border-emerald-500/40 text-emerald-400 text-[10px]" : "border-brass/30 text-brass text-[10px]"}
            >
              {isHomebrew ? "Homebrew" : "SRD"}
            </Badge>
            <Badge variant="outline" className="border-brass/30">
              CR {monster.cr ?? "?"}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {monster.size} {monster.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-dragonRed" />
            <span>{monster.hp_avg} HP</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-brass" />
            <span>{monster.ac} AC</span>
          </div>
        </div>

        <div className="flex gap-1.5 pt-2 border-t border-brass/10 flex-wrap">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onView(monster)}>
            <Eye className="w-3 h-3 mr-1" /> View
          </Button>
          {onAddToEncounter && (
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onAddToEncounter(monster)}>
              <Plus className="w-3 h-3 mr-1" /> Encounter
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onDuplicate(monster)}>
            <Copy className="w-3 h-3 mr-1" /> Duplicate
          </Button>
          {isHomebrew && onEdit && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onEdit(monster)}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          )}
          {isHomebrew && onDelete && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => onDelete(monster)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
