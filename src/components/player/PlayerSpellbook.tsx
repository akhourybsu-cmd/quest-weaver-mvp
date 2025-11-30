import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Sparkles, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  components: any;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_levels?: string;
}

interface CharacterSpell {
  id: string;
  spell_id: string;
  prepared: boolean;
  known: boolean;
  is_always_prepared: boolean;
  srd_spells: Spell;
}

interface SpellSlot {
  spell_level: number;
  max_slots: number;
  used_slots: number;
}

interface PlayerSpellbookProps {
  characterId: string;
}

export function PlayerSpellbook({ characterId }: PlayerSpellbookProps) {
  const [characterSpells, setCharacterSpells] = useState<CharacterSpell[]>([]);
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSpells();
    fetchSpellSlots();

    const channel = supabase
      .channel(`player-spells:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_spells',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchSpells()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_spell_slots',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchSpellSlots()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const fetchSpells = async () => {
    const { data } = await supabase
      .from("character_spells")
      .select(`
        *,
        srd_spells(*)
      `)
      .eq("character_id", characterId)
      .eq("known", true)
      .order("srd_spells(level)");

    if (data) {
      setCharacterSpells(data as any);
    }
  };

  const fetchSpellSlots = async () => {
    const { data } = await supabase
      .from("character_spell_slots")
      .select("*")
      .eq("character_id", characterId)
      .order("spell_level");

    if (data) {
      setSpellSlots(data);
    }
  };

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      'Abjuration': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Conjuration': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Divination': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'Enchantment': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'Evocation': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Illusion': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'Necromancy': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Transmutation': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
    return colors[school] || 'bg-muted';
  };

  const groupSpellsByLevel = (spells: CharacterSpell[]) => {
    const filtered = spells.filter(cs => 
      cs.srd_spells.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.reduce((acc, cs) => {
      const level = cs.srd_spells.level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(cs);
      return acc;
    }, {} as Record<number, CharacterSpell[]>);
  };

  const preparedSpells = characterSpells.filter(cs => cs.prepared || cs.is_always_prepared);
  const allSpellsByLevel = groupSpellsByLevel(characterSpells);
  const preparedByLevel = groupSpellsByLevel(preparedSpells);

  const SpellList = ({ spellsByLevel }: { spellsByLevel: Record<number, CharacterSpell[]> }) => (
    <div className="space-y-4">
      {Object.entries(spellsByLevel)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, spells]) => (
          <div key={level}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold">
                {level === '0' ? 'Cantrips' : `Level ${level}`}
              </h4>
              <Badge variant="outline" className="text-xs">
                {spells.length}
              </Badge>
              {level !== '0' && spellSlots.find(s => s.spell_level === Number(level)) && (
                <div className="flex gap-1 ml-auto">
                  {Array.from({ 
                    length: spellSlots.find(s => s.spell_level === Number(level))!.max_slots 
                  }).map((_, i) => {
                    const slot = spellSlots.find(s => s.spell_level === Number(level))!;
                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < slot.max_slots - slot.used_slots
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              {spells.map((cs) => (
                <Card
                  key={cs.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedSpell(cs.srd_spells)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-semibold">{cs.srd_spells.name}</h5>
                          {cs.is_always_prepared && (
                            <Badge variant="secondary" className="text-xs">
                              Always Prepared
                            </Badge>
                          )}
                          {cs.prepared && !cs.is_always_prepared && (
                            <Badge variant="outline" className="text-xs">
                              Prepared
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={getSchoolColor(cs.srd_spells.school)}>
                            {cs.srd_spells.school}
                          </Badge>
                          {cs.srd_spells.concentration && (
                            <Badge variant="outline" className="text-xs">
                              Concentration
                            </Badge>
                          )}
                          {cs.srd_spells.ritual && (
                            <Badge variant="outline" className="text-xs">
                              Ritual
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Spellbook
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search spells..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {characterSpells.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No spells learned yet</p>
            </div>
          ) : (
            <Tabs defaultValue="prepared" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prepared">
                  Prepared ({preparedSpells.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All Known ({characterSpells.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prepared" className="mt-4">
                <ScrollArea className="h-[500px] pr-4">
                  {preparedSpells.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No spells prepared</p>
                    </div>
                  ) : (
                    <SpellList spellsByLevel={preparedByLevel} />
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <ScrollArea className="h-[500px] pr-4">
                  <SpellList spellsByLevel={allSpellsByLevel} />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Spell Detail Dialog */}
      <Dialog open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSpell && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {selectedSpell.name}
                  <Badge className={getSchoolColor(selectedSpell.school)}>
                    {selectedSpell.school}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Level:</span>{" "}
                    {selectedSpell.level === 0 ? 'Cantrip' : `${selectedSpell.level}`}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Casting Time:</span>{" "}
                    {selectedSpell.casting_time}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Range:</span>{" "}
                    {selectedSpell.range}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    {selectedSpell.duration}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selectedSpell.components?.verbal && (
                    <Badge variant="outline">V</Badge>
                  )}
                  {selectedSpell.components?.somatic && (
                    <Badge variant="outline">S</Badge>
                  )}
                  {selectedSpell.components?.material && (
                    <Badge variant="outline">
                      M {selectedSpell.components.materials_description && 
                        `(${selectedSpell.components.materials_description})`}
                    </Badge>
                  )}
                  {selectedSpell.concentration && (
                    <Badge variant="secondary">Concentration</Badge>
                  )}
                  {selectedSpell.ritual && (
                    <Badge variant="secondary">Ritual</Badge>
                  )}
                </div>

                <Separator />

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedSpell.description}</p>
                  {selectedSpell.higher_levels && (
                    <>
                      <p className="font-semibold mt-4">At Higher Levels:</p>
                      <p className="whitespace-pre-wrap">{selectedSpell.higher_levels}</p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
