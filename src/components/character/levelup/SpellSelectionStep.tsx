import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Search, RefreshCw } from "lucide-react";

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
  concentration?: boolean;
  ritual?: boolean;
}

interface SpellSelectionStepProps {
  className: string;
  availableSpells: SpellOption[];
  currentSpellIds: string[];
  selectedNewSpells: string[];
  onNewSpellToggle: (spellId: string) => void;
  spellsToAdd: number;
  maxSpellLevel: number;
  // Spell swap props
  canSwap: boolean;
  spellToSwap: string | null;
  swapReplacement: string | null;
  onSpellToSwapChange: (spellId: string | null) => void;
  onSwapReplacementChange: (spellId: string | null) => void;
  // Cantrip props
  availableCantrips: SpellOption[];
  selectedNewCantrips: string[];
  onNewCantripToggle: (spellId: string) => void;
  cantripsToAdd: number;
}

export const SpellSelectionStep = ({
  className,
  availableSpells,
  currentSpellIds,
  selectedNewSpells,
  onNewSpellToggle,
  spellsToAdd,
  maxSpellLevel,
  canSwap,
  spellToSwap,
  swapReplacement,
  onSpellToSwapChange,
  onSwapReplacementChange,
  availableCantrips,
  selectedNewCantrips,
  onNewCantripToggle,
  cantripsToAdd,
}: SpellSelectionStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(cantripsToAdd > 0 ? "cantrips" : "spells");

  // Filter spells that can be learned
  const eligibleSpells = useMemo(() => {
    return availableSpells.filter(spell => {
      if (spell.level === 0) return false;
      if (spell.level > maxSpellLevel) return false;
      if (currentSpellIds.includes(spell.id)) return false;
      return true;
    });
  }, [availableSpells, currentSpellIds, maxSpellLevel]);

  // Filter cantrips that can be learned
  const eligibleCantrips = useMemo(() => {
    return availableCantrips.filter(spell => {
      if (spell.level !== 0) return false;
      if (currentSpellIds.includes(spell.id)) return false;
      return true;
    });
  }, [availableCantrips, currentSpellIds]);

  // Apply search
  const filteredSpells = useMemo(() => {
    return eligibleSpells.filter(spell =>
      spell.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [eligibleSpells, searchQuery]);

  const filteredCantrips = useMemo(() => {
    return eligibleCantrips.filter(spell =>
      spell.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [eligibleCantrips, searchQuery]);

  // Current known spells for swap selection
  const currentKnownSpells = useMemo(() => {
    return availableSpells.filter(spell => 
      currentSpellIds.includes(spell.id) && spell.level > 0
    );
  }, [availableSpells, currentSpellIds]);

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      abjuration: "bg-blue-500/20 text-blue-400",
      conjuration: "bg-yellow-500/20 text-yellow-400",
      divination: "bg-purple-500/20 text-purple-400",
      enchantment: "bg-pink-500/20 text-pink-400",
      evocation: "bg-red-500/20 text-red-400",
      illusion: "bg-indigo-500/20 text-indigo-400",
      necromancy: "bg-gray-500/20 text-gray-400",
      transmutation: "bg-green-500/20 text-green-400",
    };
    return colors[school.toLowerCase()] || "bg-muted";
  };

  const renderSpellList = (
    spells: SpellOption[],
    selectedIds: string[],
    onToggle: (id: string) => void,
    maxCount: number
  ) => (
    <div className="space-y-1">
      {spells.map(spell => {
        const isSelected = selectedIds.includes(spell.id);
        const isDisabled = !isSelected && selectedIds.length >= maxCount;

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
            onClick={() => !isDisabled && onToggle(spell.id)}
          >
            <Checkbox checked={isSelected} disabled={isDisabled} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{spell.name}</span>
                {spell.level > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Lvl {spell.level}
                  </Badge>
                )}
                {spell.ritual && <Badge variant="outline" className="text-xs">R</Badge>}
                {spell.concentration && <Badge variant="outline" className="text-xs">C</Badge>}
              </div>
            </div>
            <Badge className={`text-xs ${getSchoolColor(spell.school)}`}>
              {spell.school}
            </Badge>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Learn New Spells
        </CardTitle>
        <CardDescription>
          As a {className}, you can learn new spells when you level up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {cantripsToAdd > 0 && (
              <TabsTrigger value="cantrips">
                Cantrips ({selectedNewCantrips.length}/{cantripsToAdd})
              </TabsTrigger>
            )}
            {spellsToAdd > 0 && (
              <TabsTrigger value="spells">
                Spells ({selectedNewSpells.length}/{spellsToAdd})
              </TabsTrigger>
            )}
            {canSwap && (
              <TabsTrigger value="swap">
                <RefreshCw className="h-3 w-3 mr-1" />
                Swap
              </TabsTrigger>
            )}
          </TabsList>

          {cantripsToAdd > 0 && (
            <TabsContent value="cantrips">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Cantrips</span>
                  <Badge variant={selectedNewCantrips.length === cantripsToAdd ? "default" : "secondary"}>
                    {selectedNewCantrips.length} / {cantripsToAdd}
                  </Badge>
                </div>
              </div>
              <ScrollArea className="h-[300px] pr-4">
                {renderSpellList(filteredCantrips, selectedNewCantrips, onNewCantripToggle, cantripsToAdd)}
              </ScrollArea>
            </TabsContent>
          )}

          {spellsToAdd > 0 && (
            <TabsContent value="spells">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Spells (up to level {maxSpellLevel})</span>
                  <Badge variant={selectedNewSpells.length === spellsToAdd ? "default" : "secondary"}>
                    {selectedNewSpells.length} / {spellsToAdd}
                  </Badge>
                </div>
              </div>
              <ScrollArea className="h-[300px] pr-4">
                {renderSpellList(filteredSpells, selectedNewSpells, onNewSpellToggle, spellsToAdd)}
              </ScrollArea>
            </TabsContent>
          )}

          {canSwap && (
            <TabsContent value="swap">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm">
                    You may replace one spell you know with a different {className} spell.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Spell to Remove</h4>
                  <ScrollArea className="h-[150px] pr-4">
                    <div className="space-y-1">
                      {currentKnownSpells.map(spell => (
                        <div
                          key={spell.id}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                            spellToSwap === spell.id
                              ? "bg-destructive/20 border border-destructive/40"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => onSpellToSwapChange(spellToSwap === spell.id ? null : spell.id)}
                        >
                          <Checkbox checked={spellToSwap === spell.id} />
                          <span className="font-medium">{spell.name}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            Lvl {spell.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {spellToSwap && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Replacement Spell</h4>
                    <ScrollArea className="h-[150px] pr-4">
                      <div className="space-y-1">
                        {filteredSpells
                          .filter(s => s.id !== spellToSwap)
                          .map(spell => (
                            <div
                              key={spell.id}
                              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                swapReplacement === spell.id
                                  ? "bg-primary/20 border border-primary/40"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => onSwapReplacementChange(swapReplacement === spell.id ? null : spell.id)}
                            >
                              <Checkbox checked={swapReplacement === spell.id} />
                              <span className="font-medium">{spell.name}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                Lvl {spell.level}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
