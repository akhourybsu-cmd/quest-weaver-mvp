import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Search, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  concentration?: boolean;
  ritual?: boolean;
  classes: string[];
}

interface MagicalSecretsStepProps {
  maxSpellLevel: number;
  currentSpellIds: string[];
  selectedSpells: string[];
  count: number;
  onSelectionChange: (spells: string[]) => void;
}

export const MagicalSecretsStep = ({
  maxSpellLevel,
  currentSpellIds,
  selectedSpells,
  count,
  onSelectionChange,
}: MagicalSecretsStepProps) => {
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllSpells();
  }, [maxSpellLevel]);

  const loadAllSpells = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("srd_spells")
        .select("id, name, level, school, concentration, ritual, classes")
        .lte("level", maxSpellLevel)
        .gt("level", 0)
        .order("level")
        .order("name");

      if (data) {
        // Filter out spells already known
        setAllSpells(data.filter(s => !currentSpellIds.includes(s.id)));
      }
    } catch (error) {
      console.error("Error loading spells:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (spellId: string) => {
    if (selectedSpells.includes(spellId)) {
      onSelectionChange(selectedSpells.filter(s => s !== spellId));
    } else if (selectedSpells.length < count) {
      onSelectionChange([...selectedSpells, spellId]);
    }
  };

  const filteredSpells = allSpells.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === null || spell.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      'Abjuration': 'bg-blue-500/20 text-blue-300',
      'Conjuration': 'bg-yellow-500/20 text-yellow-300',
      'Divination': 'bg-purple-500/20 text-purple-300',
      'Enchantment': 'bg-pink-500/20 text-pink-300',
      'Evocation': 'bg-red-500/20 text-red-300',
      'Illusion': 'bg-indigo-500/20 text-indigo-300',
      'Necromancy': 'bg-gray-500/20 text-gray-300',
      'Transmutation': 'bg-green-500/20 text-green-300',
    };
    return colors[school] || 'bg-muted';
  };

  const spellLevels = Array.from(new Set(allSpells.map(s => s.level))).sort((a, b) => a - b);

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Magical Secrets
        </CardTitle>
        <CardDescription>
          Choose {count} spell{count > 1 ? 's' : ''} from ANY class spell list. 
          These become Bard spells for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection counter */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">Spells Selected</span>
          <Badge variant={selectedSpells.length === count ? "default" : "secondary"}>
            {selectedSpells.length} / {count}
          </Badge>
        </div>

        {/* Search and filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spells..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Badge
              variant={filterLevel === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterLevel(null)}
            >
              All
            </Badge>
            {spellLevels.map(level => (
              <Badge
                key={level}
                variant={filterLevel === level ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterLevel(level)}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        {/* Spell list */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading spells...</div>
          ) : filteredSpells.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No spells found</div>
          ) : (
            <div className="space-y-2">
              {filteredSpells.map(spell => {
                const isSelected = selectedSpells.includes(spell.id);
                const isDisabled = !isSelected && selectedSpells.length >= count;

                return (
                  <div
                    key={spell.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/20 border-primary/40"
                        : isDisabled
                          ? "opacity-50 cursor-not-allowed border-border"
                          : "hover:bg-muted/50 border-border"
                    }`}
                    onClick={() => !isDisabled && handleToggle(spell.id)}
                  >
                    <Checkbox checked={isSelected} disabled={isDisabled} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{spell.name}</span>
                        <Badge variant="outline" className="text-xs">Lvl {spell.level}</Badge>
                        <Badge className={`text-xs ${getSchoolColor(spell.school)}`}>
                          {spell.school}
                        </Badge>
                        {spell.concentration && (
                          <Badge variant="outline" className="text-xs text-yellow-400">C</Badge>
                        )}
                        {spell.ritual && (
                          <Badge variant="outline" className="text-xs text-blue-400">R</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <BookOpen className="h-3 w-3 inline mr-1" />
                        {spell.classes?.join(', ') || 'Unknown'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
