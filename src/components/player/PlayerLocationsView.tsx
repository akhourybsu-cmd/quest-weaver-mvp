import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Location {
  id: string;
  name: string;
  description: string | null;
  location_type: string | null;
  tags: string[];
  parent_location_id: string | null;
}

interface PlayerLocationsViewProps {
  campaignId: string;
}

const terrainColors: Record<string, string> = {
  Urban: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  Mountain: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  Forest: "bg-green-500/20 text-green-300 border-green-500/30",
  Desert: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Coastal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  City: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  Dungeon: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  Wilderness: "bg-green-500/20 text-green-300 border-green-500/30",
};

export function PlayerLocationsView({ campaignId }: PlayerLocationsViewProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadLocations();

    const channel = supabase
      .channel(`player-locations:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locations",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadLocations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, description, location_type, tags, parent_location_id")
      .eq("campaign_id", campaignId)
      .eq("discovered", true)
      .order("name");

    if (!error && data) {
      setLocations(data as Location[]);
    }
  };

  const filteredLocations = locations.filter((location) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      location.name.toLowerCase().includes(search) ||
      location.location_type?.toLowerCase().includes(search) ||
      location.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    return locations.find((loc) => loc.id === parentId)?.name;
  };

  const handleViewLocation = (location: Location) => {
    setSelectedLocation(location);
    setDialogOpen(true);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-cinzel flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedLocation?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
              {selectedLocation.location_type && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm">{selectedLocation.location_type}</p>
                </div>
              )}
              {getParentName(selectedLocation.parent_location_id) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Located In</p>
                  <p className="text-sm">{getParentName(selectedLocation.parent_location_id)}</p>
                </div>
              )}
              {selectedLocation.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedLocation.description}</p>
                </div>
              )}
              {selectedLocation.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={terrainColors[tag] || "border-brass/30"}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-2 font-cinzel">
              <MapPin className="w-5 h-5" />
              Discovered Locations
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No locations discovered yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocations.map((location) => {
                  const parentName = getParentName(location.parent_location_id);
                  return (
                    <Card
                      key={location.id}
                      className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all border-brass/20"
                      onClick={() => handleViewLocation(location)}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-arcanePurple shrink-0" />
                          <h3 className="font-cinzel font-semibold truncate">{location.name}</h3>
                        </div>
                        {parentName && (
                          <p className="text-xs text-muted-foreground">in {parentName}</p>
                        )}
                        {location.location_type && (
                          <p className="text-xs text-muted-foreground">{location.location_type}</p>
                        )}
                        {location.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {location.description}
                          </p>
                        )}
                        {location.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {location.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className={`text-xs ${terrainColors[tag] || "border-brass/30"}`}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {location.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{location.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}