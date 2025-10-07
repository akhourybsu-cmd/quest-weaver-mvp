import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Circle, Triangle, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AoEToolsProps {
  mapId: string;
  encounterId?: string;
  gridSize: number;
}

const AOE_SHAPES = [
  { value: "circle", label: "Circle/Sphere", icon: Circle },
  { value: "cone", label: "Cone", icon: Triangle },
  { value: "line", label: "Line", icon: Minus },
  { value: "cube", label: "Cube", icon: Circle },
];

const AoETools = ({ mapId, encounterId, gridSize }: AoEToolsProps) => {
  const [shape, setShape] = useState("circle");
  const [radius, setRadius] = useState("20");
  const [label, setLabel] = useState("");
  const { toast } = useToast();

  const handlePlace = async () => {
    const radiusInPixels = (parseInt(radius) / 5) * gridSize;

    const { error } = await supabase.from("aoe_templates").insert({
      map_id: mapId,
      encounter_id: encounterId,
      shape,
      x: 300,
      y: 200,
      radius: radiusInPixels,
      label: label || `${radius}ft ${shape}`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "AoE placed",
      description: `${shape} template added to map.`,
    });

    setLabel("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AoE Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="aoe-shape">Shape</Label>
          <Select value={shape} onValueChange={setShape}>
            <SelectTrigger id="aoe-shape">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AOE_SHAPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aoe-radius">Radius/Length (feet)</Label>
          <Input
            id="aoe-radius"
            type="number"
            min="5"
            step="5"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aoe-label">Label (optional)</Label>
          <Input
            id="aoe-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Fireball"
          />
        </div>

        <Button onClick={handlePlace} className="w-full">
          Place Template
        </Button>

        <div className="text-xs text-muted-foreground">
          Templates appear at map center. Drag to reposition, click to delete.
        </div>
      </CardContent>
    </Card>
  );
};

export default AoETools;
