import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoLocations } from "@/lib/demoAdapters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Flag } from "lucide-react";

interface DemoLocationsTabProps {
  campaign: DemoCampaign;
}

export function DemoLocationsTab({ campaign }: DemoLocationsTabProps) {
  const locations = adaptDemoLocations(campaign);

  const getTerrainColor = (terrain?: string) => {
    switch (terrain) {
      case "urban":
        return "border-blue-500/50 text-blue-500";
      case "forest":
        return "border-green-500/50 text-green-500";
      case "mountain":
        return "border-gray-500/50 text-gray-500";
      case "underground":
        return "border-purple-500/50 text-purple-500";
      default:
        return "border-brass/50 text-brass";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Locations</h2>
          <p className="text-muted-foreground">Places your party has discovered</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {locations.map((location) => (
          <Card 
            key={location.id} 
            className="relative overflow-hidden bg-card/50 border-brass/20 hover:shadow-lg transition-all"
          >
            {/* Background image with overlay */}
            {location.image_url && (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${location.image_url})` }}
                />
                <div className="absolute inset-0 bg-card/85 backdrop-blur-[1px]" />
              </>
            )}
            
            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-arcanePurple" />
                    {location.name}
                  </CardTitle>
                  {location.details?.region && (
                    <CardDescription className="mt-1">{location.details.region}</CardDescription>
                  )}
                </div>
                {location.details?.terrain && (
                  <Badge variant="outline" className={getTerrainColor(location.details.terrain)}>
                    {location.details.terrain}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {location.description && (
                <p className="text-sm text-muted-foreground">{location.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {location.details?.npcIds && location.details.npcIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brass" />
                    <span className="text-muted-foreground">{location.details.npcIds.length} NPCs</span>
                  </div>
                )}
                {location.details?.factionIds && location.details.factionIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-brass" />
                    <span className="text-muted-foreground">{location.details.factionIds.length} Factions</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
