import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
  concentration?: boolean;
  ritual?: boolean;
  description?: string;
}

/**
 * Maps character level to the Mystic Arcanum spell level gained.
 * Warlock gains one arcanum spell at each of these levels.
 */
const ARCANUM_LEVEL_MAP: Record<number, number> = {
  11: 6,
  13: 7,
  15: 8,
  17: 9,
};

interface MysticArcanumStepProps {
  characterLevel: number;
  selectedSpellId: string | null;
  onSelect: (spellId: string) => void;
  existingArcanumSpellIds: string[];
}

export function getMysticArcanumSpellLevel(characterLevel: number): number | null {
  return ARCANUM_LEVEL_MAP[characterLevel] ?? null;
}

export const MysticArcanumStep = ({
  characterLevel,
  selectedSpellId,
  onSelect,
  existingArcanumSpellIds,
}: MysticArcanumStepProps) => {
  const [spells, setSpells] = useState<SpellOption[]>([]);
  const [loading, setLoading] = useState(true);

  const spellLevel = getMysticArcanumSpellLevel(characterLevel);

  useEffect(() => {
    if (!spellLevel) return;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("srd_spells")
        .select("id, name, level, school, concentration, ritual, description")
        .contains("classes", ["Warlock"])
        .eq("level", spellLevel)
        .order("name");

      setSpells(
        (data || []).filter((s) => !existingArcanumSpellIds.includes(s.id))
      );
      setLoading(false);
    };
    load();
  }, [spellLevel, existingArcanumSpellIds]);

  if (!spellLevel) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading Warlock spells...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Mystic Arcanum — {spellLevel}th Level
        </CardTitle>
        <CardDescription>
          Choose one {spellLevel}th-level Warlock spell as your Mystic Arcanum.
          You can cast it once per long rest without expending a spell slot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {spells.map((spell) => {
              const isSelected = selectedSpellId === spell.id;
              return (
                <div
                  key={spell.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onClick={() => onSelect(spell.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{spell.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {spell.school}
                    </Badge>
                    {spell.concentration && (
                      <Badge variant="secondary" className="text-xs">
                        Concentration
                      </Badge>
                    )}
                    {spell.ritual && (
                      <Badge variant="secondary" className="text-xs">
                        Ritual
                      </Badge>
                    )}
                    {isSelected && <Badge>Selected</Badge>}
                  </div>
                  {spell.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {spell.description}
                    </p>
                  )}
                </div>
              );
            })}
            {spells.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No {spellLevel}th-level Warlock spells found. Check spell data.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
