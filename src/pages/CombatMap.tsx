import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MapViewer from "@/components/maps/MapViewer";
import MapUpload from "@/components/maps/MapUpload";
import TokenManager from "@/components/maps/TokenManager";
import FogOfWarTools from "@/components/maps/FogOfWarTools";
import AoETools from "@/components/maps/AoETools";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Map {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  gridEnabled: boolean;
  gridSize: number;
}

const CombatMap = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("campaign");
  const encounterId = searchParams.get("encounter");
  const isDM = searchParams.get("dm") === "true";

  const [maps, setMaps] = useState<Map[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [fogTool, setFogTool] = useState<"reveal" | "hide" | null>(null);

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
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Battle Map</h1>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedMap ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {isDM
                ? "No maps available. Upload a battle map to get started."
                : "Waiting for DM to load a battle map..."}
            </p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Map */}
            <div className="lg:col-span-3">
              <MapViewer
                mapId={selectedMap.id}
                imageUrl={selectedMap.imageUrl}
                width={selectedMap.width}
                height={selectedMap.height}
                gridEnabled={selectedMap.gridEnabled}
                gridSize={selectedMap.gridSize}
                isDM={isDM}
                encounterId={encounterId || undefined}
              />
            </div>

            {/* Sidebar Tools */}
            {isDM && (
              <div className="space-y-4">
                {campaignId && (
                  <TokenManager
                    mapId={selectedMap.id}
                    campaignId={campaignId}
                    encounterId={encounterId || undefined}
                    gridSize={selectedMap.gridSize}
                  />
                )}
                <FogOfWarTools
                  mapId={selectedMap.id}
                  onToolChange={setFogTool}
                  activeTool={fogTool}
                />
                <AoETools
                  mapId={selectedMap.id}
                  encounterId={encounterId || undefined}
                  gridSize={selectedMap.gridSize}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav role={isDM ? "dm" : "player"} />
    </div>
  );
};

export default CombatMap;
