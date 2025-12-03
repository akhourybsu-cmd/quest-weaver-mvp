import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";

interface FavoredTerrainSelectorProps {
  currentFavoredTerrains: string[];
  selectedTerrain: string | null;
  onSelectionChange: (terrain: string) => void;
}

// Natural Explorer terrain types per SRD
export const FAVORED_TERRAIN_TYPES = [
  { 
    id: 'arctic', 
    name: 'Arctic', 
    description: 'Frozen tundras, glaciers, and ice-covered regions.',
    benefits: 'Navigate and survive in extreme cold environments'
  },
  { 
    id: 'coast', 
    name: 'Coast', 
    description: 'Beaches, cliffs, and shorelines where land meets sea.',
    benefits: 'Expert at navigating coastal regions and shallow waters'
  },
  { 
    id: 'desert', 
    name: 'Desert', 
    description: 'Hot, arid regions with minimal water and vegetation.',
    benefits: 'Find water and shelter in harsh desert conditions'
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    description: 'Woodlands ranging from temperate to tropical.',
    benefits: 'Move through dense vegetation with ease'
  },
  { 
    id: 'grassland', 
    name: 'Grassland', 
    description: 'Plains, prairies, and steppes with tall grasses.',
    benefits: 'Spot distant threats and navigate open terrain'
  },
  { 
    id: 'mountain', 
    name: 'Mountain', 
    description: 'High altitude regions with rocky terrain and cliffs.',
    benefits: 'Expert climber and altitude-adapted'
  },
  { 
    id: 'swamp', 
    name: 'Swamp', 
    description: 'Marshes, bogs, and wetlands.',
    benefits: 'Navigate treacherous wetlands safely'
  },
  { 
    id: 'underdark', 
    name: 'Underdark', 
    description: 'Vast underground networks of caves and tunnels.',
    benefits: 'Navigate underground passages and detect hazards'
  },
];

export const FavoredTerrainSelector = ({
  currentFavoredTerrains,
  selectedTerrain,
  onSelectionChange,
}: FavoredTerrainSelectorProps) => {
  // Filter out already chosen terrains
  const availableTerrains = FAVORED_TERRAIN_TYPES.filter(
    t => !currentFavoredTerrains.includes(t.id)
  );

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Natural Explorer - Favored Terrain
        </CardTitle>
        <CardDescription>
          Choose a type of favored terrain. While traveling in this terrain, you gain several benefits:
          difficult terrain doesn't slow your group, you can't become lost except by magical means,
          you remain alert to danger even when foraging, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentFavoredTerrains.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground mb-2">Current Favored Terrains:</p>
            <div className="flex flex-wrap gap-2">
              {currentFavoredTerrains.map(t => {
                const terrain = FAVORED_TERRAIN_TYPES.find(type => type.id === t);
                return (
                  <Badge key={t} variant="secondary">
                    {terrain?.name || t}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <ScrollArea className="h-[350px] pr-4">
          <RadioGroup 
            value={selectedTerrain || ""} 
            onValueChange={onSelectionChange}
          >
            <div className="space-y-2">
              {availableTerrains.map(terrain => (
                <div
                  key={terrain.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTerrain === terrain.id
                      ? "bg-primary/20 border-primary/40"
                      : "hover:bg-muted/50 border-border"
                  }`}
                  onClick={() => onSelectionChange(terrain.id)}
                >
                  <RadioGroupItem value={terrain.id} id={terrain.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={terrain.id} className="font-medium cursor-pointer">
                      {terrain.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {terrain.description}
                    </p>
                    <p className="text-xs text-primary/70 mt-1">
                      {terrain.benefits}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
