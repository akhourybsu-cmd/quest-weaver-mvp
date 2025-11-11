import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Plus, Search, Map, Users, Flag } from "lucide-react";

interface Location {
  id: string;
  name: string;
  region: string;
  terrain: string;
  description: string;
  npcCount: number;
  factionCount: number;
}

const mockLocations: Location[] = [
  {
    id: "1",
    name: "Grand Library",
    region: "Capital District",
    terrain: "Urban",
    description: "A towering repository of knowledge",
    npcCount: 3,
    factionCount: 1,
  },
  {
    id: "2",
    name: "Thieves' Quarter",
    region: "Shadowside",
    terrain: "Urban",
    description: "Dark alleys and hidden passages",
    npcCount: 5,
    factionCount: 2,
  },
  {
    id: "3",
    name: "Crimson Peak",
    region: "Northern Wastes",
    terrain: "Mountain",
    description: "An ancient volcano, home to dragons",
    npcCount: 1,
    factionCount: 0,
  },
];

const terrainColors: Record<string, string> = {
  Urban: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  Mountain: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  Forest: "bg-green-500/20 text-green-300 border-green-500/30",
  Desert: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Coastal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export function LocationsTab() {
  const [locations] = useState<Location[]>(mockLocations);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-brass/30"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Location
        </Button>
      </div>

      {/* Locations Grid */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {filteredLocations.map((location) => (
            <Card
              key={location.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-card/50 border-brass/20"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-arcanePurple" />
                    <CardTitle className="text-base font-cinzel">{location.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs">{location.region}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {location.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={terrainColors[location.terrain] || "border-brass/30"}
                  >
                    {location.terrain}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-brass/10">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-brass" />
                    <span>{location.npcCount} NPCs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flag className="w-3 h-3 text-brass" />
                    <span>{location.factionCount} Factions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredLocations.length === 0 && (
        <Card className="bg-card/50 border-brass/20">
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Map className="w-12 h-12 mx-auto text-brass/50" />
              <p className="text-sm text-muted-foreground">
                No locations found. Create your first location to begin mapping your world.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
