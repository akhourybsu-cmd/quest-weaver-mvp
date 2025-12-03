import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Sparkles } from "lucide-react";

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
  concentration?: boolean;
  ritual?: boolean;
}

interface WizardSpellbookStepProps {
  availableSpells: SpellOption[];
  currentSpellIds: string[];
  selectedSpells: string[];
  onSpellToggle: (spellId: string) => void;
  spellsToAdd: number;
  maxSpellLevel: number;
}

export const WizardSpellbookStep = ({
  availableSpells,
  currentSpellIds,
  selectedSpells,
  onSpellToggle,
  spellsToAdd,
  maxSpellLevel,
}: WizardSpellbookStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);

  // Filter spells that can be added (not already known, within level range)
  const eligibleSpells = useMemo(() => {
    return availableSpells.filter(spell => {
      if (spell.level === 0) return false; // No cantrips via spellbook
      if (spell.level > maxSpellLevel) return false;
      if (currentSpellIds.includes(spell.id)) return false;
      return true;
    });
  }, [availableSpells, currentSpellIds, maxSpellLevel]);

  // Apply search and level filters
  const filteredSpells = useMemo(() => {
    return eligibleSpells.filter(spell => {
      const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           spell.school.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === null || spell.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [eligibleSpells, searchQuery, levelFilter]);

  // Group by level for display
  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, SpellOption[]> = {};
    filteredSpells.forEach(spell => {
      if (!grouped[spell.level]) grouped[spell.level] = [];
      grouped[spell.level].push(spell);
    });
    return grouped;
  }, [filteredSpells]);

  const levelNumbers = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      abjuration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      conjuration: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      divination: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      enchantment: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      evocation: "bg-red-500/20 text-red-400 border-red-500/30",
      illusion: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      necromancy: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      transmutation: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[school.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Add Spells to Spellbook
        </CardTitle>
        <CardDescription>
          As a Wizard, you add {spellsToAdd} new spells to your spellbook each level.
          Choose from Wizard spells up to level {maxSpellLevel}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection counter */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">Spells Selected</span>
          <Badge variant={selectedSpells.length === spellsToAdd ? "default" : "secondary"}>
            {selectedSpells.length} / {spellsToAdd}
          </Badge>
        </div>

        {/* Search and filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={levelFilter ?? ""}
            onChange={(e) => setLevelFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-md border bg-background text-sm"
          >
            <option value="">All Levels</option>
            {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map(lvl => (
              <option key={lvl} value={lvl}>Level {lvl}</option>
            ))}
          </select>
        </div>

        {/* Spell list */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {levelNumbers.map(level => (
              <div key={level}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                  Level {level} Spells
                </h4>
                <div className="space-y-1">
                  {spellsByLevel[level].map(spell => {
                    const isSelected = selectedSpells.includes(spell.id);
                    const isDisabled = !isSelected && selectedSpells.length >= spellsToAdd;
                    
                    return (
                      <div
                        key={spell.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-primary/20 border border-primary/40" 
                            : isDisabled 
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/50"
                        }`}
                        onClick={() => !isDisabled && onSpellToggle(spell.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() => onSpellToggle(spell.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{spell.name}</span>
                            {spell.ritual && (
                              <Badge variant="outline" className="text-xs">R</Badge>
                            )}
                            {spell.concentration && (
                              <Badge variant="outline" className="text-xs">C</Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={`text-xs ${getSchoolColor(spell.school)}`}>
                          {spell.school}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {levelNumbers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No spells found matching your criteria</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
