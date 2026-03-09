import { DemoCampaign } from "@/data/demoSeeds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, MapPin, Layers } from "lucide-react";

interface DemoMapsTabProps {
  campaign: DemoCampaign;
}

export function DemoMapsTab({ campaign }: DemoMapsTabProps) {
  const demoMaps = [
    { id: 1, name: "Ashenmoor — City Map", type: "World", pins: 5, description: "Overview of the capital city with key locations marked." },
    { id: 2, name: "Shadow Quarter", type: "District", pins: 3, description: "The cult's territory — narrow alleys and hidden passages." },
    { id: 3, name: "Scorathax's Lair", type: "Dungeon", pins: 2, description: "Multi-level cave system where the dragon was confronted." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold flex items-center gap-2">
          <Map className="w-5 h-5 text-arcanePurple" />
          Maps
        </h2>
        <Badge variant="outline" className="border-brass/30 text-brass">
          {demoMaps.length} Maps
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoMaps.map((map) => (
          <Card key={map.id} className="bg-card/50 border-brass/20 hover:border-arcanePurple/40 transition-colors cursor-pointer">
            {/* Placeholder map visual */}
            <div className="h-36 bg-gradient-to-br from-arcanePurple/10 via-card to-brass/10 rounded-t-lg flex items-center justify-center border-b border-brass/10">
              <Layers className="w-10 h-10 text-brass/40" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-cinzel font-semibold text-sm">{map.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{map.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">{map.type}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {map.pins} pins
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
