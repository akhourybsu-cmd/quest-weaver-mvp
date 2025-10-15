import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  concentration: boolean;
}

const SAMPLE_SPELLS: Spell[] = [
  {
    id: "1",
    name: "Fireball",
    level: 3,
    school: "Evocation",
    castingTime: "1 action",
    range: "150 feet",
    components: "V, S, M (a tiny ball of bat guano and sulfur)",
    duration: "Instantaneous",
    description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
    concentration: false,
  },
  {
    id: "2",
    name: "Shield",
    level: 1,
    school: "Abjuration",
    castingTime: "1 reaction",
    range: "Self",
    components: "V, S",
    duration: "1 round",
    description: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.",
    concentration: false,
  },
  {
    id: "3",
    name: "Healing Word",
    level: 1,
    school: "Evocation",
    castingTime: "1 bonus action",
    range: "60 feet",
    components: "V",
    duration: "Instantaneous",
    description: "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
    concentration: false,
  },
  {
    id: "4",
    name: "Bless",
    level: 1,
    school: "Enchantment",
    castingTime: "1 action",
    range: "30 feet",
    components: "V, S, M (a sprinkling of holy water)",
    duration: "Concentration, up to 1 minute",
    description: "You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.",
    concentration: true,
  },
  {
    id: "5",
    name: "Magic Missile",
    level: 1,
    school: "Evocation",
    castingTime: "1 action",
    range: "120 feet",
    components: "V, S",
    duration: "Instantaneous",
    description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
    concentration: false,
  },
];

export function SpellLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  const filteredSpells = SAMPLE_SPELLS.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         spell.school.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === null || spell.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      "Abjuration": "bg-blue-500/20 text-blue-400",
      "Conjuration": "bg-purple-500/20 text-purple-400",
      "Divination": "bg-cyan-500/20 text-cyan-400",
      "Enchantment": "bg-pink-500/20 text-pink-400",
      "Evocation": "bg-red-500/20 text-red-400",
      "Illusion": "bg-violet-500/20 text-violet-400",
      "Necromancy": "bg-green-500/20 text-green-400",
      "Transmutation": "bg-yellow-500/20 text-yellow-400",
    };
    return colors[school] || "bg-muted";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="w-4 h-4 mr-2" />
          Spell Library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Spell Library</DialogTitle>
          <DialogDescription>
            Browse and search D&D 5E spells
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search spells..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={filterLevel === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLevel(null)}
              >
                All
              </Button>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <Button
                  key={level}
                  variant={filterLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Spell List */}
          <div className="grid grid-cols-2 gap-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredSpells.map(spell => (
                  <Card
                    key={spell.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSpell?.id === spell.id ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedSpell(spell)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {spell.name}
                            {spell.concentration && (
                              <Badge variant="outline" className="text-xs">
                                <Wand2 className="w-3 h-3 mr-1" />
                                C
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Level {spell.level} {spell.school}
                          </CardDescription>
                        </div>
                        <Badge className={getSchoolColor(spell.school)}>
                          {spell.level === 0 ? 'Cantrip' : `${spell.level}`}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}

                {filteredSpells.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No spells found
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Spell Details */}
            <ScrollArea className="h-[500px]">
              {selectedSpell ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedSpell.name}
                      {selectedSpell.concentration && (
                        <Badge variant="outline">
                          <Wand2 className="w-3 h-3 mr-1" />
                          Concentration
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Level {selectedSpell.level} {selectedSpell.school}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-semibold">Casting Time:</span>
                        <p className="text-muted-foreground">{selectedSpell.castingTime}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Range:</span>
                        <p className="text-muted-foreground">{selectedSpell.range}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Components:</span>
                        <p className="text-muted-foreground">{selectedSpell.components}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Duration:</span>
                        <p className="text-muted-foreground">{selectedSpell.duration}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-sm">Description:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSpell.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Select a spell to view details
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
