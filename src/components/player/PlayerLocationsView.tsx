import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Search } from "lucide-react";
import { PlayerEmptyState } from "./PlayerEmptyState";
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
  image_url: string | null;
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
      .select("id, name, description, location_type, tags, parent_location_id, image_url")
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
              {/* Full Image Display */}
              {selectedLocation.image_url && (
                <div className="rounded-lg overflow-hidden border border-brass/20">
                  <img
                    src={selectedLocation.image_url}
                    alt={selectedLocation.name}
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                </div>
              )}
              
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
          {filteredLocations.length === 0 && locations.length === 0 ? (
            <PlayerEmptyState
              icon={MapPin}
              title="No Discovered Locations"
              description="Locations will appear here as you explore the world."
            />
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No locations match your search</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-28rem)] min-h-[200px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocations.map((location, index) => {
                  const parentName = getParentName(location.parent_location_id);
                  return (
                    <Card
                      key={location.id}
                      className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all border-brass/20 relative overflow-hidden card-glow opacity-0 animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'forwards' }}
                      onClick={() => handleViewLocation(location)}
                    >
                      {/* Background Image with Overlay */}
                      {location.image_url && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${location.image_url})` }}
                        />
                      )}
                      <div className={`absolute inset-0 ${location.image_url ? 'bg-card/85 backdrop-blur-[2px]' : ''}`} />
                      
                      {/* Content */}
                      <CardContent className="p-4 space-y-2 relative z-10">
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
