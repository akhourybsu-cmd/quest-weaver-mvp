import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Plus, Search, Heart, Shield, Pin } from "lucide-react";

interface Monster {
  id: string;
  name: string;
  cr: number;
  type: string;
  size: string;
  hp: number;
  ac: number;
  environment: string;
  traits: string[];
}

const mockMonsters: Monster[] = [
  {
    id: "1",
    name: "Adult Red Dragon",
    cr: 17,
    type: "Dragon",
    size: "Huge",
    hp: 256,
    ac: 19,
    environment: "Mountain",
    traits: ["Legendary Resistance", "Fire Breath"],
  },
  {
    id: "2",
    name: "Shadow Assassin",
    cr: 8,
    type: "Humanoid",
    size: "Medium",
    hp: 78,
    ac: 16,
    environment: "Urban",
    traits: ["Shadow Step", "Sneak Attack"],
  },
  {
    id: "3",
    name: "Stone Golem",
    cr: 10,
    type: "Construct",
    size: "Large",
    hp: 178,
    ac: 17,
    environment: "Any",
    traits: ["Magic Resistance", "Slow"],
  },
];

export function BestiaryTab() {
  const [monsters] = useState<Monster[]>(mockMonsters);
  const [searchQuery, setSearchQuery] = useState("");
  const [crRange, setCrRange] = useState([0, 30]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");

  const filteredMonsters = monsters.filter((monster) => {
    const matchesSearch =
      monster.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monster.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCR = monster.cr >= crRange[0] && monster.cr <= crRange[1];
    const matchesType = typeFilter === "all" || monster.type === typeFilter;
    const matchesEnvironment = environmentFilter === "all" || monster.environment === environmentFilter;

    return matchesSearch && matchesCR && matchesType && matchesEnvironment;
  });

  const types = Array.from(new Set(monsters.map((m) => m.type)));
  const environments = Array.from(new Set(monsters.map((m) => m.environment)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="text-base font-cinzel">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass" />
            <Input
              placeholder="Search monsters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-brass/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background/50 border-brass/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Environment</label>
              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger className="bg-background/50 border-brass/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  {environments.map((env) => (
                    <SelectItem key={env} value={env}>
                      {env}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Challenge Rating: {crRange[0]} - {crRange[1]}
              </label>
              <Slider
                value={crRange}
                onValueChange={setCrRange}
                min={0}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <ScrollArea className="h-[calc(100vh-450px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {filteredMonsters.map((monster) => (
            <Card
              key={monster.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-card/50 border-brass/20"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-dragonRed" />
                    <CardTitle className="text-base font-cinzel">{monster.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="border-brass/30 shrink-0">
                    CR {monster.cr}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {monster.size} {monster.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-dragonRed" />
                    <span>{monster.hp} HP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-brass" />
                    <span>{monster.ac} AC</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {monster.traits.map((trait) => (
                    <Badge key={trait} variant="outline" className="text-xs border-brass/30">
                      {trait}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-brass/10">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Plus className="w-3 h-3 mr-1" />
                    Add to Encounter
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Pin className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredMonsters.length === 0 && (
        <Card className="bg-card/50 border-brass/20">
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Flame className="w-12 h-12 mx-auto text-brass/50" />
              <p className="text-sm text-muted-foreground">
                No monsters match your filters. Adjust your search criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
