import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import MapViewer from "@/components/maps/MapViewer";
import MapUpload from "@/components/maps/MapUpload";

interface WorldMapData {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  isPrimary: boolean;
  gridSize: number;
}

const WorldMap = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const campaignId = searchParams.get("campaign");
  const isDM = searchParams.get("dm") === "true";
  
  const [maps, setMaps] = useState<WorldMapData[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    
    loadMaps();
    
    // Subscribe to map changes
    const channel = supabase
      .channel('world-maps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maps',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => loadMaps()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadMaps = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('encounter_id', null)
      .order('is_primary', { ascending: false })
      .order('created_at');

    if (error) {
      toast({
        title: "Error loading maps",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      const worldMaps = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        imageUrl: m.image_url,
        width: m.width,
        height: m.height,
        isPrimary: m.is_primary || false,
        gridSize: m.grid_size || 50,
      }));
      setMaps(worldMaps);
      
      if (worldMaps.length > 0 && !selectedMapId) {
        setSelectedMapId(worldMaps[0].id);
      }
    }
    setLoading(false);
  };

  const handleSetPrimary = async (mapId: string) => {
    if (!campaignId || !isDM) return;
    
    // Clear all primary flags first
    await supabase
      .from('maps')
      .update({ is_primary: false } as any)
      .eq('campaign_id', campaignId);
    
    // Set new primary
    const { error } = await supabase
      .from('maps')
      .update({ is_primary: true } as any)
      .eq('id', mapId);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Primary map updated",
      });
      loadMaps();
    }
  };

  const selectedMap = maps.find((m) => m.id === selectedMapId);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-brass/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-cinzel font-bold">World Map</h1>
            {isDM && campaignId && (
              <MapUpload
                campaignId={campaignId}
                onMapCreated={(id) => setSelectedMapId(id)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Map Selector Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Maps
              </h3>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : maps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isDM ? "Upload a world map to get started" : "No maps available"}
                  </p>
                ) : (
                  maps.map((map) => (
                    <div
                      key={map.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedMapId === map.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                      onClick={() => setSelectedMapId(map.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{map.name}</span>
                        {map.isPrimary && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Primary
                          </Badge>
                        )}
                      </div>
                      {isDM && selectedMapId === map.id && !map.isPrimary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimary(map.id);
                          }}
                        >
                          Set as Primary
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Map Viewer */}
          <div className="lg:col-span-4">
            {!selectedMap ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {isDM
                    ? "Upload a world map to get started"
                    : "Waiting for DM to load a map..."}
                </p>
              </Card>
            ) : (
              <MapViewer
                mapId={selectedMap.id}
                imageUrl={selectedMap.imageUrl}
                width={selectedMap.width}
                height={selectedMap.height}
                gridEnabled={false}
                gridSize={selectedMap.gridSize}
                isDM={isDM}
              />
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default WorldMap;
