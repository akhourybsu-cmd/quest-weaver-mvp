import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Droplets, Flame, Skull, X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TerrainMarker {
  id: string;
  x: number;
  y: number;
  type: 'difficult' | 'water' | 'fire' | 'hazard';
  label: string;
}

interface TerrainMarkerProps {
  isActive: boolean;
  onToggle: () => void;
}

const TERRAIN_TYPES = [
  { value: 'difficult', label: 'Difficult Terrain', icon: Mountain, color: '#8b7355' },
  { value: 'water', label: 'Water/Liquid', icon: Droplets, color: '#3b82f6' },
  { value: 'fire', label: 'Fire/Lava', icon: Flame, color: '#ef4444' },
  { value: 'hazard', label: 'Hazard/Trap', icon: Skull, color: '#a855f7' },
] as const;

export function TerrainMarker({ isActive, onToggle }: TerrainMarkerProps) {
  const [markers, setMarkers] = useState<TerrainMarker[]>([]);
  const [selectedType, setSelectedType] = useState<'difficult' | 'water' | 'fire' | 'hazard'>('difficult');

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const terrainType = TERRAIN_TYPES.find(t => t.value === selectedType);
    if (!terrainType) return;

    const newMarker: TerrainMarker = {
      id: `terrain-${Date.now()}`,
      x,
      y,
      type: selectedType,
      label: terrainType.label,
    };

    setMarkers([...markers, newMarker]);
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  const handleClearAll = () => {
    setMarkers([]);
  };

  const selectedTerrain = TERRAIN_TYPES.find(t => t.value === selectedType);

  return (
    <>
      {/* Terrain Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {markers.map((marker) => {
              const terrain = TERRAIN_TYPES.find(t => t.value === marker.type);
              const Icon = terrain?.icon || Mountain;
              
              return (
                <g key={marker.id}>
                  {/* Marker Circle */}
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r="20"
                    fill={terrain?.color}
                    opacity="0.6"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Icon rendered as foreignObject */}
                  <foreignObject
                    x={marker.x - 12}
                    y={marker.y - 12}
                    width="24"
                    height="24"
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-28 left-4 z-50 space-y-2">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="shadow-lg"
        >
          <Mountain className="w-4 h-4 mr-2" />
          Terrain
        </Button>

        {isActive && (
          <Card className="shadow-lg">
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
                    <span className="text-xs font-medium">Active Markers</span>
                    <div className="flex flex-wrap gap-1">
                      {markers.map((marker) => {
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
