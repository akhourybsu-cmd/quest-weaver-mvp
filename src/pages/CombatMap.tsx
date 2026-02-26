import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MapViewer from "@/components/maps/MapViewer";
import MapUpload from "@/components/maps/MapUpload";
import { ArrowLeft, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MapData {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  gridEnabled: boolean;
  gridSize: number;
  scaleFeetsPerSquare: number;
}

const CombatMap = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("campaign");
  const encounterId = searchParams.get("encounter");
  const isDM = searchParams.get("dm") === "true";

  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    const loadMaps = async () => {
      const query = supabase
        .from("maps")
        .select("*")
        .eq("campaign_id", campaignId);

      if (encounterId) {
        query.eq("encounter_id", encounterId);
      }

      const { data } = await query;

      if (data) {
        setMaps(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            imageUrl: m.image_url,
            width: m.width,
            height: m.height,
            gridEnabled: m.grid_enabled,
            gridSize: m.grid_size,
            scaleFeetsPerSquare: m.scale_feet_per_square || 5,
          }))
        );

        if (data.length > 0 && !selectedMapId) {
          setSelectedMapId(data[0].id);
        }
      }
    };

    loadMaps();
  }, [campaignId, encounterId, selectedMapId]);

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
            
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-brass" />
              <h1 className="text-xl font-cinzel font-bold">Battle Map</h1>
            </div>

            <div className="flex items-center gap-2">
              {isDM && campaignId && (
                <MapUpload
                  campaignId={campaignId}
                  encounterId={encounterId || undefined}
                  onMapCreated={(id) => setSelectedMapId(id)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Selection (if multiple maps) */}
      {maps.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {maps.map((map) => (
              <Button
                key={map.id}
                variant={selectedMapId === map.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMapId(map.id)}
              >
                {map.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {!selectedMap ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {isDM
                ? "No maps available. Upload a battle map to get started."
                : "Waiting for DM to load a battle map..."}
            </p>
          </Card>
        ) : (
          <MapViewer
            mapId={selectedMap.id}
            imageUrl={selectedMap.imageUrl}
            width={selectedMap.width}
            height={selectedMap.height}
            gridEnabled={selectedMap.gridEnabled}
            gridSize={selectedMap.gridSize}
            isDM={isDM}
            encounterId={encounterId || undefined}
            campaignId={campaignId || undefined}
          />
        )}
      </div>

      
    </div>
  );
};

export default CombatMap;
