import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Droplets, Flame, Skull, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TerrainMarkerData {
  id: string;
  x: number;
  y: number;
  type: 'difficult' | 'water' | 'fire' | 'hazard';
  label: string;
}

interface TerrainMarkerProps {
  mapId: string;
  isActive: boolean;
  onToggle: () => void;
}

const TERRAIN_TYPES = [
  { value: 'difficult', label: 'Difficult Terrain', icon: Mountain, color: '#8b7355' },
  { value: 'water', label: 'Water/Liquid', icon: Droplets, color: '#3b82f6' },
  { value: 'fire', label: 'Fire/Lava', icon: Flame, color: '#ef4444' },
  { value: 'hazard', label: 'Hazard/Trap', icon: Skull, color: '#a855f7' },
] as const;

export function TerrainMarker({ mapId, isActive, onToggle }: TerrainMarkerProps) {
  const [markers, setMarkers] = useState<TerrainMarkerData[]>([]);
  const [selectedType, setSelectedType] = useState<'difficult' | 'water' | 'fire' | 'hazard'>('difficult');
  const { toast } = useToast();

  // Load existing terrain markers
  useEffect(() => {
    if (!mapId) return;
    loadMarkers();
  }, [mapId]);

  const loadMarkers = async () => {
    const { data } = await supabase
      .from("map_markers")
      .select("*")
      .eq("map_id", mapId)
      .eq("marker_type", "terrain");

    if (data) {
      setMarkers(
        data.map((m: any) => ({
          id: m.id,
          x: m.x,
          y: m.y,
          type: m.metadata?.terrain_type || 'difficult',
          label: m.label || '',
        }))
      );
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !mapId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const terrainType = TERRAIN_TYPES.find(t => t.value === selectedType);
    if (!terrainType) return;

    // Save to database
    const { data, error } = await supabase.from("map_markers").insert({
      map_id: mapId,
      marker_type: "terrain",
      shape: "circle",
      x,
      y,
      color: terrainType.color,
      opacity: 0.6,
      label: terrainType.label,
      dm_only: false,
      metadata: { terrain_type: selectedType },
    }).select().single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setMarkers([...markers, {
        id: data.id,
        x,
        y,
        type: selectedType,
        label: terrainType.label,
      }]);
      toast({ title: "Terrain marker placed" });
    }
  };

  const handleRemoveMarker = async (id: string) => {
    const { error } = await supabase.from("map_markers").delete().eq("id", id);
    if (!error) {
      setMarkers(markers.filter(m => m.id !== id));
      toast({ title: "Marker removed" });
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from("map_markers")
      .delete()
      .eq("map_id", mapId)
      .eq("marker_type", "terrain");

    if (!error) {
      setMarkers([]);
      toast({ title: "All terrain markers cleared" });
    }
  };

  const selectedTerrain = TERRAIN_TYPES.find(t => t.value === selectedType);

  return (
    <>
      {/* Terrain Overlay - rendered by MarkerRenderer now, this is just click handler */}
      {isActive && (
        <div
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
        />
      )}

      {/* Control Panel */}
      <div className="space-y-2">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="w-full"
        >
          <Mountain className="w-4 h-4 mr-2" />
          Terrain Markers
        </Button>

        {isActive && (
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Terrain Type</label>
                <Select
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v as any)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERRAIN_TYPES.map((terrain) => {
                      const Icon = terrain.icon;
                      return (
                        <SelectItem key={terrain.value} value={terrain.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: terrain.color }} />
                            <span>{terrain.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {markers.length > 0 && (
                <>
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Active Markers ({markers.length})</span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {markers.slice(0, 10).map((marker) => {
                        const terrain = TERRAIN_TYPES.find(t => t.value === marker.type);
                        const Icon = terrain?.icon || Mountain;
                        return (
                          <Badge
                            key={marker.id}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-destructive"
                            onClick={() => handleRemoveMarker(marker.id)}
                          >
                            <Icon className="w-3 h-3" />
                            <X className="w-3 h-3" />
                          </Badge>
                        );
                      })}
                      {markers.length > 10 && (
                        <Badge variant="outline">+{markers.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleClearAll}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </>
              )}

              <p className="text-xs text-muted-foreground">
                Click map to place {selectedTerrain?.label.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
