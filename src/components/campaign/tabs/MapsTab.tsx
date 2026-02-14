import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Map, Plus, Search, Eye, EyeOff, Trash2, Grid3X3, ArrowLeft } from "lucide-react";
import MapUpload from "@/components/maps/MapUpload";
import MapViewer from "@/components/maps/MapViewer";

interface MapRecord {
  id: string;
  campaign_id: string;
  name: string;
  image_url: string;
  width: number;
  height: number;
  grid_enabled: boolean;
  grid_size: number;
  map_type: string | null;
  player_visible: boolean | null;
  encounter_id: string | null;
  created_at: string;
}

interface MapsTabProps {
  campaignId: string;
}

const MAP_TYPE_LABELS: Record<string, string> = {
  battle: "Battle",
  world: "World",
  region: "Region",
  city: "City",
  dungeon: "Dungeon",
};

export function MapsTab({ campaignId }: MapsTabProps) {
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMap, setSelectedMap] = useState<MapRecord | null>(null);
  const { toast } = useToast();

  const fetchMaps = useCallback(async () => {
    const { data, error } = await supabase
      .from("maps")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMaps(data as MapRecord[]);
    }
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const handleMapCreated = (mapId: string) => {
    fetchMaps();
  };

  const toggleVisibility = async (map: MapRecord) => {
    const newVisible = !(map.player_visible ?? true);
    await supabase.from("maps").update({ player_visible: newVisible }).eq("id", map.id);
    setMaps(prev => prev.map(m => m.id === map.id ? { ...m, player_visible: newVisible } : m));
    toast({ title: newVisible ? "Map visible to players" : "Map hidden from players" });
  };

  const deleteMap = async (map: MapRecord) => {
    await supabase.from("maps").delete().eq("id", map.id);
    setMaps(prev => prev.filter(m => m.id !== map.id));
    toast({ title: "Map deleted" });
  };

  const filteredMaps = maps.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // If a map is selected, show the viewer
  if (selectedMap) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedMap(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Gallery
          </Button>
          <h2 className="font-cinzel text-lg font-bold text-ink">{selectedMap.name}</h2>
          <Badge variant="outline" className="border-brass/30 text-brass text-xs">
            {MAP_TYPE_LABELS[selectedMap.map_type || "battle"] || selectedMap.map_type}
          </Badge>
        </div>
        <MapViewer
          mapId={selectedMap.id}
          imageUrl={selectedMap.image_url}
          width={selectedMap.width}
          height={selectedMap.height}
          gridEnabled={selectedMap.grid_enabled}
          gridSize={selectedMap.grid_size}
          isDM={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-cinzel text-xl font-bold text-ink flex items-center gap-2">
          <Map className="w-5 h-5 text-brass" />
          Map Gallery
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search maps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48 bg-card/50 border-brass/20"
            />
          </div>
          <MapUpload campaignId={campaignId} onMapCreated={handleMapCreated} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-card/30" />
          ))}
        </div>
      ) : filteredMaps.length === 0 ? (
        <Card className="p-12 text-center border-brass/20 bg-card/50">
          <Map className="w-12 h-12 text-brass/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-cinzel">
            {search ? "No maps match your search" : "No maps yet. Upload your first map!"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaps.map((map) => (
            <Card
              key={map.id}
              className="group relative overflow-hidden border-brass/20 bg-card/50 hover:border-brass/40 transition-all cursor-pointer"
              onClick={() => setSelectedMap(map)}
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={map.image_url}
                  alt={map.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="font-cinzel font-bold text-ink text-sm truncate">{map.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-brass/40 text-brass text-xs bg-black/40">
                      {MAP_TYPE_LABELS[map.map_type || "battle"] || "Battle"}
                    </Badge>
                    {map.grid_enabled && (
                      <Grid3X3 className="w-3 h-3 text-brass/60" />
                    )}
                    {map.encounter_id && (
                      <Badge variant="outline" className="border-arcanePurple/40 text-arcanePurple text-xs bg-black/40">
                        Encounter
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/70 text-ink"
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(map); }}
                >
                  {(map.player_visible ?? true) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-destructive/80 text-ink"
                  onClick={(e) => { e.stopPropagation(); deleteMap(map); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
