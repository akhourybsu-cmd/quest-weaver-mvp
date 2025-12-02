import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Wand2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  concentration: boolean;
  ritual: boolean;
  classes: string[];
}

const SPELLCASTING_CLASSES = [
  "All Classes",
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard"
];

export function SpellLibrary() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterClass, setFilterClass] = useState<string>("All Classes");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadSpells();
    }
  }, [open]);

  const loadSpells = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("srd_spells")
        .select("*")
        .order("level")
        .order("name");

      if (error) throw error;
      setSpells(data || []);
    } catch (error) {
      console.error("Error loading spells:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpells = spells.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         spell.school?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === null || spell.level === filterLevel;
    const matchesClass = filterClass === "All Classes" || 
                         (spell.classes && spell.classes.includes(filterClass));
    return matchesSearch && matchesLevel && matchesClass;
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
    <Dialog open={open} onOpenChange={setOpen}>
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
            Browse and search D&D 5E spells ({filteredSpells.length} spells)
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search spells..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {SPELLCASTING_CLASSES.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-1 flex-wrap">
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
                  {level === 0 ? "C" : level}
                </Button>
              ))}
            </div>

            {/* Spell List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              {spell.ritual && (
                                <Badge variant="outline" className="text-xs">R</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} {spell.school}
                            </CardDescription>
                          </div>
                          <Badge className={getSchoolColor(spell.school || "")}>
                            {spell.level === 0 ? 'C' : spell.level}
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
                        {selectedSpell.ritual && (
                          <Badge variant="outline">Ritual</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedSpell.level === 0 ? "Cantrip" : `Level ${selectedSpell.level}`} {selectedSpell.school}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-semibold">Casting Time:</span>
                          <p className="text-muted-foreground">{selectedSpell.casting_time}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Range:</span>
                          <p className="text-muted-foreground">{selectedSpell.range}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Components:</span>
                          <p className="text-muted-foreground">{selectedSpell.components?.join(", ") || "None"}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Duration:</span>
                          <p className="text-muted-foreground">{selectedSpell.duration}</p>
                        </div>
                      </div>
                      {selectedSpell.classes && selectedSpell.classes.length > 0 && (
                        <div>
                          <span className="font-semibold text-sm">Classes:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSpell.classes.map(cls => (
                              <Badge key={cls} variant="secondary" className="text-xs">
                                {cls}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-sm">Description:</span>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
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
        )}
      </DialogContent>
    </Dialog>
  );
}